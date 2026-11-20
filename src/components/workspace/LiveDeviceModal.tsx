import React, { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  X,
  QrCode,
  Copy,
  Check,
  Download,
  ExternalLink,
  Wifi,
  Smartphone,
} from "lucide-react";

interface LiveDeviceModalProps {
  isOpen: boolean;
  url: string;
  onClose: () => void;
  onToast: (text: string, tone?: "info" | "success" | "error") => void;
}

const LAN_IP_STORAGE_KEY = "omniview_lan_ip_v1";

function isLocalhostUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return (
      u.hostname === "localhost" ||
      u.hostname === "127.0.0.1" ||
      u.hostname === "0.0.0.0"
    );
  } catch {
    return false;
  }
}

function rewriteWithLanIp(raw: string, lanIp: string): string {
  const cleanIp = lanIp.trim();
  if (!cleanIp) return raw;
  try {
    const u = new URL(raw);
    if (
      u.hostname === "localhost" ||
      u.hostname === "127.0.0.1" ||
      u.hostname === "0.0.0.0"
    ) {
      u.hostname = cleanIp;
      return u.toString();
    }
    return raw;
  } catch {
    return raw;
  }
}

export const LiveDeviceModal: React.FC<LiveDeviceModalProps> = ({
  isOpen,
  url,
  onClose,
  onToast,
}) => {
  const [lanIp, setLanIp] = useState<string>(() => {
    try {
      return window.localStorage.getItem(LAN_IP_STORAGE_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const isLocal = useMemo(() => isLocalhostUrl(url), [url]);
  const isDemo = url.startsWith("chrome-extension://");

  const targetUrl = useMemo(() => {
    if (isDemo) return "https://example.com";
    return isLocal && lanIp.trim() ? rewriteWithLanIp(url, lanIp) : url;
  }, [url, isLocal, isDemo, lanIp]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LAN_IP_STORAGE_KEY, lanIp);
    } catch {
      // ignore
    }
  }, [lanIp]);

  useEffect(() => {
    if (!isOpen || !targetUrl) return;
    let cancelled = false;
    void QRCode.toDataURL(targetUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: "#09090b",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, targetUrl]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      onToast("Copied live device URL to clipboard!", "success");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      onToast("Could not copy URL.", "error");
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "omniview-live-device-qr.png";
    a.click();
    onToast("Downloaded QR code PNG.", "success");
  };

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="animate-scale-in w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400">
              <QrCode className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Run on Live Device</h2>
              <p className="text-[11px] text-zinc-400">
                Scan with your physical phone, tablet, or TV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="micro-btn rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-5">
          {isDemo && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
              You are viewing the built-in extension Demo page. Enter a public or
              local network URL in OmniView to open it on your physical phone.
            </div>
          )}

          {/* QR Code Showcase */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-5">
            <div className="animate-scale-in rounded-2xl bg-white p-3 shadow-[0_12px_40px_rgba(99,102,241,0.28)]">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Scan to open on live device"
                  className="h-52 w-52 rounded-lg"
                />
              ) : (
                <div className="flex h-52 w-52 items-center justify-center text-xs text-zinc-500">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-400">
              <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
              <span>Point your camera app at the QR code to open instantly</span>
            </div>
          </div>

          {/* Smart Localhost -> LAN IP Helper */}
          {isLocal && (
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                <Wifi className="h-3.5 w-3.5" />
                Local Dev Server Detected
              </div>
              <p className="mb-2 text-[11px] leading-relaxed text-zinc-400">
                Phones cannot open <code>localhost</code> directly. Enter your
                computer&apos;s Wi-Fi IP (e.g. <code>192.168.1.42</code>) so your
                phone on the same Wi-Fi can connect:
              </p>
              <input
                type="text"
                value={lanIp}
                onChange={(e) => setLanIp(e.target.value)}
                placeholder="e.g. 192.168.1.42"
                className="w-full rounded-lg border border-indigo-500/40 bg-zinc-950 px-3 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-400"
              />
            </div>
          )}

          {/* Active URL Bar */}
          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
            <span className="flex-1 truncate font-mono text-xs text-zinc-300">
              {targetUrl}
            </span>
            <button
              onClick={handleCopy}
              className="micro-btn flex shrink-0 items-center gap-1 rounded-lg bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-200 hover:bg-zinc-700"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadQr}
              className="micro-btn flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
            >
              <Download className="h-3.5 w-3.5" />
              Save QR PNG
            </button>
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="micro-btn btn-glow flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open in Tab
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
