export type DeviceCategory =
  | "Smartphone"
  | "Tablet"
  | "Laptop"
  | "Desktop"
  | "Smart TV";

export type FrameType =
  | "dynamic_island"
  | "notch"
  | "punch_hole"
  | "waterdrop"
  | "tablet"
  | "laptop"
  | "tv"
  | "none";

export type DeviceAccuracy = "verified" | "estimated" | "custom";

export type Orientation = "portrait" | "landscape";

export interface Device {
  id: string;
  name: string;
  brand: string;
  category: DeviceCategory;
  viewport: {
    width: number;
    height: number;
  };
  physicalResolution?: {
    width: number;
    height: number;
  };
  devicePixelRatio: number;
  userAgent: string;
  frameType: FrameType;
  accuracy: DeviceAccuracy;
  isCustom: boolean;
  isFavorite: boolean;
}

export interface ActiveDeviceInstance {
  instanceId: string;
  deviceId: string;
  orientation: Orientation;
  showFrame: boolean;
  reloadKey: number;
  landscapeLock?: boolean;
  showOverscan?: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  url: string;
  deviceIds: string[];
  viewMode: "single" | "multi";
  createdAt: number;
}

export interface PresetGroup {
  id: string;
  name: string;
  description: string;
  deviceIds: string[];
}

export type SharedUAPreset =
  | "off"
  | "mobile_android"
  | "mobile_ios"
  | "desktop_chrome"
  | "smart_tv";
