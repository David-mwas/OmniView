export type CanvasBackdropId =
  // Minimal Studio
  | "obsidian"
  | "paper"
  | "sand"
  | "graphite"
  // Cosmos & Space
  | "deep_space"
  | "nebula_nova"
  | "solar_eclipse"
  | "cyber"
  // Marine & Aquatic
  | "ocean"
  | "coral_reef"
  | "bioluminescent"
  | "arctic_ice"
  // Nature & Atmospheric
  | "aurora"
  | "sunset"
  | "emerald_forest"
  | "sakura_bloom";

export type ThemeCollection = "minimal" | "space" | "aquatic" | "nature";

export type SceneEffectType =
  | "none"
  | "stars"
  | "eclipse"
  | "aquatic"
  | "aurora"
  | "fireflies"
  | "petals"
  | "cyber_grid"
  | "orbs";

export type UiDensity = "minimal" | "pro";
export type MotionPreset = "silk" | "spring" | "snappy" | "reduced";

export interface StudioAppearance {
  backdrop: CanvasBackdropId;
  showDotGrid: boolean;
  ambientGlow: boolean;
  animatedMotion: boolean;
  hoverLift: boolean;
  uiDensity: UiDensity;
  motionPreset: MotionPreset;
}

export const DEFAULT_APPEARANCE: StudioAppearance = {
  backdrop: "obsidian",
  showDotGrid: false,
  ambientGlow: true,
  animatedMotion: true,
  hoverLift: true,
  uiDensity: "minimal",
  motionPreset: "silk",
};

export interface BackdropMeta {
  id: CanvasBackdropId;
  label: string;
  collection: ThemeCollection;
  mode: "dark" | "light";
  scene: SceneEffectType;
  swatch: string;
  canvasStyle: string;
  glowColor: string;
}

export const CANVAS_BACKDROPS: Record<CanvasBackdropId, BackdropMeta> = {
  // === Minimal Studio ===
  obsidian: {
    id: "obsidian",
    label: "Obsidian",
    collection: "minimal",
    mode: "dark",
    scene: "none",
    swatch: "linear-gradient(135deg, #18181b, #27272a)",
    canvasStyle: "#1b1b1f",
    glowColor: "rgba(99, 102, 241, 0.16)",
  },
  graphite: {
    id: "graphite",
    label: "Graphite",
    collection: "minimal",
    mode: "dark",
    scene: "orbs",
    swatch: "linear-gradient(135deg, #1e293b, #0f172a)",
    canvasStyle:
      "radial-gradient(circle at 50% 0%, rgba(148,163,184,0.14), transparent 55%), #0f141c",
    glowColor: "rgba(148, 163, 184, 0.18)",
  },
  paper: {
    id: "paper",
    label: "Pure Paper",
    collection: "minimal",
    mode: "light",
    scene: "none",
    swatch: "linear-gradient(135deg, #f8fafc, #e2e8f0)",
    canvasStyle: "#f3f4f6",
    glowColor: "rgba(99, 102, 241, 0.12)",
  },
  sand: {
    id: "sand",
    label: "Warm Sand",
    collection: "minimal",
    mode: "light",
    scene: "orbs",
    swatch: "linear-gradient(135deg, #faf7f2, #e7e0d4)",
    canvasStyle:
      "radial-gradient(circle at 20% 20%, rgba(251,191,36,0.14), transparent 50%), #f5f1ea",
    glowColor: "rgba(217, 119, 6, 0.14)",
  },

  // === Cosmos & Space ===
  deep_space: {
    id: "deep_space",
    label: "Deep Space",
    collection: "space",
    mode: "dark",
    scene: "stars",
    swatch: "linear-gradient(135deg, #020617, #1e1b4b, #312e81)",
    canvasStyle:
      "radial-gradient(ellipse at 20% 15%, rgba(67,56,202,0.28), transparent 50%), radial-gradient(ellipse at 85% 85%, rgba(14,165,233,0.18), transparent 50%), #030712",
    glowColor: "rgba(99, 102, 241, 0.28)",
  },
  nebula_nova: {
    id: "nebula_nova",
    label: "Nebula Nova",
    collection: "space",
    mode: "dark",
    scene: "stars",
    swatch: "linear-gradient(135deg, #1e0933, #9333ea, #06b6d4)",
    canvasStyle:
      "radial-gradient(ellipse at 25% 25%, rgba(192,38,211,0.3), transparent 48%), radial-gradient(ellipse at 78% 72%, rgba(6,182,212,0.24), transparent 50%), #090514",
    glowColor: "rgba(217, 70, 239, 0.28)",
  },
  solar_eclipse: {
    id: "solar_eclipse",
    label: "Solar Eclipse",
    collection: "space",
    mode: "dark",
    scene: "eclipse",
    swatch: "linear-gradient(135deg, #09090b, #78350f, #f59e0b)",
    canvasStyle:
      "radial-gradient(circle at 50% 42%, rgba(245,158,11,0.22), rgba(180,83,9,0.08) 38%, transparent 65%), #070709",
    glowColor: "rgba(245, 158, 11, 0.26)",
  },
  cyber: {
    id: "cyber",
    label: "Cyber Grid",
    collection: "space",
    mode: "dark",
    scene: "cyber_grid",
    swatch: "linear-gradient(135deg, #09090b, #3b0764, #7c3aed)",
    canvasStyle:
      "radial-gradient(circle at 50% 0%, rgba(139,92,246,0.28), transparent 55%), #08070f",
    glowColor: "rgba(168, 85, 247, 0.28)",
  },

  // === Marine & Aquatic ===
  ocean: {
    id: "ocean",
    label: "Abyssal Sea",
    collection: "aquatic",
    mode: "dark",
    scene: "aquatic",
    swatch: "linear-gradient(135deg, #041526, #0c4a6e, #0284c7)",
    canvasStyle:
      "radial-gradient(ellipse at 50% -10%, rgba(56,189,248,0.32), transparent 55%), linear-gradient(180deg, #062138 0%, #03111f 100%)",
    glowColor: "rgba(56, 189, 248, 0.26)",
  },
  coral_reef: {
    id: "coral_reef",
    label: "Coral Lagoon",
    collection: "aquatic",
    mode: "dark",
    scene: "aquatic",
    swatch: "linear-gradient(135deg, #042f2e, #0d9488, #2dd4bf)",
    canvasStyle:
      "radial-gradient(ellipse at 30% 0%, rgba(45,212,191,0.3), transparent 52%), radial-gradient(ellipse at 80% 90%, rgba(244,114,182,0.16), transparent 50%), linear-gradient(180deg, #063136 0%, #041b22 100%)",
    glowColor: "rgba(45, 212, 191, 0.26)",
  },
  bioluminescent: {
    id: "bioluminescent",
    label: "Bioluminescent",
    collection: "aquatic",
    mode: "dark",
    scene: "aquatic",
    swatch: "linear-gradient(135deg, #020617, #0e7490, #22d3ee)",
    canvasStyle:
      "radial-gradient(circle at 20% 80%, rgba(34,211,238,0.26), transparent 45%), radial-gradient(circle at 80% 20%, rgba(99,102,241,0.24), transparent 45%), #020817",
    glowColor: "rgba(34, 211, 238, 0.3)",
  },
  arctic_ice: {
    id: "arctic_ice",
    label: "Arctic Frost",
    collection: "aquatic",
    mode: "light",
    scene: "aquatic",
    swatch: "linear-gradient(135deg, #e0f2fe, #bae6fd, #7dd3fc)",
    canvasStyle:
      "radial-gradient(ellipse at 50% 0%, rgba(56,189,248,0.24), transparent 55%), linear-gradient(180deg, #eff8ff 0%, #dbeefe 100%)",
    glowColor: "rgba(14, 165, 233, 0.2)",
  },

  // === Nature & Atmospheric ===
  aurora: {
    id: "aurora",
    label: "Aurora",
    collection: "nature",
    mode: "dark",
    scene: "aurora",
    swatch: "linear-gradient(135deg, #042f2e, #10b981, #4f46e5)",
    canvasStyle:
      "radial-gradient(ellipse at 20% 20%, rgba(16,185,129,0.26), transparent 50%), radial-gradient(ellipse at 80% 25%, rgba(99,102,241,0.28), transparent 50%), #050a14",
    glowColor: "rgba(52, 211, 153, 0.26)",
  },
  sunset: {
    id: "sunset",
    label: "Sunset Velvet",
    collection: "nature",
    mode: "dark",
    scene: "orbs",
    swatch: "linear-gradient(135deg, #1b1026, #be185d, #f97316)",
    canvasStyle:
      "radial-gradient(circle at 22% 24%, rgba(219,39,119,0.28), transparent 46%), radial-gradient(circle at 80% 76%, rgba(249,115,22,0.24), transparent 48%), #120b18",
    glowColor: "rgba(244, 114, 182, 0.25)",
  },
  emerald_forest: {
    id: "emerald_forest",
    label: "Mystic Forest",
    collection: "nature",
    mode: "dark",
    scene: "fireflies",
    swatch: "linear-gradient(135deg, #022c22, #065f46, #84cc16)",
    canvasStyle:
      "radial-gradient(ellipse at 30% 80%, rgba(16,185,129,0.22), transparent 50%), radial-gradient(ellipse at 75% 20%, rgba(132,204,22,0.16), transparent 48%), #031510",
    glowColor: "rgba(132, 204, 22, 0.22)",
  },
  sakura_bloom: {
    id: "sakura_bloom",
    label: "Sakura Bloom",
    collection: "nature",
    mode: "light",
    scene: "petals",
    swatch: "linear-gradient(135deg, #fff1f2, #fecdd3, #fda4af)",
    canvasStyle:
      "radial-gradient(ellipse at 20% 15%, rgba(251,113,133,0.18), transparent 50%), linear-gradient(180deg, #fff5f7 0%, #ffe8ee 100%)",
    glowColor: "rgba(244, 63, 94, 0.16)",
  },
};
