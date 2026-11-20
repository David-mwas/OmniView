import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getAllSessions,
  getOrCreateSession,
  removeSession,
  updateSession,
} from "../background/sessionManager";
import {
  buildCompatibilityRule,
  buildUserAgentRule,
  cleanupOrphanedRules,
  removeSessionDnrRules,
  syncSessionDnrRules,
} from "../background/dnrRules";

function createChromeMock() {
  const sessionStore: Record<string, unknown> = {};
  let activeRules: chrome.declarativeNetRequest.Rule[] = [];

  return {
    storage: {
      session: {
        get: vi.fn(async (key: string) => ({ [key]: sessionStore[key] })),
        set: vi.fn(async (obj: Record<string, unknown>) => {
          Object.assign(sessionStore, obj);
        }),
      },
    },
    declarativeNetRequest: {
      updateSessionRules: vi.fn(
        async (opts: chrome.declarativeNetRequest.UpdateRuleOptions) => {
          if (opts.removeRuleIds) {
            const removeSet = new Set(opts.removeRuleIds);
            activeRules = activeRules.filter((r) => !removeSet.has(r.id));
          }
          if (opts.addRules) {
            activeRules.push(...opts.addRules);
          }
        }
      ),
      getSessionRules: vi.fn(async () => [...activeRules]),
    },
    _getActiveRules: () => activeRules,
  };
}

describe("MV3 Session Manager & DNR Rule Lifecycle", () => {
  let mockChrome: ReturnType<typeof createChromeMock>;

  beforeEach(() => {
    mockChrome = createChromeMock();
    vi.stubGlobal("chrome", mockChrome);
  });

  it("allocates isolated sessions and unique DNR rule IDs across multiple tabs", async () => {
    const s1 = await getOrCreateSession(101);
    const s2 = await getOrCreateSession(202);

    expect(s1.tabId).toBe(101);
    expect(s2.tabId).toBe(202);
    expect(s1.compatRuleId).not.toBe(s2.compatRuleId);
    expect(s1.uaRuleId).not.toBe(s2.uaRuleId);
    expect(s1.compatibilityMode).toBe(false);
    expect(s1.userAgent).toBeNull();
  });

  it("scopes compatibility rule strictly to tabId and sub_frame with standard headers only", async () => {
    const s1 = await getOrCreateSession(55);
    const rule = buildCompatibilityRule(s1);

    expect(rule.condition.tabIds).toEqual([55]);
    expect(rule.condition.resourceTypes).toEqual(["sub_frame"]);
    const headers = rule.action.responseHeaders?.map((h) => h.header) ?? [];
    expect(headers).toEqual(["x-frame-options", "content-security-policy"]);
  });

  it("applies and cleans up DNR rules when compatibility mode and UA change", async () => {
    await getOrCreateSession(77);
    const updated = await updateSession(77, {
      compatibilityMode: true,
      userAgent: "TestMobileUA/1.0",
    });

    await syncSessionDnrRules(updated);
    expect(mockChrome._getActiveRules()).toHaveLength(2);
    expect(buildUserAgentRule(updated, "TestMobileUA/1.0").condition.tabIds).toEqual([77]);

    await removeSessionDnrRules(updated);
    await removeSession(77);
    expect(mockChrome._getActiveRules()).toHaveLength(0);
    expect(await getAllSessions()).toEqual({});
  });

  it("cleans up orphaned DNR rules whose tabs no longer exist", async () => {
    const s1 = await updateSession(10, { compatibilityMode: true });
    const s2 = await updateSession(20, { compatibilityMode: true });
    await syncSessionDnrRules(s1);
    await syncSessionDnrRules(s2);
    expect(mockChrome._getActiveRules()).toHaveLength(2);

    // Tab 20 was closed while service worker was asleep
    const sessions = await getAllSessions();
    const removedIds = await cleanupOrphanedRules(new Set([10]), sessions);

    expect(removedIds).toEqual([s2.compatRuleId]);
    expect(mockChrome._getActiveRules().map((r) => r.id)).toEqual([s1.compatRuleId]);
  });
});
