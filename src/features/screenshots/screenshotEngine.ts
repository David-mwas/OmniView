import { sendExtensionMessage } from "../../utils/extensionBridge";

export type ScreenshotAction = "download" | "clipboard";
export type ImageFormat = "png" | "jpeg" | "webp";

export type StudioBackgroundId =
  | "midnight"
  | "sunset"
  | "aurora"
  | "slate"
  | "paper"
  | "transparent";

export type StudioAspectRatio = "auto" | "16:9" | "1:1" | "4:5" | "9:16";
export type AnnotationTool = "none" | "arrow" | "rect" | "blur";

export interface StudioAnnotation {
  id: string;
  type: Exclude<AnnotationTool, "none">;
  /** Normalized 0..1 coordinates relative to the final canvas */
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

export interface StudioStyleOptions {
  background: StudioBackgroundId;
  padding: number;
  borderRadius: number;
  shadow: boolean;
  caption: string;
  showCaption: boolean;
  aspectRatio: StudioAspectRatio;
  annotations: StudioAnnotation[];
}

export const STUDIO_BACKGROUNDS: Record<
  StudioBackgroundId,
  { label: string; previewCss: string; stops?: [string, string, string?] }
> = {
  midnight: {
    label: "Midnight Indigo",
    previewCss: "linear-gradient(135deg, #0f172a 0%, #312e81 55%, #0ea5e9 100%)",
    stops: ["#0f172a", "#312e81", "#0ea5e9"],
  },
  sunset: {
    label: "Sunset Coral",
    previewCss: "linear-gradient(135deg, #1e1b4b 0%, #be185d 55%, #f97316 100%)",
    stops: ["#1e1b4b", "#be185d", "#f97316"],
  },
  aurora: {
    label: "Emerald Aurora",
    previewCss: "linear-gradient(135deg, #022c22 0%, #0f766e 55%, #34d399 100%)",
    stops: ["#022c22", "#0f766e", "#34d399"],
  },
  slate: {
    label: "Carbon Studio",
    previewCss: "linear-gradient(135deg, #18181b 0%, #27272a 100%)",
    stops: ["#18181b", "#27272a"],
  },
  paper: {
    label: "Clean White",
    previewCss: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
    stops: ["#f8fafc", "#e2e8f0"],
  },
  transparent: {
    label: "Transparent",
    previewCss:
      "repeating-conic-gradient(#52525b 0% 25%, #27272a 0% 50%) 50% / 14px 14px",
  },
};

export interface CaptureResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

function waitForPaint(delayMs = 0): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (delayMs > 0) {
          window.setTimeout(resolve, delayMs);
        } else {
          resolve();
        }
      });
    });
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to decode captured tab image."));
    img.src = src;
  });
}

export async function captureElementScreenshot(
  element: HTMLElement | null,
  options: { scrollIntoView?: boolean } = {}
): Promise<CaptureResult> {
  if (element && options.scrollIntoView) {
    element.scrollIntoView({
      behavior: "instant" as ScrollBehavior,
      block: "center",
      inline: "center",
    });
    await waitForPaint(40);
  } else {
    await waitForPaint();
  }

  const res = await sendExtensionMessage({ type: "SCREENSHOT_CAPTURE_VISIBLE" });
  if (!res.ok || !("dataUrl" in res)) {
    throw new Error(
      !res.ok
        ? res.error
        : "Unable to capture tab screenshot. Ensure OmniView is loaded as a Chrome Extension."
    );
  }

  const img = await loadImage(res.dataUrl);

  const scaleX = img.naturalWidth / Math.max(window.innerWidth, 1);
  const scaleY = img.naturalHeight / Math.max(window.innerHeight, 1);

  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;

  if (element) {
    const rect = element.getBoundingClientRect();
    const clampedLeft = Math.max(0, rect.left);
    const clampedTop = Math.max(0, rect.top);
    const clampedRight = Math.min(window.innerWidth, rect.right);
    const clampedBottom = Math.min(window.innerHeight, rect.bottom);

    if (clampedRight <= clampedLeft || clampedBottom <= clampedTop) {
      throw new Error("Target element is outside the visible viewport.");
    }

    sx = Math.round(clampedLeft * scaleX);
    sy = Math.round(clampedTop * scaleY);
    sw = Math.max(1, Math.round((clampedRight - clampedLeft) * scaleX));
    sh = Math.max(1, Math.round((clampedBottom - clampedTop) * scaleY));
  }

  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not initialize 2D canvas context for cropping.");
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to encode PNG blob."))),
      "image/png"
    );
  });

  const dataUrl = canvas.toDataURL("image/png");
  return { blob, dataUrl, width: sw, height: sh };
}

function requestIframeBridge<T>(
  iframe: HTMLIFrameElement,
  message: Record<string, unknown>,
  expectedResponseType: string,
  timeoutMs = 2000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const timer = window.setTimeout(() => {
      window.removeEventListener("message", onMsg);
      reject(new Error("Iframe did not respond to scroll command (reload page or check Compatibility Mode)."));
    }, timeoutMs);

    const onMsg = (ev: MessageEvent) => {
      const d = ev.data;
      if (
        d &&
        d.__omniview === true &&
        d.type === expectedResponseType &&
        d.requestId === requestId
      ) {
        window.clearTimeout(timer);
        window.removeEventListener("message", onMsg);
        resolve(d as T);
      }
    };

    window.addEventListener("message", onMsg);
    iframe.contentWindow?.postMessage(
      { __omniview: true, requestId, ...message },
      "*"
    );
  });
}

/**
 * Scrolls an iframe from top to bottom via syncBridge, captures each slice with
 * chrome.tabs.captureVisibleTab (respecting Chrome's capture rate limit), and
 * stitches them into a full-page image.
 */
export async function captureFullPageScreenshot(
  viewportElement: HTMLElement,
  iframe: HTMLIFrameElement,
  onProgress?: (current: number, total: number) => void
): Promise<CaptureResult> {
  viewportElement.scrollIntoView({
    behavior: "instant" as ScrollBehavior,
    block: "center",
    inline: "center",
  });
  await waitForPaint(50);

  const { metrics } = await requestIframeBridge<{
    metrics: {
      scrollHeight: number;
      clientHeight: number;
      scrollTop: number;
      maxScrollY: number;
    };
  }>(iframe, { type: "OMNIVIEW_GET_METRICS" }, "OMNIVIEW_METRICS_RESPONSE");

  const originalY = metrics.scrollTop;
  const totalHeightCss = Math.min(metrics.scrollHeight, metrics.clientHeight * 12); // cap at 12 screens for memory safety
  const stepCss = Math.max(1, metrics.clientHeight);
  const steps: number[] = [];

  for (let y = 0; y < totalHeightCss; y += stepCss) {
    steps.push(Math.min(y, metrics.maxScrollY));
    if (y + stepCss >= totalHeightCss) break;
  }
  if (steps.length === 0) steps.push(0);

  const slices: { img: HTMLImageElement; actualY: number }[] = [];

  try {
    for (let i = 0; i < steps.length; i++) {
      onProgress?.(i + 1, steps.length);
      const { actualY } = await requestIframeBridge<{ actualY: number }>(
        iframe,
        { type: "OMNIVIEW_SCROLL_TO", y: steps[i] },
        "OMNIVIEW_SCROLL_TO_DONE"
      );
      // Respect Chrome's MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND (~2/sec)
      await waitForPaint(i === 0 ? 80 : 520);
      const cap = await captureElementScreenshot(viewportElement, {
        scrollIntoView: false,
      });
      const img = await loadImage(cap.dataUrl);
      slices.push({ img, actualY });
    }
  } finally {
    // Always restore original scroll position
    iframe.contentWindow?.postMessage(
      { __omniview: true, type: "OMNIVIEW_SCROLL_TO", y: originalY },
      "*"
    );
  }

  const firstSlice = slices[0].img;
  const pxPerCssY = firstSlice.naturalHeight / stepCss;
  const finalWidth = firstSlice.naturalWidth;
  const lastSlice = slices[slices.length - 1];
  const finalHeight = Math.max(
    firstSlice.naturalHeight,
    Math.round(lastSlice.actualY * pxPerCssY + lastSlice.img.naturalHeight)
  );

  const canvas = document.createElement("canvas");
  canvas.width = finalWidth;
  canvas.height = finalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not initialize 2D canvas for full-page stitching.");

  for (const slice of slices) {
    const destY = Math.round(slice.actualY * pxPerCssY);
    ctx.drawImage(slice.img, 0, destY);
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to encode full-page PNG."))),
      "image/png"
    );
  });

  return {
    blob,
    dataUrl: canvas.toDataURL("image/png"),
    width: finalWidth,
    height: finalHeight,
  };
}

export async function renderStudioCanvas(
  sourceDataUrl: string,
  style: StudioStyleOptions,
  format: ImageFormat = "png"
): Promise<CaptureResult> {
  const img = await loadImage(sourceDataUrl);
  const pad = style.padding;
  const captionHeight = style.showCaption && style.caption.trim() ? 48 : 0;

  let outW = img.naturalWidth + pad * 2;
  let outH = img.naturalHeight + pad * 2 + captionHeight;

  // Enforce optional social / presentation aspect ratio while keeping full capture centered
  if (style.aspectRatio && style.aspectRatio !== "auto") {
    const [rw, rh] = style.aspectRatio.split(":").map(Number);
    const targetRatio = rw / rh;
    const currentRatio = outW / outH;
    if (currentRatio < targetRatio) {
      outW = Math.round(outH * targetRatio);
    } else if (currentRatio > targetRatio) {
      outH = Math.round(outW / targetRatio);
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to create Studio 2D context.");

  const bgDef = STUDIO_BACKGROUNDS[style.background];
  if (bgDef.stops) {
    const grad = ctx.createLinearGradient(0, 0, outW, outH);
    grad.addColorStop(0, bgDef.stops[0]);
    if (bgDef.stops[2]) {
      grad.addColorStop(0.55, bgDef.stops[1]);
      grad.addColorStop(1, bgDef.stops[2]);
    } else {
      grad.addColorStop(1, bgDef.stops[1]);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, outW, outH);
  } else if (format === "jpeg") {
    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, outW, outH);
  }

  // Center the captured image cleanly inside the canvas
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const x = Math.round((outW - w) / 2);
  const y = Math.round((outH - captionHeight - h) / 2);
  const r = Math.min(style.borderRadius, w / 4, h / 4);

  if (style.shadow) {
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 44;
    ctx.shadowOffsetY = 20;
    ctx.fillStyle = "rgba(0,0,0,0.9)";
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.clip();
  ctx.drawImage(img, x, y, w, h);
  ctx.restore();

  // Render interactive annotations (blur boxes, highlight rects, arrows)
  for (const ann of style.annotations ?? []) {
    const ax1 = ann.x1 * outW;
    const ay1 = ann.y1 * outH;
    const ax2 = ann.x2 * outW;
    const ay2 = ann.y2 * outH;
    const rx = Math.min(ax1, ax2);
    const ry = Math.min(ay1, ay2);
    const rw = Math.abs(ax2 - ax1);
    const rh = Math.abs(ay2 - ay1);

    if (ann.type === "blur" && rw > 4 && rh > 4) {
      // Pixelate/blur region to cleanly redact sensitive data
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(rx, ry, rw, rh, 6);
      ctx.clip();
      ctx.filter = "blur(14px)";
      ctx.drawImage(canvas, rx, ry, rw, rh, rx, ry, rw, rh);
      ctx.filter = "none";
      ctx.fillStyle = "rgba(15, 23, 42, 0.25)";
      ctx.fillRect(rx, ry, rw, rh);
      ctx.restore();
    } else if (ann.type === "rect" && rw > 4 && rh > 4) {
      ctx.save();
      ctx.strokeStyle = ann.color;
      ctx.lineWidth = Math.max(3, Math.round(outW / 280));
      ctx.beginPath();
      ctx.roundRect(rx, ry, rw, rh, 8);
      ctx.stroke();
      ctx.restore();
    } else if (ann.type === "arrow") {
      const headLen = Math.max(14, Math.round(outW / 55));
      const angle = Math.atan2(ay2 - ay1, ax2 - ax1);
      ctx.save();
      ctx.strokeStyle = ann.color;
      ctx.fillStyle = ann.color;
      ctx.lineWidth = Math.max(3.5, Math.round(outW / 240));
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(ax1, ay1);
      ctx.lineTo(ax2, ay2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(ax2, ay2);
      ctx.lineTo(
        ax2 - headLen * Math.cos(angle - Math.PI / 6),
        ay2 - headLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        ax2 - headLen * Math.cos(angle + Math.PI / 6),
        ay2 - headLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  if (captionHeight > 0) {
    ctx.save();
    ctx.font =
      '600 18px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle =
      style.background === "paper"
        ? "rgba(15, 23, 42, 0.85)"
        : "rgba(255, 255, 255, 0.9)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(style.caption.trim(), outW / 2, outH - captionHeight / 2);
    ctx.restore();
  }

  const mime =
    format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
  const quality = format === "png" ? undefined : 0.92;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to encode studio image."))),
      mime,
      quality
    );
  });

  return {
    blob,
    dataUrl: canvas.toDataURL(mime, quality),
    width: outW,
    height: outH,
  };
}

export async function exportScreenshot(
  capture: CaptureResult,
  action: ScreenshotAction,
  filenameBase: string,
  format: ImageFormat = "png"
): Promise<void> {
  const safeBase = filenameBase
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-|-$/g, "");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const ext = format === "jpeg" ? "jpg" : format;
  const filename = `omniview-${safeBase || "capture"}-${stamp}.${ext}`;

  if (action === "clipboard") {
    if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
      throw new Error("Clipboard image copy is not supported in this browser context.");
    }
    // Clipboard API requires image/png
    let pngBlob = capture.blob;
    if (pngBlob.type !== "image/png") {
      const img = await loadImage(capture.dataUrl);
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext("2d")?.drawImage(img, 0, 0);
      pngBlob = await new Promise<Blob>((resolve, reject) =>
        c.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG conversion failed"))), "image/png")
      );
    }
    await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })]);
    return;
  }

  const res = await sendExtensionMessage({
    type: "DOWNLOAD_FILE",
    url: capture.dataUrl,
    filename,
    saveAs: false,
  });

  if (!res.ok) {
    const link = document.createElement("a");
    link.href = capture.dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}
