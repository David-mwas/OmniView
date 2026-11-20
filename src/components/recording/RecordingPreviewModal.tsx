import React, { useEffect, useRef, useState } from "react";
import { Download, Film, Scissors, X } from "lucide-react";
import {
  downloadRecording,
  resolveVideoCodec,
  type CompletedRecording,
} from "../../features/recording/screenRecorder";
import { formatDuration, formatFileSize } from "../../utils/breakpoints";

interface RecordingPreviewModalProps {
  recording: CompletedRecording | null;
  onClose: () => void;
  onDownloaded: (filename: string) => void;
}

export const RecordingPreviewModal: React.FC<RecordingPreviewModalProps> = ({
  recording,
  onClose,
  onDownloaded,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(1);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(1);
  const [isTrimming, setIsTrimming] = useState(false);

  useEffect(() => {
    if (!recording) return;
    setDuration(Math.max(1, recording.durationSeconds));
    setTrimStart(0);
    setTrimEnd(Math.max(1, recording.durationSeconds));
    setIsTrimming(false);
  }, [recording]);

  if (!recording) return null;

  const isTrimmed = trimStart > 0.1 || trimEnd < duration - 0.1;

  const handleDownloadFull = async () => {
    await downloadRecording(recording);
    onDownloaded(recording.filename);
  };

  const handleExportTrimmed = async () => {
    const video = videoRef.current;
    if (!video || isTrimming) return;

    const clipLen = Math.max(0.5, trimEnd - trimStart);
    setIsTrimming(true);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable.");

      const stream = canvas.captureStream(30);
      const resolved = resolveVideoCodec("auto", false);
      const chunks: Blob[] = [];
      const rec = new MediaRecorder(stream, { mimeType: resolved.mimeType });

      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };

      const done = new Promise<Blob>((resolve) => {
        rec.onstop = () =>
          resolve(new Blob(chunks, { type: resolved.mimeType }));
      });

      video.pause();
      video.currentTime = trimStart;
      await new Promise<void>((res) => {
        video.onseeked = () => res();
      });

      let rafId = 0;
      const drawFrame = () => {
        if (!video.paused && !video.ended && video.currentTime < trimEnd) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          rafId = requestAnimationFrame(drawFrame);
        } else {
          if (rec.state !== "inactive") rec.stop();
          video.pause();
        }
      };

      rec.start(250);
      await video.play();
      rafId = requestAnimationFrame(drawFrame);

      window.setTimeout(() => {
        cancelAnimationFrame(rafId);
        video.pause();
        if (rec.state !== "inactive") rec.stop();
      }, clipLen * 1000 + 200);

      const blob = await done;
      const objectUrl = URL.createObjectURL(blob);
      const trimmedFilename = recording.filename.replace(
        /\.(mp4|webm)$/i,
        `-clip.${resolved.extension}`
      );

      await downloadRecording({
        ...recording,
        blob,
        objectUrl,
        filename: trimmedFilename,
        extension: resolved.extension,
        sizeBytes: blob.size,
      });
      onDownloaded(trimmedFilename);
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
    } finally {
      setIsTrimming(false);
    }
  };

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="animate-scale-in flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold">Recording Preview & Trim</h2>
            <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase text-emerald-300">
              .{recording.extension}
            </span>
          </div>
          <button
            onClick={onClose}
            className="micro-btn rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center bg-black p-4">
          <video
            ref={videoRef}
            src={recording.objectUrl}
            controls
            autoPlay
            playsInline
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration;
              if (Number.isFinite(d) && d > 0) {
                setDuration(d);
                setTrimEnd(d);
              }
            }}
            className="max-h-[52vh] w-full rounded-lg bg-black"
          />
        </div>

        {/* Trim Bar */}
        <div className="border-t border-zinc-800/80 bg-zinc-900/50 px-5 py-3">
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 font-medium text-zinc-300">
              <Scissors className="h-3.5 w-3.5 text-indigo-400" />
              Clip Trim Range
            </span>
            <span className="font-mono text-zinc-400">
              {formatDuration(Math.floor(trimStart))} →{" "}
              {formatDuration(Math.ceil(trimEnd))} (
              {Math.max(1, Math.round(trimEnd - trimStart))}s)
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span>Start</span>
              <input
                type="range"
                min={0}
                max={Math.max(0.5, trimEnd - 0.5)}
                step={0.5}
                value={trimStart}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setTrimStart(v);
                  if (videoRef.current) videoRef.current.currentTime = v;
                }}
                className="flex-1 accent-indigo-500"
              />
            </label>
            <label className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span>End</span>
              <input
                type="range"
                min={Math.min(duration, trimStart + 0.5)}
                max={duration}
                step={0.5}
                value={trimEnd}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setTrimEnd(v);
                  if (videoRef.current) videoRef.current.currentTime = v;
                }}
                className="flex-1 accent-indigo-500"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-900/80 px-5 py-3.5">
          <div className="space-y-0.5 text-xs text-zinc-400">
            <div className="font-mono text-zinc-200">{recording.filename}</div>
            <div>
              {formatDuration(Math.round(duration))} •{" "}
              {formatFileSize(recording.sizeBytes)} • {recording.mimeType}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="micro-btn rounded-xl border border-zinc-700 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
            >
              Discard
            </button>
            {isTrimmed && (
              <button
                onClick={() => void handleExportTrimmed()}
                disabled={isTrimming}
                className="micro-btn flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                <Scissors className="h-3.5 w-3.5" />
                {isTrimming ? "Exporting Clip..." : "Export Trimmed Clip"}
              </button>
            )}
            <button
              onClick={handleDownloadFull}
              className="micro-btn btn-glow flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              <Download className="h-4 w-4" />
              Download Full .{recording.extension.toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
