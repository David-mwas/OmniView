import React, { useEffect, useRef, useState } from "react";
import {
  RotateCw,
  RefreshCw,
  Smartphone,
  Camera,
  ExternalLink,
  X,
  Video,
  Tv,
  Lock,
  Unlock,
  Gamepad2,
  Wand2,
  QrCode,
  AlertTriangle,
} from "lucide-react";
import type { ActiveDeviceInstance, Device } from "../../types/device";
import { FrameRenderer } from "../frames/FrameRenderer";
import { getBreakpointInfo } from "../../utils/breakpoints";
import { PixelRuler } from "../../features/devtools/PixelRuler";
import { TvOverscanOverlay } from "../../features/devtools/TvToolsOverlay";
import { ViewportOverlays } from "../../features/devtools/ViewportOverlays";
import type { DesignOverlayConfig, TiltMode } from "../../types/devtools";

interface DeviceCardProps {
  index: number;
  instance: ActiveDeviceInstance;
  device: Device;
  url: string;
  liveUrl: string;
  scale: number;
  canRemove: boolean;
  syncScroll: boolean;
  showOsChrome: boolean;
  showBreakpoints: boolean;
  showRuler: boolean;
  touchCursor: boolean;
  zenMode: boolean;
  minimalHeader: boolean;
  ambientGlowColor: string | null;
  hoverLift: boolean;
  isExiting?: boolean;
  xrayMode: boolean;
  touchAudit: boolean;
  customCss: string;
  rtlMode: boolean;
  textScale: number;
  visionFilterCss: string;
  overflowPx: number;
  brokenImages?: number;
  showColumnGrid: boolean;
  showSafeArea: boolean;
  showKeyboard: boolean;
  designOverlay: DesignOverlayConfig;
  tiltMode: TiltMode;
  freeformResize: boolean;
  dualUrlMode: boolean;
  overrideUrl?: string;
  onOverrideUrlChange?: (instanceId: string, url: string) => void;
  onHistoryBack: (instanceId: string) => void;
  onHistoryForward: (instanceId: string) => void;
  onOpenLiveDevice: () => void;
  onRegisterIframe: (instanceId: string, iframe: HTMLIFrameElement | null) => void;
  onRotate: (instanceId: string) => void;
  onReload: (instanceId: string) => void;
  onToggleFrame: (instanceId: string) => void;
  onRemove: (instanceId: string) => void;
  onToggleOverscan: (instanceId: string) => void;
  onToggleLandscapeLock: (instanceId: string) => void;
  onOpenTvRemote: (instanceId: string, iframeRef: HTMLIFrameElement | null) => void;
  onScreenshot: (
    element: HTMLElement | null,
    label: string,
    openStudio: boolean
  ) => void;
  onRecordDevice: (element: HTMLElement | null, label: string) => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  index,
  instance,
  device,
  url,
  liveUrl,
  scale,
  canRemove,
  syncScroll,
  showOsChrome,
  showBreakpoints,
  showRuler,
  touchCursor,
  zenMode,
  minimalHeader,
  ambientGlowColor,
  hoverLift,
  isExiting = false,
  xrayMode,
  touchAudit,
  customCss,
  rtlMode,
  textScale,
  visionFilterCss,
  overflowPx,
  brokenImages = 0,
  showColumnGrid,
  showSafeArea,
  showKeyboard,
  designOverlay,
  tiltMode,
  freeformResize,
  dualUrlMode,
  overrideUrl,
  onOverrideUrlChange,
  onHistoryBack,
  onHistoryForward,
  onOpenLiveDevice,
  onRegisterIframe,
  onRotate,
  onReload,
  onToggleFrame,
  onRemove,
  onToggleOverscan,
  onToggleLandscapeLock,
  onOpenTvRemote,
  onScreenshot,
  onRecordDevice,
}) => {
  const frameWrapperRef = useRef<HTMLDivElement>(null);
  const viewportWrapperRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [touchPos, setTouchPos] = useState<{ x: number; y: number } | null>(null);
  const [iframeSrc, setIframeSrc] = useState<string>(overrideUrl || liveUrl || url);
  const [dualInput, setDualInput] = useState<string>(overrideUrl || liveUrl || url);
  const [customWidth, setCustomWidth] = useState<number | null>(null);
  const prevUrlRef = useRef<string>(url);
  const prevOrientRef = useRef(instance.orientation);
  const prevReloadRef = useRef(instance.reloadKey);
  const [rotateAnim, setRotateAnim] = useState<"landscape" | "portrait" | null>(null);
  const [reloadPulse, setReloadPulse] = useState(false);

  useEffect(() => {
    if (!freeformResize) setCustomWidth(null);
  }, [freeformResize]);

  useEffect(() => {
    if (overrideUrl) {
      setIframeSrc(overrideUrl);
      setDualInput(overrideUrl);
    }
  }, [overrideUrl]);

  useEffect(() => {
    if (!dualUrlMode && prevUrlRef.current !== url) {
      prevUrlRef.current = url;
      setIframeSrc(url);
      setDualInput(url);
    }
  }, [url, dualUrlMode]);

  useEffect(() => {
    if (prevOrientRef.current !== instance.orientation) {
      prevOrientRef.current = instance.orientation;
      setRotateAnim(instance.orientation);
      const t = window.setTimeout(() => setRotateAnim(null), 560);
      return () => window.clearTimeout(t);
    }
  }, [instance.orientation]);

  useEffect(() => {
    if (prevReloadRef.current !== instance.reloadKey) {
      prevReloadRef.current = instance.reloadKey;
      setReloadPulse(true);
      const t = window.setTimeout(() => setReloadPulse(false), 400);
      return () => window.clearTimeout(t);
    }
  }, [instance.reloadKey]);

  useEffect(() => {
    onRegisterIframe(instance.instanceId, iframeRef.current);
    return () => onRegisterIframe(instance.instanceId, null);
  }, [instance.instanceId, instance.reloadKey, url, onRegisterIframe]);

  const sendHandshake = () => {
    iframeRef.current?.contentWindow?.postMessage(
      {
        __omniview: true,
        type: "OMNIVIEW_HANDSHAKE",
        instanceId: instance.instanceId,
        syncScroll,
        syncInteractions: syncScroll,
        xrayMode,
        touchAudit,
        customCss,
        rtlMode,
        textScale,
        currentUrl: overrideUrl || liveUrl,
      },
      "*"
    );
  };

  const isTv = device.category === "Smart TV";
  const isPhone = device.category === "Smartphone";
  const isLandscape =
    instance.orientation === "landscape" || (isTv && instance.landscapeLock !== false);

  const nativeLandscape = device.viewport.width >= device.viewport.height;
  const shouldSwap = isLandscape !== nativeLandscape;
  const baseWidth = shouldSwap ? device.viewport.height : device.viewport.width;
  const viewWidth = customWidth ?? baseWidth;
  const viewHeight = shouldSwap ? device.viewport.width : device.viewport.height;

  const handleResizeDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = viewWidth;
    const onMove = (mv: MouseEvent) => {
      const delta = (mv.clientX - startX) / Math.max(scale, 0.2);
      setCustomWidth(Math.min(1920, Math.max(280, Math.round(startW + delta))));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const bp = getBreakpointInfo(viewWidth);

  // Account for realistic OS chrome bars when phone frame is shown in portrait
  const phoneOsExtraY =
    isPhone && instance.showFrame && showOsChrome && !isLandscape
      ? device.brand.toLowerCase() === "apple"
        ? 122
        : 92
      : 0;

  const framePadX =
    !instance.showFrame || device.frameType === "none"
      ? 0
      : device.frameType === "laptop"
        ? 110
        : device.frameType === "tablet"
          ? 36
          : 26;
  const framePadY =
    !instance.showFrame || device.frameType === "none"
      ? 0
      : device.frameType === "laptop"
        ? 60
        : device.frameType === "tv"
          ? 72
          : device.frameType === "tablet"
            ? 36
            : 26 + phoneOsExtraY;

  const scaledBoxWidth = Math.ceil((viewWidth + framePadX) * scale);
  const scaledBoxHeight = Math.ceil((viewHeight + framePadY) * scale);

  const accuracyColor =
    device.accuracy === "verified"
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      : device.accuracy === "custom"
        ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/30"
        : "bg-amber-500/15 text-amber-400 border-amber-500/30";

  return (
    <div
      className={`group/card flex flex-col items-center ${
        isExiting ? "animate-device-exit" : "animate-device-enter"
      } ${hoverLift ? "device-spring device-hover-lift" : ""}`}
      style={
        isExiting
          ? undefined
          : { animationDelay: `${Math.min(index * 65, 320)}ms` }
      }
    >
      {/* Device Header & Toolbar (whisper-clean in Minimal Studio mode, full bar in Pro mode) */}
      {!zenMode && (
        <div
          className={`mb-3 flex w-full max-w-[540px] flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-1.5 transition-all duration-200 ${
            minimalHeader
              ? "border border-transparent bg-transparent hover:border-zinc-200/80 hover:bg-white/85 hover:shadow-sm hover:backdrop-blur-md dark:hover:border-zinc-800/80 dark:hover:bg-zinc-900/85"
              : "border border-zinc-200 bg-white/90 py-2 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90"
          }`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {device.name}
              </span>
              <span className="font-mono text-[10px] text-zinc-500">
                {viewWidth}×{viewHeight}
              </span>
              {overflowPx > 2 && (
                <span
                  className="inline-flex items-center gap-0.5 rounded border border-red-500/40 bg-red-500/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-red-400"
                  title={`Horizontal overflow detected: page is ${overflowPx}px wider than this ${viewWidth}px viewport! Enable X-Ray Outlines to highlight the offending element.`}
                >
                  <AlertTriangle className="h-2.5 w-2.5" />+{overflowPx}px
                </span>
              )}
              {brokenImages > 0 && (
                <span
                  className="rounded border border-amber-500/40 bg-amber-500/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-amber-400"
                  title={`${brokenImages} broken image(s) detected on this page`}
                >
                  {brokenImages} broken img
                </span>
              )}
              {!minimalHeader && (
                <span
                  className={`rounded border px-1.5 py-0.5 text-[9px] font-medium uppercase ${accuracyColor}`}
                  title={`Specification accuracy: ${device.accuracy}`}
                >
                  {device.accuracy}
                </span>
              )}
            </div>
            {!minimalHeader && (
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                <span>{device.brand}</span>
                <span>•</span>
                <span>DPR {device.devicePixelRatio}x</span>
                <span>•</span>
                <span>{isLandscape ? "Landscape" : "Portrait"}</span>
                {showBreakpoints && (
                  <>
                    <span className="rounded bg-indigo-500/15 px-1.5 py-0.5 font-semibold text-indigo-500 dark:text-indigo-300">
                      TW:{bp.tailwind}
                    </span>
                    <span className="rounded bg-purple-500/15 px-1.5 py-0.5 font-semibold text-purple-500 dark:text-purple-300">
                      BS:{bp.bootstrap}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Per-device action buttons (fade in smoothly on hover in Minimal mode) */}
          <div
            className={`flex items-center gap-0.5 transition-opacity duration-200 ${
              minimalHeader ? "opacity-0 group-hover/card:opacity-100" : "opacity-100"
            }`}
          >
            <button
              onClick={() => onRotate(instance.instanceId)}
              disabled={isTv && instance.landscapeLock !== false}
              className="micro-btn icon-spin-hover rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-35 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              title="Rotate Portrait / Landscape"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => onReload(instance.instanceId)}
              className="micro-btn icon-spin-hover rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              title="Reload Device"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={onOpenLiveDevice}
              className="micro-btn icon-pop-hover rounded-lg p-1.5 text-emerald-500 hover:bg-emerald-500/15"
              title="Run on Live Physical Device (QR Code)"
            >
              <QrCode className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => onToggleFrame(instance.instanceId)}
              className={`rounded-lg p-1.5 transition ${
                instance.showFrame
                  ? "text-indigo-500 hover:bg-indigo-500/10"
                  : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
              title="Toggle Device Frame Bezel"
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() =>
                onScreenshot(frameWrapperRef.current, device.name, true)
              }
              className="rounded-lg p-1.5 text-indigo-500 hover:bg-indigo-500/15"
              title="Open Device in Mockup Studio"
            >
              <Wand2 className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() =>
                onScreenshot(frameWrapperRef.current, device.name, false)
              }
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              title="Quick PNG Screenshot"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => onRecordDevice(frameWrapperRef.current, device.name)}
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-500 dark:text-zinc-400"
              title="Record This Device Frame"
            >
              <Video className="h-3.5 w-3.5" />
            </button>

            {isTv && (
              <>
                <button
                  onClick={() => onToggleOverscan(instance.instanceId)}
                  className={`rounded-lg p-1.5 ${
                    instance.showOverscan
                      ? "bg-amber-500/15 text-amber-400"
                      : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                  title="Toggle TV Overscan Safe-Area Guide (5% / 10%)"
                >
                  <Tv className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onToggleLandscapeLock(instance.instanceId)}
                  className={`rounded-lg p-1.5 ${
                    instance.landscapeLock !== false
                      ? "text-emerald-400 hover:bg-emerald-500/10"
                      : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                  title="Toggle TV Landscape-Only Lock"
                >
                  {instance.landscapeLock !== false ? (
                    <Lock className="h-3.5 w-3.5" />
                  ) : (
                    <Unlock className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  onClick={() =>
                    onOpenTvRemote(instance.instanceId, iframeRef.current)
                  }
                  className="rounded-lg p-1.5 text-indigo-400 hover:bg-indigo-500/15"
                  title="Open On-Screen TV D-Pad Remote"
                >
                  <Gamepad2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}

            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              title="External Preview Fallback (Open in New Tab)"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            {canRemove && (
              <button
                onClick={() => onRemove(instance.instanceId)}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/15 hover:text-red-400 dark:text-zinc-400"
                title="Remove Device from Comparison"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Dual-URL Staging vs Prod per-device address bar */}
      {!zenMode && dualUrlMode && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onOverrideUrlChange?.(instance.instanceId, dualInput);
          }}
          className="mb-2 flex w-full max-w-[440px] items-center gap-1"
        >
          <input
            type="text"
            value={dualInput}
            onChange={(e) => setDualInput(e.target.value)}
            placeholder="Custom URL for this device (e.g. staging vs prod)"
            className="flex-1 rounded-lg border border-indigo-500/40 bg-zinc-900/90 px-2.5 py-1 font-mono text-[11px] text-zinc-100 outline-none focus:border-indigo-400"
          />
          <button
            type="submit"
            className="micro-btn rounded-lg bg-indigo-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-indigo-500"
          >
            Go
          </button>
        </form>
      )}

      {/* Scaled Viewport Container with Optional Ambient Glow & 3D Tilt */}
      <div
        className="device-spring relative flex items-start justify-center"
        style={{ width: scaledBoxWidth, height: scaledBoxHeight }}
      >
        {ambientGlowColor && (
          <div
            className="pointer-events-none absolute -inset-8 rounded-full opacity-80 blur-3xl transition-opacity duration-500"
            style={{ background: ambientGlowColor }}
          />
        )}
        <div
          ref={frameWrapperRef}
          data-device-frame={instance.instanceId}
          className={`device-spring ${
            rotateAnim === "landscape"
              ? "animate-rotate-landscape"
              : rotateAnim === "portrait"
                ? "animate-rotate-portrait"
                : ""
          } ${reloadPulse ? "animate-reload-pulse" : ""}`}
          style={{
            transform: `${
              tiltMode === "left"
                ? "perspective(1400px) rotateY(14deg) rotateX(2deg) "
                : tiltMode === "right"
                  ? "perspective(1400px) rotateY(-14deg) rotateX(2deg) "
                  : ""
            }scale(${scale})`,
            transformOrigin: "top center",
          }}
        >
          <FrameRenderer
            frameType={device.frameType}
            brand={device.brand}
            url={liveUrl}
            showFrame={instance.showFrame}
            showOsChrome={showOsChrome}
            orientation={isLandscape ? "landscape" : "portrait"}
            width={viewWidth}
            height={viewHeight}
            onBack={() => onHistoryBack(instance.instanceId)}
            onForward={() => onHistoryForward(instance.instanceId)}
            onReload={() => onReload(instance.instanceId)}
          >
            <div
              ref={viewportWrapperRef}
              data-device-viewport={instance.instanceId}
              className={`relative h-full w-full bg-white ${
                touchCursor ? "cursor-none" : ""
              }`}
              style={
                visionFilterCss !== "none"
                  ? { filter: visionFilterCss }
                  : undefined
              }
              onMouseMove={(e) => {
                if (!touchCursor) return;
                const rect = e.currentTarget.getBoundingClientRect();
                setTouchPos({
                  x: (e.clientX - rect.left) / scale,
                  y: (e.clientY - rect.top) / scale,
                });
              }}
              onMouseLeave={() => setTouchPos(null)}
            >
              <iframe
                ref={iframeRef}
                key={`${instance.instanceId}-${instance.reloadKey}-${iframeSrc}`}
                src={iframeSrc}
                onLoad={sendHandshake}
                title={`${device.name} viewport`}
                style={{ width: viewWidth, height: viewHeight }}
                className="block border-0 bg-white"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              />

              {showRuler && <PixelRuler width={viewWidth} height={viewHeight} />}

              <ViewportOverlays
                width={viewWidth}
                isPhone={isPhone}
                isIos={device.brand.toLowerCase() === "apple"}
                showColumnGrid={showColumnGrid}
                showSafeArea={showSafeArea}
                showKeyboard={showKeyboard}
                designOverlay={designOverlay}
              />

              {isTv && <TvOverscanOverlay visible={Boolean(instance.showOverscan)} />}

              {/* Touch cursor indicator */}
              {touchCursor && touchPos && (
                <div
                  className="pointer-events-none absolute z-40 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-indigo-400/90 bg-indigo-500/25 shadow-[0_0_12px_rgba(99,102,241,0.45)]"
                  style={{ left: touchPos.x, top: touchPos.y }}
                />
              )}
            </div>
          </FrameRenderer>
        </div>

        {/* Freeform Drag Resize Handle */}
        {freeformResize && !zenMode && (
          <div
            onMouseDown={handleResizeDragStart}
            className="absolute -right-3 top-1/2 z-30 flex h-16 w-3 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border border-indigo-400/60 bg-indigo-600/80 shadow-lg hover:bg-indigo-500"
            title="Drag horizontally to free-resize viewport width"
          >
            <div className="h-6 w-0.5 rounded-full bg-white/80" />
          </div>
        )}
      </div>
    </div>
  );
};
