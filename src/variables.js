// variables.js: helpers for resolving the COG URLs of a selected variable
// and assembling the variable-selector sections.
//
// All configuration data (colormap, range, gradient, kind) is loaded from
// data/variables.json. All translatable strings (labels, units, section
// titles, subsection titles, "None", "Opacity") live in site.<lang>.yml
// under `viewer.variables` and are looked up by id at render time.

// Resolve a per-crop variable id into the list of COG URLs, one per crop
// the user has currently toggled visible. Per-crop COGs are rendered as
// independent raster sources on the map; deselecting a crop removes its
// source so its colored pixels disappear. Returns absolute URLs since
// maplibre-cog-protocol requires them.
//
// Args:
//   varId            e.g. "Adequacy_season"
//   manifest         parsed viewer/data/manifest.json
//   visibleCropIds   Set<class_id> from the landcover filter (null = all)
//   dataBaseUrl      manifest.data_base_url (typically "data")
export function resolvePerCropCogs({ varId, manifest, visibleCropIds, dataBaseUrl }) {
  const out = [];
  for (const crop of manifest?.crops || []) {
    if (!crop.layers?.includes(varId)) continue;
    if (visibleCropIds && !visibleCropIds.has(crop.class_id)) continue;
    const start = crop.season_start;
    const end   = crop.season_end;
    if (!start || !end) continue;
    // File pattern: data/{crop.id}/{varId}_3857/{varId}1_{start}_to_{end}.tif
    // The `_3857` suffix points at the Web-Mercator copies produced by
    // viewer_prep_cogs.py; maplibre-cog-protocol does not reproject.
    const rel = `${dataBaseUrl}/${crop.id}/${varId}_3857/${varId}1_${start}_to_${end}.tif`;
    out.push({ id: `${varId}__${crop.id}`, url: toAbsoluteUrl(rel) });
  }
  return out;
}

// Resolve a monthly basin-wide variable into a single-COG list. `month`
// is a YYYY-MM string (e.g. "2018-06"). Looks up the file by date in
// manifest.monthly_basin[].files so the lookup stays correct as the
// season window expands or contracts (a numeric array index would break
// as soon as the file list changes length).
export function resolveMonthlyCog({ varId, manifest, month = "2018-06", dataBaseUrl }) {
  const entry = (manifest?.monthly_basin || []).find(l => l.id === varId);
  if (!entry?.files?.length) return [];
  const file = entry.files.find(f => f.includes(month));
  if (!file) return [];
  return [{ id: `${varId}__${month}`, url: toAbsoluteUrl(`${dataBaseUrl}/${file}`) }];
}

function toAbsoluteUrl(rel) {
  return new URL(rel, document.location.href).href;
}

// Build the section list for the variable selector. Sections only include
// variables that actually have a renderable file on disk (per
// manifest.crops[].layers[] and manifest.monthly_basin), so the user
// never sees a dead option. The monthly section is split into "Inputs"
// and "Outputs" subsections based on the `kind` field in variables.json.
//
// Args:
//   variablesConfig   parsed data/variables.json
//   i18n              site.viewer.variables (active language)
//   monthlyLabels     {id: {label, unit}} from site.viewer.variables.items
//   availablePerCrop  Set<id> of per-crop variables on disk (any crop)
//   availableMonthly  Set<id> of monthly variables on disk
export function buildSections({
  variablesConfig, i18n, monthlyLabels,
  availablePerCrop, availableMonthly,
}) {
  const sections = [];
  const items = i18n?.items || {};

  // Basin-wide monthly comes first: it's the model inputs + outputs that
  // every stakeholder can interpret without crop-specific context.
  const monthlyAvailable = (variablesConfig?.monthly || [])
    .filter(v => availableMonthly.has(v.id) && monthlyLabels?.[v.id]);
  if (monthlyAvailable.length) {
    const inputItems = monthlyAvailable
      .filter(v => v.kind === "input")
      .map(v => itemFor(v, monthlyLabels));
    const outputItems = monthlyAvailable
      .filter(v => v.kind !== "input")
      .map(v => itemFor(v, monthlyLabels));
    const subsections = [];
    if (inputItems.length) {
      subsections.push({ title: i18n?.subsection_inputs  || "Inputs",  items: inputItems  });
    }
    if (outputItems.length) {
      subsections.push({ title: i18n?.subsection_outputs || "Outputs", items: outputItems });
    }
    sections.push({
      key:   "monthly",
      title: i18n?.section_monthly || "Basin-wide monthly",
      subsections,
    });
  }

  // Per-crop seasonal indicators follow — these require understanding
  // crop-specific Kc curves and crop-mask attribution.
  const perCropItems = (variablesConfig?.per_crop || [])
    .filter(v => availablePerCrop.has(v.id))
    .map(v => ({
      id:    v.id,
      label: items[v.id]?.label || v.id,
      unit:  items[v.id]?.unit  || "",
    }));
  if (perCropItems.length) {
    sections.push({
      key:   "per_crop",
      title: i18n?.section_per_crop || "Per-crop seasonal",
      items: perCropItems,
    });
  }

  return sections;
}

function itemFor(v, monthlyLabels) {
  return {
    id:    v.id,
    label: monthlyLabels[v.id].label || v.id,
    unit:  monthlyLabels[v.id].unit  || "",
  };
}

// Look up the full variable record (label + unit + colormap + range +
// gradient + i18n description / used_for / source + per-month basin stats)
// for a given id. Returns null for unknown ids.
//
// `manifest` is optional. When supplied (only relevant for monthly
// variables), the returned record includes `stats: [{month, mean, min,
// max, valid_pct}, …]` from manifest.monthly_basin[].stats — used by
// the right-panel sparkline.
export function lookupVariable({ varId, variablesConfig, i18n, monthlyLabels, manifest }) {
  const perCrop = (variablesConfig?.per_crop || []).find(v => v.id === varId);
  if (perCrop) {
    const item = i18n?.items?.[varId] || {};
    return {
      id:           perCrop.id,
      label:        item.label || perCrop.id,
      unit:         item.unit  || "",
      description:  item.description || "",
      usedFor:      item.used_for || "",
      source:       item.source || "",
      computedFrom: item.computed_from || "",
      qualityNotes: item.quality_notes || "",
      colormap:     perCrop.colormap,
      range:        perCrop.range,
      gradient:     perCrop.gradient,
      kind:         "per_crop",
      stats:        null,
    };
  }
  const monthly = (variablesConfig?.monthly || []).find(v => v.id === varId);
  if (monthly) {
    const items = i18n?.items || {};
    const item = items[varId] || monthlyLabels?.[varId] || {};
    const basinEntry = (manifest?.monthly_basin || []).find(l => l.id === varId);
    return {
      id:           monthly.id,
      label:        item.label || monthlyLabels?.[varId]?.label || monthly.id,
      unit:         item.unit  || monthlyLabels?.[varId]?.unit  || "",
      description:  item.description || "",
      usedFor:      item.used_for || "",
      source:       item.source || "",
      computedFrom: item.computed_from || "",
      qualityNotes: item.quality_notes || "",
      colormap:     monthly.colormap,
      range:        monthly.range,
      gradient:     monthly.gradient,
      kind:         monthly.kind === "input" ? "monthly_input" : "monthly_output",
      stats:        basinEntry?.stats || null,
    };
  }
  return null;
}
