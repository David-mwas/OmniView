import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Device, DeviceCategory, FrameType } from "../../types/device";

interface CustomDeviceModalProps {
  isOpen: boolean;
  editingDevice: Device | null;
  onClose: () => void;
  onSave: (device: Device) => void;
}

const CATEGORIES: DeviceCategory[] = [
  "Smartphone",
  "Tablet",
  "Laptop",
  "Desktop",
  "Smart TV",
];

const FRAME_TYPES: { value: FrameType; label: string }[] = [
  { value: "punch_hole", label: "Punch-Hole (Android)" },
  { value: "waterdrop", label: "Waterdrop Notch" },
  { value: "dynamic_island", label: "Dynamic Island (iPhone)" },
  { value: "notch", label: "Classic Notch" },
  { value: "tablet", label: "Tablet Bezel" },
  { value: "laptop", label: "Laptop Chassis" },
  { value: "tv", label: "TV / Monitor Bezel" },
  { value: "none", label: "Frameless / None" },
];

const DEFAULT_UA =
  "Mozilla/5.0 (Linux; Android 14; CustomDevice) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";

export const CustomDeviceModal: React.FC<CustomDeviceModalProps> = ({
  isOpen,
  editingDevice,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<DeviceCategory>("Smartphone");
  const [width, setWidth] = useState(360);
  const [height, setHeight] = useState(800);
  const [dpr, setDpr] = useState(2);
  const [frameType, setFrameType] = useState<FrameType>("punch_hole");
  const [userAgent, setUserAgent] = useState(DEFAULT_UA);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingDevice) {
      setName(editingDevice.name);
      setBrand(editingDevice.brand);
      setCategory(editingDevice.category);
      setWidth(editingDevice.viewport.width);
      setHeight(editingDevice.viewport.height);
      setDpr(editingDevice.devicePixelRatio);
      setFrameType(editingDevice.frameType);
      setUserAgent(editingDevice.userAgent);
    } else {
      setName("");
      setBrand("");
      setCategory("Smartphone");
      setWidth(360);
      setHeight(800);
      setDpr(2);
      setFrameType("punch_hole");
      setUserAgent(DEFAULT_UA);
    }
    setError("");
  }, [editingDevice, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !brand.trim()) {
      setError("Device name and brand are required.");
      return;
    }
    if (width < 200 || width > 7680 || height < 200 || height > 4320) {
      setError("Viewport dimensions must be between 200px and 7680×4320px.");
      return;
    }
    if (dpr < 0.5 || dpr > 5) {
      setError("DPR must be between 0.5 and 5.");
      return;
    }

    const device: Device = {
      id: editingDevice ? editingDevice.id : `custom-${Date.now()}`,
      name: name.trim(),
      brand: brand.trim(),
      category,
      viewport: { width: Math.round(width), height: Math.round(height) },
      physicalResolution: {
        width: Math.round(width * dpr),
        height: Math.round(height * dpr),
      },
      devicePixelRatio: Number(dpr),
      userAgent: userAgent.trim() || DEFAULT_UA,
      frameType,
      accuracy: "custom",
      isCustom: true,
      isFavorite: editingDevice ? editingDevice.isFavorite : false,
    };

    onSave(device);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold">
            {editingDevice ? "Edit Custom Device" : "Add Custom Device"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Model Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tecno Pova 6"
                className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Brand
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Tecno"
                className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DeviceCategory)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Frame Bezel Style
              </label>
              <select
                value={frameType}
                onChange={(e) => setFrameType(e.target.value as FrameType)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950"
              >
                {FRAME_TYPES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Width (CSS px)
              </label>
              <input
                type="number"
                min={200}
                max={7680}
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 font-mono text-sm outline-none focus:border-indigo-500 dark:border-zinc-700"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Height (CSS px)
              </label>
              <input
                type="number"
                min={200}
                max={4320}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 font-mono text-sm outline-none focus:border-indigo-500 dark:border-zinc-700"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                DPR
              </label>
              <input
                type="number"
                step={0.1}
                min={0.5}
                max={5}
                value={dpr}
                onChange={(e) => setDpr(Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 font-mono text-sm outline-none focus:border-indigo-500 dark:border-zinc-700"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              User-Agent String
            </label>
            <textarea
              rows={2}
              value={userAgent}
              onChange={(e) => setUserAgent(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 font-mono text-xs outline-none focus:border-indigo-500 dark:border-zinc-700"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              {editingDevice ? "Save Changes" : "Add Device"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
