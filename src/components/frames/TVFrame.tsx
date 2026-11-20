import React from "react";

interface TVFrameProps {
  width: number;
  height: number;
  children: React.ReactNode;
}

export const TVFrame: React.FC<TVFrameProps> = ({ width, height, children }) => {
  return (
    <div className="relative inline-flex flex-col items-center select-none">
      {/* Ultra-slim TV bezel */}
      <div className="relative rounded-[12px] bg-zinc-950 p-[12px] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.75)] ring-1 ring-white/15">
        <div
          className="relative overflow-hidden rounded-[4px] bg-black"
          style={{ width, height }}
        >
          {children}
        </div>
        {/* Power LED */}
        <div className="pointer-events-none mx-auto mt-1.5 flex items-center justify-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
        </div>
      </div>

      {/* Stand neck & base */}
      <div className="h-[26px] w-[100px] bg-gradient-to-b from-zinc-800 to-zinc-900 ring-1 ring-white/10" />
      <div
        className="h-[10px] rounded-full bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800 shadow-lg"
        style={{ width: Math.min(width * 0.35, 420) }}
      />
    </div>
  );
};
