export interface PendingNavigation {
  url: string;
  started: boolean;
  retries: number;
  ts: number;
}

export type SyncDecision =
  | { kind: "none" }
  | { kind: "broadcast"; sourceInstanceId: string; url: string; targets: string[] }
  | { kind: "navigate_one"; targetInstanceId: string; url: string };

/**
 * Normalizes URLs consistently between the simulator parent and iframe sync bridge
 * so trailing-slash differences do not look like navigations.
 */
export function normalizeSyncUrl(href: string): string {
  try {
    const u = new URL(href);
    return u.href.replace(/\/$/, "");
  } catch {
    return href.replace(/\/$/, "");
  }
}

/**
 * Coordinates Live Sync navigation across multiple device iframes without
 * ping-pong loops caused by asynchronous loads, stale handshakes, or redirects.
 */
export class NavSyncCoordinator {
  private liveUrl: string;
  private readonly instanceUrls = new Map<string, string>();
  private readonly pendingNavs = new Map<string, PendingNavigation>();

  constructor(initialUrl: string) {
    this.liveUrl = initialUrl;
  }

  getLiveUrl(): string {
    return this.liveUrl;
  }

  getInstanceUrl(instanceId: string): string | undefined {
    return this.instanceUrls.get(instanceId);
  }

  getPendingNavigation(instanceId: string): PendingNavigation | undefined {
    return this.pendingNavs.get(instanceId);
  }

  setGlobalUrl(url: string, instanceIds: string[]): void {
    this.liveUrl = url;
    this.pendingNavs.clear();
    for (const id of instanceIds) {
      this.instanceUrls.set(id, url);
    }
  }

  registerInstance(instanceId: string, initialUrl: string): void {
    this.instanceUrls.set(instanceId, initialUrl);
    this.pendingNavs.delete(instanceId);
  }

  unregisterInstance(instanceId: string): void {
    this.instanceUrls.delete(instanceId);
    this.pendingNavs.delete(instanceId);
  }

  /**
   * Records that an iframe actually received OMNIVIEW_APPLY_NAVIGATE and
   * started navigating before unloading. Prevents retry loops if the target
   * URL performs a server-side redirect.
   */
  onNavStarted(instanceId: string, url: string): void {
    const pending = this.pendingNavs.get(instanceId);
    if (pending && normalizeSyncUrl(pending.url) === normalizeSyncUrl(url)) {
      pending.started = true;
    }
  }

  /**
   * Records that an iframe is already at (or completed a same-document hash
   * navigation to) the requested URL without a full document reload.
   */
  onNavAck(instanceId: string, url: string): void {
    const pending = this.pendingNavs.get(instanceId);
    if (pending && normalizeSyncUrl(pending.url) === normalizeSyncUrl(url)) {
      this.pendingNavs.delete(instanceId);
    }
    this.instanceUrls.set(instanceId, url);
  }

  /**
   * Handles OMNIVIEW_READY fired after an iframe finishes loading a document
   * and completes its OMNIVIEW_HANDSHAKE.
   */
  onReady(
    instanceId: string,
    href: string,
    allInstanceIds: string[],
    syncEnabled: boolean,
    dualUrlMode: boolean,
    now = Date.now()
  ): SyncDecision {
    const normHref = normalizeSyncUrl(href);
    const pending = this.pendingNavs.get(instanceId);

    if (pending) {
      if (normHref === normalizeSyncUrl(pending.url)) {
        this.pendingNavs.delete(instanceId);
        this.instanceUrls.set(instanceId, href);
        return { kind: "none" };
      }

      // The iframe finished loading a stale document because OMNIVIEW_APPLY_NAVIGATE
      // arrived before handshake completed. Re-dispatch once now that it is ready.
      if (!pending.started && pending.retries < 1 && syncEnabled && !dualUrlMode) {
        pending.retries += 1;
        pending.ts = now;
        this.instanceUrls.set(instanceId, href);
        return {
          kind: "navigate_one",
          targetInstanceId: instanceId,
          url: pending.url,
        };
      }

      // Already started (server redirect) or retry limit reached: settle cleanly.
      this.pendingNavs.delete(instanceId);
      this.instanceUrls.set(instanceId, href);
      return { kind: "none" };
    }

    const prevUrl = this.instanceUrls.get(instanceId);
    this.instanceUrls.set(instanceId, href);

    if (!syncEnabled || dualUrlMode) {
      return { kind: "none" };
    }

    if (normHref === normalizeSyncUrl(this.liveUrl)) {
      return { kind: "none" };
    }

    // If this iframe simply finished loading the same URL it was originally given
    // while liveUrl moved ahead on another device, catch this iframe up instead
    // of reverting every other device back to the stale URL.
    if (prevUrl && normHref === normalizeSyncUrl(prevUrl)) {
      this.pendingNavs.set(instanceId, {
        url: this.liveUrl,
        started: false,
        retries: 0,
        ts: now,
      });
      return {
        kind: "navigate_one",
        targetInstanceId: instanceId,
        url: this.liveUrl,
      };
    }

    // Genuine user-initiated MPA navigation to a new URL.
    return this.broadcast(instanceId, href, allInstanceIds, now);
  }

  /**
   * Handles OMNIVIEW_NAVIGATED fired on SPA history changes, popstate, or hashchange.
   */
  onNavigated(
    instanceId: string,
    url: string,
    allInstanceIds: string[],
    syncEnabled: boolean,
    dualUrlMode: boolean,
    now = Date.now()
  ): SyncDecision {
    const normUrl = normalizeSyncUrl(url);
    const pending = this.pendingNavs.get(instanceId);

    if (pending) {
      if (normUrl === normalizeSyncUrl(pending.url)) {
        this.pendingNavs.delete(instanceId);
        this.instanceUrls.set(instanceId, url);
        return { kind: "none" };
      }

      const prevUrl = this.instanceUrls.get(instanceId);
      if (
        prevUrl &&
        normUrl === normalizeSyncUrl(prevUrl) &&
        now - pending.ts < 3000
      ) {
        // Ignore stale echo of the pre-navigation URL while remote nav is in flight.
        return { kind: "none" };
      }

      this.pendingNavs.delete(instanceId);
    }

    this.instanceUrls.set(instanceId, url);

    if (!syncEnabled || dualUrlMode) {
      return { kind: "none" };
    }

    if (normUrl === normalizeSyncUrl(this.liveUrl)) {
      return { kind: "none" };
    }

    return this.broadcast(instanceId, url, allInstanceIds, now);
  }

  private broadcast(
    sourceInstanceId: string,
    nextUrl: string,
    allInstanceIds: string[],
    now: number
  ): SyncDecision {
    this.liveUrl = nextUrl;
    const normNext = normalizeSyncUrl(nextUrl);
    const targets: string[] = [];

    for (const id of allInstanceIds) {
      if (id === sourceInstanceId) continue;
      const known = this.instanceUrls.get(id);
      if (known && normalizeSyncUrl(known) === normNext) {
        this.pendingNavs.delete(id);
        continue;
      }
      this.pendingNavs.set(id, {
        url: nextUrl,
        started: false,
        retries: 0,
        ts: now,
      });
      targets.push(id);
    }

    return {
      kind: "broadcast",
      sourceInstanceId,
      url: nextUrl,
      targets,
    };
  }
}
