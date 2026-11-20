import React from "react";
import type { SceneEffectType } from "../../types/theme";

interface CanvasSceneProps {
  scene: SceneEffectType;
  glowColor: string;
  enabled: boolean;
}

// Deterministic particle coordinates (zero re-render jitter)
const STARS = [
  { x: 6, y: 12, s: 2, d: 0 },
  { x: 14, y: 28, s: 1.5, d: 1.2 },
  { x: 22, y: 8, s: 2.5, d: 0.4 },
  { x: 31, y: 42, s: 1.5, d: 2.1 },
  { x: 42, y: 16, s: 2, d: 0.8 },
  { x: 54, y: 9, s: 2.5, d: 1.6 },
  { x: 63, y: 34, s: 1.5, d: 0.2 },
  { x: 74, y: 14, s: 2, d: 2.4 },
  { x: 83, y: 26, s: 2.5, d: 1.1 },
  { x: 92, y: 10, s: 1.5, d: 0.6 },
  { x: 11, y: 68, s: 2, d: 1.8 },
  { x: 26, y: 78, s: 1.5, d: 0.5 },
  { x: 38, y: 88, s: 2, d: 2.2 },
  { x: 58, y: 74, s: 1.5, d: 1.4 },
  { x: 71, y: 84, s: 2.5, d: 0.9 },
  { x: 86, y: 66, s: 2, d: 1.9 },
  { x: 94, y: 82, s: 1.5, d: 0.3 },
  { x: 48, y: 52, s: 1.5, d: 2.6 },
];

const BUBBLES = [
  { x: 8, s: 10, dur: 11, delay: 0 },
  { x: 18, s: 6, dur: 9, delay: 2 },
  { x: 29, s: 14, dur: 14, delay: 1 },
  { x: 44, s: 8, dur: 10, delay: 4 },
  { x: 57, s: 12, dur: 13, delay: 0.5 },
  { x: 69, s: 7, dur: 9.5, delay: 3 },
  { x: 78, s: 16, dur: 15, delay: 2.5 },
  { x: 88, s: 9, dur: 11.5, delay: 1.5 },
  { x: 94, s: 6, dur: 8.5, delay: 5 },
];

const FIREFLIES = [
  { x: 12, y: 24, d: 0 },
  { x: 28, y: 65, d: 1.4 },
  { x: 45, y: 32, d: 2.8 },
  { x: 62, y: 72, d: 0.7 },
  { x: 76, y: 28, d: 2.1 },
  { x: 86, y: 58, d: 3.2 },
  { x: 20, y: 82, d: 1.9 },
  { x: 54, y: 18, d: 0.4 },
];

const PETALS = [
  { x: 10, dur: 12, delay: 0 },
  { x: 24, dur: 14, delay: 2.5 },
  { x: 38, dur: 11, delay: 1.1 },
  { x: 52, dur: 15, delay: 3.4 },
  { x: 68, dur: 13, delay: 0.7 },
  { x: 82, dur: 12.5, delay: 4.2 },
  { x: 92, dur: 14.5, delay: 1.9 },
];

export const CanvasScene: React.FC<CanvasSceneProps> = ({
  scene,
  glowColor,
  enabled,
}) => {
  if (!enabled || scene === "none") return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Cosmos & Space Starfield + Shooting Star */}
      {scene === "stars" && (
        <>
          {STARS.map((st, idx) => (
            <span
              key={idx}
              className="animate-twinkle absolute rounded-full bg-white"
              style={{
                left: `${st.x}%`,
                top: `${st.y}%`,
                width: st.s,
                height: st.s,
                animationDelay: `${st.d}s`,
                boxShadow: "0 0 6px rgba(255,255,255,0.85)",
              }}
            />
          ))}
          <div className="animate-shooting-star absolute left-[15%] top-[18%] h-[2px] w-28 -rotate-12 rounded-full bg-gradient-to-r from-transparent via-indigo-200 to-white opacity-0" />
          <div
            className="animate-ambient-drift absolute -left-24 top-1/4 h-96 w-96 rounded-full opacity-40 blur-3xl"
            style={{ background: glowColor }}
          />
        </>
      )}

      {/* Solar Eclipse Glowing Corona */}
      {scene === "eclipse" && (
        <div className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2">
          <div className="animate-corona-pulse h-[420px] w-[420px] rounded-full border border-amber-400/30 bg-amber-500/10 shadow-[0_0_120px_rgba(245,158,11,0.35)] blur-xl" />
          <div className="absolute inset-8 rounded-full bg-black/80 ring-1 ring-amber-300/30" />
        </div>
      )}

      {/* Marine & Aquatic Caustic Light Rays + Rising Bubbles */}
      {scene === "aquatic" && (
        <>
          <div className="animate-caustic-wave absolute -top-24 left-[12%] h-[65vh] w-64 rotate-12 bg-gradient-to-b from-cyan-300/20 via-sky-400/5 to-transparent blur-2xl" />
          <div
            className="animate-caustic-wave absolute -top-24 left-[48%] h-[70vh] w-72 -rotate-6 bg-gradient-to-b from-teal-300/20 via-cyan-400/5 to-transparent blur-2xl"
            style={{ animationDelay: "-4s" }}
          />
          <div
            className="animate-caustic-wave absolute -top-24 right-[10%] h-[60vh] w-60 rotate-6 bg-gradient-to-b from-sky-300/18 via-teal-400/5 to-transparent blur-2xl"
            style={{ animationDelay: "-7s" }}
          />
          {BUBBLES.map((b, idx) => (
            <span
              key={idx}
              className="animate-bubble-rise absolute -bottom-8 rounded-full border border-cyan-200/40 bg-cyan-200/10 backdrop-blur-[1px]"
              style={{
                left: `${b.x}%`,
                width: b.s,
                height: b.s,
                animationDuration: `${b.dur}s`,
                animationDelay: `${b.delay}s`,
              }}
            />
          ))}
        </>
      )}

      {/* Northern Aurora Ribbons */}
      {scene === "aurora" && (
        <>
          <div className="animate-aurora-ribbon absolute -left-1/4 top-[-15%] h-[55vh] w-[150%] rounded-full bg-gradient-to-r from-emerald-500/20 via-teal-400/25 to-indigo-500/20 blur-3xl" />
          <div
            className="animate-aurora-ribbon absolute -left-1/4 top-[10%] h-[45vh] w-[140%] rounded-full bg-gradient-to-r from-indigo-500/15 via-cyan-400/20 to-emerald-400/20 blur-3xl"
            style={{ animationDelay: "-6s" }}
          />
        </>
      )}

      {/* Mystic Forest Drifting Fireflies */}
      {scene === "fireflies" && (
        <>
          {FIREFLIES.map((f, idx) => (
            <span
              key={idx}
              className="animate-firefly absolute h-2 w-2 rounded-full bg-lime-300"
              style={{
                left: `${f.x}%`,
                top: `${f.y}%`,
                animationDelay: `${f.d}s`,
                boxShadow: "0 0 14px 4px rgba(163,230,53,0.65)",
              }}
            />
          ))}
        </>
      )}

      {/* Sakura Falling Petals */}
      {scene === "petals" && (
        <>
          {PETALS.map((p, idx) => (
            <span
              key={idx}
              className="animate-petal-fall absolute -top-6 h-2.5 w-4 rounded-tl-full rounded-br-full bg-rose-300/70"
              style={{
                left: `${p.x}%`,
                animationDuration: `${p.dur}s`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </>
      )}

      {/* Futuristic Cyber Perspective Grid */}
      {scene === "cyber_grid" && (
        <>
          <div
            className="absolute inset-x-0 bottom-0 h-[45vh] opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(168,85,247,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(168,85,247,0.35) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              transform: "perspective(520px) rotateX(62deg)",
              transformOrigin: "bottom center",
              maskImage: "linear-gradient(to top, black 20%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to top, black 20%, transparent 100%)",
            }}
          />
          <div
            className="animate-ambient-drift absolute -top-24 left-1/3 h-80 w-80 rounded-full opacity-45 blur-3xl"
            style={{ background: glowColor }}
          />
        </>
      )}

      {/* Soft Ambient Drifting Orbs */}
      {scene === "orbs" && (
        <>
          <div
            className="animate-ambient-drift absolute -left-24 -top-24 h-96 w-96 rounded-full opacity-55 blur-3xl"
            style={{ background: glowColor }}
          />
          <div
            className="animate-ambient-drift absolute -bottom-24 right-12 h-96 w-96 rounded-full opacity-55 blur-3xl"
            style={{ background: glowColor, animationDelay: "-8s" }}
          />
        </>
      )}
    </div>
  );
};
