export type VisionFilterId =
  | "none"
  | "protanopia"
  | "deuteranopia"
  | "tritanopia"
  | "achromatopsia"
  | "blurred"
  | "low_contrast"
  | "battery_saver";

export interface VisionFilterMeta {
  id: VisionFilterId;
  label: string;
  description: string;
  cssFilter: string;
}

export const VISION_FILTERS: Record<VisionFilterId, VisionFilterMeta> = {
  none: {
    id: "none",
    label: "Normal Vision",
    description: "No vision simulation filter",
    cssFilter: "none",
  },
  protanopia: {
    id: "protanopia",
    label: "Protanopia (Red-Blind)",
    description: "Simulates red-cone deficiency (~1% of males)",
    cssFilter: "url(#omniview-protanopia)",
  },
  deuteranopia: {
    id: "deuteranopia",
    label: "Deuteranopia (Green-Blind)",
    description: "Simulates green-cone deficiency (most common)",
    cssFilter: "url(#omniview-deuteranopia)",
  },
  tritanopia: {
    id: "tritanopia",
    label: "Tritanopia (Blue-Blind)",
    description: "Simulates blue-yellow color blindness",
    cssFilter: "url(#omniview-tritanopia)",
  },
  achromatopsia: {
    id: "achromatopsia",
    label: "Achromatopsia (Monochrome)",
    description: "Complete color blindness / grayscale",
    cssFilter: "grayscale(100%)",
  },
  blurred: {
    id: "blurred",
    label: "Blurred Vision",
    description: "Simulates low visual acuity / reading without glasses",
    cssFilter: "blur(2.2px)",
  },
  low_contrast: {
    id: "low_contrast",
    label: "Sunlight Glare / Low Contrast",
    description: "Simulates harsh outdoor sunlight & washed-out contrast",
    cssFilter: "contrast(0.55) brightness(1.18)",
  },
  battery_saver: {
    id: "battery_saver",
    label: "Battery Saver / Low Light",
    description: "Simulates dimmed screen brightness for night / power-saving",
    cssFilter: "brightness(0.58) contrast(0.95)",
  },
};

export type CompareLayoutMode = "grid" | "row";
export type TiltMode = "flat" | "left" | "right";
export type TextScaleOption = 1 | 1.25 | 1.5 | 2;

export interface DesignOverlayConfig {
  dataUrl: string | null;
  opacity: number;
  blendMode: "normal" | "difference";
}

export interface PageAuditData {
  url: string;
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  favicon: string;
  fonts: string[];
  colors: string[];
  brokenImages: number;
  smallTouchTargets: number;
  domNodes: number;
  imageCount: number;
  loadTimeMs: number;
  cls: number;
  overflowPx: number;
  consoleErrors: string[];
  updatedAt: number;
}
