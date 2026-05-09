// page-shell.js — shared header/footer/nav rendering used by both
// the story page (main.js) and the about page (about.js). Keeps the
// language toggle, page nav, and citation-context flattening in one
// place so both pages stay consistent without duplicating code.

import { detectLang, persistLang, renderLangToggle } from "./i18n.js";
import { loadYaml } from "./content-loader.js";

// Pre-compute helper fields on the site object so mustache templates
// can reference {{ site.attribution.authors_formatted }} directly
// instead of iterating arrays. Returns the same object (mutated).
export function deriveSiteHelpers(site) {
  const a = site?.attribution;
  if (Array.isArray(a?.authors)) {
    a.authors_formatted     = a.authors.join("; ");
    a.authors_first         = a.authors[0] ?? "";
    a.authors_count         = a.authors.length;
    a.authors_short_citation =
      a.authors.length === 1 ? a.authors[0]
      : a.authors.length === 2 ? a.authors.join(" & ")
      : `${a.authors[0]} et al.`;
  }
  return site;
}

// Render the top-of-page nav: site page links on the left, language toggle
// on the right. `pages` is read from site.navigation.pages — each language
// YAML supplies its own labels — so adding a page is purely a content edit.
export function renderTopNav({ host, lang, langConfig, site, onLangChange }) {
  if (!host) return;
  host.innerHTML = "";

  const pages = site?.navigation?.pages || [];
  const left = document.createElement("div");
  left.className = "top-nav__links";
  for (const p of pages) {
    const a = document.createElement("a");
    a.href = p.href;
    a.className = "top-nav__link";
    a.textContent = p.label || p.href;
    if (window.location.pathname.endsWith("/" + p.href)) {
      a.classList.add("is-active");
      a.setAttribute("aria-current", "page");
    }
    left.appendChild(a);
  }
  host.appendChild(left);

  const right = document.createElement("div");
  right.className = "top-nav__lang";
  host.appendChild(right);
  renderLangToggle(right, lang, langConfig, site?.navigation?.language_toggle, onLangChange);
}

// Renders the same header (title + subtitle) used on every page.
export function renderHeader(site) {
  const el = document.querySelector("[data-region='header']");
  if (!el) return;
  const title    = site?.site?.title    ?? "";
  const subtitle = site?.site?.subtitle ?? "";
  el.innerHTML = `
    <h1>${escapeHtml(title)}</h1>
    <p class="subtitle">${escapeHtml(subtitle)}</p>
  `;
}

export function renderFooter(site) {
  const el = document.querySelector("[data-region='footer']");
  if (!el) return;
  const primary = site?.attribution?.primary ?? "";
  const year    = site?.attribution?.year ?? "";
  const caveat  = site?.footer?.caveat_short ?? "";
  el.innerHTML = `
    <p class="footer__attribution">${escapeHtml(primary)}${year ? ` · ${escapeHtml(String(year))}` : ""}</p>
    <p class="footer__caveat">${escapeHtml(caveat)}</p>
  `;
}

export function showFatal(err) {
  console.error("Fatal load error:", err);
  const banner = document.querySelector("[data-region='banner']");
  if (banner) {
    banner.hidden = false;
    banner.textContent = `Could not load content. ${err.message}`;
  }
}

export function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// Walk every element with `data-i18n="dotted.path"` and replace its
// textContent with the looked-up string from `siteData`. Use
// `data-i18n-attr="title"` on the same element to set an attribute
// (useful for tooltips / aria-label) instead of textContent.
// Missing keys are left as-is and a warning is logged.
export function applyI18n(siteData) {
  const nodes = document.querySelectorAll("[data-i18n]");
  for (const el of nodes) {
    const path = el.getAttribute("data-i18n");
    const value = lookupDotted(siteData, path);
    if (value == null) {
      console.warn(`[i18n] missing key: ${path}`);
      continue;
    }
    const targetAttr = el.getAttribute("data-i18n-attr");
    if (targetAttr) el.setAttribute(targetAttr, value);
    else            el.textContent = value;
  }
}

function lookupDotted(obj, path) {
  return path.split(".").reduce(
    (acc, k) => (acc == null ? undefined : acc[k]),
    obj,
  );
}

// Re-export for convenience so pages don't need to import i18n.js separately.
export { detectLang, persistLang };

// Register the service worker once per page load. Failures (no SW support,
// file:// origin, blocked by browser settings) are logged and swallowed —
// the page must still work without offline support.
export function registerServiceWorker(scriptUrl = "sw.js") {
  if (!("serviceWorker" in navigator)) return;
  if (location.protocol === "file:") return;  // SW requires http(s) origin
  navigator.serviceWorker.register(scriptUrl).catch((err) => {
    console.warn("Service worker registration failed; continuing without offline support.", err);
  });
}

// bootPage — shared bootstrap used by every page entry script (main.js,
// about.js, viewer.js, future pages). Loads languages.yml + the active
// site.<lang>.yml, renders the top nav + applies i18n strings, then
// hands off to the page-specific `onRender({ lang, site, langConfig })`
// callback. Re-runs onRender when the language toggle is clicked.
//
// Pass `pageTitle({ lang, site })` to set document.title from the loaded
// site data (e.g. prepend "About — " in the active language).
export async function bootPage({ onRender, pageTitle }) {
  let langConfig;
  try {
    langConfig = await loadYaml("content/languages.yml");
  } catch {
    langConfig = { default: "en", supported: [{ code: "en", label: "English" }] };
  }

  let currentLang = detectLang(langConfig);
  const navHost = document.querySelector("[data-region='top-nav']");

  async function render(lang) {
    document.documentElement.lang = lang;

    let site;
    try {
      site = await loadYaml(`content/site.${lang}.yml`);
    } catch (err) {
      showFatal(err);
      return;
    }
    deriveSiteHelpers(site);

    if (typeof pageTitle === "function") {
      const t = pageTitle({ lang, site });
      if (t) document.title = t;
    } else {
      document.title = site?.site?.title ?? document.title;
    }

    renderTopNav({
      host: navHost, lang, langConfig, site,
      onLangChange: async (newLang) => {
        if (newLang === currentLang) return;
        currentLang = newLang;
        persistLang(newLang);
        await render(newLang);
        window.scrollTo({ top: 0, behavior: "instant" });
      },
    });
    applyI18n(site);
    renderHeader(site);

    if (typeof onRender === "function") {
      await onRender({ lang, site, langConfig });
    }

    renderFooter(site);
  }

  await render(currentLang);
}
