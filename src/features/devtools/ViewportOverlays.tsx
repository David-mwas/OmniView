import React from "react";
import type { DesignOverlayConfig } from "../../types/devtools";

interface ViewportOverlaysProps {
  width: number;
  isPhone: boolean;
  isIos: boolean;
  showColumnGrid: boolean;
  showSafeArea: boolean;
  showKeyboard: boolean;
  designOverlay: DesignOverlayConfig;
}

const KEY_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["⇧", "z", "x", "c", "v", "b", "n", "m", "⌫"],
];

export const ViewportOverlays: React.FC<ViewportOverlaysProps> = ({
  width,
  isPhone,
  isIos,
  showColumnGrid,
  showSafeArea,
  showKeyboard,
  designOverlay,
}) => {
  const columns = width < 640 ? 4 : width < 1024 ? 8 : 12;

  return (
    <>
      {/* Figma-Style Translucent Column Layout Grid */}
      {showColumnGrid && (
        <div
          className="pointer-events-none absolute inset-0 z-20 grid gap-3 px-4"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((_, idx) => (
            <div
              key={idx}
              className="h-full border-x border-rose-500/20 bg-rose-500/[0.08]"
            />
          ))}
        </div>
      )}

      {/* Safe-Area & Notch / Bottom-Bar Collision Checker */}
      {showSafeArea && isPhone && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between">
          <div className="flex h-11 items-center justify-center border-b border-dashed border-amber-400/80 bg-amber-500/15 font-mono text-[9px] font-semibold text-amber-200">
            safe-area-inset-top (44px)
          </div>
          <div className="flex h-9 items-center justify-center border-t border-dashed border-amber-400/80 bg-amber-500/15 font-mono text-[9px] font-semibold text-amber-200">
            safe-area-inset-bottom (34px)
          </div>
        </div>
      )}

      {/* Figma / Design Comp Pixel Comparator Overlay */}
      {designOverlay.dataUrl && (
        <img
          src={designOverlay.dataUrl}
          alt="Design Comp Overlay"
          className="pointer-events-none absolute inset-0 z-30 h-full w-full object-cover object-top"
          style={{
            opacity: designOverlay.opacity,
            mixBlendMode: designOverlay.blendMode,
          }}
        />
      )}

      {/* Realistic On-Screen Virtual Mobile Keyboard Overlay */}
      {showKeyboard && isPhone && (
        <div className="animate-fade-in pointer-events-none absolute inset-x-0 bottom-0 z-30 border-t border-zinc-700/80 bg-zinc-900/95 px-1.5 pt-2 pb-3 text-white shadow-2xl backdrop-blur-md">
          <div className="mb-1.5 flex items-center justify-between px-2 text-[9px] text-zinc-400">
            <span>{isIos ? "iOS Keyboard" : "Gboard Android"}</span>
            <span>Occlusion Test (~36% height)</span>
          </div>
          <div className="space-y-1.5">
            {KEY_ROWS.map((row, rIdx) => (
              <div key={rIdx} className="flex justify-center gap-1">
                {row.map((k) => (
                  <div
                    key={k}
                    className="flex h-9 flex-1 items-center justify-center rounded-md bg-zinc-700/90 text-xs font-medium shadow-sm"
                  >
                    {k}
                  </div>
                ))}
              </div>
            ))}
            <div className="flex gap-1 pt-0.5">
              <div className="flex h-9 w-16 items-center justify-center rounded-md bg-zinc-800 text-[11px]">
                123
              </div>
              <div className="flex h-9 flex-1 items-center justify-center rounded-md bg-zinc-700/90 text-[11px] text-zinc-300">
                space
              </div>
              <div className="flex h-9 w-20 items-center justify-center rounded-md bg-indigo-600 text-[11px] font-semibold">
                {isIos ? "return" : "Go"}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
