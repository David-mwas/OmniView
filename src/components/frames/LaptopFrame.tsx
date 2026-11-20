import React from "react";

interface LaptopFrameProps {
  width: number;
  height: number;
  children: React.ReactNode;
}

export const LaptopFrame: React.FC<LaptopFrameProps> = ({
  width,
  height,
  children,
}) => {
  return (
    <div className="relative inline-flex flex-col items-center select-none">
      {/* Screen lid */}
      <div className="relative rounded-t-[20px] rounded-b-[6px] bg-gradient-to-b from-zinc-800 to-zinc-950 px-[16px] pt-[20px] pb-[14px] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.65)] ring-1 ring-white/15">
        {/* Webcam notch */}
        <div className="pointer-events-none absolute left-1/2 top-2 flex -translate-x-1/2 items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-zinc-700 ring-1 ring-emerald-400/40" />
        </div>

        {/* Exact viewport */}
        <div
          className="relative overflow-hidden rounded-[4px] bg-black ring-1 ring-black/80"
          style={{ width, height }}
        >
          {children}
        </div>
      </div>

      {/* Metallic laptop base */}
      <div
        className="relative h-[22px] rounded-b-[14px] bg-gradient-to-b from-zinc-600 via-zinc-700 to-zinc-800 shadow-xl ring-1 ring-white/10"
        style={{ width: width + 110 }}
      >
        <div className="mx-auto h-[5px] w-28 rounded-b-md bg-zinc-900/70" />
      </div>
    </div>
  );
};
