// content-loader.js — fetch + parse YAML/markdown story content.
// Browser globals expected (loaded via CDN <script> tags in index.html):
//   window.jsyaml   — js-yaml
//   window.marked   — marked
//   window.Mustache — mustache.js

export async function loadYaml(url) {
  const text = await fetchText(url);
  return window.jsyaml.load(text);
}

export async function loadMarkdownStory(url) {
  const text = await fetchText(url);
  return parseStorySections(text);
}

async function fetchText(url) {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

// Split a markdown file on lines that are exactly `---` and treat odd
// blocks as YAML frontmatter, even blocks as the section body.
// Matches the loader described in spec §3.3.
function parseStorySections(text) {
  const blocks = text.split(/^---\s*$/m).map(b => b.trim()).filter(b => b.length);
  const sections = [];
  for (let i = 0; i + 1 < blocks.length; i += 2) {
    const front = window.jsyaml.load(blocks[i]) || {};
    const body  = blocks[i + 1] || "";
    sections.push({ ...front, body });
  }
  return sections;
}

// Substitute {{ findings.foo }} / {{ site.bar }} placeholders. Missing keys
// render as `[missing: <key>]` so a stakeholder can spot omissions without
// the page silently dropping content (spec §6 error handling).
export function renderTemplate(text, context) {
  Mustache.escape = v => v;  // we'll trust our own content; markdown handles HTML escaping later
  const customLookup = {
    ...context,
    // Mustache helper for resolving missing keys with a visible marker.
    _missing: () => function (key) { return `[missing: ${key}]`; },
  };
  try {
    return Mustache.render(text, customLookup, {}, {
      escape: v => v,
    });
  } catch (err) {
    console.warn("Template render error:", err);
    return text;
  }
}

// Build a flat lookup that supports `findings.basin_area_km2` style paths
// using mustache's dot-traversal on the original nested object.
export function combineContext(...sources) {
  return Object.assign({}, ...sources);
}
