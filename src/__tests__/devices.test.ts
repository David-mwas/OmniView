import { describe, it, expect } from "vitest";
import { BUILTIN_DEVICES, PRESET_GROUPS } from "../data/devices";

const VALID_CATEGORIES = new Set([
  "Smartphone",
  "Tablet",
  "Laptop",
  "Desktop",
  "Smart TV",
]);

const VALID_FRAME_TYPES = new Set([
  "dynamic_island",
  "notch",
  "punch_hole",
  "waterdrop",
  "tablet",
  "laptop",
  "tv",
  "none",
]);

const VALID_ACCURACY = new Set(["verified", "estimated", "custom"]);

describe("Device Library Schema & Integrity", () => {
  it("contains at least 35 pre-seeded devices", () => {
    expect(BUILTIN_DEVICES.length).toBeGreaterThanOrEqual(35);
  });

  it("includes emerging-market brands alongside international flagships", () => {
    const brands = new Set(BUILTIN_DEVICES.map((d) => d.brand));
    for (const required of [
      "Itel",
      "Tecno",
      "Infinix",
      "Oppo",
      "Xiaomi",
      "Apple",
      "Samsung",
      "Google",
      "Smart TV",
    ]) {
      expect(brands.has(required)).toBe(true);
    }
  });

  it("has unique IDs and valid viewport, DPR, frameType, and accuracy fields", () => {
    const ids = new Set<string>();
    for (const device of BUILTIN_DEVICES) {
      expect(ids.has(device.id)).toBe(false);
      ids.add(device.id);

      expect(device.name.trim().length).toBeGreaterThan(0);
      expect(device.brand.trim().length).toBeGreaterThan(0);
      expect(VALID_CATEGORIES.has(device.category)).toBe(true);
      expect(VALID_FRAME_TYPES.has(device.frameType)).toBe(true);
      expect(VALID_ACCURACY.has(device.accuracy)).toBe(true);

      expect(device.viewport.width).toBeGreaterThanOrEqual(300);
      expect(device.viewport.height).toBeGreaterThanOrEqual(400);
      expect(device.devicePixelRatio).toBeGreaterThanOrEqual(1);
      expect(device.devicePixelRatio).toBeLessThanOrEqual(4);
      expect(device.userAgent.length).toBeGreaterThan(20);
      expect(device.isCustom).toBe(false);
    }
  });

  it("all preset groups reference valid built-in device IDs", () => {
    const idSet = new Set(BUILTIN_DEVICES.map((d) => d.id));
    for (const preset of PRESET_GROUPS) {
      expect(preset.deviceIds.length).toBeGreaterThan(0);
      for (const id of preset.deviceIds) {
        expect(idSet.has(id)).toBe(true);
      }
    }
  });
});
