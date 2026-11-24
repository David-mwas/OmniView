/**
 * OmniView Iframe Sync Bridge (Content Script)
 * Stays completely dormant unless explicitly handshaked by the OmniView simulator parent window.
 * Powers:
 *  1. Real-time Synchronized Scrolling (proportional + exact)
 *  2. Real-time Synchronized Navigation (MPA full page loads + SPA route changes)
 *  3. Real-time Synchronized Clicks & Form Inputs (menus, tabs, modals, search bars)
 *  4. Full-page scroll-and-stitch screenshot stepping
 *  5. Cross-origin Smart TV D-Pad keyboard focus navigation
 */
(() => {
  // Never run in top-level normal browser tabs
  if (window === window.top) return;

  let instanceId: string | null = null;
  let syncScrollEnabled = false;
  let syncInteractionsEnabled = false;
  let isApplyingRemoteScroll = false;
  let isApplyingRemoteAction = false;
  let isNavigatingRemotely = false;
  let remoteGuardTimer: number | null = null;
  let remoteActionTimer: number | null = null;
  let remoteNavTimer: number | null = null;
  let scrollRaf: number | null = null;
  let lastReportedUrl = window.location.href;
  let urlPollInterval: number | null = null;
  let xrayEnabled = false;
  let touchAuditEnabled = false;
  let clsScore = 0;
  const consoleErrors: string[] = [];

  const XRAY_STYLE_ID = "__omniview_xray_style__";
  const TOUCH_STYLE_ID = "__omniview_touch_audit_style__";
  const CUSTOM_CSS_ID = "__omniview_custom_css__";

  // Capture runtime errors & unhandled rejections cleanly without chrome.debugger
  window.addEventListener("error", (ev) => {
    const msg = ev.message || "Script error";
    consoleErrors.push(msg.slice(0, 140));
    if (consoleErrors.length > 20) consoleErrors.shift();
  });
  window.addEventListener("unhandledrejection", (ev) => {
    const msg =
      ev.reason instanceof Error
        ? ev.reason.message
        : String(ev.reason ?? "Unhandled promise rejection");
    consoleErrors.push(msg.slice(0, 140));
    if (consoleErrors.length > 20) consoleErrors.shift();
  });

  // Track Cumulative Layout Shift (CLS) if supported
  try {
    if (typeof PerformanceObserver !== "undefined") {
      const po = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const ls = entry as PerformanceEntry & {
            value?: number;
            hadRecentInput?: boolean;
          };
          if (!ls.hadRecentInput && typeof ls.value === "number") {
            clsScore += ls.value;
          }
        }
      });
      po.observe({ type: "layout-shift", buffered: true });
    }
  } catch {
    // ignore unsupported entry types
  }

  function rgbToHex(rgb: string): string | null {
    const m = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
    if (!m) return null;
    if (m[4] !== undefined && Number(m[4]) === 0) return null;
    const hex = [Number(m[1]), Number(m[2]), Number(m[3])]
      .map((n) => n.toString(16).padStart(2, "0"))
      .join("");
    return `#${hex.toLowerCase()}`;
  }

  function applyTouchAudit(enabled: boolean): number {
    touchAuditEnabled = enabled;
    const existing = document.getElementById(TOUCH_STYLE_ID);
    document
      .querySelectorAll("[data-omniview-small-tap]")
      .forEach((el) => el.removeAttribute("data-omniview-small-tap"));

    const interactives = document.querySelectorAll<HTMLElement>(
      'a[href], button, [role="button"], input:not([type="hidden"]), select'
    );
    let smallCount = 0;
    interactives.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
        smallCount++;
        if (enabled) {
          el.setAttribute("data-omniview-small-tap", "true");
        }
      }
    });

    if (!enabled) {
      existing?.remove();
    } else if (!existing) {
      const style = document.createElement("style");
      style.id = TOUCH_STYLE_ID;
      style.textContent = `
        [data-omniview-small-tap="true"] {
          outline: 2px dashed #f59e0b !important;
          outline-offset: 1px !important;
        }
      `;
      (document.head || document.documentElement).appendChild(style);
    }
    return smallCount;
  }

  function applyCustomCss(css: string) {
    let el = document.getElementById(CUSTOM_CSS_ID) as HTMLStyleElement | null;
    if (!css.trim()) {
      el?.remove();
      return;
    }
    if (!el) {
      el = document.createElement("style");
      el.id = CUSTOM_CSS_ID;
      (document.head || document.documentElement).appendChild(el);
    }
    el.textContent = css;
  }

  function applyA11yStress(rtl: boolean, textScale: number) {
    document.documentElement.dir = rtl ? "rtl" : "";
    document.documentElement.style.fontSize =
      textScale !== 1 ? `${Math.round(textScale * 100)}%` : "";
  }

  function collectPageAudit() {
    const getMeta = (sel: string) =>
      document.querySelector<HTMLMetaElement>(sel)?.content?.trim() ?? "";

    const faviconHref =
      document.querySelector<HTMLLinkElement>('link[rel*="icon"]')?.href ?? "";

    const fontSet = new Set<string>();
    const colorCounts = new Map<string, number>();

    const sampleNodes = Array.from(
      document.querySelectorAll("body, h1, h2, h3, p, a, button, header, nav, section")
    ).slice(0, 120);

    for (const node of sampleNodes) {
      const cs = window.getComputedStyle(node);
      const primaryFont = cs.fontFamily
        .split(",")[0]
        ?.replace(/['"]/g, "")
        .trim();
      if (primaryFont) fontSet.add(primaryFont);

      const fg = rgbToHex(cs.color);
      if (fg) colorCounts.set(fg, (colorCounts.get(fg) ?? 0) + 1);
      const bg = rgbToHex(cs.backgroundColor);
      if (bg) colorCounts.set(bg, (colorCounts.get(bg) ?? 0) + 2);
    }

    const topColors = Array.from(colorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([hex]) => hex);

    const imgs = Array.from(document.querySelectorAll("img"));
    const brokenImages = imgs.filter(
      (img) => img.complete && img.naturalWidth === 0
    ).length;

    const smallTouchTargets = applyTouchAudit(touchAuditEnabled);
    const docEl = document.documentElement;
    const body = document.body;
    const clientWidth = docEl?.clientWidth || window.innerWidth || 1;
    const scrollWidth = Math.max(docEl?.scrollWidth ?? 0, body?.scrollWidth ?? 0);
    const overflowPx = Math.max(0, Math.round(scrollWidth - clientWidth));

    let loadTimeMs = 0;
    try {
      const nav = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;
      if (nav && nav.loadEventEnd > 0) {
        loadTimeMs = Math.round(nav.loadEventEnd - nav.startTime);
      } else if (nav && nav.domContentLoadedEventEnd > 0) {
        loadTimeMs = Math.round(nav.domContentLoadedEventEnd - nav.startTime);
      }
    } catch {
      // ignore
    }

    return {
      url: window.location.href,
      title: document.title || window.location.hostname,
      description: getMeta('meta[name="description"]'),
      ogTitle: getMeta('meta[property="og:title"]'),
      ogDescription: getMeta('meta[property="og:description"]'),
      ogImage: getMeta('meta[property="og:image"]'),
      favicon: faviconHref,
      fonts: Array.from(fontSet).slice(0, 8),
      colors: topColors,
      brokenImages,
      smallTouchTargets,
      domNodes: document.getElementsByTagName("*").length,
      imageCount: imgs.length,
      loadTimeMs,
      cls: Number(clsScore.toFixed(3)),
      overflowPx,
      consoleErrors: [...consoleErrors],
      updatedAt: Date.now(),
    };
  }

  function applyXray(enabled: boolean) {
    xrayEnabled = enabled;
    const existing = document.getElementById(XRAY_STYLE_ID);
    if (!enabled) {
      existing?.remove();
      document
        .querySelectorAll("[data-omniview-overflow]")
        .forEach((el) => el.removeAttribute("data-omniview-overflow"));
      return;
    }

    if (!existing) {
      const style = document.createElement("style");
      style.id = XRAY_STYLE_ID;
      style.textContent = `
        * { outline: 1px solid rgba(99, 102, 241, 0.32) !important; }
        [data-omniview-overflow="true"] {
          outline: 2px solid #ef4444 !important;
          background-color: rgba(239, 68, 68, 0.12) !important;
        }
      `;
      (document.head || document.documentElement).appendChild(style);
    }

    const vw = document.documentElement.clientWidth || window.innerWidth;
    document.querySelectorAll("*").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.right > vw + 2) {
        el.setAttribute("data-omniview-overflow", "true");
      } else {
        el.removeAttribute("data-omniview-overflow");
      }
    });
  }

  function reportOverflowStatus() {
    if (!instanceId) return;
    const docEl = document.documentElement;
    const body = document.body;
    const clientWidth = docEl?.clientWidth || window.innerWidth || 1;
    const scrollWidth = Math.max(
      docEl?.scrollWidth ?? 0,
      body?.scrollWidth ?? 0
    );
    const overflowPx = Math.max(0, Math.round(scrollWidth - clientWidth));
    postToParent({
      type: "OMNIVIEW_OVERFLOW_STATUS",
      instanceId,
      hasOverflow: overflowPx > 2,
      overflowPx,
    });
    if (xrayEnabled) {
      applyXray(true);
    }
  }

  function normalizeHref(href: string): string {
    try {
      const u = new URL(href);
      return u.href.replace(/\/$/, "");
    } catch {
      return href;
    }
  }

  function getScrollMetrics() {
    const docEl = document.documentElement;
    const body = document.body;
    const scrollHeight = Math.max(
      docEl?.scrollHeight ?? 0,
      body?.scrollHeight ?? 0
    );
    const scrollWidth = Math.max(
      docEl?.scrollWidth ?? 0,
      body?.scrollWidth ?? 0
    );
    const clientHeight = window.innerHeight || docEl?.clientHeight || 1;
    const clientWidth = window.innerWidth || docEl?.clientWidth || 1;
    const scrollTop = window.scrollY ?? docEl?.scrollTop ?? 0;
    const scrollLeft = window.scrollX ?? docEl?.scrollLeft ?? 0;
    const maxScrollY = Math.max(0, scrollHeight - clientHeight);
    const maxScrollX = Math.max(0, scrollWidth - clientWidth);

    return {
      scrollTop,
      scrollLeft,
      scrollHeight,
      scrollWidth,
      clientHeight,
      clientWidth,
      maxScrollY,
      maxScrollX,
      ratioY: maxScrollY > 0 ? scrollTop / maxScrollY : 0,
      ratioX: maxScrollX > 0 ? scrollLeft / maxScrollX : 0,
    };
  }

  function postToParent(payload: Record<string, unknown>) {
    try {
      window.parent.postMessage({ __omniview: true, ...payload }, "*");
    } catch {
      // ignore if parent is unavailable
    }
  }

  /**
   * Builds a resilient CSS selector for an element so clicks & inputs can be
   * mirrored accurately across devices of different viewport sizes.
   */
  function buildSelector(el: Element): string | null {
    if (el.id) {
      return `#${CSS.escape(el.id)}`;
    }

    const testId = el.getAttribute("data-testid");
    if (testId) {
      return `[data-testid="${CSS.escape(testId)}"]`;
    }

    const tag = el.tagName.toLowerCase();
    if (tag === "a") {
      const href = el.getAttribute("href");
      if (href && href !== "#" && !href.startsWith("javascript:")) {
        return `a[href="${CSS.escape(href)}"]`;
      }
    }

    if (tag === "input" || tag === "textarea" || tag === "select") {
      const name = el.getAttribute("name");
      if (name) return `${tag}[name="${CSS.escape(name)}"]`;
      const placeholder = el.getAttribute("placeholder");
      if (placeholder) return `${tag}[placeholder="${CSS.escape(placeholder)}"]`;
    }

    const ariaLabel = el.getAttribute("aria-label");
    if (ariaLabel) {
      return `${tag}[aria-label="${CSS.escape(ariaLabel)}"]`;
    }

    // Structural nth-of-type fallback path
    const parts: string[] = [];
    let current: Element | null = el;
    let depth = 0;
    while (current && current.nodeType === 1 && depth < 6) {
      const currTag = current.tagName.toLowerCase();
      if (currTag === "html" || currTag === "body") break;
      if (current.id) {
        parts.unshift(`#${CSS.escape(current.id)}`);
        break;
      }
      const parent: Element | null = current.parentElement;
      if (!parent) {
        parts.unshift(currTag);
        break;
      }
      const siblings = Array.from(parent.children).filter(
        (c) => c.tagName === current!.tagName
      );
      const index = siblings.indexOf(current) + 1;
      parts.unshift(
        siblings.length > 1 ? `${currTag}:nth-of-type(${index})` : currTag
      );
      current = parent;
      depth++;
    }

    return parts.length > 0 ? parts.join(" > ") : null;
  }

  function findClickableTarget(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof Element)) return null;
    const interactive = target.closest(
      'a, button, [role="button"], [role="tab"], [role="menuitem"], summary, label, input, select, textarea'
    );
    return (interactive as HTMLElement | null) ?? (target as HTMLElement);
  }

  function checkUrlChange() {
    if (!instanceId || !syncInteractionsEnabled) return;
    if (isApplyingRemoteAction || isNavigatingRemotely) return;
    const current = window.location.href;
    if (normalizeHref(current) !== normalizeHref(lastReportedUrl)) {
      lastReportedUrl = current;
      postToParent({
        type: "OMNIVIEW_NAVIGATED",
        instanceId,
        url: current,
      });
    }
  }

  function startUrlWatcher() {
    if (urlPollInterval !== null) return;
    urlPollInterval = window.setInterval(checkUrlChange, 200);
  }

  function handleLocalScroll() {
    if (!instanceId || !syncScrollEnabled || isApplyingRemoteScroll) return;
    if (scrollRaf !== null) return;

    scrollRaf = window.requestAnimationFrame(() => {
      scrollRaf = null;
      if (!instanceId || !syncScrollEnabled || isApplyingRemoteScroll) return;
      const m = getScrollMetrics();
      postToParent({
        type: "OMNIVIEW_SCROLL_EVENT",
        instanceId,
        scrollTop: m.scrollTop,
        scrollLeft: m.scrollLeft,
        ratioY: m.ratioY,
        ratioX: m.ratioX,
      });
    });
  }

  function handleLocalClick(ev: MouseEvent) {
    if (!instanceId || !syncInteractionsEnabled || isApplyingRemoteAction) return;
    if (!ev.isTrusted) return;

    const target = findClickableTarget(ev.target);
    if (!target) return;

    const selector = buildSelector(target);
    const textHint = (target.textContent ?? "").trim().slice(0, 60);

    if (selector) {
      postToParent({
        type: "OMNIVIEW_CLICK_EVENT",
        instanceId,
        selector,
        tagName: target.tagName.toLowerCase(),
        textHint,
      });
    }

    // Also check shortly after click in case it triggered an SPA pushState
    window.setTimeout(checkUrlChange, 60);
    window.setTimeout(checkUrlChange, 250);
  }

  function handleLocalInput(ev: Event) {
    if (!instanceId || !syncInteractionsEnabled || isApplyingRemoteAction) return;
    if (!ev.isTrusted) return;

    const target = ev.target;
    if (
      !(
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      )
    ) {
      return;
    }
    if (target instanceof HTMLInputElement && target.type === "file") return;

    const selector = buildSelector(target);
    if (!selector) return;

    const isCheckable =
      target instanceof HTMLInputElement &&
      (target.type === "checkbox" || target.type === "radio");

    postToParent({
      type: "OMNIVIEW_INPUT_EVENT",
      instanceId,
      selector,
      value: target.value,
      checked: isCheckable ? target.checked : undefined,
    });
  }

  window.addEventListener("scroll", handleLocalScroll, { passive: true });
  window.addEventListener("resize", reportOverflowStatus, { passive: true });
  window.addEventListener("popstate", checkUrlChange);
  window.addEventListener("hashchange", checkUrlChange);
  document.addEventListener("click", handleLocalClick, true);
  document.addEventListener("input", handleLocalInput, true);
  document.addEventListener("change", handleLocalInput, true);

  function setRemoteActionGuard(ms = 140, syncUrlOnEnd = false) {
    isApplyingRemoteAction = true;
    if (remoteActionTimer !== null) window.clearTimeout(remoteActionTimer);
    remoteActionTimer = window.setTimeout(() => {
      isApplyingRemoteAction = false;
      remoteActionTimer = null;
      if (syncUrlOnEnd && !isNavigatingRemotely) {
        lastReportedUrl = window.location.href;
      }
    }, ms);
  }

  window.addEventListener("message", (event: MessageEvent) => {
    const data = event.data;
    if (!data || typeof data !== "object" || data.__omniview !== true) return;

    switch (data.type) {
      case "OMNIVIEW_HANDSHAKE": {
        if (typeof data.instanceId === "string") {
          instanceId = data.instanceId;
          syncScrollEnabled = Boolean(data.syncScroll);
          syncInteractionsEnabled = Boolean(data.syncInteractions);
          lastReportedUrl = window.location.href;
          startUrlWatcher();
          applyXray(Boolean(data.xrayMode));
          if (typeof data.customCss === "string" && data.customCss.trim()) {
            applyCustomCss(data.customCss);
          }
          if (data.rtlMode || (typeof data.textScale === "number" && data.textScale !== 1)) {
            applyA11yStress(Boolean(data.rtlMode), Number(data.textScale) || 1);
          }
          if (data.touchAudit) {
            applyTouchAudit(true);
          }
          window.setTimeout(() => {
            reportOverflowStatus();
            if (instanceId) {
              postToParent({
                type: "OMNIVIEW_AUDIT_RESULT",
                instanceId,
                audit: collectPageAudit(),
              });
            }
          }, 260);

          postToParent({
            type: "OMNIVIEW_READY",
            instanceId,
            href: window.location.href,
          });
        }
        break;
      }

      case "OMNIVIEW_SET_SYNC": {
        syncScrollEnabled = Boolean(data.syncScroll);
        if (typeof data.syncInteractions === "boolean") {
          syncInteractionsEnabled = data.syncInteractions;
        }
        break;
      }

      case "OMNIVIEW_SET_XRAY": {
        applyXray(Boolean(data.enabled));
        reportOverflowStatus();
        break;
      }

      case "OMNIVIEW_SET_TOUCH_AUDIT": {
        applyTouchAudit(Boolean(data.enabled));
        if (instanceId) {
          postToParent({
            type: "OMNIVIEW_AUDIT_RESULT",
            instanceId,
            audit: collectPageAudit(),
          });
        }
        break;
      }

      case "OMNIVIEW_SET_CUSTOM_CSS": {
        applyCustomCss(String(data.css ?? ""));
        break;
      }

      case "OMNIVIEW_SET_A11Y_STRESS": {
        applyA11yStress(Boolean(data.rtl), Number(data.textScale) || 1);
        window.setTimeout(reportOverflowStatus, 100);
        break;
      }

      case "OMNIVIEW_RUN_AUDIT": {
        if (instanceId) {
          postToParent({
            type: "OMNIVIEW_AUDIT_RESULT",
            instanceId,
            audit: collectPageAudit(),
          });
        }
        break;
      }

      case "OMNIVIEW_HISTORY_BACK": {
        window.history.back();
        window.setTimeout(checkUrlChange, 150);
        break;
      }

      case "OMNIVIEW_HISTORY_FORWARD": {
        window.history.forward();
        window.setTimeout(checkUrlChange, 150);
        break;
      }

      case "OMNIVIEW_APPLY_SCROLL": {
        if (!instanceId || data.sourceInstanceId === instanceId) return;
        const m = getScrollMetrics();
        const targetY =
          data.mode === "exact"
            ? Number(data.scrollTop) || 0
            : Math.round((Number(data.ratioY) || 0) * m.maxScrollY);
        const targetX =
          data.mode === "exact"
            ? Number(data.scrollLeft) || 0
            : Math.round((Number(data.ratioX) || 0) * m.maxScrollX);

        isApplyingRemoteScroll = true;
        if (remoteGuardTimer !== null) window.clearTimeout(remoteGuardTimer);

        window.scrollTo({
          top: targetY,
          left: targetX,
          behavior: "instant" as ScrollBehavior,
        });

        remoteGuardTimer = window.setTimeout(() => {
          isApplyingRemoteScroll = false;
          remoteGuardTimer = null;
        }, 80);
        break;
      }

      case "OMNIVIEW_APPLY_NAVIGATE": {
        if (!instanceId || data.sourceInstanceId === instanceId) return;
        const targetUrl = typeof data.url === "string" ? data.url : "";
        if (!targetUrl) return;
        if (normalizeHref(window.location.href) === normalizeHref(targetUrl)) {
          lastReportedUrl = window.location.href;
          isNavigatingRemotely = false;
          if (remoteNavTimer !== null) {
            window.clearTimeout(remoteNavTimer);
            remoteNavTimer = null;
          }
          postToParent({
            type: "OMNIVIEW_NAV_ACK",
            instanceId,
            url: window.location.href,
          });
          return;
        }

        let isSameDocHash = false;
        try {
          const cur = new URL(window.location.href);
          const tgt = new URL(targetUrl, window.location.href);
          isSameDocHash =
            cur.origin === tgt.origin &&
            cur.pathname === tgt.pathname &&
            cur.search === tgt.search &&
            cur.hash !== tgt.hash;
        } catch {
          isSameDocHash = false;
        }

        setRemoteActionGuard(500, true);
        if (isSameDocHash) {
          lastReportedUrl = targetUrl;
          window.location.assign(targetUrl);
          postToParent({
            type: "OMNIVIEW_NAV_ACK",
            instanceId,
            url: window.location.href,
          });
        } else {
          // Keep lastReportedUrl at the current URL and suppress checkUrlChange()
          // while the asynchronous full-document navigation is in flight so the
          // 200ms poller never echoes the old URL back to the simulator parent.
          isNavigatingRemotely = true;
          if (remoteNavTimer !== null) window.clearTimeout(remoteNavTimer);
          remoteNavTimer = window.setTimeout(() => {
            isNavigatingRemotely = false;
            remoteNavTimer = null;
            lastReportedUrl = window.location.href;
          }, 8000);
          postToParent({
            type: "OMNIVIEW_NAV_STARTED",
            instanceId,
            url: targetUrl,
          });
          window.location.assign(targetUrl);
        }
        break;
      }

      case "OMNIVIEW_APPLY_CLICK": {
        if (!instanceId || data.sourceInstanceId === instanceId) return;
        const selector = typeof data.selector === "string" ? data.selector : "";
        if (!selector) return;

        let el: HTMLElement | null = null;
        try {
          el = document.querySelector<HTMLElement>(selector);
        } catch {
          el = null;
        }

        // Fallback match by tagName + exact text if layout-specific selector differs
        if (!el && typeof data.tagName === "string" && typeof data.textHint === "string" && data.textHint.length > 0) {
          const candidates = Array.from(
            document.querySelectorAll<HTMLElement>(data.tagName)
          );
          el =
            candidates.find(
              (c) => (c.textContent ?? "").trim().slice(0, 60) === data.textHint
            ) ?? null;
        }

        if (el) {
          setRemoteActionGuard(400, true);
          el.click();
        }
        break;
      }

      case "OMNIVIEW_APPLY_INPUT": {
        if (!instanceId || data.sourceInstanceId === instanceId) return;
        const selector = typeof data.selector === "string" ? data.selector : "";
        if (!selector) return;

        let el: HTMLElement | null = null;
        try {
          el = document.querySelector<HTMLElement>(selector);
        } catch {
          el = null;
        }
        if (!el) return;

        setRemoteActionGuard(140);

        if (
          el instanceof HTMLInputElement &&
          (el.type === "checkbox" || el.type === "radio")
        ) {
          el.checked = Boolean(data.checked);
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        } else if (
          el instanceof HTMLInputElement ||
          el instanceof HTMLTextAreaElement ||
          el instanceof HTMLSelectElement
        ) {
          const proto =
            el instanceof HTMLInputElement
              ? HTMLInputElement.prototype
              : el instanceof HTMLTextAreaElement
                ? HTMLTextAreaElement.prototype
                : HTMLSelectElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
          if (setter) {
            setter.call(el, String(data.value ?? ""));
          } else {
            el.value = String(data.value ?? "");
          }
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }
        break;
      }

      case "OMNIVIEW_GET_METRICS": {
        const m = getScrollMetrics();
        postToParent({
          type: "OMNIVIEW_METRICS_RESPONSE",
          requestId: data.requestId,
          instanceId,
          metrics: m,
        });
        break;
      }

      case "OMNIVIEW_SCROLL_TO": {
        isApplyingRemoteScroll = true;
        if (remoteGuardTimer !== null) window.clearTimeout(remoteGuardTimer);

        const y = Math.max(0, Number(data.y) || 0);
        window.scrollTo({ top: y, left: 0, behavior: "instant" as ScrollBehavior });

        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            const m = getScrollMetrics();
            postToParent({
              type: "OMNIVIEW_SCROLL_TO_DONE",
              requestId: data.requestId,
              instanceId,
              actualY: m.scrollTop,
            });
            remoteGuardTimer = window.setTimeout(() => {
              isApplyingRemoteScroll = false;
              remoteGuardTimer = null;
            }, 80);
          });
        });
        break;
      }

      case "OMNIVIEW_DISPATCH_KEY": {
        const key = String(data.key || "");
        if (!key) return;
        const target = (document.activeElement as HTMLElement | null) ?? document.body;
        const ev = new KeyboardEvent("keydown", {
          key,
          bubbles: true,
          cancelable: true,
        });
        target?.dispatchEvent(ev);
        window.dispatchEvent(ev);

        if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(key)) {
          const focusables = Array.from(
            document.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => el.offsetParent !== null);

          if (focusables.length > 0) {
            const idx = focusables.indexOf(document.activeElement as HTMLElement);
            const nextIdx =
              key === "ArrowRight" || key === "ArrowDown"
                ? (idx + 1) % focusables.length
                : (idx - 1 + focusables.length) % focusables.length;
            focusables[nextIdx]?.focus();
            focusables[nextIdx]?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            });
          }
        } else if (key === "Enter" && target instanceof HTMLElement) {
          target.click();
        }
        break;
      }
    }
  });
})();
