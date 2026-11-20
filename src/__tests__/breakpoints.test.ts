import { describe, it, expect } from "vitest";
import {
  formatDuration,
  formatFileSize,
  getBootstrapBreakpoint,
  getBreakpointInfo,
  getTailwindBreakpoint,
  normalizeUrl,
} from "../utils/breakpoints";

describe("Breakpoint & Utility Helpers", () => {
  it("computes Tailwind breakpoints accurately", () => {
    expect(getTailwindBreakpoint(360)).toBe("xs");
    expect(getTailwindBreakpoint(640)).toBe("sm");
    expect(getTailwindBreakpoint(768)).toBe("md");
    expect(getTailwindBreakpoint(1024)).toBe("lg");
    expect(getTailwindBreakpoint(1280)).toBe("xl");
    expect(getTailwindBreakpoint(1536)).toBe("2xl");
  });

  it("computes Bootstrap breakpoints accurately", () => {
    expect(getBootstrapBreakpoint(393)).toBe("xs");
    expect(getBootstrapBreakpoint(576)).toBe("sm");
    expect(getBootstrapBreakpoint(768)).toBe("md");
    expect(getBootstrapBreakpoint(992)).toBe("lg");
    expect(getBootstrapBreakpoint(1200)).toBe("xl");
    expect(getBootstrapBreakpoint(1400)).toBe("xxl");
  });

  it("returns combined breakpoint metadata", () => {
    expect(getBreakpointInfo(393)).toEqual({
      tailwind: "xs",
      bootstrap: "xs",
      label: "Mobile",
    });
    expect(getBreakpointInfo(1920)).toEqual({
      tailwind: "2xl",
      bootstrap: "xxl",
      label: "Desktop / TV",
    });
  });

  it("normalizes URLs including localhost and bare domains", () => {
    expect(normalizeUrl("localhost:5173")).toBe("http://localhost:5173");
    expect(normalizeUrl("127.0.0.1:8080/app")).toBe("http://127.0.0.1:8080/app");
    expect(normalizeUrl("example.com")).toBe("https://example.com");
    expect(normalizeUrl("https://news.ycombinator.com")).toBe(
      "https://news.ycombinator.com"
    );
  });

  it("formats recording duration and file size cleanly", () => {
    expect(formatDuration(0)).toBe("00:00");
    expect(formatDuration(74)).toBe("01:14");
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.00 MB");
  });
});
