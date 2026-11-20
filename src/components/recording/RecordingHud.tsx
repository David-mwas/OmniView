import React from "react";
import { Pause, Play, Square, Video } from "lucide-react";
import type { RecordingState } from "../../features/recording/screenRecorder";
import { formatDuration, formatFileSize } from "../../utils/breakpoints";

interface RecordingHudProps {
  state: RecordingState;
  elapsedSeconds: number;
  bytesRecorded: number;
  targetLabel: string;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export const RecordingHud: React.FC<RecordingHudProps> = ({
  state,
  elapsedSeconds,
  bytesRecorded,
  targetLabel,
  onPause,
  onResume,
  onStop,
}) => {
  if (state === "idle") return null;

  return (
    <div className="animate-slide-up fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-red-500/40 bg-zinc-950/95 px-4 py-2 text-zinc-100 shadow-[0_12px_40px_rgba(0,0,0,0.65)] backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            state === "recording" ? "animate-pulse bg-red-500" : "bg-amber-400"
          }`}
        />
        <Video className="h-4 w-4 text-red-400" />
        <span className="max-w-[140px] truncate text-xs font-medium text-zinc-300">
          {targetLabel}
        </span>
      </div>

      <div className="h-4 w-px bg-zinc-800" />

      <span className="font-mono text-sm font-semibold tabular-nums text-white">
        {formatDuration(elapsedSeconds)}
      </span>

      <span className="font-mono text-xs text-zinc-400">
        {formatFileSize(bytesRecorded)}
      </span>

      <div className="h-4 w-px bg-zinc-800" />

      {state === "recording" ? (
        <button
          onClick={onPause}
          className="flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition"
          title="Pause Recording"
        >
          <Pause className="h-3.5 w-3.5" />
          Pause
        </button>
      ) : (
        <button
          onClick={onResume}
          className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/30 transition"
          title="Resume Recording"
        >
          <Play className="h-3.5 w-3.5" />
          Resume
        </button>
      )}

      <button
        onClick={onStop}
        className="flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-500 transition"
        title="Stop and Download WebM"
      >
        <Square className="h-3 w-3 fill-current" />
        Stop
      </button>
    </div>
  );
};
