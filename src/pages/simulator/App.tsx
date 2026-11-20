import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Minimize2 } from "lucide-react";
import type {
  ActiveDeviceInstance,
  Device,
  PresetGroup,
  SharedUAPreset,
  Workspace,
} from "../../types/device";
import {
  BUILTIN_DEVICES,
  PRESET_GROUPS,
  SHARED_USER_AGENTS,
} from "../../data/devices";
import {
  CANVAS_BACKDROPS,
  DEFAULT_APPEARANCE,
  type StudioAppearance,
} from "../../types/theme";
import {
  loadAppearance,
  loadDevices,
  loadRecentDeviceIds,
  loadTheme,
  loadUrlHistory,
  loadWorkspaces,
  pushRecentDeviceId,
  pushUrlHistory,
  saveAppearance,
  saveDevices,
  saveTheme,
  saveWorkspaces,
} from "../../stores/storage";
import { getDemoPageUrl, sendExtensionMessage } from "../../utils/extensionBridge";
import { normalizeUrl } from "../../utils/breakpoints";
import { Sidebar } from "../../components/layout/Sidebar";
import { TopBar, type ZoomOption } from "../../components/layout/TopBar";
import { FloatingRail } from "../../components/layout/FloatingRail";
import { CanvasScene } from "../../components/layout/CanvasScene";
import { DeviceCard } from "../../components/workspace/DeviceCard";
import { CustomDeviceModal } from "../../features/devices/CustomDeviceModal";
import {
  captureElementScreenshot,
  captureFullPageScreenshot,
  exportScreenshot,
  type CaptureResult,
  type ScreenshotAction,
} from "../../features/screenshots/screenshotEngine";
import { ScreenshotStudioModal } from "../../components/screenshot/ScreenshotStudioModal";
import {
  OmniScreenRecorder,
  type CompletedRecording,
  type RecordingState,
  type VideoFormatPreference,
  type VideoQualityPreset,
} from "../../features/recording/screenRecorder";
import { RecordingHud } from "../../components/recording/RecordingHud";
import { RecordingPreviewModal } from "../../components/recording/RecordingPreviewModal";
import { LiveDeviceModal } from "../../components/workspace/LiveDeviceModal";
import { TvRemoteHud } from "../../features/devtools/TvToolsOverlay";

interface ToastMessage {
  id: number;
  text: string;
  tone: "info" | "success" | "error";
}

function makeInstance(device: Device): ActiveDeviceInstance {
  const isNativeLandscape = device.viewport.width >= device.viewport.height;
  return {
    instanceId: `${device.id}-${Math.random().toString(36).slice(2, 7)}`,
    deviceId: device.id,
    orientation: isNativeLandscape ? "landscape" : "portrait",
    showFrame: device.frameType !== "none",
    reloadKey: 0,
    landscapeLock: device.category === "Smart TV" ? true : undefined,
    showOverscan: device.category === "Smart TV" ? true : undefined,
  };
}

export const App: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>(BUILTIN_DEVICES);
  const [recentDeviceIds, setRecentDeviceIds] = useState<string[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [urlHistory, setUrlHistory] = useState<string[]>([]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [appearance, setAppearance] = useState<StudioAppearance>(DEFAULT_APPEARANCE);

  const initialUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const paramUrl = params.get("url");
    return paramUrl && /^https?:\/\//i.test(paramUrl)
      ? paramUrl
      : getDemoPageUrl();
  }, []);

  const [activeUrl, setActiveUrl] = useState<string>(initialUrl);
  const [liveUrl, setLiveUrl] = useState<string>(initialUrl);
  const liveUrlRef = useRef<string>(initialUrl);
  const [urlInput, setUrlInput] = useState<string>(
    initialUrl === getDemoPageUrl() ? "" : initialUrl
  );

  // Start collapsed for a calm, uncluttered canvas-first experience
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [viewMode, setViewMode] = useState<"single" | "multi">("single");
  const [activeInstances, setActiveInstances] = useState<ActiveDeviceInstance[]>([
    makeInstance(BUILTIN_DEVICES[0]),
  ]);
  const [zoom, setZoom] = useState<ZoomOption>("auto");

  // Session-scoped DNR state (default enabled for seamless live-site previews in this simulator tab only)
  const [sessionReady, setSessionReady] = useState(false);
  const [compatibilityMode, setCompatibilityMode] = useState(true);
  const [singleUaEnabled, setSingleUaEnabled] = useState(false);
  const [multiUaPreset, setMultiUaPreset] = useState<SharedUAPreset>("off");

  // Enhanced UX toggles
  const [syncScroll, setSyncScroll] = useState(true);
  const [showOsChrome, setShowOsChrome] = useState(true);
  const [showBreakpoints, setShowBreakpoints] = useState(true);
  const [showRuler, setShowRuler] = useState(false);
  const [touchCursor, setTouchCursor] = useState(false);

  // Modals & HUDs
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [liveDeviceOpen, setLiveDeviceOpen] = useState(false);
  const [exitingIds, setExitingIds] = useState<Set<string>>(() => new Set());
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [studioCapture, setStudioCapture] = useState<{
    capture: CaptureResult;
    label: string;
  } | null>(null);
  const [completedRecording, setCompletedRecording] =
    useState<CompletedRecording | null>(null);
  const [tvRemoteTarget, setTvRemoteTarget] = useState<{
    instanceId: string;
    deviceName: string;
    iframe: HTMLIFrameElement | null;
  } | null>(null);

  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingBytes, setRecordingBytes] = useState(0);
  const [recordingLabel, setRecordingLabel] = useState("Simulator Tab");
  const [includeAudio, setIncludeAudio] = useState(false);
  const [videoFormat, setVideoFormat] = useState<VideoFormatPreference>("auto");
  const [videoQuality, setVideoQuality] = useState<VideoQualityPreset>("high");

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const iframeRegistryRef = useRef<Map<string, HTMLIFrameElement>>(new Map());
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 700 });
  const recorderRef = useRef<OmniScreenRecorder | null>(null);

  const pushToast = useCallback(
    (text: string, tone: ToastMessage["tone"] = "info") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev.slice(-3), { id, text, tone }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  const handleRegisterIframe = useCallback(
    (instanceId: string, iframe: HTMLIFrameElement | null) => {
      if (iframe) {
        iframeRegistryRef.current.set(instanceId, iframe);
      } else {
        iframeRegistryRef.current.delete(instanceId);
      }
    },
    []
  );

  // Live Sync listener + broadcaster across all preview iframes (Scroll, Navigation, Clicks, Inputs)
  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      const data = ev.data;
      if (!data || typeof data !== "object" || data.__omniview !== true) return;
      if (!syncScroll) return;

      if (data.type === "OMNIVIEW_SCROLL_EVENT") {
        for (const [id, iframe] of iframeRegistryRef.current.entries()) {
          if (id === data.instanceId) continue;
          iframe.contentWindow?.postMessage(
            {
              __omniview: true,
              type: "OMNIVIEW_APPLY_SCROLL",
              sourceInstanceId: data.instanceId,
              scrollTop: data.scrollTop,
              scrollLeft: data.scrollLeft,
              ratioY: data.ratioY,
              ratioX: data.ratioX,
              mode: "proportional",
            },
            "*"
          );
        }
      } else if (data.type === "OMNIVIEW_NAVIGATED" && typeof data.url === "string") {
        const nextUrl = data.url;
        const norm = (u: string) => u.replace(/\/$/, "");
        if (norm(nextUrl) === norm(liveUrlRef.current)) return;

        liveUrlRef.current = nextUrl;
        setLiveUrl(nextUrl);
        if (/^https?:\/\//i.test(nextUrl)) {
          setUrlInput(nextUrl);
        }

        for (const [id, iframe] of iframeRegistryRef.current.entries()) {
          if (id === data.instanceId) continue;
          iframe.contentWindow?.postMessage(
            {
              __omniview: true,
              type: "OMNIVIEW_APPLY_NAVIGATE",
              sourceInstanceId: data.instanceId,
              url: nextUrl,
            },
            "*"
          );
        }
      } else if (data.type === "OMNIVIEW_CLICK_EVENT") {
        for (const [id, iframe] of iframeRegistryRef.current.entries()) {
          if (id === data.instanceId) continue;
          iframe.contentWindow?.postMessage(
            {
              __omniview: true,
              type: "OMNIVIEW_APPLY_CLICK",
              sourceInstanceId: data.instanceId,
              selector: data.selector,
              tagName: data.tagName,
              textHint: data.textHint,
            },
            "*"
          );
        }
      } else if (data.type === "OMNIVIEW_INPUT_EVENT") {
        for (const [id, iframe] of iframeRegistryRef.current.entries()) {
          if (id === data.instanceId) continue;
          iframe.contentWindow?.postMessage(
            {
              __omniview: true,
              type: "OMNIVIEW_APPLY_INPUT",
              sourceInstanceId: data.instanceId,
              selector: data.selector,
              value: data.value,
              checked: data.checked,
            },
            "*"
          );
        }
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [syncScroll]);

  // Notify all iframes whenever syncScroll / Live Sync toggle changes
  useEffect(() => {
    for (const [id, iframe] of iframeRegistryRef.current.entries()) {
      iframe.contentWindow?.postMessage(
        {
          __omniview: true,
          type: "OMNIVIEW_SET_SYNC",
          instanceId: id,
          syncScroll,
          syncInteractions: syncScroll,
        },
        "*"
      );
    }
  }, [syncScroll, activeInstances]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inInput =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT";

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setZenMode(false);
        setSidebarOpen(true);
        window.setTimeout(() => searchInputRef.current?.focus(), 40);
        return;
      }

      if (inInput) return;

      if (e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        setZenMode((z) => !z);
      } else if (e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setSyncScroll((s) => !s);
      } else if (e.shiftKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        setActiveInstances((prev) =>
          prev.map((inst) => ({ ...inst, reloadKey: inst.reloadKey + 1 }))
        );
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Initialize storage + MV3 session
  useEffect(() => {
    void (async () => {
      const [
        loadedDevices,
        loadedWorkspaces,
        loadedHistory,
        loadedRecent,
        loadedTheme,
        loadedAppearance,
      ] = await Promise.all([
        loadDevices(),
        loadWorkspaces(),
        loadUrlHistory(),
        loadRecentDeviceIds(),
        loadTheme(),
        loadAppearance(),
      ]);
      setDevices(loadedDevices);
      setWorkspaces(loadedWorkspaces);
      setUrlHistory(loadedHistory);
      setRecentDeviceIds(loadedRecent);
      setAppearance(loadedAppearance);
      setTheme(CANVAS_BACKDROPS[loadedAppearance.backdrop]?.mode ?? loadedTheme);

      const res = await sendExtensionMessage({ type: "SESSION_INIT" });
      if (res.ok && "session" in res) {
        setCompatibilityMode(res.session.compatibilityMode);
      }
      setSessionReady(true);
    })();
  }, []);

  // Sync HTML dark class + motion preset CSS variables
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    root.dataset.motion = appearance.motionPreset ?? "silk";
  }, [theme, appearance.motionPreset]);

  // Measure canvas container for Auto-Fit zoom
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) {
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Recording timer
  useEffect(() => {
    if (recordingState !== "recording") return;
    const id = window.setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [recordingState]);

  const deviceMap = useMemo(
    () => new Map(devices.map((d) => [d.id, d])),
    [devices]
  );

  // Sync User-Agent DNR rule
  useEffect(() => {
    let targetUa: string | null = null;
    if (viewMode === "single" && singleUaEnabled) {
      const primary = activeInstances[0];
      const dev = primary ? deviceMap.get(primary.deviceId) : undefined;
      targetUa = dev?.userAgent ?? null;
    } else if (viewMode === "multi" && multiUaPreset !== "off") {
      targetUa = SHARED_USER_AGENTS[multiUaPreset].ua;
    }
    void sendExtensionMessage({ type: "SESSION_SET_UA", userAgent: targetUa });
  }, [viewMode, singleUaEnabled, multiUaPreset, activeInstances, deviceMap]);

  // Initialize recorder instance
  useEffect(() => {
    recorderRef.current = new OmniScreenRecorder({
      onStateChange: (state) => {
        setRecordingState(state);
        if (state === "idle") {
          setRecordingSeconds(0);
          setRecordingBytes(0);
        }
      },
      onSizeChange: (bytes) => setRecordingBytes(bytes),
      onNotice: (msg) => pushToast(msg, "info"),
      onError: (msg) => pushToast(msg, "error"),
      onComplete: (recording) => {
        setCompletedRecording((prev) => {
          if (prev?.objectUrl) URL.revokeObjectURL(prev.objectUrl);
          return recording;
        });
      },
    });
    return () => {
      recorderRef.current?.stop();
    };
  }, [pushToast]);

  const handleLoadUrl = async (raw: string) => {
    const normalized = normalizeUrl(raw);
    if (!normalized) return;
    liveUrlRef.current = normalized;
    setLiveUrl(normalized);
    setActiveUrl(normalized);
    setUrlInput(normalized);
    if (/^https?:\/\//i.test(normalized)) {
      const nextHist = await pushUrlHistory(normalized);
      setUrlHistory(nextHist);
    }
  };

  const handleLoadDemo = () => {
    const demoUrl = getDemoPageUrl();
    liveUrlRef.current = demoUrl;
    setLiveUrl(demoUrl);
    setActiveUrl(demoUrl);
    setUrlInput("");
    pushToast("Loaded built-in responsive demo page.", "info");
  };

  const handleReloadAll = () => {
    setActiveInstances((prev) =>
      prev.map((inst) => ({ ...inst, reloadKey: inst.reloadKey + 1 }))
    );
  };

  const handleToggleCompat = async () => {
    const next = !compatibilityMode;
    const res = await sendExtensionMessage({
      type: "SESSION_SET_COMPAT",
      enabled: next,
    });
    if (res.ok) {
      setCompatibilityMode(next);
      handleReloadAll();
      pushToast(
        next
          ? "Compatibility Mode enabled for this tab. Reloading frames..."
          : "Compatibility Mode disabled. Standard headers restored.",
        "info"
      );
    } else {
      pushToast(res.error, "error");
    }
  };

  const handleSelectDevice = async (device: Device) => {
    const nextRecent = await pushRecentDeviceId(device.id);
    setRecentDeviceIds(nextRecent);

    if (viewMode === "single") {
      setActiveInstances([makeInstance(device)]);
      return;
    }

    setActiveInstances((prev) => {
      const exists = prev.find((i) => i.deviceId === device.id);
      if (exists) {
        if (prev.length === 1) return prev;
        return prev.filter((i) => i.deviceId !== device.id);
      }
      if (prev.length >= 6) {
        pushToast("Multi-Device Comparison supports up to 6 devices at once.", "info");
        return prev;
      }
      return [...prev, makeInstance(device)];
    });
  };

  const handleViewModeChange = (mode: "single" | "multi") => {
    setViewMode(mode);
    if (mode === "single" && activeInstances.length > 1) {
      setActiveInstances([activeInstances[0]]);
    } else if (mode === "multi" && activeInstances.length === 1) {
      const currentId = activeInstances[0].deviceId;
      const partnerId =
        currentId === "itel-a70" ? "iphone-15-pro" : "itel-a70";
      const partner = deviceMap.get(partnerId);
      if (partner) {
        setActiveInstances((prev) => [...prev, makeInstance(partner)]);
      }
    }
  };

  const handleToggleFavorite = async (deviceId: string) => {
    const next = devices.map((d) =>
      d.id === deviceId ? { ...d, isFavorite: !d.isFavorite } : d
    );
    setDevices(next);
    await saveDevices(next);
  };

  const handleSaveCustomDevice = async (device: Device) => {
    const exists = devices.some((d) => d.id === device.id);
    const next = exists
      ? devices.map((d) => (d.id === device.id ? device : d))
      : [device, ...devices];
    setDevices(next);
    await saveDevices(next);
    pushToast(
      exists ? `Updated ${device.name}` : `Added custom device: ${device.name}`,
      "success"
    );
  };

  const handleDeleteCustomDevice = async (deviceId: string) => {
    const next = devices.filter((d) => d.id !== deviceId);
    setDevices(next);
    await saveDevices(next);
    setActiveInstances((prev) => {
      const filtered = prev.filter((i) => i.deviceId !== deviceId);
      return filtered.length > 0 ? filtered : [makeInstance(next[0])];
    });
    pushToast("Deleted custom device.", "info");
  };

  const handleImportDevices = async (imported: Device[]) => {
    const existingIds = new Set(devices.map((d) => d.id));
    const sanitized = imported.map((d, idx) => ({
      ...d,
      id: existingIds.has(d.id) ? `imported-${Date.now()}-${idx}` : d.id,
      isCustom: true,
      accuracy: "custom" as const,
      devicePixelRatio: Number(d.devicePixelRatio) || 2,
      frameType: d.frameType || "punch_hole",
      category: d.category || "Smartphone",
      userAgent: d.userAgent || navigator.userAgent,
      isFavorite: Boolean(d.isFavorite),
    }));
    const next = [...sanitized, ...devices];
    setDevices(next);
    await saveDevices(next);
    pushToast(`Imported ${sanitized.length} device(s).`, "success");
  };

  const handleExportDevices = () => {
    const blob = new Blob([JSON.stringify(devices, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "omniview-devices.json";
    a.click();
    URL.revokeObjectURL(url);
    pushToast(`Exported ${devices.length} devices as JSON.`, "success");
  };

  const handleApplyPreset = (preset: PresetGroup) => {
    const instances = preset.deviceIds
      .map((id) => deviceMap.get(id))
      .filter((d): d is Device => Boolean(d))
      .map((d) => makeInstance(d));
    if (instances.length === 0) return;
    setViewMode(instances.length > 1 ? "multi" : "single");
    setActiveInstances(instances);
    pushToast(`Applied preset: ${preset.name}`, "info");
  };

  const handleSaveWorkspace = async (name: string) => {
    const ws: Workspace = {
      id: `ws-${Date.now()}`,
      name,
      url: liveUrl,
      deviceIds: activeInstances.map((i) => i.deviceId),
      viewMode,
      createdAt: Date.now(),
    };
    const next = [ws, ...workspaces];
    setWorkspaces(next);
    await saveWorkspaces(next);
    pushToast(`Saved workspace "${name}"`, "success");
  };

  const handleLoadWorkspace = (ws: Workspace) => {
    liveUrlRef.current = ws.url;
    setLiveUrl(ws.url);
    setActiveUrl(ws.url);
    setUrlInput(ws.url === getDemoPageUrl() ? "" : ws.url);
    setViewMode(ws.viewMode);
    const instances = ws.deviceIds
      .map((id) => deviceMap.get(id))
      .filter((d): d is Device => Boolean(d))
      .map((d) => makeInstance(d));
    if (instances.length > 0) {
      setActiveInstances(instances);
    }
    pushToast(`Loaded workspace "${ws.name}"`, "info");
  };

  const handleDeleteWorkspace = async (id: string) => {
    const next = workspaces.filter((w) => w.id !== id);
    setWorkspaces(next);
    await saveWorkspaces(next);
  };

  const getDeviceScale = (device: Device, inst: ActiveDeviceInstance): number => {
    if (zoom !== "auto") return zoom;
    const isTv = device.category === "Smart TV";
    const isPhone = device.category === "Smartphone";
    const isLandscape =
      inst.orientation === "landscape" || (isTv && inst.landscapeLock !== false);
    const nativeLandscape = device.viewport.width >= device.viewport.height;
    const w =
      isLandscape !== nativeLandscape
        ? device.viewport.height
        : device.viewport.width;
    const h =
      isLandscape !== nativeLandscape
        ? device.viewport.width
        : device.viewport.height;

    const extraH = isPhone && inst.showFrame && showOsChrome && !isLandscape ? 120 : 0;
    const count = activeInstances.length;
    const cols = count === 1 ? 1 : count === 2 ? 2 : count <= 4 ? 2 : 3;
    const availW = Math.max(260, (canvasSize.width - 72 - (cols - 1) * 32) / cols);
    const availH = Math.max(300, canvasSize.height - (zenMode ? 64 : 130));

    const scaleW = availW / (w + 60);
    const scaleH = availH / (h + 70 + extraH);
    return Math.min(1, Math.max(0.18, Number(Math.min(scaleW, scaleH).toFixed(3))));
  };

  const handleScreenshotElement = async (
    element: HTMLElement | null,
    label: string,
    action: ScreenshotAction | "studio"
  ) => {
    try {
      const capture = await captureElementScreenshot(element, {
        scrollIntoView: Boolean(element),
      });
      if (action === "studio") {
        setStudioCapture({ capture, label });
        return;
      }
      await exportScreenshot(capture, action, label);
      pushToast(
        action === "clipboard"
          ? `Copied ${label} screenshot to clipboard.`
          : `Downloaded ${label} screenshot (${capture.width}×${capture.height}).`,
        "success"
      );
    } catch (err) {
      pushToast(
        err instanceof Error ? err.message : "Screenshot capture failed.",
        "error"
      );
    }
  };

  const handleCapturePrimaryDevice = (
    mode: "frame" | "viewport",
    action: ScreenshotAction | "studio"
  ) => {
    const first = activeInstances[0];
    if (!first) return;
    const dev = deviceMap.get(first.deviceId);
    const selector =
      mode === "frame"
        ? `[data-device-frame="${first.instanceId}"]`
        : `[data-device-viewport="${first.instanceId}"]`;
    const el = document.querySelector<HTMLElement>(selector);
    void handleScreenshotElement(
      el,
      `${dev?.name ?? "device"} (${dev?.viewport.width}×${dev?.viewport.height})`,
      action
    );
  };

  const handleCaptureFullPage = async () => {
    const first = activeInstances[0];
    if (!first) return;
    const dev = deviceMap.get(first.deviceId);
    const viewportEl = document.querySelector<HTMLElement>(
      `[data-device-viewport="${first.instanceId}"]`
    );
    const iframe = iframeRegistryRef.current.get(first.instanceId);
    if (!viewportEl || !iframe) {
      pushToast("No active device viewport found for full-page capture.", "error");
      return;
    }

    pushToast("Capturing full scrolling page... please wait.", "info");
    try {
      const capture = await captureFullPageScreenshot(
        viewportEl,
        iframe,
        (cur, total) => {
          if (total > 1 && cur === Math.ceil(total / 2)) {
            pushToast(`Stitching full page (${cur}/${total})...`, "info");
          }
        }
      );
      setStudioCapture({
        capture,
        label: `${dev?.name ?? "device"} — Full Page`,
      });
    } catch (err) {
      pushToast(
        err instanceof Error ? err.message : "Full-page capture failed.",
        "error"
      );
    }
  };

  const handleCaptureGrid = (action: ScreenshotAction | "studio") => {
    if (gridRef.current) {
      const rect = gridRef.current.getBoundingClientRect();
      if (rect.width > window.innerWidth || rect.height > window.innerHeight) {
        setZoom("auto");
        pushToast(
          "Switched to Auto-Fit Zoom so the comparison grid fits inside the visible capture.",
          "info"
        );
      }
    }
    void handleScreenshotElement(gridRef.current, "OmniView Comparison", action);
  };

  const handleStartRecording = async (
    targetEl: HTMLElement | null,
    label: string
  ) => {
    setRecordingLabel(label);
    await recorderRef.current?.start({
      targetElement: targetEl,
      includeAudio,
      label,
      formatPreference: videoFormat,
      quality: videoQuality,
    });
  };

  const handleTvKeyPress = (
    key: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" | "Enter" | "Escape"
  ) => {
    const iframe = tvRemoteTarget?.iframe;
    if (!iframe) return;
    iframe.contentWindow?.postMessage(
      { __omniview: true, type: "OMNIVIEW_DISPATCH_KEY", key },
      "*"
    );
  };

  const handleChangeAppearance = (patch: Partial<StudioAppearance>) => {
    setAppearance((prev) => {
      const next = { ...prev, ...patch };
      void saveAppearance(next);
      if (patch.backdrop) {
        const nextMode = CANVAS_BACKDROPS[patch.backdrop].mode;
        setTheme(nextMode);
        void saveTheme(nextMode);
      }
      return next;
    });
  };

  const handleRotateAll = () => {
    setActiveInstances((prev) =>
      prev.map((item) => ({
        ...item,
        orientation:
          item.orientation === "portrait" ? "landscape" : "portrait",
      }))
    );
  };

  const handleCycleZoom = () => {
    const order: ZoomOption[] = ["auto", 0.5, 0.75, 1];
    const idx = order.indexOf(zoom);
    const next = order[(idx + 1) % order.length];
    setZoom(next);
    pushToast(
      `Zoom: ${next === "auto" ? "Auto-Fit" : `${Math.round(next * 100)}%`}`,
      "info"
    );
  };

  const handleRemoveInstanceSmooth = (id: string) => {
    setExitingIds((prev) => new Set(prev).add(id));
    window.setTimeout(() => {
      setActiveInstances((prev) => prev.filter((item) => item.instanceId !== id));
      setExitingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 220);
  };

  const activeBackdrop = CANVAS_BACKDROPS[appearance.backdrop] ?? CANVAS_BACKDROPS.obsidian;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <TopBar
        visible={!zenMode}
        sidebarOpen={sidebarOpen}
          urlInput={urlInput}
          urlHistory={urlHistory}
          viewMode={viewMode}
          zoom={zoom}
          compatibilityMode={compatibilityMode}
          singleUaEnabled={singleUaEnabled}
          multiUaPreset={multiUaPreset}
          syncScroll={syncScroll}
          showOsChrome={showOsChrome}
          showBreakpoints={showBreakpoints}
          showRuler={showRuler}
          touchCursor={touchCursor}
          theme={theme}
          appearance={appearance}
          presets={PRESET_GROUPS}
          workspaces={workspaces}
          recordingState={recordingState}
          includeAudio={includeAudio}
          videoFormat={videoFormat}
          videoQuality={videoQuality}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
          onOpenLiveDevice={() => setLiveDeviceOpen(true)}
          onChangeAppearance={handleChangeAppearance}
          onUrlInputChange={setUrlInput}
          onLoadUrl={handleLoadUrl}
          onLoadDemo={handleLoadDemo}
          onReloadAll={handleReloadAll}
          onViewModeChange={handleViewModeChange}
          onZoomChange={setZoom}
          onToggleCompat={handleToggleCompat}
          onToggleSingleUa={() => {
            setSingleUaEnabled((v) => !v);
            window.setTimeout(handleReloadAll, 100);
          }}
          onMultiUaPresetChange={(preset) => {
            setMultiUaPreset(preset);
            window.setTimeout(handleReloadAll, 100);
          }}
          onToggleSyncScroll={() => {
            setSyncScroll((s) => {
              const next = !s;
              pushToast(
                next
                  ? "Live Sync enabled: scrolling, navigation, clicks & typing mirror across all devices."
                  : "Live Sync disabled.",
                "info"
              );
              return next;
            });
          }}
          onToggleOsChrome={() => setShowOsChrome((o) => !o)}
          onToggleZenMode={() => setZenMode(true)}
          onApplyPreset={handleApplyPreset}
          onSaveWorkspace={handleSaveWorkspace}
          onLoadWorkspace={handleLoadWorkspace}
          onDeleteWorkspace={handleDeleteWorkspace}
          onCaptureGrid={handleCaptureGrid}
          onCapturePrimaryDevice={handleCapturePrimaryDevice}
          onCaptureFullPage={handleCaptureFullPage}
          onStartRecordingTab={() => handleStartRecording(null, "simulator-tab")}
          onStartRecordingPrimaryDevice={() => {
            const first = activeInstances[0];
            const dev = first ? deviceMap.get(first.deviceId) : undefined;
            const el = first
              ? document.querySelector<HTMLElement>(
                  `[data-device-frame="${first.instanceId}"]`
                )
              : null;
            void handleStartRecording(el, dev?.name ?? "device");
          }}
          onToggleIncludeAudio={() => setIncludeAudio((a) => !a)}
          onVideoFormatChange={setVideoFormat}
          onVideoQualityChange={setVideoQuality}
          onToggleBreakpoints={() => setShowBreakpoints((b) => !b)}
          onToggleRuler={() => setShowRuler((r) => !r)}
          onToggleTouchCursor={() => setTouchCursor((t) => !t)}
          onToggleTheme={async () => {
            const nextBackdrop = theme === "dark" ? "paper" : "obsidian";
            handleChangeAppearance({ backdrop: nextBackdrop });
          }}
        />

      {zenMode && (
        <button
          onClick={() => setZenMode(false)}
          className="animate-scale-in micro-btn fixed right-4 top-4 z-50 flex items-center gap-1.5 rounded-full border border-zinc-700/80 bg-zinc-900/90 px-3.5 py-2 text-xs font-semibold text-zinc-100 shadow-xl backdrop-blur-md hover:bg-indigo-600"
          title="Exit Zen Mode (Shift+Z)"
        >
          <Minimize2 className="h-3.5 w-3.5" />
          Exit Zen Mode
        </button>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar
          isOpen={!zenMode && sidebarOpen}
            devices={devices}
            activeDeviceIds={activeInstances.map((i) => i.deviceId)}
            recentDeviceIds={recentDeviceIds}
            viewMode={viewMode}
            searchInputRef={searchInputRef}
            onClose={() => setSidebarOpen(false)}
            onSelectDevice={handleSelectDevice}
            onToggleFavorite={handleToggleFavorite}
            onOpenAddModal={() => {
              setEditingDevice(null);
              setCustomModalOpen(true);
            }}
            onEditDevice={(dev) => {
              setEditingDevice(dev);
              setCustomModalOpen(true);
            }}
            onDeleteDevice={handleDeleteCustomDevice}
            onImportDevices={handleImportDevices}
            onExportDevices={handleExportDevices}
          />

        {/* Simulator Canvas with 16 Studio Themes & Living Animated Scenes */}
        <main
          ref={canvasRef}
          className={`relative flex-1 overflow-auto p-6 transition-all duration-500 ${
            appearance.showDotGrid ? "bg-dot-grid" : ""
          }`}
          style={{
            background: activeBackdrop.canvasStyle,
          }}
        >
          <CanvasScene
            scene={activeBackdrop.scene}
            glowColor={activeBackdrop.glowColor}
            enabled={
              appearance.animatedMotion &&
              appearance.motionPreset !== "reduced"
            }
          />

          <div
            ref={gridRef}
            className="relative z-10 mx-auto flex min-h-full flex-wrap items-center justify-center gap-10 pr-10"
          >
            {sessionReady && activeInstances.map((inst, idx) => {
              const device = deviceMap.get(inst.deviceId);
              if (!device) return null;
              return (
                <DeviceCard
                  key={inst.instanceId}
                  index={idx}
                  instance={inst}
                  device={device}
                  url={activeUrl}
                  liveUrl={liveUrl}
                  scale={getDeviceScale(device, inst)}
                  canRemove={activeInstances.length > 1}
                  syncScroll={syncScroll}
                  showOsChrome={showOsChrome}
                  showBreakpoints={showBreakpoints}
                  showRuler={showRuler}
                  touchCursor={touchCursor}
                  zenMode={zenMode}
                  minimalHeader={appearance.uiDensity === "minimal"}
                  ambientGlowColor={
                    appearance.ambientGlow ? activeBackdrop.glowColor : null
                  }
                  hoverLift={appearance.hoverLift}
                  isExiting={exitingIds.has(inst.instanceId)}
                  onOpenLiveDevice={() => setLiveDeviceOpen(true)}
                  onRegisterIframe={handleRegisterIframe}
                  onRotate={(id) =>
                    setActiveInstances((prev) =>
                      prev.map((item) =>
                        item.instanceId === id
                          ? {
                              ...item,
                              orientation:
                                item.orientation === "portrait"
                                  ? "landscape"
                                  : "portrait",
                            }
                          : item
                      )
                    )
                  }
                  onReload={(id) =>
                    setActiveInstances((prev) =>
                      prev.map((item) =>
                        item.instanceId === id
                          ? { ...item, reloadKey: item.reloadKey + 1 }
                          : item
                      )
                    )
                  }
                  onToggleFrame={(id) =>
                    setActiveInstances((prev) =>
                      prev.map((item) =>
                        item.instanceId === id
                          ? { ...item, showFrame: !item.showFrame }
                          : item
                      )
                    )
                  }
                  onRemove={(id) => handleRemoveInstanceSmooth(id)}
                  onToggleOverscan={(id) =>
                    setActiveInstances((prev) =>
                      prev.map((item) =>
                        item.instanceId === id
                          ? { ...item, showOverscan: !item.showOverscan }
                          : item
                      )
                    )
                  }
                  onToggleLandscapeLock={(id) =>
                    setActiveInstances((prev) =>
                      prev.map((item) =>
                        item.instanceId === id
                          ? {
                              ...item,
                              landscapeLock: item.landscapeLock === false,
                              orientation:
                                item.landscapeLock === false
                                  ? "landscape"
                                  : item.orientation,
                            }
                          : item
                      )
                    )
                  }
                  onOpenTvRemote={(id, iframeEl) =>
                    setTvRemoteTarget({
                      instanceId: id,
                      deviceName: device.name,
                      iframe: iframeEl,
                    })
                  }
                  onScreenshot={(el, label, openStudio) =>
                    void handleScreenshotElement(
                      el,
                      label,
                      openStudio ? "studio" : "download"
                    )
                  }
                  onRecordDevice={(el, label) =>
                    void handleStartRecording(el, label)
                  }
                />
              );
            })}
          </div>
        </main>
      </div>

      {/* Floating Right Quick-Action Rail */}
      <FloatingRail
        visible={!zenMode}
        sidebarOpen={sidebarOpen}
          viewMode={viewMode}
          syncScroll={syncScroll}
          showOsChrome={showOsChrome}
          appearance={appearance}
          recordingState={recordingState}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
          onRotateAll={handleRotateAll}
          onCycleZoom={handleCycleZoom}
          onToggleSyncScroll={() => {
            setSyncScroll((s) => {
              const next = !s;
              pushToast(
                next
                  ? "Live Sync enabled: scrolling, navigation, clicks & typing mirror across all devices."
                  : "Live Sync disabled.",
                "info"
              );
              return next;
            });
          }}
          onOpenStudioCapture={() =>
            viewMode === "multi"
              ? handleCaptureGrid("studio")
              : handleCapturePrimaryDevice("frame", "studio")
          }
          onStartRecording={() => void handleStartRecording(null, "simulator-tab")}
          onOpenLiveDevice={() => setLiveDeviceOpen(true)}
          onChangeAppearance={handleChangeAppearance}
          onToggleOsChrome={() => setShowOsChrome((o) => !o)}
          onToggleZenMode={() => setZenMode(true)}
        />

      {/* Run on Live Physical Device Modal */}
      <LiveDeviceModal
        isOpen={liveDeviceOpen}
        url={liveUrl}
        onClose={() => setLiveDeviceOpen(false)}
        onToast={pushToast}
      />

      {/* Custom Device Modal */}
      <CustomDeviceModal
        isOpen={customModalOpen}
        editingDevice={editingDevice}
        onClose={() => setCustomModalOpen(false)}
        onSave={handleSaveCustomDevice}
      />

      {/* Mockup Screenshot Studio Modal */}
      <ScreenshotStudioModal
        capture={studioCapture?.capture ?? null}
        defaultLabel={studioCapture?.label ?? "OmniView Capture"}
        onClose={() => setStudioCapture(null)}
        onToast={pushToast}
      />

      {/* Video Recording Preview & Export Modal */}
      <RecordingPreviewModal
        recording={completedRecording}
        onClose={() => {
          if (completedRecording?.objectUrl) {
            URL.revokeObjectURL(completedRecording.objectUrl);
          }
          setCompletedRecording(null);
        }}
        onDownloaded={(filename) =>
          pushToast(`Downloaded video: ${filename}`, "success")
        }
      />

      {/* Floating Recording HUD */}
      <RecordingHud
        state={recordingState}
        elapsedSeconds={recordingSeconds}
        bytesRecorded={recordingBytes}
        targetLabel={recordingLabel}
        onPause={() => recorderRef.current?.pause()}
        onResume={() => recorderRef.current?.resume()}
        onStop={() => recorderRef.current?.stop()}
      />

      {/* Floating Smart TV D-Pad Remote */}
      {tvRemoteTarget && (
        <TvRemoteHud
          deviceName={tvRemoteTarget.deviceName}
          onKeyPress={handleTvKeyPress}
          onClose={() => setTvRemoteTarget(null)}
        />
      )}

      {/* Toast Notifications */}
      <div className="pointer-events-none fixed right-4 top-24 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-toast-in max-w-sm rounded-xl border px-3.5 py-2.5 text-xs font-medium shadow-xl backdrop-blur-md ${
              t.tone === "success"
                ? "border-emerald-500/40 bg-emerald-950/90 text-emerald-200"
                : t.tone === "error"
                  ? "border-red-500/40 bg-red-950/90 text-red-200"
                  : "border-zinc-700 bg-zinc-900/95 text-zinc-100"
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
};
