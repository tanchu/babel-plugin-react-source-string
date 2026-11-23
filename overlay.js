/*! Overlay for react-source-string plugins: Alt (Option) + hover shows path:line, Alt + click copies it,
 * window.__REACT_SOURCE__ for agents. Dev only: does nothing outside a browser or in production builds.
 * Generated from vite-plugin-react-source-string src/client.ts, keep the copies in sync. */
(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (typeof process !== "undefined" && process.env && process.env.NODE_ENV === "production") return;
  (function installReactSourceClient(attr) {
  if (typeof window === "undefined" || window.__REACT_SOURCE__) return;
  const selector = `[${attr}]`;
  const resolve = (target) => typeof target === "string" ? document.querySelector(target) : target;
  const tagged = (target) => resolve(target)?.closest(selector) ?? null;
  const textOf = (el) => {
    const text = (el.innerText ?? el.textContent ?? "").replace(/\s+/g, " ").trim();
    return text.length > 60 ? `${text.slice(0, 57)}...` : text;
  };
  const stack = (target) => {
    const out = [];
    for (let el = tagged(target); el; el = el.parentElement?.closest(selector) ?? null) {
      const source = el.getAttribute(attr);
      if (source && !out.includes(source)) out.push(source);
    }
    return out;
  };
  const describe = (target) => {
    const el = tagged(target);
    if (!el) return null;
    const [source, ...parents] = stack(el);
    const text = textOf(el);
    const lines = [`${source} <${el.tagName.toLowerCase()}>${text ? ` "${text}"` : ""}`];
    if (parents.length) lines.push(`inside: ${parents.slice(0, 4).join(" \u2190 ")}`);
    return lines.join("\n");
  };
  const api = {
    of: (target) => tagged(target)?.getAttribute(attr) ?? null,
    stack,
    describe,
    find(text) {
      const needle = text.toLowerCase();
      const matches = [...document.querySelectorAll(selector)].filter(
        (el) => textOf(el).toLowerCase().includes(needle)
      );
      return matches.filter((el) => !matches.some((other) => other !== el && el.contains(other))).map((el) => ({ source: el.getAttribute(attr) ?? "", tag: el.tagName.toLowerCase(), text: textOf(el) }));
    }
  };
  window.__REACT_SOURCE__ = api;
  const box = document.createElement("div");
  const label = document.createElement("div");
  box.setAttribute("aria-hidden", "true");
  box.style.cssText = "position:fixed;z-index:2147483647;pointer-events:none;display:none;border:2px solid #7c3aed;background:rgba(124,58,237,.08);border-radius:3px;transition:all 40ms";
  label.style.cssText = "position:absolute;left:-2px;bottom:100%;margin-bottom:2px;padding:2px 6px;border-radius:3px;background:#7c3aed;color:#fff;font:12px/1.4 ui-monospace,Menlo,monospace;white-space:nowrap";
  box.appendChild(label);
  let current = null;
  const hide = () => {
    box.style.display = "none";
    current = null;
  };
  const show = (el) => {
    if (!box.isConnected) document.body.appendChild(box);
    const rect = el.getBoundingClientRect();
    Object.assign(box.style, {
      display: "block",
      left: `${rect.left - 2}px`,
      top: `${rect.top - 2}px`,
      width: `${rect.width + 4}px`,
      height: `${rect.height + 4}px`
    });
    label.textContent = el.getAttribute(attr);
    label.style.bottom = rect.top < 24 ? "auto" : "100%";
    label.style.top = rect.top < 24 ? "100%" : "auto";
    current = el;
  };
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
  };
  const toast = (message) => {
    const note = document.createElement("div");
    note.setAttribute("role", "status");
    note.textContent = message;
    note.style.cssText = "position:fixed;z-index:2147483647;left:50%;bottom:24px;transform:translateX(-50%);padding:6px 12px;border-radius:6px;background:#111;color:#fff;font:13px/1.4 ui-monospace,Menlo,monospace;pointer-events:none";
    document.body.appendChild(note);
    setTimeout(() => note.remove(), 1600);
  };
  const fromEvent = (event) => event.target instanceof Element ? event.target.closest(selector) : null;
  document.addEventListener(
    "mousemove",
    (event) => {
      if (!event.altKey) return hide();
      const el = fromEvent(event);
      if (el) show(el);
      else hide();
    },
    true
  );
  for (const type of ["mousedown", "mouseup", "click"]) {
    document.addEventListener(
      type,
      (event) => {
        if (!event.altKey || !fromEvent(event)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (type !== "click") return;
        const text = describe(event.target);
        if (!text) return;
        void copy(text).then(() => toast(`Copied ${text.split("\n")[0].split(" ")[0]}`));
      },
      true
    );
  }
  document.addEventListener("keyup", (event) => {
    if (event.key === "Alt") hide();
  });
  window.addEventListener("blur", hide);
  window.addEventListener("scroll", () => current && show(current), true);
})("data-source");
})();
