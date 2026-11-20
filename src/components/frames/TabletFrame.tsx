import React from "react";
import type { Orientation } from "../../types/device";

interface TabletFrameProps {
  orientation: Orientation;
  width: number;
  height: number;
  children: React.ReactNode;
}

export const TabletFrame: React.FC<TabletFrameProps> = ({
  orientation,
  width,
  height,
  children,
}) => {
  const isLandscape = orientation === "landscape";

  return (
    <div className="relative inline-flex items-center justify-center select-none">
      <div className="relative rounded-[28px] bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950 p-[18px] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.65)] ring-1 ring-white/15 transition-all duration-300">
        {/* Front camera dot */}
        <div
          className={
            isLandscape
              ? "pointer-events-none absolute left-1/2 top-2 h-2 w-2 -translate-x-1/2 rounded-full bg-zinc-700 ring-1 ring-white/10"
              : "pointer-events-none absolute left-1/2 top-2 h-2 w-2 -translate-x-1/2 rounded-full bg-zinc-700 ring-1 ring-white/10"
          }
        />
        <div
          className="relative overflow-hidden rounded-[14px] bg-black ring-1 ring-black/80"
          style={{ width, height }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
