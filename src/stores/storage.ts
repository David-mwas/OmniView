import type { Device, Workspace } from "../types/device";
import { DEFAULT_APPEARANCE, type StudioAppearance } from "../types/theme";
import { BUILTIN_DEVICES } from "../data/devices";
import { isExtensionContext } from "../utils/extensionBridge";

const KEYS = {
  DEVICES: "omniview_devices_v1",
  WORKSPACES: "omniview_workspaces_v1",
  URL_HISTORY: "omniview_url_history_v1",
  RECENT_DEVICES: "omniview_recent_devices_v1",
  THEME: "omniview_theme_v1",
  APPEARANCE: "omniview_appearance_v1",
} as const;

async function readLocal<T>(key: string): Promise<T | undefined> {
  if (isExtensionContext() && chrome.storage?.local) {
    const res = await chrome.storage.local.get(key);
    return res[key] as T | undefined;
  }
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

async function writeLocal<T>(key: string, value: T): Promise<void> {
  if (isExtensionContext() && chrome.storage?.local) {
    await chrome.storage.local.set({ [key]: value });
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors in non-extension preview
  }
}

export async function loadDevices(): Promise<Device[]> {
  const stored = await readLocal<Device[]>(KEYS.DEVICES);
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    await writeLocal(KEYS.DEVICES, BUILTIN_DEVICES);
    return BUILTIN_DEVICES;
  }
  // Ensure any newly added built-in devices are merged without losing favorites/customs
  const storedMap = new Map(stored.map((d) => [d.id, d]));
  const merged: Device[] = [...stored];
  for (const builtin of BUILTIN_DEVICES) {
    if (!storedMap.has(builtin.id)) {
      merged.push(builtin);
    }
  }
  return merged;
}

export async function saveDevices(devices: Device[]): Promise<void> {
  await writeLocal(KEYS.DEVICES, devices);
}

export async function loadWorkspaces(): Promise<Workspace[]> {
  return (await readLocal<Workspace[]>(KEYS.WORKSPACES)) ?? [];
}

export async function saveWorkspaces(workspaces: Workspace[]): Promise<void> {
  await writeLocal(KEYS.WORKSPACES, workspaces);
}

export async function loadUrlHistory(): Promise<string[]> {
  return (await readLocal<string[]>(KEYS.URL_HISTORY)) ?? [];
}

export async function pushUrlHistory(url: string): Promise<string[]> {
  const history = await loadUrlHistory();
  const next = [url, ...history.filter((u) => u !== url)].slice(0, 25);
  await writeLocal(KEYS.URL_HISTORY, next);
  return next;
}

export async function loadRecentDeviceIds(): Promise<string[]> {
  return (await readLocal<string[]>(KEYS.RECENT_DEVICES)) ?? [];
}

export async function pushRecentDeviceId(deviceId: string): Promise<string[]> {
  const recent = await loadRecentDeviceIds();
  const next = [deviceId, ...recent.filter((id) => id !== deviceId)].slice(0, 12);
  await writeLocal(KEYS.RECENT_DEVICES, next);
  return next;
}

export async function loadTheme(): Promise<"dark" | "light"> {
  const t = await readLocal<"dark" | "light">(KEYS.THEME);
  return t === "light" ? "light" : "dark";
}

export async function saveTheme(theme: "dark" | "light"): Promise<void> {
  await writeLocal(KEYS.THEME, theme);
}

export async function loadAppearance(): Promise<StudioAppearance> {
  const stored = await readLocal<Partial<StudioAppearance>>(KEYS.APPEARANCE);
  if (!stored) return DEFAULT_APPEARANCE;
  return { ...DEFAULT_APPEARANCE, ...stored };
}

export async function saveAppearance(appearance: StudioAppearance): Promise<void> {
  await writeLocal(KEYS.APPEARANCE, appearance);
}
