(() => {
  "use strict";

  const LS_KEY_DAYS = "ytAgeFilter.maxDays";
  const LS_KEY_WHITELIST = "ytAgeFilter.whitelistChannels";
  const LS_KEY_DEBUG = "ytAgeFilter.debugOverlay";
  const LS_KEY_HIDE_SHORTS = "ytAgeFilter.hideShorts";
  const LS_KEY_ENABLED = "ytAgeFilter.enabled";
  const DEFAULT_MAX_DAYS = 30;
  const DEFAULT_HIDE_SHORTS = true;
  const PROCESSED_ATTR = "data-yt-age-filtered";
  const RETRIES_ATTR = "data-yt-age-retries";
  let generation = 0;
  const AGE_RENDERER_SELECTOR = [
    "ytd-rich-item-renderer",
    "ytd-rich-grid-media",
    "ytd-video-renderer",
    "ytd-compact-video-renderer",
    "ytd-grid-video-renderer",
    "ytd-playlist-video-renderer",
    "ytd-episode-renderer"
  ].join(",");
  const RENDERER_SELECTOR = [
    AGE_RENDERER_SELECTOR,
    "ytd-reel-item-renderer",
    "ytd-rich-section-renderer",
    "ytd-rich-shelf-renderer",
    "ytd-shelf-renderer",
    "ytd-horizontal-card-list-renderer",
    "ytd-reel-shelf-renderer",
    "ytd-item-section-renderer",
    "grid-shelf-view-model",
    "ytm-shorts-lockup-view-model",
    "ytm-shorts-lockup-view-model-v2"
  ].join(",");
  const SHORTS_STYLE_ID = "yt-age-filter-shorts-style";
  const SHORTS_LINK_SELECTOR = 'a[href="/shorts"], a[href^="/shorts/"], a[href^="/shorts?"], a[href*="youtube.com/shorts"]';
  const SHORTS_NAV_SELECTOR = [
    "ytd-guide-entry-renderer",
    "ytd-mini-guide-entry-renderer",
    "ytd-chip-cloud-chip-renderer",
    "yt-chip-cloud-chip-renderer"
  ].join(",");
  const SHORTS_SURFACE_SELECTOR = [
    "ytd-reel-item-renderer",
    "ytd-reel-shelf-renderer",
    "ytd-rich-section-renderer",
    "ytd-rich-shelf-renderer",
    "ytd-shelf-renderer",
    "ytd-horizontal-card-list-renderer",
    "ytd-item-section-renderer",
    "grid-shelf-view-model",
    "ytm-shorts-lockup-view-model",
    "ytm-shorts-lockup-view-model-v2",
    "ytd-rich-item-renderer",
    "ytd-video-renderer",
    "ytd-compact-video-renderer",
    "ytd-grid-video-renderer"
  ].join(",");
  const SHORTS_CSS = `
    ytd-reel-item-renderer,
    ytd-reel-shelf-renderer,
    ytm-shorts-lockup-view-model,
    ytm-shorts-lockup-view-model-v2,
    ytd-guide-entry-renderer:has(a[href="/shorts"]),
    ytd-mini-guide-entry-renderer:has(a[href="/shorts"]),
    ytd-chip-cloud-chip-renderer:has(a[href="/shorts"]),
    yt-chip-cloud-chip-renderer:has(a[href="/shorts"]) {
      display: none !important;
    }
  `;

  const getStorage = (keys) => new Promise(res => chrome.storage.local.get(keys, res));
  const setStorage = (obj)   => new Promise(res => chrome.storage.local.set(obj, res));

  async function getMaxDays() {
    const s = await getStorage([LS_KEY_DAYS]);
    const v = parseInt(s[LS_KEY_DAYS], 10);
    return Number.isFinite(v) && v > 0 ? v : DEFAULT_MAX_DAYS;
  }
  async function setMaxDays(days) { await setStorage({ [LS_KEY_DAYS]: String(days) }); }

  async function getWhitelist() {
    const s = await getStorage([LS_KEY_WHITELIST]);
    try {
      if (!s[LS_KEY_WHITELIST]) return new Set();
      return new Set(JSON.parse(s[LS_KEY_WHITELIST]));
    } catch { return new Set(); }
  }
  async function setWhitelist(set) { await setStorage({ [LS_KEY_WHITELIST]: JSON.stringify([...set]) }); }

  async function getDebug() {
    const s = await getStorage([LS_KEY_DEBUG]);
    return Boolean(s[LS_KEY_DEBUG]);
  }
  async function getHideShorts() {
    const s = await getStorage([LS_KEY_HIDE_SHORTS]);
    return s[LS_KEY_HIDE_SHORTS] == null ? DEFAULT_HIDE_SHORTS : Boolean(s[LS_KEY_HIDE_SHORTS]);
  }
  async function setHideShorts(v) {
    await setStorage({ [LS_KEY_HIDE_SHORTS]: Boolean(v) });
  }
  async function getEnabled() {
    const s = await getStorage([LS_KEY_ENABLED]);
    return s[LS_KEY_ENABLED] == null ? true : Boolean(s[LS_KEY_ENABLED]);
  }
  async function setEnabled(v) {
    await setStorage({ [LS_KEY_ENABLED]: Boolean(v) });
  }

  // UI control
  function makeControl() {
    const existing = document.getElementById("yt-age-filter-control");
    if (existing) return existing;

    const wrap = document.createElement("div");
    wrap.id = "yt-age-filter-control";
    Object.assign(wrap.style, {
      position: "fixed",
      left: "12px",
      bottom: "12px",
      zIndex: 2147483647,
      padding: "6px 10px",
      background: "rgba(0,0,0,0.76)",
      color: "#fff",
      fontSize: "12px",
      borderRadius: "8px",
      backdropFilter: "blur(4px)",
      userSelect: "none",
      display: "flex",
      gap: "8px",
      alignItems: "center",
      cursor: "default"
    });
    wrap.style.maxWidth = "calc(100vw - 44px)";
    wrap.style.flexWrap = "wrap";

    const label = document.createElement("span");
    label.textContent = "YT Age Filter";
    label.title = `Version ${chrome.runtime.getManifest().version}`;

    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.step = "1";
    input.style.width = "64px";
    input.title = "Max video age (days)";

    const applyBtn = document.createElement("button");
    applyBtn.textContent = "Apply";
    styleBtn(applyBtn);

    const info = document.createElement("span");
    info.textContent = "days";
    info.style.opacity = "0.8";

    const wlBtn = document.createElement("button");
    wlBtn.textContent = "Whitelist";
    styleBtn(wlBtn);
    wlBtn.title = "Always show current channel’s videos";

    const rescanBtn = document.createElement("button");
    rescanBtn.textContent = "Rescan";
    styleBtn(rescanBtn);

    const pauseBtn = document.createElement("button");
    pauseBtn.id = "yt-age-filter-pause";
    styleBtn(pauseBtn);
    pauseBtn.title = "Pause or start all filtering";

    const shortsBtn = document.createElement("button");
    shortsBtn.id = "yt-age-filter-hide-shorts";
    shortsBtn.textContent = "Hide Shorts";
    styleBtn(shortsBtn);
    shortsBtn.title = "Hide YouTube Shorts and Shorts shelves";

    const counter = document.createElement("span");
    counter.id = "yt-age-filter-counter";
    counter.textContent = "Hidden: 0";
    counter.style.opacity = "0.95";

    wrap.append(label, input, info, applyBtn, wlBtn, rescanBtn, pauseBtn, shortsBtn, counter);
    document.body.appendChild(wrap);

    getMaxDays().then(d => input.value = String(d));
    getHideShorts().then(on => setToggleButtonState(shortsBtn, on));
    getEnabled().then(on => setPauseButtonState(pauseBtn, on));

    applyBtn.addEventListener("click", async () => {
      const val = parseInt(input.value, 10);
      if (!Number.isFinite(val) || val < 1) return alert("Enter a positive integer.");
      await setMaxDays(val);
      runFullSweep(true);
    });

    wlBtn.addEventListener("click", async () => {
      const channelId = getCurrentChannelIdFromDOM();
      if (!channelId) return alert("No channel detected on this page.");
      const wl = await getWhitelist();
      if (isWhitelisted(channelId, wl)) { removeWhitelistEntry(channelId, wl); alert("Whitelist: removed"); }
      else { wl.add(channelId); alert("Whitelist: added"); }
      await setWhitelist(wl);
      runFullSweep(true);
    });

    rescanBtn.addEventListener("click", () => runFullSweep(true));

    pauseBtn.addEventListener("click", async () => {
      const enabled = !(await getEnabled());
      await setEnabled(enabled);
      setPauseButtonState(pauseBtn, enabled);
      runFullSweep(true);
    });

    shortsBtn.addEventListener("click", async () => {
      const on = !(await getHideShorts());
      await setHideShorts(on);
      setToggleButtonState(shortsBtn, on);
      runFullSweep(true);
    });

    return wrap;
  }

  function updateHiddenCounter(n, replace=false) {
    const el = document.getElementById("yt-age-filter-counter");
    if (!el) return;
    if (replace) el.textContent = `Hidden: ${n}`;
    else {
      const cur = parseInt((el.textContent || "0").replace(/\D+/g,"") || "0", 10);
      el.textContent = `Hidden: ${cur + n}`;
    }
  }

  function styleBtn(btn) {
    Object.assign(btn.style, {
      border: "1px solid rgba(255,255,255,0.3)",
      background: "transparent",
      color: "#fff",
      padding: "2px 8px",
      borderRadius: "6px",
      cursor: "pointer"
    });
  }

  function setToggleButtonState(btn, on) {
    btn.setAttribute("aria-pressed", String(on));
    btn.style.borderColor = on ? "#6cf" : "rgba(255,255,255,0.3)";
    btn.style.background = on ? "rgba(102,204,255,0.16)" : "transparent";
  }

  function setPauseButtonState(btn, enabled) {
    btn.textContent = enabled ? "Pause" : "Start";
    btn.setAttribute("aria-pressed", String(!enabled));
    btn.style.borderColor = enabled ? "rgba(255,255,255,0.3)" : "#ffb74d";
    btn.style.background = enabled ? "transparent" : "rgba(255,183,77,0.2)";
  }

  const DAYS_PER = { day: 1, week: 7, month: 30, year: 365, hour: 1/24, minute: 1/1440, second: 1/86400 };

  function publishedTextToDays(text) {
    if (!text) return null;
    const t = text.toLowerCase().trim();
    if (t.includes("live now")) return 0;

    const re = /(premiered|streamed)?\s*(about\s*)?(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago/;
    const m = t.match(re);
    if (m) {
      const count = parseInt(m[3], 10);
      const unit = m[4];
      const per = DAYS_PER[unit] || null;
      return per ? count * per : null;
    }

    const wordCount = t.match(/(a|an|one)\s+(second|minute|hour|day|week|month|year)\s+ago/);
    if (wordCount) {
      const per = DAYS_PER[wordCount[2]] || null;
      return per || null;
    }

    if (t.includes("yesterday")) return 1;
    if (t.includes("today") || t.includes("just now")) return 0;

    const compact = t.match(/(?:^|\s)(\d+)\s*(mo|sec|min|hr|s|m|h|d|w|y)\s+ago\b/);
    if (compact) {
      const units = { mo: 30, sec: 1/86400, min: 1/1440, hr: 1/24,
        s: 1/86400, m: 1/1440, h: 1/24, d: 1, w: 7, y: 365 };
      return Number(compact[1]) * units[compact[2]];
    }
    // Unrecognized metadata is not evidence that a video is old.
    return null;
  }

  // Try hard to find a publish-time string
  function extractPublishedText(rendererEl) {
    // New YouTube cards abbreviate visible dates but retain full aria labels.
    for (const metadata of rendererEl.querySelectorAll(
      '.ytContentMetadataViewModelMetadataText, #metadata-line span, .metadata-line span, .inline-metadata-item'
    )) {
      for (const text of [metadata.getAttribute("aria-label"), metadata.textContent]) {
        if (publishedTextToDays(text) !== null) return text.trim();
      }
    }
    // 1) Typical metadata line
    let spans = rendererEl.querySelectorAll(
      "#metadata-line span, .metadata-line span, .inline-metadata-item, ytd-video-meta-block .style-scope.ytd-video-meta-block"
    );
    for (const s of spans) {
      const txt = s.textContent?.trim();
      if (!txt) continue;
      const low = txt.toLowerCase();
      if (low.includes("ago") || low.includes("premiered") || low.includes("streamed") || low.includes("live now")) {
        return txt;
      }
    }
    // 2) aria-label on title link
    const titleA = rendererEl.querySelector('a#video-title[aria-label], a#video-title-link[aria-label]');
    if (titleA?.ariaLabel) {
      const low = titleA.ariaLabel.toLowerCase();
      if (low.includes("ago") || low.includes("live now")) return titleA.ariaLabel;
    }
    // 3) Full-text scan fallback (coarse but effective on Home)
    const txt = rendererEl.innerText || rendererEl.textContent || "";
    if (txt) {
      const idx = txt.toLowerCase().indexOf("ago");
      if (idx > -1) {
        const windowStart = Math.max(0, idx - 24);
        const windowEnd = Math.min(txt.length, idx + 24);
        const slice = txt.slice(windowStart, windowEnd);
        if (/\d/.test(slice)) return slice;
      }
    }
    return null;
  }

  function getCurrentChannelIdFromDOM() {
    const currentKey = getChannelKeyFromUrl(location.href);
    if (currentKey) return currentKey;
    const link = document.querySelector('link[rel="canonical"]');
    const canonicalId = getChannelKeyFromUrl(link?.href);
    if (canonicalId) return canonicalId;

    const owner = document.querySelector(
      'ytd-video-owner-renderer a[href*="/channel/"], ytd-video-owner-renderer a[href^="/@"]'
    );
    return getChannelKeyFromUrl(owner?.href);
  }

  function getRendererChannelId(rendererEl) {
    const a = rendererEl.querySelector('a[href*="/channel/"], a[href^="/@"], a[href*="youtube.com/@"]');
    return getChannelKeyFromUrl(a?.href);
  }

  function getRendererChannelKeys(rendererEl) {
    const keys = [];
    const channelId = getRendererChannelId(rendererEl);
    if (channelId) keys.push(channelId);

    const channelLink = rendererEl.querySelector(
      '#channel-name a, ytd-channel-name a, a[href*="/channel/"], a[href^="/@"]'
    );
    const channelName = channelLink?.textContent?.trim();
    if (channelName) keys.push(`name:${channelName.toLowerCase()}`);
    // Channel video grids often omit the channel link on individual cards.
    if (!channelId && /^\/(?:@[^/]+|channel\/[^/]+)\/(?:videos|streams|shorts)\/?$/.test(location.pathname)) {
      const currentKey = getChannelKeyFromUrl(location.href);
      if (currentKey) keys.push(currentKey);
    }
    return keys;
  }

  function getChannelKeyFromUrl(url) {
    if (!url) return null;

    try {
      const parsed = new URL(url, location.origin);
      const path = parsed.pathname;
      const channel = path.match(/^\/channel\/([^/?#]+)/);
      if (channel) return `channel:${channel[1]}`;

      const handle = path.match(/^\/@([^/?#]+)/);
      if (handle) return `handle:${handle[1].toLowerCase()}`;
    } catch {
      return null;
    }

    return null;
  }

  function isWhitelisted(channelKey, whitelist) {
    if (whitelist.has(channelKey)) return true;

    const legacyKey = channelKey.replace(/^(channel|handle):/, "");
    return legacyKey !== channelKey && whitelist.has(legacyKey);
  }

  function removeWhitelistEntry(channelKey, whitelist) {
    whitelist.delete(channelKey);
    whitelist.delete(channelKey.replace(/^(channel|handle):/, ""));
  }

  function isShortsRenderer(rendererEl) {
    if (!rendererEl) return false;

    const tagName = rendererEl.localName || "";
    // A mixed shelf must never disappear because one child happens to be a Short.
    if (isShelfRenderer(tagName) && rendererEl.querySelector('a[href^="/watch?"]')) return false;
    if (tagName === "ytd-reel-item-renderer" ||
        tagName === "ytd-reel-shelf-renderer" ||
        tagName === "ytm-shorts-lockup-view-model" ||
        tagName === "ytm-shorts-lockup-view-model-v2") return true;
    if (rendererEl.matches?.(SHORTS_LINK_SELECTOR)) return true;
    if (rendererEl.querySelector?.(SHORTS_LINK_SELECTOR)) return true;

    const text = (rendererEl.textContent || "").toLowerCase();
    if (/(^|\s)#shorts(\s|$)/i.test(text)) return true;

    if (isShelfRenderer(tagName)) {
      return hasShortsHeading(rendererEl);
    }

    return false;
  }

  function isShelfRenderer(tagName) {
    return tagName === "ytd-rich-section-renderer" ||
      tagName === "ytd-rich-shelf-renderer" ||
      tagName === "ytd-shelf-renderer" ||
      tagName === "ytd-horizontal-card-list-renderer" ||
      tagName === "ytd-item-section-renderer" ||
      tagName === "grid-shelf-view-model";
  }

  function hasShortsHeading(el) {
    const headingSelectors = [
      "#title",
      "#title-text",
      "h2",
      "h3",
      "yt-formatted-string"
    ].join(",");

    for (const heading of el.querySelectorAll?.(headingSelectors) || []) {
      if ((heading.textContent || "").trim().toLowerCase() === "shorts") return true;
    }

    return false;
  }

  function syncShortsStyle(hideShorts) {
    let style = document.getElementById(SHORTS_STYLE_ID);
    if (!hideShorts) {
      style?.remove();
      return;
    }

    if (!style) {
      style = document.createElement("style");
      style.id = SHORTS_STYLE_ID;
      document.documentElement.appendChild(style);
    }
    style.textContent = SHORTS_CSS;
  }

  function hideShortsSurfaces(hideShorts) {
    syncShortsStyle(hideShorts);

    document.querySelectorAll('[data-yt-age-hidden-reason="shorts"], [data-yt-age-shorts-nav="1"]').forEach(el => {
      if (!hideShorts) {
        el.style.removeProperty("display");
        el.removeAttribute("data-yt-age-hidden");
        el.removeAttribute("data-yt-age-hidden-reason");
        el.removeAttribute("data-yt-age-shorts-nav");
        el.removeAttribute(PROCESSED_ATTR);
      }
    });

    document.querySelectorAll(SHORTS_LINK_SELECTOR).forEach(link => {
      const target = link.closest(SHORTS_NAV_SELECTOR);
      if (target) {
        target.style.display = hideShorts ? "none" : "";
        target.setAttribute("data-yt-age-shorts-nav", hideShorts ? "1" : "0");
      }
    });

    if (!hideShorts) return 0;

    let hidden = 0;
    document.querySelectorAll(SHORTS_SURFACE_SELECTOR).forEach(el => {
      if (!isShortsRenderer(el)) return;
      if (el.style.display !== "none") hidden += 1;
      el.style.display = "none";
      el.setAttribute("data-yt-age-hidden", "1");
      el.setAttribute("data-yt-age-hidden-reason", "shorts");
      el.setAttribute(PROCESSED_ATTR, "1");
    });

    return hidden;
  }

  function addDebugBadge(rendererEl, info) {
    const started = generation;
    rendererEl.querySelector(".yt-age-debug-badge")?.remove();
    getDebug().then(on => {
      if (!on || started !== generation) return;
      const b = document.createElement("div");
      b.className = "yt-age-debug-badge";
      Object.assign(b.style, {
        position: "absolute",
        top: "6px",
        left: "6px",
        zIndex: 2147480000,
        background: "rgba(20,20,20,0.85)",
        color: "#fff",
        fontSize: "10px",
        padding: "2px 4px",
        borderRadius: "4px",
        pointerEvents: "none"
      });
      b.textContent = info;
      // Place inside thumbnail container if present for better visibility
      const thumb = rendererEl.querySelector("ytd-thumbnail") || rendererEl;
      thumb.style.position = thumb.style.position || "relative";
      thumb.appendChild(b);
    });
  }

  function scheduleRetry(el) {
    const retries = parseInt(el.getAttribute(RETRIES_ATTR) || "0", 10);
    if (retries >= 10) return; // try a bit more now
    el.setAttribute(RETRIES_ATTR, String(retries + 1));
    const delay = 120 + retries * 180;
    setTimeout(() => {
      evaluateRenderer(el, true).then((hidden) => {
        if (hidden) updateHiddenCounter(hidden);
      });
    }, delay);
  }

  async function evaluateRenderer(rendererEl, fromRetry=false) {
    const started = generation;
    if (!rendererEl) return 0;
    if (rendererEl.getAttribute(PROCESSED_ATTR) === "1") return 0;

    if (!(await getEnabled())) return 0;

    const [maxDays, whitelist, hideShorts] = await Promise.all([getMaxDays(), getWhitelist(), getHideShorts()]);
    if (started !== generation || !rendererEl.isConnected) return 0;
    if (rendererEl.hasAttribute("data-yt-age-hidden")) {
      rendererEl.style.removeProperty("display");
      rendererEl.removeAttribute("data-yt-age-hidden");
      rendererEl.removeAttribute("data-yt-age-hidden-reason");
    }

    if (hideShorts && isShortsRenderer(rendererEl)) {
      rendererEl.style.display = "none";
      rendererEl.setAttribute("data-yt-age-hidden", "1");
      rendererEl.setAttribute("data-yt-age-hidden-reason", "shorts");
      rendererEl.setAttribute(PROCESSED_ATTR, "1");
      addDebugBadge(rendererEl, "shorts");
      return 1;
    }

    // Section wrappers are Shorts surfaces, but are not individual video cards.
    if (!rendererEl.matches?.(AGE_RENDERER_SELECTOR)) return 0;

    const channelKeys = getRendererChannelKeys(rendererEl);
    if (channelKeys.some(key => isWhitelisted(key, whitelist))) {
      rendererEl.style.removeProperty("display");
      rendererEl.setAttribute(PROCESSED_ATTR, "1");
      addDebugBadge(rendererEl, "whitelisted");
      return 0;
    }

    const pubText = extractPublishedText(rendererEl);
    if (pubText == null) {
      addDebugBadge(rendererEl, "no date yet");
      scheduleRetry(rendererEl);
      return 0;
    }

    const days = publishedTextToDays(pubText);
    addDebugBadge(rendererEl, `age≈${days?.toFixed ? days.toFixed(2) : days}`);

    if (days !== null && days > maxDays) {
      rendererEl.style.display = "none";
      rendererEl.setAttribute("data-yt-age-hidden", "1");
      rendererEl.setAttribute("data-yt-age-hidden-reason", "age");
      rendererEl.setAttribute(PROCESSED_ATTR, "1");
      return 1;
    } else {
      rendererEl.style.removeProperty("display");
      rendererEl.removeAttribute("data-yt-age-hidden");
      rendererEl.removeAttribute("data-yt-age-hidden-reason");
      rendererEl.setAttribute(PROCESSED_ATTR, "1");
      return 0;
    }
  }

  async function runFullSweep(resetCounter=false) {
    if (resetCounter) generation += 1;
    const started = generation;
    const [enabled, hideShortsSetting] = await Promise.all([getEnabled(), getHideShorts()]);
    if (started !== generation) return;
    const hideShorts = enabled && hideShortsSetting;
    syncShortsStyle(hideShorts);

    const nodes = document.querySelectorAll(RENDERER_SELECTOR);
    let hidden = 0;
    const tasks = [];
    nodes.forEach(n => {
      if (resetCounter) {
        if (n.hasAttribute("data-yt-age-hidden")) n.style.removeProperty("display");
        n.removeAttribute(PROCESSED_ATTR);
        n.removeAttribute(RETRIES_ATTR);
        n.removeAttribute("data-yt-age-hidden");
        n.removeAttribute("data-yt-age-hidden-reason");
        n.querySelector(".yt-age-debug-badge")?.remove();
      }
      if (enabled) tasks.push(evaluateRenderer(n).then(v => hidden += v));
    });
    await Promise.allSettled(tasks);
    if (started !== generation) return;
    hidden += hideShortsSurfaces(hideShorts);

    updateHiddenCounter(document.querySelectorAll('[data-yt-age-hidden="1"]').length, true);

    // Schedule a couple of follow-up sweeps to catch late metadata
    if (resetCounter && enabled) {
      setTimeout(() => runFullSweep(false), 600);
      setTimeout(() => runFullSweep(false), 1500);
    }
  }

  let mo;
  let mutationTimer;
  function attachObserver() {
    if (mo) mo.disconnect();
    mo = new MutationObserver(mutations => {
      const added = new Set();
      for (const m of mutations) {
        const target = m.target.nodeType === 1 ? m.target : m.target.parentElement;
        if (target?.closest('#yt-age-filter-control, .yt-age-debug-badge, #yt-age-filter-shorts-style')) continue;
        if (m.type === 'childList' && [...m.addedNodes, ...m.removedNodes].length &&
            [...m.addedNodes, ...m.removedNodes].every(n => n.nodeType === 1 && n.matches('.yt-age-debug-badge'))) continue;
        const owner = target?.closest(RENDERER_SELECTOR);
        if (owner) {
          owner.removeAttribute(PROCESSED_ATTR);
          owner.removeAttribute(RETRIES_ATTR);
          added.add(owner);
        }
        for (const node of m.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (isRenderer(node)) {
            added.add(node);
          } else {
            const nested = node.querySelectorAll?.(RENDERER_SELECTOR);
            nested?.forEach(el => added.add(el));
          }
        }
      }
      if (added.size) {
        clearTimeout(mutationTimer);
        mutationTimer = setTimeout(() => runFullSweep(false), 150);
      }
    });
    mo.observe(document.documentElement, {
      childList: true, characterData: true, subtree: true,
      attributes: true, attributeFilter: ['href', 'aria-label']
    });
  }

  function isRenderer(el) {
    return el.matches?.(RENDERER_SELECTOR);
  }

  window.addEventListener("yt-navigate-finish", () => setTimeout(() => runFullSweep(true), 140));
  window.addEventListener("popstate", () => setTimeout(() => runFullSweep(true), 160));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && (LS_KEY_DAYS in changes || LS_KEY_WHITELIST in changes || LS_KEY_DEBUG in changes || LS_KEY_HIDE_SHORTS in changes || LS_KEY_ENABLED in changes)) {
      if (LS_KEY_HIDE_SHORTS in changes) {
        const shortsBtn = document.getElementById("yt-age-filter-hide-shorts");
        if (shortsBtn) setToggleButtonState(shortsBtn, Boolean(changes[LS_KEY_HIDE_SHORTS].newValue));
      }
      if (LS_KEY_ENABLED in changes) {
        const pauseBtn = document.getElementById("yt-age-filter-pause");
        if (pauseBtn) setPauseButtonState(pauseBtn, Boolean(changes[LS_KEY_ENABLED].newValue));
      }
      runFullSweep(true);
    }
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "yt-age-filter:get-current-channel") return false;
    const key = getCurrentChannelIdFromDOM();
    const owner = location.pathname === '/watch'
      ? document.querySelector('ytd-video-owner-renderer #channel-name a')
      : document.querySelector('ytd-page-header-renderer h1, #channel-header-container #channel-name');
    sendResponse({ key, name: owner?.textContent?.trim() || "" });
    return false;
  });

  function boot() {
    makeControl();
    attachObserver();
    runFullSweep(true);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
