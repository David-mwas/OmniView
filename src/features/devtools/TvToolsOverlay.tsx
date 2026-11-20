import React from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CornerDownLeft,
  Undo2,
  Tv,
} from "lucide-react";

interface TvOverscanOverlayProps {
  visible: boolean;
}

export const TvOverscanOverlay: React.FC<TvOverscanOverlayProps> = ({ visible }) => {
  if (!visible) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {/* 5% Action-Safe Guide */}
      <div
        className="absolute border-2 border-dashed border-amber-400/80"
        style={{ inset: "5%" }}
      >
        <span className="absolute left-2 top-1 rounded bg-amber-500/90 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-950">
          5% Action Safe
        </span>
      </div>
      {/* 10% Title-Safe Guide */}
      <div
        className="absolute border-2 border-dashed border-emerald-400/80"
        style={{ inset: "10%" }}
      >
        <span className="absolute left-2 top-1 rounded bg-emerald-500/90 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-950">
          10% Title Safe
        </span>
      </div>
    </div>
  );
};

interface TvRemoteHudProps {
  deviceName: string;
  onKeyPress: (key: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" | "Enter" | "Escape") => void;
  onClose: () => void;
}

export const TvRemoteHud: React.FC<TvRemoteHudProps> = ({
  deviceName,
  onKeyPress,
  onClose,
}) => {
  return (
    <div className="animate-scale-in fixed bottom-5 right-5 z-50 w-52 rounded-2xl border border-zinc-700/80 bg-zinc-900/95 p-3.5 text-zinc-100 shadow-2xl backdrop-blur-md">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
          <Tv className="h-3.5 w-3.5" />
          <span className="truncate max-w-[130px]">{deviceName}</span>
        </div>
        <button
          onClick={onClose}
          className="rounded px-1.5 py-0.5 text-[11px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          title="Close Remote"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <div />
        <button
          onClick={() => onKeyPress("ArrowUp")}
          className="flex h-10 items-center justify-center rounded-lg bg-zinc-800 hover:bg-indigo-600 active:scale-95 transition"
          title="Up (ArrowUp)"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <div />

        <button
          onClick={() => onKeyPress("ArrowLeft")}
          className="flex h-10 items-center justify-center rounded-lg bg-zinc-800 hover:bg-indigo-600 active:scale-95 transition"
          title="Left (ArrowLeft)"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onKeyPress("Enter")}
          className="flex h-10 items-center justify-center rounded-lg bg-indigo-600 font-semibold text-xs hover:bg-indigo-500 active:scale-95 transition"
          title="OK / Enter"
        >
          <CornerDownLeft className="h-3.5 w-3.5 mr-0.5" />
          OK
        </button>
        <button
          onClick={() => onKeyPress("ArrowRight")}
          className="flex h-10 items-center justify-center rounded-lg bg-zinc-800 hover:bg-indigo-600 active:scale-95 transition"
          title="Right (ArrowRight)"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div />
        <button
          onClick={() => onKeyPress("ArrowDown")}
          className="flex h-10 items-center justify-center rounded-lg bg-zinc-800 hover:bg-indigo-600 active:scale-95 transition"
          title="Down (ArrowDown)"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
        <button
          onClick={() => onKeyPress("Escape")}
          className="flex h-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:scale-95 transition"
          title="Back (Escape)"
        >
          <Undo2 className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-2.5 text-[10px] leading-snug text-zinc-400">
        Dispatches keyboard focus events for same-origin / Demo pages.
      </p>
    </div>
  );
};
