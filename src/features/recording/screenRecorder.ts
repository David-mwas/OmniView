import { sendExtensionMessage } from "../../utils/extensionBridge";

export type RecordingState = "idle" | "recording" | "paused";
export type VideoFormatPreference = "auto" | "mp4" | "webm_h264" | "webm_vp9";
export type VideoQualityPreset = "standard" | "high" | "ultra";

export interface CompletedRecording {
  blob: Blob;
  objectUrl: string;
  filename: string;
  mimeType: string;
  extension: "mp4" | "webm";
  sizeBytes: number;
  durationSeconds: number;
  label: string;
}

interface CropTargetStatic {
  fromElement(element: Element): Promise<unknown>;
}

interface CroppableVideoTrack extends MediaStreamTrack {
  cropTo?: (cropTarget: unknown) => Promise<void>;
}

export function isRegionCaptureSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "CropTarget" in window &&
    typeof MediaStreamTrack !== "undefined" &&
    "cropTo" in MediaStreamTrack.prototype
  );
}

export function resolveVideoCodec(preference: VideoFormatPreference): {
  mimeType: string;
  extension: "mp4" | "webm";
  codecLabel: string;
} {
  const isSupported = (m: string) =>
    typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m);

  // Prefer avc3 over avc1 so dynamic resolution changes (e.g. rotating/resizing during recording) never error
  const mp4Candidates = [
    "video/mp4;codecs=avc3.42E01E,mp4a.40.2",
    "video/mp4;codecs=avc3.42E01E",
    "video/mp4;codecs=avc3",
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4;codecs=avc1.42E01E",
    "video/mp4;codecs=avc1",
    "video/mp4",
  ];
  const webmH264Candidates = [
    "video/webm;codecs=h264,opus",
    "video/webm;codecs=h264",
  ];
  const webmVpCandidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  const tryList = (
    list: string[],
    extension: "mp4" | "webm",
    codecLabel: string
  ) => {
    for (const mimeType of list) {
      if (isSupported(mimeType)) {
        return { mimeType, extension, codecLabel };
      }
    }
    return null;
  };

  if (preference === "mp4" || preference === "auto") {
    const mp4 = tryList(mp4Candidates, "mp4", "MP4 (H.264)");
    if (mp4) return mp4;
    const h264Webm = tryList(webmH264Candidates, "webm", "WebM (H.264)");
    if (h264Webm) return h264Webm;
  }

  if (preference === "webm_h264") {
    const h264Webm = tryList(webmH264Candidates, "webm", "WebM (H.264)");
    if (h264Webm) return h264Webm;
  }

  const vp = tryList(webmVpCandidates, "webm", "WebM (VP9/VP8)");
  if (vp) return vp;

  return { mimeType: "video/webm", extension: "webm", codecLabel: "WebM" };
}

function getBitrateBps(quality: VideoQualityPreset): number {
  switch (quality) {
    case "standard":
      return 2_500_000;
    case "ultra":
      return 8_000_000;
    case "high":
    default:
      return 5_000_000;
  }
}

export interface RecorderCallbacks {
  onStateChange: (state: RecordingState) => void;
  onSizeChange: (bytes: number) => void;
  onNotice: (message: string) => void;
  onError: (message: string) => void;
  onComplete: (recording: CompletedRecording) => void;
}

export class OmniScreenRecorder {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private totalBytes = 0;
  private startedAt = 0;
  private callbacks: RecorderCallbacks;

  constructor(callbacks: RecorderCallbacks) {
    this.callbacks = callbacks;
  }

  async start(options: {
    targetElement?: HTMLElement | null;
    includeAudio?: boolean;
    label?: string;
    formatPreference?: VideoFormatPreference;
    quality?: VideoQualityPreset;
  }): Promise<boolean> {
    if (this.recorder && this.recorder.state !== "inactive") {
      return false;
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      this.callbacks.onError("Screen recording is not supported in this browser.");
      return false;
    }

    try {
      const displayConstraints: DisplayMediaStreamOptions & {
        preferCurrentTab?: boolean;
      } = {
        video: {
          frameRate: { ideal: 30, max: 60 },
        },
        audio: options.includeAudio ?? false,
        preferCurrentTab: true,
      };

      const stream = await navigator.mediaDevices.getDisplayMedia(displayConstraints);
      this.stream = stream;

      const [videoTrack] = stream.getVideoTracks() as CroppableVideoTrack[];
      if (!videoTrack) {
        this.cleanupTracks();
        this.callbacks.onError("No video track was returned by screen capture.");
        return false;
      }

      if (options.targetElement) {
        if (isRegionCaptureSupported() && typeof videoTrack.cropTo === "function") {
          try {
            const cropApi = (window as unknown as { CropTarget: CropTargetStatic })
              .CropTarget;
            const cropTarget = await cropApi.fromElement(options.targetElement);
            await videoTrack.cropTo(cropTarget);
          } catch {
            this.callbacks.onNotice(
              "Region Capture requires selecting 'This Tab'. Recording full capture instead."
            );
          }
        } else {
          this.callbacks.onNotice(
            "Region Capture API is unavailable in this browser; recording the full tab instead."
          );
        }
      }

      const resolved = resolveVideoCodec(options.formatPreference ?? "auto");
      const videoBitsPerSecond = getBitrateBps(options.quality ?? "high");

      this.chunks = [];
      this.totalBytes = 0;
      this.startedAt = Date.now();

      const recorder = new MediaRecorder(stream, {
        mimeType: resolved.mimeType,
        videoBitsPerSecond,
      });
      this.recorder = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          this.chunks.push(ev.data);
          this.totalBytes += ev.data.size;
          this.callbacks.onSizeChange(this.totalBytes);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: resolved.mimeType });
        const finalSize = blob.size;
        const durationSeconds = Math.max(
          1,
          Math.round((Date.now() - this.startedAt) / 1000)
        );
        this.cleanupTracks();
        this.callbacks.onStateChange("idle");

        if (finalSize > 0) {
          const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
          const slug = (options.label ?? "recording")
            .toLowerCase()
            .replace(/[^a-z0-9-_]+/g, "-")
            .replace(/^-|-$/g, "");
          const filename = `omniview-${slug || "recording"}-${stamp}.${resolved.extension}`;
          const objectUrl = URL.createObjectURL(blob);

          this.callbacks.onComplete({
            blob,
            objectUrl,
            filename,
            mimeType: resolved.mimeType,
            extension: resolved.extension,
            sizeBytes: finalSize,
            durationSeconds,
            label: options.label ?? "Simulator Recording",
          });
        }
      };

      recorder.onerror = () => {
        this.cleanupTracks();
        this.callbacks.onStateChange("idle");
        this.callbacks.onError("Recording stopped due to a MediaRecorder error.");
      };

      videoTrack.onended = () => {
        if (this.recorder && this.recorder.state !== "inactive") {
          this.recorder.stop();
        }
      };

      recorder.start(1000);
      this.callbacks.onNotice(`Recording started using ${resolved.codecLabel}`);
      this.callbacks.onStateChange("recording");
      return true;
    } catch (err) {
      this.cleanupTracks();
      this.callbacks.onStateChange("idle");
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "AbortError") {
        this.callbacks.onError("Screen capture permission was cancelled or denied.");
      } else {
        this.callbacks.onError(
          err instanceof Error ? err.message : "Failed to start screen recording."
        );
      }
      return false;
    }
  }

  pause(): void {
    if (this.recorder && this.recorder.state === "recording") {
      this.recorder.pause();
      this.callbacks.onStateChange("paused");
    }
  }

  resume(): void {
    if (this.recorder && this.recorder.state === "paused") {
      this.recorder.resume();
      this.callbacks.onStateChange("recording");
    }
  }

  stop(): void {
    if (this.recorder && this.recorder.state !== "inactive") {
      this.recorder.stop();
    } else {
      this.cleanupTracks();
      this.callbacks.onStateChange("idle");
    }
  }

  private cleanupTracks(): void {
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        try {
          track.stop();
        } catch {
          // ignore
        }
      }
      this.stream = null;
    }
    this.recorder = null;
  }
}

export async function downloadRecording(recording: CompletedRecording): Promise<void> {
  const res = await sendExtensionMessage({
    type: "DOWNLOAD_FILE",
    url: recording.objectUrl,
    filename: recording.filename,
    saveAs: false,
  });

  if (!res.ok) {
    const a = document.createElement("a");
    a.href = recording.objectUrl;
    a.download = recording.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}
