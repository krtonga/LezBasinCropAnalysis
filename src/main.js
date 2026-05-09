// main.js: entry point for the story page (index.html).
// All shared boilerplate (lang detection, top nav, header, footer, i18n)
// lives in page-shell.js. This file is only the story-specific render.

import { loadYaml, loadMarkdownStory, renderTemplate, combineContext } from "./content-loader.js";
import { renderVisual } from "./story.js";
import { applyChartTheme } from "./charts.js";
import { bootPage, escapeHtml, registerServiceWorker } from "./page-shell.js";

registerServiceWorker();
applyChartTheme();

bootPage({
  onRender: async ({ lang, site }) => {
    const [findings, story, manifest, theiaColors, basinAreas, monthlyWater] = await Promise.all([
      loadYaml("content/findings.yml"),
      loadMarkdownStory(`content/story.${lang}.md`),
      fetchJsonOr("data/manifest.json", null),
      fetchJsonOr("data/theia_oso_colors.json", { classes: [] }),
      fetchJsonOr("data/basin_class_areas.json", { classes: [] }),
      fetchJsonOr("data/monthly_water.json", null),
    ]);

    // Auto-derive headline figures (Mm³ totals, ratios vs urban demand)
    // from manifest × basin areas so the story prose stays in sync with
    // the latest analysis run without needing manual findings.yml edits.
    if (findings?.findings) {
      findings.findings.headline = computeHeadlineNumbers(
        manifest, basinAreas, findings.findings.urban_demand_mm3,
      );
    }

    const ctx = combineContext(site, findings, { manifest, basinAreas });
    const cropClasses = (manifest?.crop_map?.classes) || theiaColors.classes || [];

    await renderStory(story, ctx, { manifest, cropClasses, basinAreas, findings, monthlyWater, lang });
  },
});

// Compute Mm³ totals + urban-demand ratios for use in story prose
// (renders into {{ findings.headline.* }}). Joins manifest pyWaPOR stats
// with full-basin OSO areas the same way the bar chart does.
// 1 ha × 1 mm = 10 m³ → Mm³ = ha × mm × 1e-5.
function computeHeadlineNumbers(manifest, basinAreas, urbanDemandMm3) {
  const areaById = new Map((basinAreas?.classes || []).map(c => [c.id, c.area_ha || 0]));

  const seenClass = new Set();
  let croplandTotal = 0;
  let vineyardTotal = 0;
  for (const c of manifest?.crops || []) {
    if (seenClass.has(c.class_id)) continue;     // dedupe sub-classes (orchards split)
    seenClass.add(c.class_id);
    const aeti = Number(c.stats?.AETI_mean);
    const area = areaById.get(c.class_id);
    if (!Number.isFinite(aeti) || !area) continue;
    const mm3 = area * aeti / 100000;
    croplandTotal += mm3;
    if (c.class_id === 15) vineyardTotal += mm3;
  }

  const urban = Number(urbanDemandMm3) || 0;
  const round = (n) => Math.round(n);
  const ratio = (n) => urban > 0 ? Math.round(n / urban * 10) / 10 : null;

  return {
    cropland_total_mm3:        round(croplandTotal),
    vineyard_total_mm3:        round(vineyardTotal),
    cropland_vs_urban_ratio:   ratio(croplandTotal),
    vineyard_vs_urban_ratio:   ratio(vineyardTotal),
  };
}

async function fetchJsonOr(url, fallback) {
  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) return fallback;
    return await res.json();
  } catch {
    return fallback;
  }
}

async function renderStory(sections, ctx, deps) {
  const root = document.querySelector("[data-region='story']");
  if (!root) return;
  root.innerHTML = "";

  for (const section of sections) {
    const node = document.createElement("section");
    node.className = "story-section";
    node.dataset.section = section.section ?? "";
    if (section.caveat) node.classList.add("story-section--caveat");

    const bodyRendered  = renderTemplate(section.body  ?? "", ctx);
    const titleRendered = renderTemplate(section.title ?? "", ctx);
    const labelText     = section.label ?? "";

    const labelHtml = labelText
      ? `<p class="story-section__label">${escapeHtml(labelText)}</p>`
      : "";
    const titleHtml = titleRendered
      ? `<h2 class="story-section__title">${escapeHtml(titleRendered)}</h2>`
      : "";
    const visualHtml = section.visual_type && section.visual_type !== "none"
      ? `<div class="story-section__visual" data-visual="${escapeHtml(section.visual ?? "")}"
              data-visual-type="${escapeHtml(section.visual_type ?? "")}"></div>`
      : "";

    node.innerHTML = `
      ${labelHtml}
      ${titleHtml}
      ${visualHtml}
      <div class="story-section__body">${window.marked.parse(bodyRendered)}</div>
    `;
    root.appendChild(node);

    const host = node.querySelector(".story-section__visual");
    if (host) await renderVisual(host, { ...section, ctx }, { ...deps, ctx });
  }
}
