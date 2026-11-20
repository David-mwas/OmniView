import React from "react";
import { Wifi, BatteryFull, Signal, Lock, RotateCw, Share, BookOpen, Copy, ChevronLeft, ChevronRight, Home } from "lucide-react";
import type { FrameType, Orientation } from "../../types/device";

interface PhoneFrameProps {
  frameType: FrameType;
  brand: string;
  url?: string;
  showOsChrome?: boolean;
  orientation: Orientation;
  width: number;
  height: number;
  children: React.ReactNode;
}

function getHostname(url?: string): string {
  if (!url) return "omniview.local";
  try {
    const parsed = new URL(url);
    return parsed.protocol === "chrome-extension:" ? "omniview.demo" : parsed.hostname;
  } catch {
    return url;
  }
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  frameType,
  brand,
  url,
  showOsChrome = true,
  orientation,
  width,
  height,
  children,
}) => {
  const isLandscape = orientation === "landscape";
  const isIos = brand.toLowerCase() === "apple";
  const hostname = getHostname(url);

  const now = new Date();
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <div className="device-spring relative inline-flex items-center justify-center select-none">
      {/* Side hardware buttons */}
      {!isLandscape && (
        <>
          <div className="absolute -left-[3px] top-24 h-8 w-[3px] rounded-l bg-zinc-600/90" />
          <div className="absolute -left-[3px] top-36 h-12 w-[3px] rounded-l bg-zinc-600/90" />
          <div className="absolute -right-[3px] top-32 h-14 w-[3px] rounded-r bg-zinc-600/90" />
        </>
      )}

      {/* Outer titanium/matte chassis */}
      <div className="device-spring relative rounded-[44px] bg-gradient-to-b from-zinc-700 via-zinc-900 to-zinc-950 p-[11px] shadow-[0_28px_75px_-16px_rgba(0,0,0,0.7)] ring-1 ring-white/20">
        {/* Inner screen shell */}
        <div className="relative flex flex-col overflow-hidden rounded-[33px] bg-zinc-950 ring-1 ring-black/90">
          {/* Realistic OS Status Bar (Portrait) */}
          {!isLandscape && showOsChrome && (
            <div className="relative flex h-9 shrink-0 items-center justify-between bg-zinc-950 px-5 text-[11px] font-semibold text-white">
              <span className="tabular-nums tracking-tight">{timeStr}</span>

              {/* Cutout inside status bar */}
              {frameType === "dynamic_island" && (
                <div className="absolute left-1/2 top-1.5 flex h-6 w-24 -translate-x-1/2 items-center justify-end rounded-full bg-black px-2 ring-1 ring-white/10">
                  <div className="h-2.5 w-2.5 rounded-full bg-indigo-950 ring-1 ring-indigo-400/35" />
                </div>
              )}
              {frameType === "notch" && (
                <div className="absolute left-1/2 top-0 flex h-6 w-28 -translate-x-1/2 items-center justify-center gap-2 rounded-b-2xl bg-black">
                  <div className="h-1 w-9 rounded-full bg-zinc-800" />
                  <div className="h-2 w-2 rounded-full bg-zinc-800 ring-1 ring-indigo-500/30" />
                </div>
              )}
              {frameType === "punch_hole" && (
                <div className="absolute left-1/2 top-2.5 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-black ring-1 ring-zinc-700" />
              )}
              {frameType === "waterdrop" && (
                <div className="absolute left-1/2 top-0 flex h-5 w-8 -translate-x-1/2 items-center justify-center rounded-b-full bg-black">
                  <div className="h-2.5 w-2.5 rounded-full bg-zinc-800 ring-1 ring-indigo-400/20" />
                </div>
              )}

              <div className="flex items-center gap-1.5 text-white/90">
                <Signal className="h-3 w-3" />
                <Wifi className="h-3 w-3" />
                {!isIos && <span className="text-[10px] font-medium">100%</span>}
                <BatteryFull className="h-3.5 w-3.5" />
              </div>
            </div>
          )}

          {/* Android Chrome Top Address Bar */}
          {!isLandscape && showOsChrome && !isIos && (
            <div className="flex h-10 shrink-0 items-center gap-2 border-b border-zinc-800/80 bg-zinc-900 px-3 text-zinc-300">
              <Home className="h-3.5 w-3.5 text-zinc-400" />
              <div className="flex flex-1 items-center gap-1.5 rounded-full bg-zinc-800/90 px-3 py-1 text-[11px] text-zinc-200">
                <Lock className="h-2.5 w-2.5 text-emerald-400" />
                <span className="truncate">{hostname}</span>
              </div>
              <div className="flex h-4 w-4 items-center justify-center rounded border border-zinc-500 text-[9px] font-bold">
                1
              </div>
            </div>
          )}

          {/* Exact CSS viewport content */}
          <div className="relative overflow-hidden bg-white" style={{ width, height }}>
            {/* Overlay cutout only when OS status bar is hidden */}
            {!showOsChrome && !isLandscape && frameType === "dynamic_island" && (
              <div className="pointer-events-none absolute left-1/2 top-2.5 z-20 flex h-6 w-24 -translate-x-1/2 items-center justify-end rounded-full bg-black px-2 ring-1 ring-white/10">
                <div className="h-2.5 w-2.5 rounded-full bg-indigo-950/90 ring-1 ring-indigo-400/30" />
              </div>
            )}
            {!showOsChrome && !isLandscape && frameType === "punch_hole" && (
              <div className="pointer-events-none absolute left-1/2 top-2.5 z-20 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-black ring-1 ring-zinc-700/80" />
            )}
            {!showOsChrome && !isLandscape && frameType === "waterdrop" && (
              <div className="pointer-events-none absolute left-1/2 top-0 z-20 flex h-5 w-8 -translate-x-1/2 items-center justify-center rounded-b-full bg-black">
                <div className="h-2.5 w-2.5 rounded-full bg-zinc-800 ring-1 ring-indigo-400/20" />
              </div>
            )}
            {isLandscape && frameType !== "none" && (
              <div className="pointer-events-none absolute left-2.5 top-1/2 z-20 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-black ring-1 ring-zinc-700/80" />
            )}

            {children}

            {!showOsChrome && (
              <div className="pointer-events-none absolute bottom-1.5 left-1/2 z-20 h-1 w-28 -translate-x-1/2 rounded-full bg-white/35 mix-blend-difference" />
            )}
          </div>

          {/* iOS Safari Bottom Address + Navigation Bar */}
          {!isLandscape && showOsChrome && isIos && (
            <div className="flex flex-col border-t border-zinc-800/80 bg-zinc-900/95 px-3 pt-2 pb-1.5 text-zinc-300">
              <div className="flex items-center justify-between rounded-xl bg-zinc-800/90 px-3 py-1.5 text-[11px]">
                <span className="font-serif text-[10px] text-zinc-400">AA</span>
                <div className="flex items-center gap-1 truncate text-zinc-100">
                  <Lock className="h-2.5 w-2.5 text-zinc-400" />
                  <span className="truncate">{hostname}</span>
                </div>
                <RotateCw className="h-3 w-3 text-zinc-400" />
              </div>
              <div className="mt-2 flex items-center justify-around text-zinc-400">
                <ChevronLeft className="h-4 w-4" />
                <ChevronRight className="h-4 w-4 opacity-40" />
                <Share className="h-3.5 w-3.5" />
                <BookOpen className="h-3.5 w-3.5" />
                <Copy className="h-3.5 w-3.5" />
              </div>
              <div className="mx-auto mt-2 h-1 w-28 rounded-full bg-zinc-500/70" />
            </div>
          )}

          {/* Android Gesture Pill */}
          {!isLandscape && showOsChrome && !isIos && (
            <div className="flex h-4 items-center justify-center bg-zinc-950">
              <div className="h-1 w-24 rounded-full bg-zinc-600/70" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
