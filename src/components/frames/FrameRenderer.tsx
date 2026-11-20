import React from "react";
import type { FrameType, Orientation } from "../../types/device";
import { PhoneFrame } from "./PhoneFrame";
import { TabletFrame } from "./TabletFrame";
import { LaptopFrame } from "./LaptopFrame";
import { TVFrame } from "./TVFrame";

interface FrameRendererProps {
  frameType: FrameType;
  brand: string;
  url?: string;
  showFrame: boolean;
  showOsChrome?: boolean;
  orientation: Orientation;
  width: number;
  height: number;
  onBack?: () => void;
  onForward?: () => void;
  onReload?: () => void;
  children: React.ReactNode;
}

export const FrameRenderer: React.FC<FrameRendererProps> = ({
  frameType,
  brand,
  url,
  showFrame,
  showOsChrome = true,
  orientation,
  width,
  height,
  onBack,
  onForward,
  onReload,
  children,
}) => {
  if (!showFrame || frameType === "none") {
    return (
      <div
        className="device-spring relative overflow-hidden rounded-lg bg-black shadow-2xl ring-1 ring-zinc-700/80"
        style={{ width, height }}
      >
        {children}
      </div>
    );
  }

  switch (frameType) {
    case "dynamic_island":
    case "notch":
    case "punch_hole":
    case "waterdrop":
      return (
        <PhoneFrame
          frameType={frameType}
          brand={brand}
          url={url}
          showOsChrome={showOsChrome}
          orientation={orientation}
          width={width}
          height={height}
          onBack={onBack}
          onForward={onForward}
          onReload={onReload}
        >
          {children}
        </PhoneFrame>
      );
    case "tablet":
      return (
        <TabletFrame orientation={orientation} width={width} height={height}>
          {children}
        </TabletFrame>
      );
    case "laptop":
      return (
        <LaptopFrame width={width} height={height}>
          {children}
        </LaptopFrame>
      );
    case "tv":
      return (
        <TVFrame width={width} height={height}>
          {children}
        </TVFrame>
      );
    default:
      return (
        <div
          className="device-spring relative overflow-hidden rounded-lg bg-black shadow-2xl ring-1 ring-zinc-700/80"
          style={{ width, height }}
        >
          {children}
        </div>
      );
  }
};
