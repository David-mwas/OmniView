import type { ExtensionMessage, ExtensionResponse } from "../types/messages";
import {
  getAllSessions,
  getOrCreateSession,
  removeSession,
  updateSession,
} from "./sessionManager";
import {
  cleanupOrphanedRules,
  removeSessionDnrRules,
  syncSessionDnrRules,
} from "./dnrRules";

async function cleanupOrphans(): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({});
    const activeTabIds = new Set<number>(
      tabs.map((t) => t.id).filter((id): id is number => typeof id === "number")
    );
    const sessions = await getAllSessions();

    for (const tabIdStr of Object.keys(sessions)) {
      const tabId = Number(tabIdStr);
      if (!activeTabIds.has(tabId)) {
        await removeSession(tabId);
      }
    }

    const updatedSessions = await getAllSessions();
    await cleanupOrphanedRules(activeTabIds, updatedSessions);
  } catch (err) {
    console.warn("[OmniView] Failed to clean up orphaned sessions:", err);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  void cleanupOrphans();
});

chrome.runtime.onStartup.addListener(() => {
  void cleanupOrphans();
});

chrome.action.onClicked.addListener(async (tab) => {
  const rawUrl = tab.url ?? "";
  const isWebUrl = /^https?:\/\//i.test(rawUrl);
  const simulatorUrl = chrome.runtime.getURL("simulator.html");
  const target = isWebUrl
    ? `${simulatorUrl}?url=${encodeURIComponent(rawUrl)}`
    : simulatorUrl;

  await chrome.tabs.create({ url: target });
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const removed = await removeSession(tabId);
  if (removed) {
    try {
      await removeSessionDnrRules(removed);
    } catch (err) {
      console.warn("[OmniView] Failed to remove DNR rules for closed tab:", err);
    }
  }
});

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: ExtensionResponse) => void
  ) => {
    const handle = async (): Promise<ExtensionResponse> => {
      const tabId = sender.tab?.id;

      switch (message.type) {
        case "SESSION_INIT": {
          if (typeof tabId !== "number") {
            return { ok: false, error: "No sender tabId available." };
          }
          const session = await getOrCreateSession(tabId);
          await syncSessionDnrRules(session);
          return { ok: true, session };
        }

        case "SESSION_GET": {
          if (typeof tabId !== "number") {
            return { ok: false, error: "No sender tabId available." };
          }
          const session = await getOrCreateSession(tabId);
          return { ok: true, session };
        }

        case "SESSION_SET_COMPAT": {
          if (typeof tabId !== "number") {
            return { ok: false, error: "No sender tabId available." };
          }
          const session = await updateSession(tabId, {
            compatibilityMode: message.enabled,
          });
          await syncSessionDnrRules(session);
          return { ok: true, session };
        }

        case "SESSION_SET_UA": {
          if (typeof tabId !== "number") {
            return { ok: false, error: "No sender tabId available." };
          }
          const session = await updateSession(tabId, {
            userAgent: message.userAgent,
          });
          await syncSessionDnrRules(session);
          return { ok: true, session };
        }

        case "SCREENSHOT_CAPTURE_VISIBLE": {
          const windowId = sender.tab?.windowId;
          if (typeof windowId !== "number") {
            return { ok: false, error: "No sender windowId available." };
          }
          const dataUrl = await chrome.tabs.captureVisibleTab(windowId, {
            format: "png",
          });
          return { ok: true, dataUrl };
        }

        case "DOWNLOAD_FILE": {
          const downloadId = await chrome.downloads.download({
            url: message.url,
            filename: message.filename,
            saveAs: message.saveAs ?? false,
          });
          return { ok: true, downloadId };
        }

        default:
          return { ok: false, error: "Unknown extension message type." };
      }
    };

    void handle()
      .then(sendResponse)
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        sendResponse({ ok: false, error: msg });
      });

    return true; // keep async message channel open
  }
);
