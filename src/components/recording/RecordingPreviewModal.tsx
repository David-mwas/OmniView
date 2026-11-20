import React from "react";
import { Download, Film, X } from "lucide-react";
import {
  downloadRecording,
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
  if (!recording) return null;

  const handleDownload = async () => {
    await downloadRecording(recording);
    onDownloaded(recording.filename);
  };

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="animate-scale-in flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold">Recording Preview & Export</h2>
            <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase text-emerald-300">
              .{recording.extension}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center bg-black p-4">
          <video
            src={recording.objectUrl}
            controls
            autoPlay
            playsInline
            className="max-h-[58vh] w-full rounded-lg bg-black"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-900/80 px-5 py-3.5">
          <div className="space-y-0.5 text-xs text-zinc-400">
            <div className="font-mono text-zinc-200">{recording.filename}</div>
            <div>
              {formatDuration(recording.durationSeconds)} •{" "}
              {formatFileSize(recording.sizeBytes)} • {recording.mimeType}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-zinc-700 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
            >
              Discard
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 active:scale-[0.99] transition"
            >
              <Download className="h-4 w-4" />
              Download .{recording.extension.toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
