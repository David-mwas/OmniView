import React, { useState, useRef, useEffect } from "react";
import {
  Smartphone,
  RotateCw,
  Wand2,
  Video,
  Palette,
  Maximize2,
  Link2,
  Unlink2,
  ZoomIn,
  QrCode,
} from "lucide-react";
import type { StudioAppearance } from "../../types/theme";
import type { RecordingState } from "../../features/recording/screenRecorder";
import { StudioThemeMenu } from "./StudioThemeMenu";

interface FloatingRailProps {
  visible: boolean;
  sidebarOpen: boolean;
  viewMode: "single" | "multi";
  syncScroll: boolean;
  showOsChrome: boolean;
  appearance: StudioAppearance;
  recordingState: RecordingState;
  onToggleSidebar: () => void;
  onRotateAll: () => void;
  onCycleZoom: () => void;
  onToggleSyncScroll: () => void;
  onOpenStudioCapture: () => void;
  onStartRecording: () => void;
  onOpenLiveDevice: () => void;
  onChangeAppearance: (patch: Partial<StudioAppearance>) => void;
  onToggleOsChrome: () => void;
  onToggleZenMode: () => void;
}

export const FloatingRail: React.FC<FloatingRailProps> = ({
  visible,
  sidebarOpen,
  viewMode,
  syncScroll,
  showOsChrome,
  appearance,
  recordingState,
  onToggleSidebar,
  onRotateAll,
  onCycleZoom,
  onToggleSyncScroll,
  onOpenStudioCapture,
  onStartRecording,
  onOpenLiveDevice,
  onChangeAppearance,
  onToggleOsChrome,
  onToggleZenMode,
}) => {
  const [themeOpen, setThemeOpen] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (railRef.current && !railRef.current.contains(e.target as Node)) {
        setThemeOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const btnBase =
    "micro-btn flex h-9 w-9 items-center justify-center rounded-xl";

  return (
    <div
      ref={railRef}
      className={`rail-shell fixed right-3 top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-1 rounded-2xl border border-zinc-200/80 bg-white/80 p-1.5 shadow-xl backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/75 ${
        visible
          ? "translate-x-0 opacity-100"
          : "pointer-events-none translate-x-16 opacity-0"
      }`}
    >
      <button
        onClick={onToggleSidebar}
        className={`${btnBase} ${
          sidebarOpen
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
        }`}
        title="Device Library (Ctrl+K)"
      >
        <Smartphone className="h-4 w-4" />
      </button>

      {viewMode === "multi" && (
        <button
          onClick={onToggleSyncScroll}
          className={`${btnBase} ${
            syncScroll
              ? "bg-emerald-500/20 text-emerald-500 dark:text-emerald-300"
              : "text-zinc-500 hover:bg-zinc-200/70 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
          title={`Live Sync: ${syncScroll ? "ON" : "OFF"} (Shift+S)`}
        >
          {syncScroll ? (
            <Link2 className="h-4 w-4" />
          ) : (
            <Unlink2 className="h-4 w-4" />
          )}
        </button>
      )}

      <button
        onClick={onRotateAll}
        className={`${btnBase} icon-spin-hover text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white`}
        title="Rotate Active Devices"
      >
        <RotateCw className="h-4 w-4" />
      </button>

      <button
        onClick={onCycleZoom}
        className={`${btnBase} icon-pop-hover text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white`}
        title="Cycle Zoom (Auto-Fit / 50% / 75% / 100%)"
      >
        <ZoomIn className="h-4 w-4" />
      </button>

      <button
        onClick={onOpenLiveDevice}
        className={`${btnBase} icon-pop-hover text-emerald-500 hover:bg-emerald-500/15 dark:text-emerald-400`}
        title="Run on Live Physical Device (QR Code)"
      >
        <QrCode className="h-4 w-4" />
      </button>

      <div className="my-0.5 h-px w-5 bg-zinc-200 dark:bg-zinc-800" />

      <button
        onClick={onOpenStudioCapture}
        className={`${btnBase} text-zinc-500 hover:bg-indigo-500/15 hover:text-indigo-500 dark:text-zinc-400 dark:hover:text-indigo-300`}
        title="Capture & Open in Mockup Studio"
      >
        <Wand2 className="h-4 w-4" />
      </button>

      <button
        onClick={onStartRecording}
        disabled={recordingState !== "idle"}
        className={`${btnBase} ${
          recordingState !== "idle"
            ? "animate-pulse bg-red-500/20 text-red-400"
            : "text-zinc-500 hover:bg-red-500/15 hover:text-red-500 dark:text-zinc-400"
        }`}
        title="Quick Record Tab (MP4 / H.264)"
      >
        <Video className="h-4 w-4" />
      </button>

      <div className="relative">
        <button
          onClick={() => setThemeOpen((o) => !o)}
          className={`${btnBase} ${
            themeOpen
              ? "bg-indigo-600 text-white"
              : "text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
          }`}
          title="Studio Themes, Backdrops & Effects"
        >
          <Palette className="h-4 w-4" />
        </button>

        {themeOpen && (
          <div className="animate-popover-left absolute bottom-0 right-full mr-3">
            <StudioThemeMenu
              appearance={appearance}
              showOsChrome={showOsChrome}
              onChange={onChangeAppearance}
              onToggleOsChrome={onToggleOsChrome}
            />
          </div>
        )}
      </div>

      <button
        onClick={onToggleZenMode}
        className={`${btnBase} text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white`}
        title="Zen Presentation Mode (Shift+Z)"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
    </div>
  );
};
