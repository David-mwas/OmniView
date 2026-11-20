import React, { useEffect, useState } from "react";
import { X, Download, Clipboard, Sparkles, Check } from "lucide-react";
import {
  STUDIO_BACKGROUNDS,
  exportScreenshot,
  renderStudioCanvas,
  type CaptureResult,
  type ImageFormat,
  type StudioBackgroundId,
  type StudioStyleOptions,
} from "../../features/screenshots/screenshotEngine";

interface ScreenshotStudioModalProps {
  capture: CaptureResult | null;
  defaultLabel: string;
  onClose: () => void;
  onToast: (text: string, tone?: "info" | "success" | "error") => void;
}

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
  });
  const [format, setFormat] = useState<ImageFormat>("png");
  const [rendered, setRendered] = useState<CaptureResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setStyle((prev) => ({ ...prev, caption: defaultLabel }));
  }, [defaultLabel]);

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

  const handleDownload = async () => {
    const target = rendered ?? capture;
    await exportScreenshot(target, "download", defaultLabel, format);
    onToast(`Downloaded ${format.toUpperCase()} mockup (${target.width}×${target.height})`, "success");
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
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-semibold">OmniView Mockup Studio</h2>
            {rendered && (
              <span className="rounded-md bg-zinc-900 px-2 py-0.5 font-mono text-[11px] text-zinc-400">
                {rendered.width} × {rendered.height} px
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Live Preview */}
          <div className="bg-dot-grid flex flex-1 items-center justify-center overflow-auto p-6">
            {rendered ? (
              <img
                src={rendered.dataUrl}
                alt="Mockup Studio Preview"
                className="max-h-[65vh] max-w-full rounded-lg object-contain shadow-2xl"
              />
            ) : (
              <div className="text-xs text-zinc-400">Rendering mockup...</div>
            )}
          </div>

          {/* Controls */}
          <div className="w-full shrink-0 space-y-5 overflow-y-auto border-t border-zinc-800 bg-zinc-900/70 p-5 md:w-72 md:border-l md:border-t-0">
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
                        className={`flex flex-col items-center gap-1 rounded-xl border p-1.5 text-[10px] transition ${
                          active
                            ? "border-indigo-500 bg-indigo-500/15 text-white"
                            : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <div
                          className="h-7 w-full rounded-md ring-1 ring-white/10"
                          style={{ background: bg.previewCss }}
                        />
                        <span className="truncate w-full text-center">
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
            <div className="space-y-2.5">
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
                    className={`rounded-lg border py-1.5 text-xs font-semibold uppercase transition ${
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
            <div className="space-y-2 pt-2">
              <button
                onClick={handleDownload}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 active:scale-[0.99] transition"
              >
                <Download className="h-4 w-4" />
                Download {format.toUpperCase()}
              </button>
              <button
                onClick={handleCopy}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/70 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition"
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
