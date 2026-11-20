import React, { useRef, useState } from "react";
import {
  X,
  RefreshCw,
  Copy,
  Download,
  Palette,
  Globe,
  Activity,
  Code2,
  AlertTriangle,
  Upload,
  Trash2,
} from "lucide-react";
import type { DesignOverlayConfig, PageAuditData } from "../../types/devtools";

interface PageInspectorDrawerProps {
  isOpen: boolean;
  audit: PageAuditData | null;
  activeDeviceNames: string[];
  customCss: string;
  designOverlay: DesignOverlayConfig;
  onClose: () => void;
  onRefreshAudit: () => void;
  onCustomCssChange: (css: string) => void;
  onDesignOverlayChange: (patch: Partial<DesignOverlayConfig>) => void;
  onToast: (text: string, tone?: "info" | "success" | "error") => void;
}

type InspectorTab = "dna" | "seo" | "qa" | "css";

const CSS_SNIPPETS = [
  {
    label: "Hide Scrollbars",
    css: "::-webkit-scrollbar { display: none !important; }\n* { scrollbar-width: none !important; }",
  },
  {
    label: "Force Dark Invert",
    css: "html { filter: invert(0.92) hue-rotate(180deg); }\nimg, video { filter: invert(1) hue-rotate(180deg); }",
  },
  {
    label: "Highlight Images",
    css: "img { outline: 2px solid #10b981 !important; }",
  },
];

export const PageInspectorDrawer: React.FC<PageInspectorDrawerProps> = ({
  isOpen,
  audit,
  activeDeviceNames,
  customCss,
  designOverlay,
  onClose,
  onRefreshAudit,
  onCustomCssChange,
  onDesignOverlayChange,
  onToast,
}) => {
  const [tab, setTab] = useState<InspectorTab>("qa");
  const [notes, setNotes] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const buildMarkdownReport = () => {
    const lines = [
      `# OmniView QA Report`,
      `- **URL**: ${audit?.url ?? "N/A"}`,
      `- **Devices Tested**: ${activeDeviceNames.join(", ")}`,
      `- **Timestamp**: ${new Date().toLocaleString()}`,
      ``,
      `## Metrics & Health`,
      `- **Load Time**: ${audit?.loadTimeMs ?? 0} ms`,
      `- **CLS**: ${audit?.cls ?? 0}`,
      `- **DOM Nodes**: ${audit?.domNodes ?? 0}`,
      `- **Images**: ${audit?.imageCount ?? 0} (${audit?.brokenImages ?? 0} broken)`,
      `- **Horizontal Overflow**: ${audit?.overflowPx ?? 0} px`,
      `- **Small Touch Targets (<44px)**: ${audit?.smallTouchTargets ?? 0}`,
      `- **Runtime Errors**: ${audit?.consoleErrors.length ?? 0}`,
    ];
    if (audit && audit.consoleErrors.length > 0) {
      lines.push(``, `## Runtime Errors`);
      for (const err of audit.consoleErrors) lines.push(`- \`${err}\``);
    }
    if (notes.trim()) {
      lines.push(``, `## Reviewer Notes`, notes.trim());
    }
    return lines.join("\n");
  };

  const handleCopyReport = async () => {
    await navigator.clipboard.writeText(buildMarkdownReport());
    onToast("Copied Markdown QA Report to clipboard!", "success");
  };

  const handleDownloadReport = () => {
    const blob = new Blob([buildMarkdownReport()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `omniview-qa-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    onToast("Downloaded Markdown QA Report.", "success");
  };

  const handleOverlayUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onDesignOverlayChange({ dataUrl: String(reader.result) });
      onToast("Loaded Figma/Design overlay onto device viewport!", "success");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <aside
      aria-hidden={!isOpen}
      className={`sidebar-drawer fixed right-0 top-0 z-50 h-full overflow-hidden border-l bg-zinc-950/95 text-zinc-100 shadow-2xl backdrop-blur-xl ${
        isOpen
          ? "w-96 translate-x-0 border-zinc-800 opacity-100"
          : "pointer-events-none w-0 translate-x-8 border-transparent opacity-0"
      }`}
    >
      <div className="flex h-full w-96 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-semibold">Page Inspector & QA Studio</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onRefreshAudit}
              className="micro-btn icon-spin-hover rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              title="Re-scan Active Page"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onClose}
              className="micro-btn rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-4 gap-1 border-b border-zinc-800 p-2">
          {(
            [
              { id: "qa", label: "QA", icon: Activity },
              { id: "dna", label: "DNA", icon: Palette },
              { id: "seo", label: "SEO", icon: Globe },
              { id: "css", label: "CSS/Comp", icon: Code2 },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`micro-btn flex items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-medium ${
                  tab === t.id
                    ? "bg-indigo-600 text-white"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
              >
                <Icon className="h-3 w-3" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs">
          {/* === QA & VITALS TAB === */}
          {tab === "qa" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                  <div className="text-[10px] uppercase text-zinc-500">Load Time</div>
                  <div className="mt-1 font-mono text-base font-bold text-emerald-400">
                    {audit?.loadTimeMs ? `${audit.loadTimeMs} ms` : "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                  <div className="text-[10px] uppercase text-zinc-500">CLS Shift</div>
                  <div
                    className={`mt-1 font-mono text-base font-bold ${
                      (audit?.cls ?? 0) > 0.1 ? "text-amber-400" : "text-emerald-400"
                    }`}
                  >
                    {audit ? audit.cls.toFixed(3) : "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                  <div className="text-[10px] uppercase text-zinc-500">DOM Nodes</div>
                  <div className="mt-1 font-mono text-base font-bold text-zinc-100">
                    {audit?.domNodes ?? "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                  <div className="text-[10px] uppercase text-zinc-500">Overflow</div>
                  <div
                    className={`mt-1 font-mono text-base font-bold ${
                      (audit?.overflowPx ?? 0) > 2 ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {audit ? `${audit.overflowPx} px` : "—"}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Broken Images</span>
                  <span
                    className={`font-mono font-semibold ${
                      (audit?.brokenImages ?? 0) > 0 ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {audit?.brokenImages ?? 0} / {audit?.imageCount ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Small Tap Targets (&lt;44px)</span>
                  <span
                    className={`font-mono font-semibold ${
                      (audit?.smallTouchTargets ?? 0) > 0
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {audit?.smallTouchTargets ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Runtime Console Errors</span>
                  <span
                    className={`font-mono font-semibold ${
                      (audit?.consoleErrors.length ?? 0) > 0
                        ? "text-red-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {audit?.consoleErrors.length ?? 0}
                  </span>
                </div>
              </div>

              {audit && audit.consoleErrors.length > 0 && (
                <div className="space-y-1 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                  <div className="flex items-center gap-1.5 font-semibold text-red-300">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Captured Errors
                  </div>
                  {audit.consoleErrors.map((err, i) => (
                    <div
                      key={i}
                      className="rounded bg-black/40 p-1.5 font-mono text-[10px] text-red-200 break-all"
                    >
                      {err}
                    </div>
                  ))}
                </div>
              )}

              {/* Reviewer Notes & Markdown QA Report Export */}
              <div className="space-y-2 border-t border-zinc-800 pt-3">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  QA Review Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Write bug notes to include in your Markdown QA report..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-zinc-100 outline-none focus:border-indigo-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleCopyReport}
                    className="micro-btn flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 py-2 text-xs font-medium hover:bg-zinc-800"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy MD
                  </button>
                  <button
                    onClick={handleDownloadReport}
                    className="micro-btn btn-glow flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export Report
                  </button>
                </div>
              </div>
            </>
          )}

          {/* === PAGE DNA (FONTS & COLORS) TAB === */}
          {tab === "dna" && (
            <>
              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Detected Fonts ({audit?.fonts.length ?? 0})
                </div>
                <div className="space-y-1.5">
                  {audit && audit.fonts.length > 0 ? (
                    audit.fonts.map((font) => (
                      <button
                        key={font}
                        onClick={() => {
                          void navigator.clipboard.writeText(font);
                          onToast(`Copied font "${font}"`, "success");
                        }}
                        className="micro-btn flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-left hover:border-indigo-500/50"
                      >
                        <span className="truncate font-medium text-zinc-100">
                          {font}
                        </span>
                        <Copy className="h-3 w-3 text-zinc-500" />
                      </button>
                    ))
                  ) : (
                    <p className="text-zinc-500">Click refresh to inspect page fonts.</p>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Brand Color Palette ({audit?.colors.length ?? 0})
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {audit?.colors.map((hex) => (
                    <button
                      key={hex}
                      onClick={() => {
                        void navigator.clipboard.writeText(hex);
                        onToast(`Copied ${hex}`, "success");
                      }}
                      className="micro-btn flex flex-col items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/70 p-2 hover:border-indigo-500/50"
                    >
                      <div
                        className="h-8 w-full rounded-lg ring-1 ring-white/15"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="font-mono text-[10px] text-zinc-300">
                        {hex}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* === SEO & SOCIAL CARD PREVIEW TAB === */}
          {tab === "seo" && (
            <>
              <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
                {audit?.ogImage ? (
                  <img
                    src={audit.ogImage}
                    alt="Open Graph Preview"
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-32 items-center justify-center bg-zinc-950 text-zinc-500">
                    No og:image meta tag detected
                  </div>
                )}
                <div className="space-y-1 p-3.5">
                  <div className="truncate font-mono text-[10px] uppercase text-zinc-500">
                    {audit?.url ? new URL(audit.url).hostname : "example.com"}
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {audit?.ogTitle || audit?.title || "Untitled Page"}
                  </div>
                  <p className="line-clamp-3 text-xs text-zinc-400">
                    {audit?.ogDescription ||
                      audit?.description ||
                      "No meta description found on this page."}
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                <div>
                  <span className="text-[10px] uppercase text-zinc-500">
                    Document Title ({(audit?.title ?? "").length} chars)
                  </span>
                  <div className="mt-0.5 text-zinc-200">{audit?.title || "—"}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-zinc-500">
                    Meta Description ({(audit?.description ?? "").length} chars)
                  </span>
                  <div className="mt-0.5 text-zinc-300">
                    {audit?.description || "Missing meta description"}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* === LIVE CSS INJECTOR & FIGMA COMP OVERLAY TAB === */}
          {tab === "css" && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Live CSS Injector (All Devices)
                  </span>
                  {customCss && (
                    <button
                      onClick={() => onCustomCssChange("")}
                      className="text-[10px] text-red-400 hover:underline"
                    >
                      Clear CSS
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {CSS_SNIPPETS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => onCustomCssChange(s.css)}
                      className="micro-btn rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-300 hover:border-indigo-500"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={6}
                  value={customCss}
                  onChange={(e) => onCustomCssChange(e.target.value)}
                  placeholder="/* Type CSS to inject live into all devices */\nbody { font-size: 18px !important; }"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 font-mono text-[11px] text-emerald-300 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2.5 border-t border-zinc-800 pt-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Figma / Design Comp Overlay
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="micro-btn flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/15 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/25"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload Design PNG
                  </button>
                  {designOverlay.dataUrl && (
                    <button
                      onClick={() => onDesignOverlayChange({ dataUrl: null })}
                      className="micro-btn rounded-xl border border-red-500/30 bg-red-500/15 px-3 text-red-400 hover:bg-red-500/25"
                      title="Remove Design Overlay"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleOverlayUpload}
                    className="hidden"
                  />
                </div>

                {designOverlay.dataUrl && (
                  <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                    <div>
                      <div className="mb-1 flex justify-between text-[11px]">
                        <span className="text-zinc-400">Overlay Opacity</span>
                        <span className="font-mono text-zinc-200">
                          {Math.round(designOverlay.opacity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.05}
                        max={1}
                        step={0.05}
                        value={designOverlay.opacity}
                        onChange={(e) =>
                          onDesignOverlayChange({ opacity: Number(e.target.value) })
                        }
                        className="w-full accent-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(["normal", "difference"] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => onDesignOverlayChange({ blendMode: mode })}
                          className={`micro-btn rounded-lg border py-1 text-[11px] font-medium capitalize ${
                            designOverlay.blendMode === mode
                              ? "border-indigo-500 bg-indigo-600 text-white"
                              : "border-zinc-800 bg-zinc-950 text-zinc-400"
                          }`}
                        >
                          {mode === "difference" ? "Pixel Diff" : "Normal"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};
