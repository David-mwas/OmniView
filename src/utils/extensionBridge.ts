import type { ExtensionMessage, ExtensionResponse } from "../types/messages";

export function isExtensionContext(): boolean {
  return typeof chrome !== "undefined" && Boolean(chrome.runtime?.id);
}

export async function sendExtensionMessage(
  message: ExtensionMessage
): Promise<ExtensionResponse> {
  if (!isExtensionContext()) {
    return {
      ok: false,
      error: "Chrome extension runtime not detected (running in preview mode).",
    };
  }
  try {
    const response = (await chrome.runtime.sendMessage(message)) as
      | ExtensionResponse
      | undefined;
    if (!response) {
      return { ok: false, error: "Empty response from background worker." };
    }
    return response;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function getDemoPageUrl(): string {
  if (isExtensionContext()) {
    return chrome.runtime.getURL("demo.html");
  }
  return "/demo.html";
}
