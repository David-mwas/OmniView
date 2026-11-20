export type VisionFilterId =
  | "none"
  | "protanopia"
  | "deuteranopia"
  | "tritanopia"
  | "achromatopsia"
  | "blurred"
  | "low_contrast";

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
    label: "Low Contrast / Glare",
    description: "Simulates bright outdoor sunlight & contrast loss",
    cssFilter: "contrast(0.55) brightness(1.12)",
  },
};

export type CompareLayoutMode = "grid" | "row";
