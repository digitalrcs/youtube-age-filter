(() => {
  "use strict";

  const KEYS = {
    days: "ytAgeFilter.maxDays",
    debug: "ytAgeFilter.debugOverlay",
    hideShorts: "ytAgeFilter.hideShorts",
    enabled: "ytAgeFilter.enabled",
    whitelist: "ytAgeFilter.whitelistChannels"
  };
  const get = (keys) => new Promise(resolve => chrome.storage.local.get(keys, resolve));
  const set = (value) => new Promise(resolve => chrome.storage.local.set(value, resolve));
  let whitelist = new Set();

  function parseWhitelist(raw) {
    try { return new Set(raw ? JSON.parse(raw) : []); }
    catch { return new Set(); }
  }

  function normalizeChannel(value) {
    const input = value.trim();
    if (!input) return null;
    try {
      const pathInput = input.includes("://") ? input : /^(?:www\.)?youtube\.com\//i.test(input)
        ? `https://${input}` : `https://www.youtube.com/${input.replace(/^\//, "")}`;
      const url = new URL(pathInput);
      if (!['youtube.com', 'www.youtube.com'].includes(url.hostname)) return null;
      const channel = url.pathname.match(/^\/channel\/([^/?#]+)/i);
      if (channel) return `channel:${channel[1]}`;
      const handle = url.pathname.match(/^\/@([^/?#]+)/i);
      if (handle) return `handle:${handle[1].toLowerCase()}`;
    } catch { /* Fall through to text parsing. */ }
    if (/^UC[\w-]{20,}$/i.test(input)) return `channel:${input}`;
    if (input.startsWith("@")) return `handle:${input.slice(1).toLowerCase()}`;
    return `name:${input.toLowerCase()}`;
  }

  function displayEntry(entry) {
    if (entry.startsWith("handle:")) return `@${entry.slice(7)}`;
    if (entry.startsWith("channel:")) return entry.slice(8);
    if (entry.startsWith("name:")) return entry.slice(5);
    return entry;
  }

  function showStatus(message) {
    document.getElementById("status").textContent = message;
  }

  async function saveWhitelist(message) {
    await set({ [KEYS.whitelist]: JSON.stringify([...whitelist]) });
    renderWhitelist();
    showStatus(message);
  }

  function renderWhitelist() {
    const list = document.getElementById("whitelist");
    list.replaceChildren();
    [...whitelist].sort().forEach(entry => {
      const item = document.createElement("li");
      const label = document.createElement("span");
      label.textContent = displayEntry(entry);
      label.title = entry;
      const remove = document.createElement("button");
      remove.className = "delete";
      remove.textContent = "x";
      remove.title = `Remove ${displayEntry(entry)}`;
      remove.setAttribute("aria-label", remove.title);
      remove.addEventListener("click", () => {
        whitelist.delete(entry);
        saveWhitelist("Channel removed.");
      });
      item.append(label, remove);
      list.appendChild(item);
    });
    if (!whitelist.size) {
      const empty = document.createElement("li");
      empty.textContent = "No channels added.";
      list.appendChild(empty);
    }
  }

  async function addTypedChannel() {
    const input = document.getElementById("channelInput");
    const entry = normalizeChannel(input.value);
    if (!entry) return showStatus("Enter a channel first.");
    whitelist.add(entry);
    input.value = "";
    await saveWhitelist("Channel added.");
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const st = await get(Object.values(KEYS));
    document.getElementById("days").value = st[KEYS.days] || 30;
    document.getElementById("hideShorts").checked = st[KEYS.hideShorts] == null ? true : Boolean(st[KEYS.hideShorts]);
    document.getElementById("debugOverlay").checked = Boolean(st[KEYS.debug]);
    document.getElementById("enabled").checked = st[KEYS.enabled] == null ? true : Boolean(st[KEYS.enabled]);
    whitelist = parseWhitelist(st[KEYS.whitelist]);
    renderWhitelist();
  });

  document.getElementById("save").addEventListener("click", async () => {
    const days = parseInt(document.getElementById("days").value, 10);
    if (!Number.isFinite(days) || days < 1) return showStatus("Enter a positive number of days.");
    await set({
      [KEYS.days]: String(days),
      [KEYS.hideShorts]: document.getElementById("hideShorts").checked,
      [KEYS.debug]: document.getElementById("debugOverlay").checked,
      [KEYS.enabled]: document.getElementById("enabled").checked
    });
    showStatus(document.getElementById("enabled").checked ? "Settings saved. Filter started." : "Settings saved. Filter paused.");
  });

  document.getElementById("addChannel").addEventListener("click", addTypedChannel);
  document.getElementById("channelInput").addEventListener("keydown", event => {
    if (event.key === "Enter") addTypedChannel();
  });

  document.getElementById("currentChannel").addEventListener("click", async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return showStatus("No active YouTube tab found.");
      const result = await chrome.tabs.sendMessage(tab.id, { type: "yt-age-filter:get-current-channel" });
      const entry = result?.key;
      if (!entry) return showStatus("Open a channel or video page first.");
      whitelist.add(entry);
      await saveWhitelist(`Added ${result.name || displayEntry(entry)}.`);
    } catch {
      showStatus("Reload the YouTube tab, then try again.");
    }
  });
})();
