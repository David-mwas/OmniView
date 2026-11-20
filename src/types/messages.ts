export interface SimulatorSession {
  sessionId: string;
  tabId: number;
  compatRuleId: number;
  uaRuleId: number;
  compatibilityMode: boolean;
  userAgent: string | null;
  createdAt: number;
}

export type ExtensionMessage =
  | { type: "SESSION_INIT" }
  | { type: "SESSION_GET" }
  | { type: "SESSION_SET_COMPAT"; enabled: boolean }
  | { type: "SESSION_SET_UA"; userAgent: string | null }
  | { type: "SCREENSHOT_CAPTURE_VISIBLE" }
  | { type: "DOWNLOAD_FILE"; url: string; filename: string; saveAs?: boolean };

export type ExtensionResponse =
  | { ok: true; session: SimulatorSession }
  | { ok: true; dataUrl: string }
  | { ok: true; downloadId: number }
  | { ok: false; error: string };
