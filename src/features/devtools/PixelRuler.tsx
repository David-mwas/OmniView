import React from "react";

interface PixelRulerProps {
  width: number;
  height: number;
}

export const PixelRuler: React.FC<PixelRulerProps> = ({ width, height }) => {
  const step = width > 1600 ? 200 : width > 800 ? 100 : 50;
  const xTicks: number[] = [];
  for (let x = 0; x <= width; x += step) xTicks.push(x);

  const yTicks: number[] = [];
  for (let y = 0; y <= height; y += step) yTicks.push(y);

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {/* Top ruler */}
      <div className="absolute left-0 right-0 top-0 h-5 bg-zinc-950/80 backdrop-blur-[2px] border-b border-indigo-400/50">
        {xTicks.map((x) => (
          <div
            key={`x-${x}`}
            className="absolute top-0 flex flex-col items-start"
            style={{ left: x }}
          >
            <div className="h-2.5 w-px bg-indigo-400/80" />
            {x > 0 && (
              <span className="ml-0.5 -mt-1 font-mono text-[9px] leading-none text-indigo-200">
                {x}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Left ruler */}
      <div className="absolute bottom-0 left-0 top-5 w-5 bg-zinc-950/80 backdrop-blur-[2px] border-r border-indigo-400/50">
        {yTicks.map((y) => (
          <div
            key={`y-${y}`}
            className="absolute left-0 flex items-center"
            style={{ top: Math.max(0, y - 20) }}
          >
            <div className="h-px w-2.5 bg-indigo-400/80" />
            {y >= step && (
              <span className="ml-0.5 font-mono text-[8px] leading-none text-indigo-200">
                {y}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
