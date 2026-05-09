// story.js — visual dispatch for story sections (spec §4 Step 2 + polish).
// Each section in story.md declares a `visual_type`. This module reads that
// frontmatter and replaces the placeholder element with the appropriate
// rendering: image / chart / chart_toggleable / pie_pair / animation / none.

import {
  renderBarChart, renderToggleableChart, renderPieChart,
  renderDirectBarChart, renderStackedBarChart, renderMonthlyStackedChart,
} from "./charts.js";

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Registry of named charts referenced from story.md `visual:` fields.
const CHART_CONFIGS = {
  per_crop_aeti_chart: {
    type: "single",
    metric: "AETI_mean",
    unit_en:  "mm/season  (= L of water per m² of cropland)",
    unit_fr:  "mm/saison  (= L d'eau par m² de terre cultivée)",
    title_en: "Seasonal water consumption per crop area",
    title_fr: "Consommation d'eau saisonnière par surface cultivée",
  },
  cwp_ranking_chart: {
    type: "toggleable",
    units: [
      { key: "cWP_mean",
        label_en: "kg of fresh produce per m³ of water consumed",
        label_fr: "kg de produit frais par m³ d'eau consommée" },
      // €/m³ and kcal/m³ require yield-pricing/calorie inputs; add when available.
    ],
    default_unit: "cWP_mean",
    title_en: "Crop water productivity",
    title_fr: "Productivité de l'eau par culture",
  },
  area_pies: {
    type: "pie_pair",
    title_en_left:  "Cropland share by crop",
    title_en_right: "Basin land cover (all classes)",
    title_fr_left:  "Part des cultures dans la surface agricole",
    title_fr_right: "Couverture du sol du bassin (toutes classes)",
  },
  total_water_chart: {
    // Bars are area_ha (full basin OSO) × AETI_mean (NW pyWaPOR) / 100 000 = Mm³.
    // Includes a reference bar for the urban demand from findings.urban_demand_mm3.
    type: "total_water",
    metric: "AETI_mean",
    unit_en: "Mm³ / season",
    unit_fr: "Mm³ / saison",
    title_en: "Total water consumed per crop (basin-wide estimate)",
    title_fr: "Eau totale consommée par culture (estimation à l'échelle du bassin)",
  },
  green_blue_chart: {
    // Stacked bars per crop: green water (rainfall) + blue water (irrigation),
    // both in Mm³ (area × per-area mean / 100 000). Blue water is what
    // competes with the urban supply from the karst aquifer.
    type: "green_blue",
    unit_en: "Mm³ / season",
    unit_fr: "Mm³ / saison",
    title_en: "Where the water comes from",
    title_fr: "D'où vient l'eau",
  },
  monthly_water_chart: {
    // Stacked vertical bars per month, one stack per crop class. Reference
    // line at monthly urban demand. Rainfall over cropland is overlaid as
    // a line so the irrigation gap (bar height − rainfall line) is visible.
    // Source: viewer/data/monthly_water.json (compute_monthly_water.py).
    type: "monthly_water",
    unit_en: "Mm³ / month",
    unit_fr: "Mm³ / mois",
    title_en: "Monthly cropland water consumption vs rainfall (basin-wide estimate)",
    title_fr: "Consommation d'eau mensuelle vs pluie (estimation à l'échelle du bassin)",
    reference_label_en: "Urban demand / month",
    reference_label_fr: "Demande urbaine / mois",
    rainfall_label_en: "Rainfall on cropland",
    rainfall_label_fr: "Pluie sur les cultures",
  },
};

// Deduplicate manifest crops by class_id and project to chart-row shape.
// When two manifest entries share the same class_id (e.g. orchards split into
// olives + deciduous via params_key), `dedupe=false` keeps both.
function manifestCropsToChartItems(manifestCrops, { dedupe = true } = {}) {
  const seen = new Set();
  const out = [];
  for (const c of manifestCrops || []) {
    const id = c.class_id;
    if (id == null) continue;
    if (dedupe && seen.has(id)) continue;
    seen.add(id);
    out.push({
      crop_id:    id,
      crop_name:  c.id,
      params_key: c.params_key,
      area_ha:    c.area_ha,
      area_share: c.area_share ?? 1.0,
      ...c.stats,
    });
  }
  return out;
}

async function firstReachable(urls) {
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: "HEAD", cache: "no-cache" });
      if (res.ok) return url;
    } catch {} // try next
  }
  return null;
}

async function renderImage(host, section) {
  const name = section.visual;
  if (!name) return renderPlaceholder(host, "no image");
  const candidates = ["jpg", "jpeg", "png", "webp"].map(ext => `assets/${name}.${ext}`);
  const url = await firstReachable(candidates);
  if (!url) return renderPlaceholder(host, `image not found: assets/${name}.*`);

  host.innerHTML = "";
  const fig = document.createElement("figure");
  const img = document.createElement("img");
  img.src = url;
  img.alt = section.visual_alt || section.title || "";
  fig.appendChild(img);
  if (section.visual_caption) {
    const cap = document.createElement("figcaption");
    cap.textContent = section.visual_caption;
    fig.appendChild(cap);
  }
  host.appendChild(fig);
}

// Render a vertical stack of pre-supplied images with captions. Captions
// live in the per-language story.md frontmatter (the file is already
// single-language) — see feedback_i18n_per_language_files in memory. This
// function does no language switching itself.
//   visual_images:
//     - src: chart_lake_geneva_surface.png
//       caption: "Evolution of surface temperatures..."
function renderImageGallery(host, section) {
  const images = section.visual_images || [];
  if (images.length === 0) return renderPlaceholder(host, "no images");
  host.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "image-gallery";
  for (const img of images) {
    const fig = document.createElement("figure");
    fig.className = "image-gallery__figure";
    const i = document.createElement("img");
    i.src = `content/${img.src}`;
    i.loading = "lazy";
    i.alt = img.caption || "";
    fig.appendChild(i);
    if (img.caption) {
      const cap = document.createElement("figcaption");
      cap.textContent = img.caption;
      fig.appendChild(cap);
    }
    wrap.appendChild(fig);
  }
  host.appendChild(wrap);
}

async function renderAnimation(host, section, ctx) {
  const sourceKey = section.visual_source;
  const fallbackName = section.visual_fallback;
  const videoUrl = resolveDotPath(ctx, sourceKey);

  if (videoUrl) {
    const reachable = await firstReachable([videoUrl, `data/${videoUrl}`, `assets/${videoUrl}`]);
    if (reachable) {
      host.innerHTML = "";
      const v = document.createElement("video");
      v.src = reachable;
      v.controls = true;
      v.playsInline = true;
      v.preload = "metadata";
      v.addEventListener("error", () => renderImage(host, { visual: fallbackName, visual_alt: section.title }));
      host.appendChild(v);
      return;
    }
  }
  if (fallbackName) {
    return renderImage(host, { visual: fallbackName, visual_alt: section.title });
  }
  renderPlaceholder(host, "animation not available");
}

function renderBarVisual(host, section, deps) {
  const { manifest, cropClasses, basinAreas, findings, lang } = deps;
  const cfg = CHART_CONFIGS[section.visual];
  if (!cfg) return renderPlaceholder(host, `unknown chart: ${section.visual}`);

  // For cWP (section 04) we show olives + deciduous as separate bars; for AETI
  // they're identical (same mask) so dedupe to a single Orchards bar.
  const dedupe = cfg.metric !== "cWP_mean" && (cfg.units?.[0]?.key !== "cWP_mean");
  const items = manifestCropsToChartItems(manifest?.crops, { dedupe });
  host.innerHTML = "";

  if (cfg.type === "total_water") {
    return renderTotalWaterChart(host, items, cfg, cropClasses, basinAreas, findings, lang);
  }
  if (cfg.type === "green_blue") {
    return renderGreenBlueChart(host, items, cfg, cropClasses, basinAreas, lang);
  }
  if (cfg.type === "monthly_water") {
    return renderMonthlyWaterChart(host, cfg, deps.monthlyWater, lang);
  }

  if (cfg.type === "single") {
    const wrap = document.createElement("div");
    wrap.className = "chart-canvas-wrap";
    const canvas = document.createElement("canvas");
    wrap.appendChild(canvas);
    host.appendChild(wrap);
    const unit  = lang === "fr" ? cfg.unit_fr  : cfg.unit_en;
    const title = lang === "fr" ? cfg.title_fr : cfg.title_en;
    renderBarChart(canvas, items, cfg.metric, unit, cropClasses, lang, title);
    return;
  }

  if (cfg.type === "toggleable") {
    const units = cfg.units.map(u => ({
      key:   u.key,
      label: lang === "fr" ? (u.label_fr || u.label_en) : u.label_en,
    }));
    renderToggleableChart(host, items, units, cfg.default_unit, cropClasses, lang);
  }
}

// Build per-class totals: basin_area_ha × per-area metric / 100 000 = Mm³.
// Joins manifest stats (NW pyWaPOR) with full-basin OSO areas; this is the
// same join used in viewer-panels.js so the numbers stay consistent.
function buildTotalMm3(items, metricKey, basinAreas, cropClasses, lang) {
  const areaById = new Map((basinAreas?.classes || []).map(c => [c.id, c.area_ha || 0]));
  const out = [];
  for (const it of items) {
    const v = Number(it[metricKey]);
    const a = areaById.get(it.crop_id);
    if (!Number.isFinite(v) || !a) continue;
    const cls = (cropClasses || []).find(x => x.id === it.crop_id);
    const label = (lang === "fr" ? cls?.label_fr : cls?.label_en) || `class ${it.crop_id}`;
    out.push({
      crop_id: it.crop_id,
      label,
      color:   cls?.color || cssVar("--accent"),
      value:   a * v / 100000,   // ha × mm × 1e-5 = Mm³
    });
  }
  return out;
}

function renderTotalWaterChart(host, items, cfg, cropClasses, basinAreas, findings, lang) {
  const wrap = document.createElement("div");
  wrap.className = "chart-canvas-wrap";
  const canvas = document.createElement("canvas");
  wrap.appendChild(canvas);
  host.appendChild(wrap);

  const cropTotals = buildTotalMm3(items, cfg.metric, basinAreas, cropClasses, lang);

  const urbanMm3 = Number(findings?.findings?.urban_demand_mm3);
  const extras = Number.isFinite(urbanMm3) && urbanMm3 > 0
    ? [{
        label: lang === "fr"
          ? `Demande urbaine (source du Lez)`
          : `Urban demand (Lez source)`,
        value: urbanMm3,
        color: cssVar("--reference-bar"),
      }]
    : [];

  const unit  = lang === "fr" ? cfg.unit_fr  : cfg.unit_en;
  const title = lang === "fr" ? cfg.title_fr : cfg.title_en;
  renderDirectBarChart(canvas, cropTotals, unit, { title, extras });
}

function renderMonthlyWaterChart(host, cfg, monthlyWater, lang) {
  const wrap = document.createElement("div");
  wrap.className = "chart-canvas-wrap";
  const canvas = document.createElement("canvas");
  wrap.appendChild(canvas);
  host.appendChild(wrap);

  if (!monthlyWater) return renderPlaceholder(host, "monthly water data not available");

  // Convert "2018-07" → short locale month label so the x-axis is scannable.
  const fmt = new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", { month: "short" });
  const monthLabels = (monthlyWater.months || []).map(m => {
    const [yyyy, mm] = m.split("-").map(Number);
    return fmt.format(new Date(yyyy, mm - 1, 1));
  });

  // Stack order: largest annual contributor at the bottom of the bar
  // (visually most stable). Sum each class's annual total, sort desc.
  const sortedClasses = [...(monthlyWater.by_class || [])]
    .map(c => ({ ...c, annual: (c.monthly_mm3 || []).reduce((s, v) => s + (v || 0), 0) }))
    .sort((a, b) => b.annual - a.annual);

  const series = sortedClasses.map(c => ({
    label: lang === "fr" ? c.label_fr : c.label_en,
    color: c.color,
    values: c.monthly_mm3,
  }));

  const refValue = monthlyWater.urban_per_month_mm3;
  const refLabel = lang === "fr" ? cfg.reference_label_fr : cfg.reference_label_en;
  const unit  = lang === "fr" ? cfg.unit_fr  : cfg.unit_en;
  const title = lang === "fr" ? cfg.title_fr : cfg.title_en;

  const lines = [];
  if (Array.isArray(monthlyWater.rainfall_on_cropland_mm3)) {
    lines.push({
      label:  lang === "fr" ? cfg.rainfall_label_fr : cfg.rainfall_label_en,
      color:  cssVar("--water-blue"),
      values: monthlyWater.rainfall_on_cropland_mm3,
    });
  }

  renderMonthlyStackedChart(canvas, monthLabels, series, unit, {
    title,
    referenceLine: refValue ? { value: refValue, label: refLabel ? `${refLabel}: ${refValue} ${unit.split('/')[0].trim()}` : null } : null,
    lines,
  });
}

function renderGreenBlueChart(host, items, cfg, cropClasses, basinAreas, lang) {
  const wrap = document.createElement("div");
  wrap.className = "chart-canvas-wrap";
  const canvas = document.createElement("canvas");
  wrap.appendChild(canvas);
  host.appendChild(wrap);

  // Pre-multiply each crop's per-area Green/Blue mean by basin area to get Mm³.
  const greenItems = buildTotalMm3(items, "GreenETa_mean", basinAreas, cropClasses, lang);
  const blueItems  = buildTotalMm3(items, "BlueETa_mean",  basinAreas, cropClasses, lang);

  const merged = new Map();
  for (const g of greenItems) merged.set(g.crop_id, { ...g, green: g.value, blue: 0 });
  for (const b of blueItems) {
    const m = merged.get(b.crop_id) || { ...b, green: 0, blue: 0 };
    m.blue = b.value;
    merged.set(b.crop_id, m);
  }
  const rows = [...merged.values()];

  const stacks = [
    { key: "green", label: lang === "fr" ? "Eau verte (pluie)"     : "Green water (rainfall)",   color: cssVar("--water-green") },
    { key: "blue",  label: lang === "fr" ? "Eau bleue (irrigation)": "Blue water (irrigation)",  color: cssVar("--water-blue")  },
  ];
  const unit  = lang === "fr" ? cfg.unit_fr  : cfg.unit_en;
  const title = lang === "fr" ? cfg.title_fr : cfg.title_en;
  renderStackedBarChart(canvas, rows, stacks, unit, { title });
}

// Render the two-pie comparison: cropland-only on left, basin-wide on right.
// Both pies are sourced from basin_class_areas.json (the full-basin Theia OSO
// shapefile clip) so the absolute hectares agree between them. While only one
// quarter (NW) has been pyWaPOR-processed, mask-derived area would only
// reflect the processed extent and bias the share-of-cropland breakdown.
// Once all four quarters land, this can switch to manifest.crops[].area_ha
// and act as a validation cross-check against the OSO shapefile.
async function renderPieVisual(host, section, deps) {
  const { basinAreas, lang } = deps;
  const cfg = CHART_CONFIGS[section.visual] || CHART_CONFIGS.area_pies;
  const CROP_CLASS_IDS = new Set([5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 24]);

  const allClasses = (basinAreas?.classes || []).filter(c => c.area_ha > 0);

  const cropAggregated = allClasses
    .filter(c => CROP_CLASS_IDS.has(c.id))
    .map(c => ({
      crop_id: c.id,
      label:   lang === "fr" ? c.label_fr : c.label_en,
      color:   c.color,
      value:   c.area_ha,
    }))
    .sort((a, b) => b.value - a.value);

  const basinSlices = allClasses.map(c => ({
    label: lang === "fr" ? c.label_fr : c.label_en,
    value: c.area_ha,
    color: c.color,
  }));

  host.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "pie-pair";
  host.appendChild(grid);

  const leftWrap  = document.createElement("div");
  const rightWrap = document.createElement("div");
  leftWrap.className  = "chart-canvas-wrap chart-canvas-wrap--pie";
  rightWrap.className = "chart-canvas-wrap chart-canvas-wrap--pie";
  const leftCanvas  = document.createElement("canvas");
  const rightCanvas = document.createElement("canvas");
  leftWrap.appendChild(leftCanvas);
  rightWrap.appendChild(rightCanvas);
  grid.appendChild(leftWrap);
  grid.appendChild(rightWrap);

  const fmt = (v) => `${v.toLocaleString(undefined, { maximumFractionDigits: 0 })} ha`;

  renderPieChart(leftCanvas, cropAggregated, {
    title: lang === "fr" ? cfg.title_fr_left : cfg.title_en_left,
    doughnut: false,
    unitFormatter: fmt,
    legendPosition: "bottom",
  });
  renderPieChart(rightCanvas, basinSlices, {
    title: lang === "fr" ? cfg.title_fr_right : cfg.title_en_right,
    doughnut: true,
    unitFormatter: fmt,
    legendPosition: "bottom",
    minShareLabel: 0.015,
  });
}

function renderPlaceholder(host, msg) {
  host.innerHTML = `<span class="placeholder">${escapeHtml(msg)}</span>`;
}

function resolveDotPath(obj, path) {
  if (!path) return null;
  return path.split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

function escapeHtml(s) {
  return String(s ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export async function renderVisual(host, section, deps) {
  const t = section.visual_type;
  if (!t || t === "none") { host.remove(); return; }
  try {
    if      (t === "image")            await renderImage(host, section);
    else if (t === "image_gallery")          renderImageGallery(host, section);
    else if (t === "animation")        await renderAnimation(host, section, deps.ctx);
    else if (t === "chart")            renderBarVisual(host, section, deps);
    else if (t === "chart_toggleable") renderBarVisual(host, section, deps);
    else if (t === "pie_pair")         await renderPieVisual(host, section, deps);
    else                                renderPlaceholder(host, `unsupported visual_type: ${t}`);
  } catch (err) {
    console.warn("Visual render error in section", section.section, err);
    renderPlaceholder(host, "Visual not available");
  }
}
