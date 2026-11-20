import type { SimulatorSession } from "../types/messages";

const SESSIONS_STORAGE_KEY = "omniview_sessions_v1";
const NEXT_RULE_ID_KEY = "omniview_next_rule_id_v1";
const BASE_RULE_ID = 1000;

export async function getAllSessions(): Promise<Record<number, SimulatorSession>> {
  const data = await chrome.storage.session.get(SESSIONS_STORAGE_KEY);
  return (data[SESSIONS_STORAGE_KEY] as Record<number, SimulatorSession> | undefined) ?? {};
}

async function saveAllSessions(sessions: Record<number, SimulatorSession>): Promise<void> {
  await chrome.storage.session.set({ [SESSIONS_STORAGE_KEY]: sessions });
}

async function allocateRuleIdPair(): Promise<{ compatRuleId: number; uaRuleId: number }> {
  const data = await chrome.storage.session.get(NEXT_RULE_ID_KEY);
  const current =
    typeof data[NEXT_RULE_ID_KEY] === "number" && data[NEXT_RULE_ID_KEY] >= BASE_RULE_ID
      ? (data[NEXT_RULE_ID_KEY] as number)
      : BASE_RULE_ID;
  const next = current + 2;
  await chrome.storage.session.set({ [NEXT_RULE_ID_KEY]: next });
  return { compatRuleId: current, uaRuleId: current + 1 };
}

export async function getOrCreateSession(tabId: number): Promise<SimulatorSession> {
  const sessions = await getAllSessions();
  if (sessions[tabId]) {
    return sessions[tabId];
  }
  const { compatRuleId, uaRuleId } = await allocateRuleIdPair();
  const session: SimulatorSession = {
    sessionId: `sim-${tabId}-${Date.now()}`,
    tabId,
    compatRuleId,
    uaRuleId,
    compatibilityMode: true,
    userAgent: null,
    createdAt: Date.now(),
  };
  sessions[tabId] = session;
  await saveAllSessions(sessions);
  return session;
}

export async function updateSession(
  tabId: number,
  patch: Partial<Pick<SimulatorSession, "compatibilityMode" | "userAgent">>
): Promise<SimulatorSession> {
  const sessions = await getAllSessions();
  const existing = sessions[tabId] ?? (await getOrCreateSession(tabId));
  const updated: SimulatorSession = {
    ...existing,
    ...patch,
  };
  sessions[tabId] = updated;
  await saveAllSessions(sessions);
  return updated;
}

export async function removeSession(tabId: number): Promise<SimulatorSession | null> {
  const sessions = await getAllSessions();
  const removed = sessions[tabId] ?? null;
  if (removed) {
    delete sessions[tabId];
    await saveAllSessions(sessions);
  }
  return removed;
}
