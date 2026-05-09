// i18n.js — language detection, persistence, and toggle wiring (spec §4 Step 3).
// The set of supported languages comes from content/languages.yml — this
// module never hardcodes language codes. To add a new language, add an
// entry to that YAML and ship the matching site.<code>.yml + story.<code>.md.

const STORAGE_KEY = "lez-viewer-lang";

// Detect the active language given a loaded languages.yml config.
// Priority order:
//   1. ?lang=xx URL parameter (explicit user choice from a shared link)
//   2. localStorage (returning visitor's previous toggle)
//   3. navigator.language browser preference (first-time visitor)
//   4. languages.default
export function detectLang(langConfig) {
  const codes = (langConfig?.supported || []).map(l => l.code);
  const fallback = langConfig?.default || codes[0] || "en";
  if (codes.length === 0) return fallback;
  const supported = new Set(codes);

  const fromUrl = new URLSearchParams(window.location.search).get("lang");
  if (fromUrl && supported.has(fromUrl)) return fromUrl;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && supported.has(stored)) return stored;
  } catch {} // localStorage may be disabled (private mode); ignore

  const nav = (navigator.language || "").slice(0, 2).toLowerCase();
  if (supported.has(nav)) return nav;

  return fallback;
}

export function persistLang(lang) {
  try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
  // Reflect choice in URL so the page is shareable in either language.
  const url = new URL(window.location.href);
  url.searchParams.set("lang", lang);
  history.replaceState(null, "", url);
}

// Render the language switcher into `host`. With two supported langs we
// render a single text button that flips to the other; with 3+ we render
// a select. `currentSiteToggleLabel` is the toggle string from the active
// site.<lang>.yml navigation.language_toggle — used as a tooltip /
// fallback label when nothing else fits.
export function renderLangToggle(host, currentLang, langConfig, currentSiteToggleLabel, onSelect) {
  if (!host) return;
  host.innerHTML = "";
  const langs = langConfig?.supported || [];
  const others = langs.filter(l => l.code !== currentLang);
  if (others.length === 0) return;

  if (others.length === 1) {
    const other = others[0];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lang-toggle";
    btn.lang = other.code;
    btn.setAttribute("aria-label", currentSiteToggleLabel || `Switch to ${other.label}`);
    btn.textContent = other.label;
    btn.addEventListener("click", () => onSelect(other.code));
    host.appendChild(btn);
    return;
  }

  // 3+ supported languages: a select keeps it accessible without bespoke UI.
  const select = document.createElement("select");
  select.className = "lang-toggle lang-toggle--select";
  select.setAttribute("aria-label", currentSiteToggleLabel || "Language");
  for (const l of langs) {
    const opt = document.createElement("option");
    opt.value = l.code;
    opt.textContent = l.label;
    if (l.code === currentLang) opt.selected = true;
    select.appendChild(opt);
  }
  select.addEventListener("change", () => onSelect(select.value));
  host.appendChild(select);
}
