import type { SimulatorSession } from "../types/messages";

const SUB_FRAME_TYPES: chrome.declarativeNetRequest.ResourceType[] = [
  "sub_frame" as chrome.declarativeNetRequest.ResourceType,
];

export function buildCompatibilityRule(
  session: SimulatorSession
): chrome.declarativeNetRequest.Rule {
  return {
    id: session.compatRuleId,
    priority: 1,
    action: {
      type: "modifyHeaders" as chrome.declarativeNetRequest.RuleActionType,
      responseHeaders: [
        {
          header: "x-frame-options",
          operation: "remove" as chrome.declarativeNetRequest.HeaderOperation,
        },
        {
          header: "content-security-policy",
          operation: "remove" as chrome.declarativeNetRequest.HeaderOperation,
        },
      ],
    },
    condition: {
      tabIds: [session.tabId],
      resourceTypes: SUB_FRAME_TYPES,
    },
  };
}

export function buildUserAgentRule(
  session: SimulatorSession,
  userAgent: string
): chrome.declarativeNetRequest.Rule {
  return {
    id: session.uaRuleId,
    priority: 1,
    action: {
      type: "modifyHeaders" as chrome.declarativeNetRequest.RuleActionType,
      requestHeaders: [
        {
          header: "user-agent",
          operation: "set" as chrome.declarativeNetRequest.HeaderOperation,
          value: userAgent,
        },
      ],
    },
    condition: {
      tabIds: [session.tabId],
      resourceTypes: SUB_FRAME_TYPES,
    },
  };
}

export async function syncSessionDnrRules(session: SimulatorSession): Promise<void> {
  const removeRuleIds: number[] = [session.compatRuleId, session.uaRuleId];
  const addRules: chrome.declarativeNetRequest.Rule[] = [];

  if (session.compatibilityMode) {
    addRules.push(buildCompatibilityRule(session));
  }
  if (session.userAgent && session.userAgent.trim().length > 0) {
    addRules.push(buildUserAgentRule(session, session.userAgent.trim()));
  }

  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds,
    addRules,
  });
}

export async function removeSessionDnrRules(session: SimulatorSession): Promise<void> {
  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [session.compatRuleId, session.uaRuleId],
  });
}

export async function cleanupOrphanedRules(
  activeTabIds: Set<number>,
  sessions: Record<number, SimulatorSession>
): Promise<number[]> {
  const existingRules = await chrome.declarativeNetRequest.getSessionRules();
  const validRuleIds = new Set<number>();

  for (const session of Object.values(sessions)) {
    if (activeTabIds.has(session.tabId)) {
      if (session.compatibilityMode) validRuleIds.add(session.compatRuleId);
      if (session.userAgent) validRuleIds.add(session.uaRuleId);
    }
  }

  const orphanedRuleIds = existingRules
    .map((r) => r.id)
    .filter((id) => !validRuleIds.has(id));

  if (orphanedRuleIds.length > 0) {
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: orphanedRuleIds,
    });
  }

  return orphanedRuleIds;
}
