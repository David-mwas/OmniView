export type TailwindBreakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type BootstrapBreakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

export interface BreakpointInfo {
  tailwind: TailwindBreakpoint;
  bootstrap: BootstrapBreakpoint;
  label: string;
}

export function getTailwindBreakpoint(width: number): TailwindBreakpoint {
  if (width >= 1536) return "2xl";
  if (width >= 1280) return "xl";
  if (width >= 1024) return "lg";
  if (width >= 768) return "md";
  if (width >= 640) return "sm";
  return "xs";
}

export function getBootstrapBreakpoint(width: number): BootstrapBreakpoint {
  if (width >= 1400) return "xxl";
  if (width >= 1200) return "xl";
  if (width >= 992) return "lg";
  if (width >= 768) return "md";
  if (width >= 576) return "sm";
  return "xs";
}

export function getBreakpointInfo(width: number): BreakpointInfo {
  const tailwind = getTailwindBreakpoint(width);
  const bootstrap = getBootstrapBreakpoint(width);
  const label =
    width < 640
      ? "Mobile"
      : width < 1024
        ? "Tablet"
        : width < 1440
          ? "Laptop"
          : "Desktop / TV";
  return { tailwind, bootstrap, label };
}

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^(https?|chrome-extension):\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (/^localhost(:\d+)?(\/|$)/i.test(trimmed) || /^127\.0\.0\.1(:\d+)?(\/|$)/.test(trimmed)) {
    return `http://${trimmed}`;
  }
  return `https://${trimmed}`;
}

export function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
