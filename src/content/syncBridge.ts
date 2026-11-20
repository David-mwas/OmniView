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
  let remoteGuardTimer: number | null = null;
  let remoteActionTimer: number | null = null;
  let scrollRaf: number | null = null;
  let lastReportedUrl = window.location.href;
  let urlPollInterval: number | null = null;

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
  window.addEventListener("popstate", checkUrlChange);
  window.addEventListener("hashchange", checkUrlChange);
  document.addEventListener("click", handleLocalClick, true);
  document.addEventListener("input", handleLocalInput, true);
  document.addEventListener("change", handleLocalInput, true);

  function setRemoteActionGuard(ms = 140) {
    isApplyingRemoteAction = true;
    if (remoteActionTimer !== null) window.clearTimeout(remoteActionTimer);
    remoteActionTimer = window.setTimeout(() => {
      isApplyingRemoteAction = false;
      remoteActionTimer = null;
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

          postToParent({
            type: "OMNIVIEW_READY",
            instanceId,
            href: window.location.href,
          });

          // If this iframe just completed an MPA navigation to a different URL than the simulator's current URL, notify parent!
          if (
            syncInteractionsEnabled &&
            typeof data.currentUrl === "string" &&
            data.currentUrl.length > 0 &&
            normalizeHref(window.location.href) !== normalizeHref(data.currentUrl)
          ) {
            postToParent({
              type: "OMNIVIEW_NAVIGATED",
              instanceId,
              url: window.location.href,
            });
          }
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
          return;
        }
        setRemoteActionGuard(500);
        lastReportedUrl = targetUrl;
        window.location.assign(targetUrl);
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
          setRemoteActionGuard(180);
          el.click();
          // Sync lastReportedUrl after SPA click so we don't bounce an echo
          window.setTimeout(() => {
            lastReportedUrl = window.location.href;
          }, 120);
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
