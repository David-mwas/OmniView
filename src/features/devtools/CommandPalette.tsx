import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, Smartphone, Palette, Layers, Zap, Eye } from "lucide-react";
import type { Device, PresetGroup } from "../../types/device";
import { CANVAS_BACKDROPS, type CanvasBackdropId } from "../../types/theme";
import { VISION_FILTERS, type VisionFilterId } from "../../types/devtools";

export interface CommandItem {
  id: string;
  group: "Actions" | "Devices" | "Themes" | "Presets" | "Vision";
  label: string;
  hint?: string;
  run: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  devices: Device[];
  presets: PresetGroup[];
  actions: Array<{ id: string; label: string; hint?: string; run: () => void }>;
  onSelectDevice: (device: Device) => void;
  onSelectTheme: (id: CanvasBackdropId) => void;
  onApplyPreset: (preset: PresetGroup) => void;
  onSelectVision: (id: VisionFilterId) => void;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  devices,
  presets,
  actions,
  onSelectDevice,
  onSelectTheme,
  onApplyPreset,
  onSelectVision,
  onClose,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIdx(0);
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [isOpen]);

  const allItems = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [];
    for (const a of actions) {
      list.push({ id: `act-${a.id}`, group: "Actions", label: a.label, hint: a.hint, run: a.run });
    }
    for (const p of presets) {
      list.push({
        id: `pre-${p.id}`,
        group: "Presets",
        label: `Preset: ${p.name}`,
        hint: p.description,
        run: () => onApplyPreset(p),
      });
    }
    for (const id of Object.keys(CANVAS_BACKDROPS) as CanvasBackdropId[]) {
      const b = CANVAS_BACKDROPS[id];
      list.push({
        id: `thm-${id}`,
        group: "Themes",
        label: `Theme: ${b.label}`,
        hint: `${b.collection} • ${b.mode}`,
        run: () => onSelectTheme(id),
      });
    }
    for (const id of Object.keys(VISION_FILTERS) as VisionFilterId[]) {
      const v = VISION_FILTERS[id];
      list.push({
        id: `vis-${id}`,
        group: "Vision",
        label: `Vision: ${v.label}`,
        hint: v.description,
        run: () => onSelectVision(id),
      });
    }
    for (const d of devices) {
      list.push({
        id: `dev-${d.id}`,
        group: "Devices",
        label: `${d.name} (${d.brand})`,
        hint: `${d.viewport.width}×${d.viewport.height} • ${d.category}`,
        run: () => onSelectDevice(d),
      });
    }
    return list;
  }, [actions, presets, devices, onApplyPreset, onSelectTheme, onSelectVision, onSelectDevice]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems.slice(0, 24);
    return allItems
      .filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          (item.hint?.toLowerCase().includes(q) ?? false) ||
          item.group.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [allItems, query]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && filtered[selectedIdx]) {
      e.preventDefault();
      filtered[selectedIdx].run();
      onClose();
    }
  };

  const GroupIcon = ({ group }: { group: CommandItem["group"] }) => {
    switch (group) {
      case "Devices":
        return <Smartphone className="h-3.5 w-3.5 text-indigo-400" />;
      case "Themes":
        return <Palette className="h-3.5 w-3.5 text-pink-400" />;
      case "Presets":
        return <Layers className="h-3.5 w-3.5 text-emerald-400" />;
      case "Vision":
        return <Eye className="h-3.5 w-3.5 text-amber-400" />;
      default:
        return <Zap className="h-3.5 w-3.5 text-sky-400" />;
    }
  };

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-start justify-center bg-black/65 pt-[12vh] p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-scale-in w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/95 text-zinc-100 shadow-2xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-2.5 border-b border-zinc-800 px-4 py-3">
          <Search className="h-4 w-4 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, device, theme, preset, or vision mode..."
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
          />
          <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
            ESC
          </kbd>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-xs text-zinc-500">
              No matching commands or devices.
            </div>
          ) : (
            filtered.map((item, idx) => (
              <button
                key={item.id}
                onMouseEnter={() => setSelectedIdx(idx)}
                onClick={() => {
                  item.run();
                  onClose();
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${
                  idx === selectedIdx
                    ? "bg-indigo-600 text-white"
                    : "text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <GroupIcon group={item.group} />
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium">{item.label}</div>
                    {item.hint && (
                      <div
                        className={`truncate text-[10px] ${
                          idx === selectedIdx ? "text-indigo-100" : "text-zinc-500"
                        }`}
                      >
                        {item.hint}
                      </div>
                    )}
                  </div>
                </div>
                <span
                  className={`ml-2 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
                    idx === selectedIdx
                      ? "bg-white/20 text-white"
                      : "bg-zinc-900 text-zinc-500"
                  }`}
                >
                  {item.group}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
