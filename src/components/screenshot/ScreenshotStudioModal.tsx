import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Download,
  Clipboard,
  Sparkles,
  Check,
  MoveUpRight,
  Square,
  EyeOff,
  Undo2,
  Trash2,
  MousePointer2,
} from "lucide-react";
import {
  STUDIO_BACKGROUNDS,
  exportScreenshot,
  renderStudioCanvas,
  type AnnotationTool,
  type CaptureResult,
  type ImageFormat,
  type StudioAnnotation,
  type StudioAspectRatio,
  type StudioBackgroundId,
  type StudioStyleOptions,
} from "../../features/screenshots/screenshotEngine";

interface ScreenshotStudioModalProps {
  capture: CaptureResult | null;
  defaultLabel: string;
  onClose: () => void;
  onToast: (text: string, tone?: "info" | "success" | "error") => void;
}

const ASPECT_RATIOS: { id: StudioAspectRatio; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "16:9", label: "16:9" },
  { id: "1:1", label: "1:1" },
  { id: "4:5", label: "4:5" },
  { id: "9:16", label: "9:16" },
];

export const ScreenshotStudioModal: React.FC<ScreenshotStudioModalProps> = ({
  capture,
  defaultLabel,
  onClose,
  onToast,
}) => {
  const [style, setStyle] = useState<StudioStyleOptions>({
    background: "midnight",
    padding: 48,
    borderRadius: 20,
    shadow: true,
    caption: defaultLabel,
    showCaption: true,
    aspectRatio: "auto",
    annotations: [],
  });
  const [format, setFormat] = useState<ImageFormat>("png");
  const [tool, setTool] = useState<AnnotationTool>("none");
  const [annColor, setAnnColor] = useState("#f43f5e");
  const [rendered, setRendered] = useState<CaptureResult | null>(null);
  const [copied, setCopied] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const [draftStart, setDraftStart] = useState<{ x: number; y: number } | null>(
    null
  );

  useEffect(() => {
    setStyle((prev) => ({ ...prev, caption: defaultLabel, annotations: [] }));
    setTool("none");
  }, [defaultLabel, capture]);

  useEffect(() => {
    if (!capture) {
      setRendered(null);
      return;
    }
    let cancelled = false;
    void renderStudioCanvas(capture.dataUrl, style, format).then((res) => {
      if (!cancelled) setRendered(res);
    });
    return () => {
      cancelled = true;
    };
  }, [capture, style, format]);

  if (!capture) return null;

  const getNormCoords = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / Math.max(rect.width, 1))),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / Math.max(rect.height, 1))),
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    if (tool === "none") return;
    e.preventDefault();
    setDraftStart(getNormCoords(e));
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLImageElement>) => {
    if (tool === "none" || !draftStart) return;
    const end = getNormCoords(e);
    const dx = Math.abs(end.x - draftStart.x);
    const dy = Math.abs(end.y - draftStart.y);
    setDraftStart(null);

    if (dx < 0.01 && dy < 0.01) return;
    const newAnn: StudioAnnotation = {
      id: `ann-${Date.now()}`,
      type: tool,
      x1: draftStart.x,
      y1: draftStart.y,
      x2: end.x,
      y2: end.y,
      color: annColor,
    };
    setStyle((s) => ({ ...s, annotations: [...s.annotations, newAnn] }));
  };

  const handleDownload = async () => {
    const target = rendered ?? capture;
    await exportScreenshot(target, "download", defaultLabel, format);
    onToast(
      `Downloaded ${format.toUpperCase()} mockup (${target.width}×${target.height})`,
      "success"
    );
  };

  const handleCopy = async () => {
    const target = rendered ?? capture;
    try {
      await exportScreenshot(target, "clipboard", defaultLabel, "png");
      setCopied(true);
      onToast("Copied mockup to clipboard!", "success");
      window.setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Copy failed", "error");
    }
  };

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="animate-scale-in flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-5 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-semibold">OmniView Mockup Studio</h2>
            {rendered && (
              <span className="rounded-md bg-zinc-900 px-2 py-0.5 font-mono text-[11px] text-zinc-400">
                {rendered.width} × {rendered.height} px
              </span>
            )}
          </div>

          {/* Annotation Toolbar */}
          <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/90 p-1">
            {(
              [
                { id: "none", icon: MousePointer2, label: "Select" },
                { id: "arrow", icon: MoveUpRight, label: "Draw Arrow" },
                { id: "rect", icon: Square, label: "Highlight Box" },
                { id: "blur", icon: EyeOff, label: "Blur / Redact Sensitive Info" },
              ] as const
            ).map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTool(t.id)}
                  className={`micro-btn flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium ${
                    tool === t.id
                      ? "bg-indigo-600 text-white"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                  }`}
                  title={t.label}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">{t.label.split(" ")[0]}</span>
                </button>
              );
            })}

            {(tool === "arrow" || tool === "rect") && (
              <input
                type="color"
                value={annColor}
                onChange={(e) => setAnnColor(e.target.value)}
                className="ml-1 h-6 w-6 cursor-pointer rounded border-0 bg-transparent"
                title="Annotation Color"
              />
            )}

            {style.annotations.length > 0 && (
              <>
                <div className="mx-0.5 h-4 w-px bg-zinc-700" />
                <button
                  onClick={() =>
                    setStyle((s) => ({
                      ...s,
                      annotations: s.annotations.slice(0, -1),
                    }))
                  }
                  className="micro-btn rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  title="Undo Last Annotation"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setStyle((s) => ({ ...s, annotations: [] }))}
                  className="micro-btn rounded-lg p-1 text-zinc-400 hover:bg-red-500/20 hover:text-red-400"
                  title="Clear All Annotations"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="micro-btn rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Live Interactive Preview */}
          <div className="bg-dot-grid relative flex flex-1 flex-col items-center justify-center overflow-auto p-6">
            {tool !== "none" && (
              <div className="mb-2 rounded-full border border-indigo-500/30 bg-indigo-500/15 px-3 py-1 text-[11px] font-medium text-indigo-300">
                Click and drag directly on the image to place your{" "}
                <strong>{tool}</strong> annotation
              </div>
            )}
            {rendered ? (
              <img
                ref={imgRef}
                src={rendered.dataUrl}
                alt="Mockup Studio Preview"
                draggable={false}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                className={`max-h-[62vh] max-w-full rounded-lg object-contain shadow-2xl select-none ${
                  tool !== "none" ? "cursor-crosshair" : ""
                }`}
              />
            ) : (
              <div className="text-xs text-zinc-400">Rendering mockup...</div>
            )}
          </div>

          {/* Controls */}
          <div className="w-full shrink-0 space-y-4 overflow-y-auto border-t border-zinc-800 bg-zinc-900/70 p-5 md:w-72 md:border-l md:border-t-0">
            {/* Aspect Ratio Templates */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Pitch / Social Aspect Ratio
              </label>
              <div className="grid grid-cols-5 gap-1">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.id}
                    onClick={() =>
                      setStyle((s) => ({ ...s, aspectRatio: ar.id }))
                    }
                    className={`micro-btn rounded-lg border py-1 text-[10px] font-semibold ${
                      style.aspectRatio === ar.id
                        ? "border-indigo-500 bg-indigo-600 text-white"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {ar.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Backgrounds */}
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Backdrop
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(STUDIO_BACKGROUNDS) as StudioBackgroundId[]).map(
                  (bgId) => {
                    const bg = STUDIO_BACKGROUNDS[bgId];
                    const active = style.background === bgId;
                    return (
                      <button
                        key={bgId}
                        onClick={() =>
                          setStyle((s) => ({ ...s, background: bgId }))
                        }
                        className={`micro-btn flex flex-col items-center gap-1 rounded-xl border p-1.5 text-[10px] ${
                          active
                            ? "border-indigo-500 bg-indigo-500/15 text-white"
                            : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <div
                          className="h-7 w-full rounded-md ring-1 ring-white/10"
                          style={{ background: bg.previewCss }}
                        />
                        <span className="w-full truncate text-center">
                          {bg.label.split(" ")[0]}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Padding */}
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-zinc-400">Padding</span>
                <span className="font-mono text-zinc-300">{style.padding}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={120}
                step={8}
                value={style.padding}
                onChange={(e) =>
                  setStyle((s) => ({ ...s, padding: Number(e.target.value) }))
                }
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Corner Radius */}
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-zinc-400">Corners</span>
                <span className="font-mono text-zinc-300">
                  {style.borderRadius}px
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={48}
                step={4}
                value={style.borderRadius}
                onChange={(e) =>
                  setStyle((s) => ({
                    ...s,
                    borderRadius: Number(e.target.value),
                  }))
                }
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Shadow & Caption */}
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center justify-between text-xs text-zinc-300">
                <span>Drop Shadow</span>
                <input
                  type="checkbox"
                  checked={style.shadow}
                  onChange={(e) =>
                    setStyle((s) => ({ ...s, shadow: e.target.checked }))
                  }
                  className="accent-indigo-500"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between text-xs text-zinc-300">
                <span>Device Caption</span>
                <input
                  type="checkbox"
                  checked={style.showCaption}
                  onChange={(e) =>
                    setStyle((s) => ({ ...s, showCaption: e.target.checked }))
                  }
                  className="accent-indigo-500"
                />
              </label>

              {style.showCaption && (
                <input
                  type="text"
                  value={style.caption}
                  onChange={(e) =>
                    setStyle((s) => ({ ...s, caption: e.target.value }))
                  }
                  placeholder="Caption text..."
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500"
                />
              )}
            </div>

            {/* Export Format */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Export Format
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["png", "jpeg", "webp"] as ImageFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    className={`micro-btn rounded-lg border py-1.5 text-xs font-semibold uppercase ${
                      format === fmt
                        ? "border-indigo-500 bg-indigo-600 text-white"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Export Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleDownload}
                className="micro-btn btn-glow flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                <Download className="h-4 w-4" />
                Download {format.toUpperCase()}
              </button>
              <button
                onClick={handleCopy}
                className="micro-btn flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/70 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Clipboard className="h-3.5 w-3.5" />
                    Copy to Clipboard
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
