import React, { useState, useRef, useEffect } from "react";
import {
  PanelLeftOpen,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  LayoutGrid,
  Square,
  Camera,
  Video,
  Ruler,
  Fingerprint,
  Layers,
  Bookmark,
  Sun,
  Moon,
  Sparkles,
  Globe,
  Trash2,
  Clipboard,
  Download,
  ChevronDown,
  Smartphone,
  Link2,
  Unlink2,
  Maximize2,
  FileImage,
  Wand2,
  Palette,
  SlidersHorizontal,
  QrCode,
  ArrowLeft,
  ArrowRight,
  Eye,
  BoxSelect,
  Columns,
  Keyboard,
  Shield,
  Grid3X3,
  Pointer,
  SplitSquareHorizontal,
  Box,
  MoveHorizontal,
  Share2,
  Images,
  Command,
  Activity,
} from "lucide-react";
import type { PresetGroup, SharedUAPreset, Workspace } from "../../types/device";
import type { StudioAppearance } from "../../types/theme";
import {
  VISION_FILTERS,
  type CompareLayoutMode,
  type TextScaleOption,
  type TiltMode,
  type VisionFilterId,
} from "../../types/devtools";
import { SHARED_USER_AGENTS } from "../../data/devices";
import { StudioThemeMenu } from "./StudioThemeMenu";
import {
  resolveVideoCodec,
  type RecordingState,
  type VideoFormatPreference,
  type VideoQualityPreset,
} from "../../features/recording/screenRecorder";
import type { ScreenshotAction } from "../../features/screenshots/screenshotEngine";

export type ZoomOption = "auto" | 0.25 | 0.5 | 0.75 | 1;

interface TopBarProps {
  visible: boolean;
  sidebarOpen: boolean;
  urlInput: string;
  urlHistory: string[];
  viewMode: "single" | "multi";
  zoom: ZoomOption;
  compatibilityMode: boolean;
  singleUaEnabled: boolean;
  multiUaPreset: SharedUAPreset;
  syncScroll: boolean;
  showOsChrome: boolean;
  showBreakpoints: boolean;
  showRuler: boolean;
  touchCursor: boolean;
  xrayMode: boolean;
  touchAudit: boolean;
  rtlMode: boolean;
  textScale: TextScaleOption;
  showColumnGrid: boolean;
  showSafeArea: boolean;
  showKeyboard: boolean;
  tiltMode: TiltMode;
  freeformResize: boolean;
  dualUrlMode: boolean;
  hasQaIssues: boolean;
  visionFilter: VisionFilterId;
  compareLayout: CompareLayoutMode;
  theme: "dark" | "light";
  appearance: StudioAppearance;
  presets: PresetGroup[];
  workspaces: Workspace[];
  recordingState: RecordingState;
  includeAudio: boolean;
  videoFormat: VideoFormatPreference;
  videoQuality: VideoQualityPreset;
  onToggleSidebar: () => void;
  onHistoryBack: () => void;
  onHistoryForward: () => void;
  onToggleXray: () => void;
  onToggleTouchAudit: () => void;
  onToggleRtl: () => void;
  onCycleTextScale: () => void;
  onToggleColumnGrid: () => void;
  onToggleSafeArea: () => void;
  onToggleKeyboard: () => void;
  onCycleTilt: () => void;
  onToggleFreeformResize: () => void;
  onToggleDualUrl: () => void;
  onBatchCaptureAll: () => void;
  onShareWorkspace: () => void;
  onOpenCommandPalette: () => void;
  onOpenInspector: () => void;
  onVisionFilterChange: (filter: VisionFilterId) => void;
  onToggleCompareLayout: () => void;
  onOpenLiveDevice: () => void;
  onChangeAppearance: (patch: Partial<StudioAppearance>) => void;
  onUrlInputChange: (val: string) => void;
  onLoadUrl: (url: string) => void;
  onLoadDemo: () => void;
  onReloadAll: () => void;
  onViewModeChange: (mode: "single" | "multi") => void;
  onZoomChange: (zoom: ZoomOption) => void;
  onToggleCompat: () => void;
  onToggleSingleUa: () => void;
  onMultiUaPresetChange: (preset: SharedUAPreset) => void;
  onToggleSyncScroll: () => void;
  onToggleOsChrome: () => void;
  onToggleZenMode: () => void;
  onApplyPreset: (preset: PresetGroup) => void;
  onSaveWorkspace: (name: string) => void;
  onLoadWorkspace: (workspace: Workspace) => void;
  onDeleteWorkspace: (workspaceId: string) => void;
  onCaptureGrid: (action: ScreenshotAction | "studio") => void;
  onCapturePrimaryDevice: (
    mode: "frame" | "viewport",
    action: ScreenshotAction | "studio"
  ) => void;
  onCaptureFullPage: () => void;
  onStartRecordingTab: () => void;
  onStartRecordingPrimaryDevice: () => void;
  onToggleIncludeAudio: () => void;
  onVideoFormatChange: (fmt: VideoFormatPreference) => void;
  onVideoQualityChange: (q: VideoQualityPreset) => void;
  onToggleBreakpoints: () => void;
  onToggleRuler: () => void;
  onToggleTouchCursor: () => void;
  onToggleTheme: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  visible,
  sidebarOpen,
  urlInput,
  urlHistory,
  viewMode,
  zoom,
  compatibilityMode,
  singleUaEnabled,
  multiUaPreset,
  syncScroll,
  showOsChrome,
  showBreakpoints,
  showRuler,
  touchCursor,
  xrayMode,
  touchAudit,
  rtlMode,
  textScale,
  showColumnGrid,
  showSafeArea,
  showKeyboard,
  tiltMode,
  freeformResize,
  dualUrlMode,
  hasQaIssues,
  visionFilter,
  compareLayout,
  theme,
  appearance,
  presets,
  workspaces,
  recordingState,
  includeAudio,
  videoFormat,
  videoQuality,
  onToggleSidebar,
  onHistoryBack,
  onHistoryForward,
  onToggleXray,
  onToggleTouchAudit,
  onToggleRtl,
  onCycleTextScale,
  onToggleColumnGrid,
  onToggleSafeArea,
  onToggleKeyboard,
  onCycleTilt,
  onToggleFreeformResize,
  onToggleDualUrl,
  onBatchCaptureAll,
  onShareWorkspace,
  onOpenCommandPalette,
  onOpenInspector,
  onVisionFilterChange,
  onToggleCompareLayout,
  onOpenLiveDevice,
  onChangeAppearance,
  onUrlInputChange,
  onLoadUrl,
  onLoadDemo,
  onReloadAll,
  onViewModeChange,
  onZoomChange,
  onToggleCompat,
  onToggleSingleUa,
  onMultiUaPresetChange,
  onToggleSyncScroll,
  onToggleOsChrome,
  onToggleZenMode,
  onApplyPreset,
  onSaveWorkspace,
  onLoadWorkspace,
  onDeleteWorkspace,
  onCaptureGrid,
  onCapturePrimaryDevice,
  onCaptureFullPage,
  onStartRecordingTab,
  onStartRecordingPrimaryDevice,
  onToggleIncludeAudio,
  onVideoFormatChange,
  onVideoQualityChange,
  onToggleBreakpoints,
  onToggleRuler,
  onToggleTouchCursor,
  onToggleTheme,
}) => {
  const [openMenu, setOpenMenu] = useState<
    null | "presets" | "workspaces" | "screenshot" | "record" | "ua" | "theme" | "vision"
  >(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const menuContainerRef = useRef<HTMLDivElement>(null);

  const activeCodec = resolveVideoCodec(videoFormat);
  const isProBar = appearance.uiDensity === "pro";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(e.target as Node)
      ) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoadUrl(urlInput);
  };

  const handleSaveWs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;
    onSaveWorkspace(workspaceName.trim());
    setWorkspaceName("");
    setOpenMenu(null);
  };

  return (
    <header
      ref={menuContainerRef}
      className={`topbar-shell z-30 flex flex-col border-b border-zinc-200 bg-white/90 backdrop-blur-xl dark:border-zinc-800/90 dark:bg-zinc-950/90 ${
        visible
          ? "max-h-[260px] translate-y-0 opacity-100"
          : "pointer-events-none max-h-0 -translate-y-full overflow-hidden border-b-0 opacity-0"
      }`}
    >
      {/* Primary Row */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        {/* Sidebar toggle + Brand */}
        <div className="flex items-center gap-2">
          {!sidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              title="Open Device Library"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}
          <div className="flex items-center gap-1.5 pr-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-emerald-500 text-white shadow-sm">
              <Smartphone className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">
              OmniView
            </span>
          </div>
        </div>

        {/* URL Form + Back/Forward History */}
        <form
          onSubmit={handleUrlSubmit}
          className="flex min-w-[240px] flex-1 items-center gap-1.5"
        >
          <div className="hidden sm:flex items-center gap-0.5">
            <button
              type="button"
              onClick={onHistoryBack}
              className="micro-btn rounded-lg border border-zinc-300 p-1.5 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              title="Navigate Back inside Devices"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onHistoryForward}
              className="micro-btn rounded-lg border border-zinc-300 p-1.5 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              title="Navigate Forward inside Devices"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="relative flex-1">
            <Globe className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              list="omniview-url-history"
              value={urlInput}
              onChange={(e) => onUrlInputChange(e.target.value)}
              placeholder="https://example.com or http://localhost:3000"
              className="w-full rounded-lg border border-zinc-300 bg-zinc-50 py-1.5 pl-8 pr-3 font-mono text-xs text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <datalist id="omniview-url-history">
              {urlHistory.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>
          <button
            type="submit"
            className="micro-btn btn-glow rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
          >
            Load
          </button>
          <button
            type="button"
            onClick={onReloadAll}
            className="micro-btn icon-spin-hover rounded-lg border border-zinc-300 p-1.5 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
            title="Reload All Devices (Shift+R)"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onOpenLiveDevice}
            className="micro-btn icon-pop-hover hidden sm:flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-300"
            title="Run current site on your physical phone or tablet via QR Code"
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>Live Device</span>
          </button>
          <button
            type="button"
            onClick={onLoadDemo}
            className="hidden sm:flex items-center gap-1 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            title="Load Built-in Responsive Demo Page"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            Demo
          </button>
        </form>

        {/* View Mode Toggle */}
        <div className="flex items-center rounded-lg border border-zinc-300 p-0.5 dark:border-zinc-800">
          <button
            onClick={() => onViewModeChange("single")}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
              viewMode === "single"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
            title="Single Device View"
          >
            <Square className="h-3 w-3" />
            Single
          </button>
          <button
            onClick={() => onViewModeChange("multi")}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
              viewMode === "multi"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
            title="Multi-Device Comparison View (up to 6)"
          >
            <LayoutGrid className="h-3 w-3" />
            Compare
          </button>
        </div>

        {/* Zoom Selector */}
        <select
          value={String(zoom)}
          onChange={(e) => {
            const val = e.target.value;
            onZoomChange(val === "auto" ? "auto" : (Number(val) as ZoomOption));
          }}
          className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 font-mono text-xs text-zinc-700 outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          title="Global Zoom Level"
        >
          <option value="auto">Auto-Fit</option>
          <option value="0.25">25%</option>
          <option value="0.5">50%</option>
          <option value="0.75">75%</option>
          <option value="1">100%</option>
        </select>

        {/* Command Palette Button */}
        <button
          onClick={onOpenCommandPalette}
          className="micro-btn hidden md:flex items-center gap-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
          title="Open Command Palette (Ctrl+Shift+P)"
        >
          <Command className="h-3.5 w-3.5" />
          <span className="font-mono text-[10px]">⌘P</span>
        </button>

        {/* Page Inspector & QA Drawer Button */}
        <button
          onClick={onOpenInspector}
          className="micro-btn relative rounded-lg border border-zinc-300 p-1.5 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
          title="Page Inspector (DNA Fonts/Colors, SEO Card, Live CSS, Figma Overlay & QA Report)"
        >
          <Activity className="h-3.5 w-3.5" />
          {hasQaIssues && (
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400" />
          )}
        </button>

        {/* Studio Theme & Effects Popover */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === "theme" ? null : "theme")}
            className={`rounded-lg border p-1.5 transition ${
              openMenu === "theme"
                ? "border-indigo-500 bg-indigo-600 text-white"
                : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
            }`}
            title="Studio Themes, Backdrops & Effects"
          >
            <Palette className="h-3.5 w-3.5" />
          </button>
          {openMenu === "theme" && (
            <div className="animate-popover-down absolute right-0 top-full mt-2 z-50">
              <StudioThemeMenu
                appearance={appearance}
                showOsChrome={showOsChrome}
                onChange={onChangeAppearance}
                onToggleOsChrome={onToggleOsChrome}
              />
            </div>
          )}
        </div>

        {/* Toggle Pro Toolbar Row */}
        <button
          onClick={() =>
            onChangeAppearance({ uiDensity: isProBar ? "minimal" : "pro" })
          }
          className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
            isProBar
              ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-500 dark:text-indigo-300"
              : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
          }`}
          title={
            isProBar
              ? "Switch to Minimal Studio Bar"
              : "Expand Pro Developer Toolbar (Compat, UA, Presets, Workspaces, Media, DevTools)"
          }
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Tools</span>
        </button>

        {/* Zen / Presentation Mode */}
        <button
          onClick={onToggleZenMode}
          className="rounded-lg border border-zinc-300 p-1.5 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
          title="Zen Presentation Mode (Shift+Z)"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>

        {/* Quick Dark / Light Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="rounded-lg border border-zinc-300 p-1.5 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
          title="Quick Switch Dark / Light Backdrop"
        >
          {theme === "dark" ? (
            <Sun className="h-3.5 w-3.5" />
          ) : (
            <Moon className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Secondary Toolbar Row (Smooth Accordion Expand/Collapse) */}
      <div className="accordion-shell" data-open={isProBar ? "true" : "false"}>
      <div className="accordion-inner">
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200/80 px-3 py-1.5 dark:border-zinc-800/70">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Live Sync Toggle (Multi-Device: Scroll + Navigation + Clicks + Inputs) */}
          {viewMode === "multi" && (
            <button
              onClick={onToggleSyncScroll}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition active:scale-95 ${
                syncScroll
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                  : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
              title="Live Sync: Mirror scrolling, page navigation, clicks, and typing across all comparison devices in real time (Shift+S)"
            >
              {syncScroll ? (
                <Link2 className="h-3.5 w-3.5" />
              ) : (
                <Unlink2 className="h-3.5 w-3.5" />
              )}
              <span>Live Sync: {syncScroll ? "ON" : "OFF"}</span>
            </button>
          )}

          {/* Compare Layout Mode (Grid vs Side-by-Side Row Strip) */}
          {viewMode === "multi" && (
            <>
              <button
                onClick={onToggleCompareLayout}
                className={`micro-btn flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium ${
                  compareLayout === "row"
                    ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-500 dark:text-indigo-300"
                    : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
                title="Toggle Comparison Layout: Grid Wrap vs Horizontal Side-by-Side Row"
              >
                <Columns className="h-3.5 w-3.5" />
                <span>{compareLayout === "row" ? "Row Strip" : "Grid"}</span>
              </button>

              <button
                onClick={onToggleDualUrl}
                className={`micro-btn flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium ${
                  dualUrlMode
                    ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-500 dark:text-indigo-300"
                    : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
                title="Compare 2 URLs (Staging vs Production) side-by-side"
              >
                <SplitSquareHorizontal className="h-3.5 w-3.5" />
                <span>Dual URL</span>
              </button>
            </>
          )}

          {/* Opt-in Compatibility Mode */}
          <button
            onClick={onToggleCompat}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition active:scale-95 ${
              compatibilityMode
                ? "border-amber-500/50 bg-amber-500/15 text-amber-600 dark:text-amber-300"
                : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
            title="Experimental: Relaxes X-Frame-Options and Content-Security-Policy headers strictly for sub-frames in this tab."
          >
            {compatibilityMode ? (
              <ShieldAlert className="h-3.5 w-3.5" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5" />
            )}
            <span>Compat: {compatibilityMode ? "ON" : "OFF"}</span>
          </button>

          {/* User-Agent Override */}
          <div className="relative">
            {viewMode === "single" ? (
              <button
                onClick={onToggleSingleUa}
                className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                  singleUaEnabled
                    ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-600 dark:text-indigo-300"
                    : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
                title="Applies the selected device's User-Agent header for this tab."
              >
                <span>Device UA: {singleUaEnabled ? "ON" : "OFF"}</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => setOpenMenu(openMenu === "ua" ? null : "ua")}
                  className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                    multiUaPreset !== "off"
                      ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-600 dark:text-indigo-300"
                      : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  }`}
                >
                  <span>
                    Shared UA:{" "}
                    {multiUaPreset === "off"
                      ? "Off"
                      : SHARED_USER_AGENTS[multiUaPreset].label.split(" ")[0]}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </button>
                {openMenu === "ua" && (
                  <div className="animate-popover-down absolute left-0 top-full mt-1.5 w-64 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="mb-2 rounded-lg bg-zinc-100 p-2 text-[10px] leading-snug text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
                      Tab-scoped DNR applies one shared User-Agent across all
                      iframes in this tab. Chrome&apos;s rendering engine is
                      still used.
                    </p>
                    <button
                      onClick={() => {
                        onMultiUaPresetChange("off");
                        setOpenMenu(null);
                      }}
                      className={`w-full rounded-lg px-2.5 py-1.5 text-left text-xs ${
                        multiUaPreset === "off"
                          ? "bg-indigo-600 text-white"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      Off (Default Browser UA)
                    </button>
                    {(
                      Object.keys(SHARED_USER_AGENTS) as Array<
                        Exclude<SharedUAPreset, "off">
                      >
                    ).map((key) => (
                      <button
                        key={key}
                        onClick={() => {
                          onMultiUaPresetChange(key);
                          setOpenMenu(null);
                        }}
                        className={`mt-0.5 w-full rounded-lg px-2.5 py-1.5 text-left text-xs ${
                          multiUaPreset === key
                            ? "bg-indigo-600 text-white"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {SHARED_USER_AGENTS[key].label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Quick Presets */}
          <div className="relative">
            <button
              onClick={() =>
                setOpenMenu(openMenu === "presets" ? null : "presets")
              }
              className="flex items-center gap-1 rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              Presets
              <ChevronDown className="h-3 w-3" />
            </button>
            {openMenu === "presets" && (
              <div className="animate-popover-down absolute left-0 top-full mt-1.5 w-72 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      onApplyPreset(preset);
                      setOpenMenu(null);
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {preset.name}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {preset.description}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Saved Workspaces */}
          <div className="relative">
            <button
              onClick={() =>
                setOpenMenu(openMenu === "workspaces" ? null : "workspaces")
              }
              className="flex items-center gap-1 rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              <Bookmark className="h-3.5 w-3.5 text-emerald-400" />
              Workspaces ({workspaces.length})
              <ChevronDown className="h-3 w-3" />
            </button>
            {openMenu === "workspaces" && (
              <div className="animate-popover-down absolute left-0 top-full mt-1.5 w-80 rounded-xl border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                <form onSubmit={handleSaveWs} className="mb-2.5 flex gap-1.5">
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="Save current URL & devices..."
                    className="flex-1 rounded-lg border border-zinc-300 bg-transparent px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-zinc-700"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    Save
                  </button>
                </form>

                {workspaces.length === 0 ? (
                  <p className="py-3 text-center text-xs text-zinc-500">
                    No saved workspaces yet.
                  </p>
                ) : (
                  <div className="max-h-56 space-y-1 overflow-y-auto">
                    {workspaces.map((ws) => (
                      <div
                        key={ws.id}
                        className="flex items-center justify-between rounded-lg border border-zinc-200 px-2.5 py-2 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60"
                      >
                        <button
                          onClick={() => {
                            onLoadWorkspace(ws);
                            setOpenMenu(null);
                          }}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            {ws.name}
                          </div>
                          <div className="truncate font-mono text-[10px] text-zinc-500">
                            {ws.deviceIds.length} device(s) • {ws.url}
                          </div>
                        </button>
                        <button
                          onClick={() => onDeleteWorkspace(ws.id)}
                          className="ml-2 rounded p-1 text-zinc-400 hover:bg-red-500/15 hover:text-red-400"
                          title="Delete Workspace"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right side: Screenshot Studio, Video Recorder, OS Chrome & Dev Utilities */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Screenshot Studio Dropdown */}
          <div className="relative">
            <button
              onClick={() =>
                setOpenMenu(openMenu === "screenshot" ? null : "screenshot")
              }
              className="flex items-center gap-1 rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              <Camera className="h-3.5 w-3.5 text-indigo-400" />
              Screenshot
              <ChevronDown className="h-3 w-3" />
            </button>
            {openMenu === "screenshot" && (
              <div className="animate-popover-down absolute right-0 top-full mt-1.5 w-80 rounded-xl border border-zinc-200 bg-white p-2.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                <button
                  onClick={() => {
                    setOpenMenu(null);
                    onCaptureFullPage();
                  }}
                  className="mb-2.5 flex w-full items-center justify-between rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-left text-xs font-semibold text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-300 transition"
                >
                  <span className="flex items-center gap-2">
                    <FileImage className="h-4 w-4" />
                    Full-Page Scrolling Capture
                  </span>
                  <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[9px] text-white">
                    NEW
                  </span>
                </button>

                <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Single Device (With Realistic Frame)
                </div>
                <div className="mb-2 grid grid-cols-3 gap-1">
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      onCapturePrimaryDevice("frame", "studio");
                    }}
                    className="flex items-center justify-center gap-1 rounded-lg bg-indigo-600 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-500"
                  >
                    <Wand2 className="h-3 w-3" /> Studio
                  </button>
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      onCapturePrimaryDevice("frame", "download");
                    }}
                    className="flex items-center justify-center gap-1 rounded-lg bg-zinc-100 py-1.5 text-[11px] hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                  >
                    <Download className="h-3 w-3" /> PNG
                  </button>
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      onCapturePrimaryDevice("frame", "clipboard");
                    }}
                    className="flex items-center justify-center gap-1 rounded-lg bg-zinc-100 py-1.5 text-[11px] hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                  >
                    <Clipboard className="h-3 w-3" /> Copy
                  </button>
                </div>

                <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Single Device (Raw Viewport Only)
                </div>
                <div className="mb-2 grid grid-cols-3 gap-1">
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      onCapturePrimaryDevice("viewport", "studio");
                    }}
                    className="flex items-center justify-center gap-1 rounded-lg bg-indigo-600 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-500"
                  >
                    <Wand2 className="h-3 w-3" /> Studio
                  </button>
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      onCapturePrimaryDevice("viewport", "download");
                    }}
                    className="flex items-center justify-center gap-1 rounded-lg bg-zinc-100 py-1.5 text-[11px] hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                  >
                    <Download className="h-3 w-3" /> PNG
                  </button>
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      onCapturePrimaryDevice("viewport", "clipboard");
                    }}
                    className="flex items-center justify-center gap-1 rounded-lg bg-zinc-100 py-1.5 text-[11px] hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                  >
                    <Clipboard className="h-3 w-3" /> Copy
                  </button>
                </div>

                <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Visible Comparison Grid
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      onCaptureGrid("studio");
                    }}
                    className="flex items-center justify-center gap-1 rounded-lg bg-indigo-600 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-500"
                  >
                    <Wand2 className="h-3 w-3" /> Studio
                  </button>
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      onCaptureGrid("download");
                    }}
                    className="flex items-center justify-center gap-1 rounded-lg bg-zinc-100 py-1.5 text-[11px] hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                  >
                    <Download className="h-3 w-3" /> PNG
                  </button>
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      onCaptureGrid("clipboard");
                    }}
                    className="flex items-center justify-center gap-1 rounded-lg bg-zinc-100 py-1.5 text-[11px] hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                  >
                    <Clipboard className="h-3 w-3" /> Copy
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Screen Recorder Dropdown */}
          <div className="relative">
            <button
              onClick={() =>
                setOpenMenu(openMenu === "record" ? null : "record")
              }
              disabled={recordingState !== "idle"}
              className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                recordingState !== "idle"
                  ? "border-red-500/50 bg-red-500/15 text-red-400"
                  : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
              }`}
            >
              <Video className="h-3.5 w-3.5 text-red-500" />
              {recordingState === "idle" ? "Record" : "Recording..."}
              <ChevronDown className="h-3 w-3" />
            </button>
            {openMenu === "record" && recordingState === "idle" && (
              <div className="animate-popover-down absolute right-0 top-full mt-1.5 w-72 rounded-xl border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-2.5 space-y-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      Video Codec (Active: {activeCodec.codecLabel})
                    </label>
                    <select
                      value={videoFormat}
                      onChange={(e) =>
                        onVideoFormatChange(
                          e.target.value as VideoFormatPreference
                        )
                      }
                      className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-2 py-1.5 text-xs outline-none dark:border-zinc-700 dark:bg-zinc-950"
                    >
                      <option value="auto">
                        Auto — MP4 (H.264 Universal)
                      </option>
                      <option value="mp4">MP4 (H.264 — Best Compatibility)</option>
                      <option value="webm_h264">WebM (H.264)</option>
                      <option value="webm_vp9">WebM (VP9 / VP8)</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      Video Quality
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {(
                        [
                          { id: "standard", label: "Standard" },
                          { id: "high", label: "High HD" },
                          { id: "ultra", label: "Ultra" },
                        ] as const
                      ).map((q) => (
                        <button
                          key={q.id}
                          onClick={() => onVideoQualityChange(q.id)}
                          className={`rounded-lg border py-1 text-[11px] font-medium transition ${
                            videoQuality === q.id
                              ? "border-indigo-500 bg-indigo-600 text-white"
                              : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
                          }`}
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs dark:bg-zinc-950">
                    <input
                      type="checkbox"
                      checked={includeAudio}
                      onChange={onToggleIncludeAudio}
                      className="accent-indigo-500"
                    />
                    <span>Include Tab Audio (optional)</span>
                  </label>
                </div>

                <button
                  onClick={() => {
                    setOpenMenu(null);
                    onStartRecordingTab();
                  }}
                  className="w-full rounded-lg bg-red-600 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-red-500 transition"
                >
                  Record Full Simulator Tab
                </button>
                <button
                  onClick={() => {
                    setOpenMenu(null);
                    onStartRecordingPrimaryDevice();
                  }}
                  className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-center text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800 transition"
                >
                  Record Active Device Frame (Region)
                </button>
              </div>
            )}
          </div>

          <div className="mx-0.5 h-4 w-px bg-zinc-300 dark:bg-zinc-800" />

          {/* Vision & Accessibility Simulator Dropdown */}
          <div className="relative">
            <button
              onClick={() =>
                setOpenMenu(openMenu === "vision" ? null : "vision")
              }
              className={`micro-btn flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium ${
                visionFilter !== "none"
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-500 dark:text-emerald-300"
                  : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
              title="Accessibility & Vision Simulator (Color Blindness, Blurred Vision, Low Contrast)"
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">
                {visionFilter === "none"
                  ? "Vision"
                  : VISION_FILTERS[visionFilter].label.split(" ")[0]}
              </span>
            </button>
            {openMenu === "vision" && (
              <div className="animate-popover-down absolute right-0 top-full mt-1.5 w-64 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                {(Object.keys(VISION_FILTERS) as VisionFilterId[]).map((id) => {
                  const meta = VISION_FILTERS[id];
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        onVisionFilterChange(id);
                        setOpenMenu(null);
                      }}
                      className={`w-full rounded-lg px-2.5 py-1.5 text-left transition ${
                        visionFilter === id
                          ? "bg-indigo-600 text-white"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <div className="text-xs font-medium">{meta.label}</div>
                      <div
                        className={`text-[10px] ${
                          visionFilter === id ? "text-indigo-100" : "text-zinc-500"
                        }`}
                      >
                        {meta.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* X-Ray Layout Outlines & Overflow Highlighter */}
          <button
            onClick={onToggleXray}
            className={`micro-btn rounded-lg border p-1.5 ${
              xrayMode
                ? "border-red-500/50 bg-red-500/15 text-red-400"
                : "border-zinc-300 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
            title="X-Ray Mode: Outline all DOM boxes & highlight horizontal overflow elements in red"
          >
            <BoxSelect className="h-3.5 w-3.5" />
          </button>

          {/* Touch Target (<44px) Auditor */}
          <button
            onClick={onToggleTouchAudit}
            className={`micro-btn rounded-lg border p-1.5 ${
              touchAudit
                ? "border-amber-500/50 bg-amber-500/15 text-amber-400"
                : "border-zinc-300 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
            title="Touch Target Auditor: Highlight buttons/links smaller than 44×44px"
          >
            <Pointer className="h-3.5 w-3.5" />
          </button>

          {/* Virtual Mobile Keyboard */}
          <button
            onClick={onToggleKeyboard}
            className={`micro-btn rounded-lg border p-1.5 ${
              showKeyboard
                ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-400"
                : "border-zinc-300 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
            title="Toggle On-Screen Virtual Mobile Keyboard (Occlusion Test)"
          >
            <Keyboard className="h-3.5 w-3.5" />
          </button>

          {/* Safe-Area Guides */}
          <button
            onClick={onToggleSafeArea}
            className={`micro-btn rounded-lg border p-1.5 ${
              showSafeArea
                ? "border-amber-500/50 bg-amber-500/15 text-amber-400"
                : "border-zinc-300 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
            title="Toggle Mobile Safe-Area & Notch Collision Guides"
          >
            <Shield className="h-3.5 w-3.5" />
          </button>

          {/* Figma Column Grid */}
          <button
            onClick={onToggleColumnGrid}
            className={`micro-btn rounded-lg border p-1.5 ${
              showColumnGrid
                ? "border-rose-500/50 bg-rose-500/15 text-rose-400"
                : "border-zinc-300 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
            title="Toggle 4/8/12-Column Layout Grid Overlay"
          >
            <Grid3X3 className="h-3.5 w-3.5" />
          </button>

          {/* RTL Flip */}
          <button
            onClick={onToggleRtl}
            className={`micro-btn rounded-lg border px-1.5 py-1 font-mono text-[10px] font-semibold ${
              rtlMode
                ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-400"
                : "border-zinc-300 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
            title="Toggle Right-to-Left (RTL) Layout Stress Test"
          >
            RTL
          </button>

          {/* OS Accessibility Text Scale */}
          <button
            onClick={onCycleTextScale}
            className={`micro-btn rounded-lg border px-1.5 py-1 font-mono text-[10px] font-semibold ${
              textScale !== 1
                ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-400"
                : "border-zinc-300 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
            title="Cycle OS Accessibility Text Scaling (100% / 125% / 150% / 200%)"
          >
            {Math.round(textScale * 100)}%
          </button>

          {/* 3D Perspective Showcase Tilt */}
          <button
            onClick={onCycleTilt}
            className={`micro-btn rounded-lg border p-1.5 ${
              tiltMode !== "flat"
                ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-400"
                : "border-zinc-300 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
            title={`3D Perspective Showcase Tilt (${tiltMode})`}
          >
            <Box className="h-3.5 w-3.5" />
          </button>

          {/* Freeform Drag Resize */}
          <button
            onClick={onToggleFreeformResize}
            className={`micro-btn rounded-lg border p-1.5 ${
              freeformResize
                ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-400"
                : "border-zinc-300 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
            title="Toggle Freeform Viewport Width Drag Handle"
          >
            <MoveHorizontal className="h-3.5 w-3.5" />
          </button>

          {/* Batch Capture All Devices */}
          <button
            onClick={onBatchCaptureAll}
            className="micro-btn rounded-lg border border-zinc-300 p-1.5 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
            title="Batch Capture All Active Devices Individually"
          >
            <Images className="h-3.5 w-3.5" />
          </button>

          {/* Share Workspace Code */}
          <button
            onClick={onShareWorkspace}
            className="micro-btn rounded-lg border border-zinc-300 p-1.5 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
            title="Copy Shareable Workspace Link"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>

          {/* OS Chrome Toggle */}
          <button
            onClick={onToggleOsChrome}
            className={`rounded-lg border px-2 py-1 text-[11px] font-medium transition ${
              showOsChrome
                ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-500 dark:text-indigo-300"
                : "border-zinc-300 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
            title="Toggle Realistic iOS Safari / Android Chrome Status & Address Bars"
          >
            OS UI
          </button>

          {/* Dev Utilities */}
          <button
            onClick={onToggleBreakpoints}
            className={`rounded-lg border px-2 py-1 font-mono text-[11px] font-medium transition ${
              showBreakpoints
                ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-500 dark:text-indigo-300"
                : "border-zinc-300 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
            title="Toggle Breakpoint Inspector (Tailwind & Bootstrap)"
          >
            BP
          </button>

          <button
            onClick={onToggleRuler}
            className={`rounded-lg border p-1.5 transition ${
              showRuler
                ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-500 dark:text-indigo-300"
                : "border-zinc-300 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
            title="Toggle Pixel Ruler Overlay"
          >
            <Ruler className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={onToggleTouchCursor}
            className={`micro-btn rounded-lg border p-1.5 ${
              touchCursor
                ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-500 dark:text-indigo-300"
                : "border-zinc-300 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
            title="Toggle Touch Cursor Indicator"
          >
            <Fingerprint className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      </div>
      </div>

      {/* Subtle Compatibility Mode disclosure bar (shown in Pro Toolbar) */}
      <div className="accordion-shell" data-open={isProBar && compatibilityMode ? "true" : "false"}>
        <div className="accordion-inner">
          <div className="flex items-center justify-between border-t border-amber-500/20 bg-amber-500/10 px-4 py-1 text-[11px] text-amber-600 dark:text-amber-300">
            <span>
              <strong>Compatibility Mode Active (This Tab Only):</strong>{" "}
              <code>X-Frame-Options</code> and{" "}
              <code>Content-Security-Policy</code> response headers are stripped
              for embedded sub-frames.
            </span>
            <button
              onClick={onToggleCompat}
              className="micro-btn ml-3 shrink-0 rounded bg-amber-500/20 px-2 py-0.5 font-semibold hover:bg-amber-500/30"
            >
              Disable
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
