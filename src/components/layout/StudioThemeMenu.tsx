import React, { useState } from "react";
import { Palette, Sparkles, Check } from "lucide-react";
import {
  CANVAS_BACKDROPS,
  type CanvasBackdropId,
  type MotionPreset,
  type StudioAppearance,
  type ThemeCollection,
} from "../../types/theme";

interface StudioThemeMenuProps {
  appearance: StudioAppearance;
  showOsChrome: boolean;
  onChange: (patch: Partial<StudioAppearance>) => void;
  onToggleOsChrome: () => void;
}

const COLLECTIONS: { id: "all" | ThemeCollection; label: string }[] = [
  { id: "all", label: "All (16)" },
  { id: "minimal", label: "Minimal" },
  { id: "space", label: "Space" },
  { id: "aquatic", label: "Aquatic" },
  { id: "nature", label: "Nature" },
];

export const StudioThemeMenu: React.FC<StudioThemeMenuProps> = ({
  appearance,
  showOsChrome,
  onChange,
  onToggleOsChrome,
}) => {
  const [collection, setCollection] = useState<"all" | ThemeCollection>("all");

  const backdropIds = (
    Object.keys(CANVAS_BACKDROPS) as CanvasBackdropId[]
  ).filter((id) =>
    collection === "all" ? true : CANVAS_BACKDROPS[id].collection === collection
  );

  return (
    <div className="animate-scale-in max-h-[calc(100vh-88px)] w-80 overflow-y-auto rounded-2xl border border-zinc-200/90 bg-white/95 p-3.5 text-zinc-900 shadow-2xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-100">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <Palette className="h-3.5 w-3.5 text-indigo-400" />
          <span>Studio Themes & Living Scenes</span>
        </div>
        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
      </div>

      {/* Collection Tabs */}
      <div className="mb-2.5 flex flex-wrap gap-1">
        {COLLECTIONS.map((col) => (
          <button
            key={col.id}
            onClick={() => setCollection(col.id)}
            className={`micro-btn rounded-md px-2 py-0.5 text-[10px] font-medium ${
              collection === col.id
                ? "bg-indigo-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {col.label}
          </button>
        ))}
      </div>

      {/* Canvas Backdrops Grid */}
      <div className="mb-3.5 grid grid-cols-4 gap-1.5">
        {backdropIds.map((id) => {
          const meta = CANVAS_BACKDROPS[id];
          const active = appearance.backdrop === id;
          return (
            <button
              key={id}
              onClick={() => onChange({ backdrop: id })}
              className={`micro-btn group flex flex-col items-center gap-1 rounded-xl border p-1 ${
                active
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-700"
              }`}
              title={meta.label}
            >
              <div
                className="relative flex h-7 w-full items-center justify-center rounded-lg ring-1 ring-black/10 dark:ring-white/10"
                style={{ background: meta.swatch }}
              >
                {active && (
                  <Check className="h-3.5 w-3.5 text-white drop-shadow" />
                )}
              </div>
              <span className="w-full truncate text-center text-[9px] font-medium text-zinc-600 dark:text-zinc-400">
                {meta.label.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Interface Mode */}
      <div className="mb-3">
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Interface Mode
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onChange({ uiDensity: "minimal" })}
            className={`micro-btn rounded-lg border py-1.5 text-[11px] font-medium ${
              appearance.uiDensity === "minimal"
                ? "border-indigo-500 bg-indigo-600 text-white"
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            Minimal Studio
          </button>
          <button
            onClick={() => onChange({ uiDensity: "pro" })}
            className={`micro-btn rounded-lg border py-1.5 text-[11px] font-medium ${
              appearance.uiDensity === "pro"
                ? "border-indigo-500 bg-indigo-600 text-white"
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            Pro Toolbar
          </button>
        </div>
      </div>

      {/* Motion & Animation Feel */}
      <div className="mb-3">
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Animation Feel
        </div>
        <div className="grid grid-cols-4 gap-1">
          {(
            [
              { id: "silk", label: "Silk" },
              { id: "spring", label: "Spring" },
              { id: "snappy", label: "Snappy" },
              { id: "reduced", label: "Calm" },
            ] as { id: MotionPreset; label: string }[]
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => onChange({ motionPreset: m.id })}
              className={`micro-btn rounded-lg border py-1 text-[10px] font-medium ${
                appearance.motionPreset === m.id
                  ? "border-indigo-500 bg-indigo-600 text-white"
                  : "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Effects & Animations */}
      <div className="space-y-2 border-t border-zinc-200 pt-2.5 text-xs dark:border-zinc-800">
        <label className="flex cursor-pointer items-center justify-between">
          <span className="text-zinc-700 dark:text-zinc-300">
            Living Scene Animations
          </span>
          <input
            type="checkbox"
            checked={appearance.animatedMotion}
            onChange={(e) => onChange({ animatedMotion: e.target.checked })}
            className="accent-indigo-500"
          />
        </label>
        <label className="flex cursor-pointer items-center justify-between">
          <span className="text-zinc-700 dark:text-zinc-300">
            Ambient Device Glow
          </span>
          <input
            type="checkbox"
            checked={appearance.ambientGlow}
            onChange={(e) => onChange({ ambientGlow: e.target.checked })}
            className="accent-indigo-500"
          />
        </label>
        <label className="flex cursor-pointer items-center justify-between">
          <span className="text-zinc-700 dark:text-zinc-300">Subtle Dot Grid</span>
          <input
            type="checkbox"
            checked={appearance.showDotGrid}
            onChange={(e) => onChange({ showDotGrid: e.target.checked })}
            className="accent-indigo-500"
          />
        </label>
        <label className="flex cursor-pointer items-center justify-between">
          <span className="text-zinc-700 dark:text-zinc-300">
            Hover Lift Micro-Motion
          </span>
          <input
            type="checkbox"
            checked={appearance.hoverLift}
            onChange={(e) => onChange({ hoverLift: e.target.checked })}
            className="accent-indigo-500"
          />
        </label>
        <label className="flex cursor-pointer items-center justify-between">
          <span className="text-zinc-700 dark:text-zinc-300">
            Phone OS Status & URL Bar
          </span>
          <input
            type="checkbox"
            checked={showOsChrome}
            onChange={onToggleOsChrome}
            className="accent-indigo-500"
          />
        </label>
      </div>
    </div>
  );
};
