import { describe, it, expect } from "vitest";
import { NavSyncCoordinator, normalizeSyncUrl } from "../utils/navSyncCoordinator";

const HOME = "https://zidiphones.co.ke/";
const PHONE = "https://zidiphones.co.ke/phone/itel-a100c-2gb-64gb-a6611l";
const OTHER = "https://zidiphones.co.ke/phone/tecno-spark-20";

describe("NavSyncCoordinator — Live Sync navigation loop prevention", () => {
  it("normalizes trailing slashes consistently", () => {
    expect(normalizeSyncUrl("https://zidiphones.co.ke")).toBe("https://zidiphones.co.ke");
    expect(normalizeSyncUrl("https://zidiphones.co.ke/")).toBe("https://zidiphones.co.ke");
    expect(normalizeSyncUrl(`${PHONE}/`)).toBe(PHONE);
  });

  it("prevents ping-pong loop when Device B finishes a stale load or echoes old URL while navigating", () => {
    const coord = new NavSyncCoordinator(HOME);
    const ids = ["itel-a70", "iphone-15-pro"];
    coord.registerInstance("itel-a70", HOME);
    coord.registerInstance("iphone-15-pro", HOME);

    // 1. User clicks phone page in Device A (SPA navigation)
    const d1 = coord.onNavigated("itel-a70", PHONE, ids, true, false, 1000);
    expect(d1).toEqual({
      kind: "broadcast",
      sourceInstanceId: "itel-a70",
      url: PHONE,
      targets: ["iphone-15-pro"],
    });
    expect(coord.getLiveUrl()).toBe(PHONE);

    // 2. While Device B is still waiting for the network response to PHONE,
    // a stale OMNIVIEW_NAVIGATED(HOME) arrives — must be ignored, NOT broadcast back!
    const staleEcho = coord.onNavigated("iphone-15-pro", HOME, ids, true, false, 1200);
    expect(staleEcho).toEqual({ kind: "none" });
    expect(coord.getLiveUrl()).toBe(PHONE);

    // 3. Device B finishes loading PHONE -> onReady clears pending without re-broadcasting
    coord.onNavStarted("iphone-15-pro", PHONE);
    const done = coord.onReady("iphone-15-pro", PHONE, ids, true, false, 1800);
    expect(done).toEqual({ kind: "none" });
    expect(coord.getPendingNavigation("iphone-15-pro")).toBeUndefined();
    expect(coord.getLiveUrl()).toBe(PHONE);
  });

  it("catches up a lagging iframe that missed OMNIVIEW_APPLY_NAVIGATE mid-load instead of reverting other devices", () => {
    const coord = new NavSyncCoordinator(HOME);
    const ids = ["itel-a70", "iphone-15-pro"];
    coord.registerInstance("itel-a70", HOME);
    coord.registerInstance("iphone-15-pro", HOME);

    // Device A navigates to PHONE while Device B is still loading HOME (message dropped before handshake)
    const d1 = coord.onNavigated("itel-a70", PHONE, ids, true, false, 1000);
    expect(d1.kind).toBe("broadcast");

    // Device B finishes loading HOME (never sent OMNIVIEW_NAV_STARTED for PHONE!)
    const d2 = coord.onReady("iphone-15-pro", HOME, ids, true, false, 1500);
    expect(d2).toEqual({
      kind: "navigate_one",
      targetInstanceId: "iphone-15-pro",
      url: PHONE,
    });
    // Live URL stays PHONE — Device A is NOT reverted to HOME!
    expect(coord.getLiveUrl()).toBe(PHONE);

    // Now Device B receives PHONE, starts nav, and finishes loading PHONE
    coord.onNavStarted("iphone-15-pro", PHONE);
    const d3 = coord.onReady("iphone-15-pro", PHONE, ids, true, false, 2200);
    expect(d3).toEqual({ kind: "none" });
    expect(coord.getPendingNavigation("iphone-15-pro")).toBeUndefined();
  });

  it("catches up a newly added 3rd device that loaded a stale URL instead of reverting the session", () => {
    const coord = new NavSyncCoordinator(HOME);
    coord.registerInstance("a", HOME);
    coord.registerInstance("b", HOME);

    // A and B move to PHONE
    coord.onNavigated("a", PHONE, ["a", "b"], true, false, 1000);
    coord.onNavAck("b", PHONE);

    // 3rd device C mounts with stale HOME and finishes loading HOME
    coord.registerInstance("c", HOME);
    const decision = coord.onReady("c", HOME, ["a", "b", "c"], true, false, 1500);
    expect(decision).toEqual({
      kind: "navigate_one",
      targetInstanceId: "c",
      url: PHONE,
    });
    expect(coord.getLiveUrl()).toBe(PHONE);
  });

  it("does not loop when a target URL performs a server-side redirect", () => {
    const coord = new NavSyncCoordinator(HOME);
    const ids = ["a", "b"];
    coord.registerInstance("a", HOME);
    coord.registerInstance("b", HOME);

    coord.onNavigated("a", PHONE, ids, true, false, 1000);
    // B acknowledges starting navigation to PHONE
    coord.onNavStarted("b", PHONE);

    // Server redirects PHONE -> OTHER on B
    const d = coord.onReady("b", OTHER, ids, true, false, 1600);
    expect(d).toEqual({ kind: "none" });
    expect(coord.getPendingNavigation("b")).toBeUndefined();
    expect(coord.getInstanceUrl("b")).toBe(OTHER);
  });

  it("syncs genuine user-initiated MPA navigations on onReady", () => {
    const coord = new NavSyncCoordinator(HOME);
    const ids = ["a", "b"];
    coord.registerInstance("a", HOME);
    coord.registerInstance("b", HOME);

    // Both settle on HOME
    expect(coord.onReady("a", HOME, ids, true, false, 1000)).toEqual({ kind: "none" });
    expect(coord.onReady("b", HOME, ids, true, false, 1000)).toEqual({ kind: "none" });

    // User clicks MPA link in A -> A loads PHONE
    const d = coord.onReady("a", PHONE, ids, true, false, 2000);
    expect(d).toEqual({
      kind: "broadcast",
      sourceInstanceId: "a",
      url: PHONE,
      targets: ["b"],
    });
  });

  it("does not cross-overwrite URLs in Dual-URL mode or when sync is disabled", () => {
    const coord = new NavSyncCoordinator(HOME);
    const ids = ["staging", "prod"];
    coord.registerInstance("staging", "https://staging.example.com");
    coord.registerInstance("prod", "https://prod.example.com");

    expect(
      coord.onNavigated("staging", "https://staging.example.com/pricing", ids, true, true, 1000)
    ).toEqual({ kind: "none" });

    expect(
      coord.onNavigated("staging", "https://staging.example.com/about", ids, false, false, 1100)
    ).toEqual({ kind: "none" });
  });
});
