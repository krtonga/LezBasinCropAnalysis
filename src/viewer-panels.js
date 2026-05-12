// viewer-panels.js: render the left (controls) and right (stats) panels
// of the viewer page. All user-facing strings come from site.<lang>.yml
// (the `viewer.*` block); this file does no translation of its own.
//
// Left panel: two grouped sections of class-visibility checkboxes.
//   - Crops          (expanded, all CHECKED by default)
//   - Other land cover (collapsed, all UNCHECKED by default)
// Toggling a checkbox emits the new visible-id set to the map filter.
//
// Right panel: when a feature is clicked, show the class label, its
// area in the basin, and any pyWaPOR statistics (only crops have those).
// An Adequacy footnote (also from site.yml) is shown beneath when the
// Adequacy_mean row is present.

// ── Left panel: basemap toggle ────────────────────────────────────────

// Render a small radio-style basemap selector. Options come from
// site.viewer.basemap_options[]; a disclaimer string from
// site.viewer.controls.basemap_note is shown beneath.
export function renderBasemapToggle({ host, site, current, onChange }) {
  if (!host) return;
  host.innerHTML = "";
  const options = site?.basemap_options || site?.viewer?.basemap_options || [];
  const note = site?.viewer?.controls?.basemap_note;
  const sectionLabel = site?.viewer?.controls?.basemap_section || "Basemap";

  const details = document.createElement("details");
  details.className = "lc-section";
  details.open = true;
  const summary = document.createElement("summary");
  summary.className = "lc-section__summary";
  summary.textContent = sectionLabel;
  details.appendChild(summary);

  const list = document.createElement("ul");
  list.className = "basemap-toggle-list";
  for (const opt of options) {
    const li = document.createElement("li");
    li.className = "basemap-toggle-list__item";
    const id = `basemap-opt-${opt.id}`;
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "basemap";
    input.id = id;
    input.value = opt.id;
    input.checked = opt.id === current;
    input.addEventListener("change", () => {
      if (input.checked) onChange(opt.id);
    });
    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = opt.label;
    li.append(input, label);
    list.appendChild(li);
  }
  details.appendChild(list);

  if (note) {
    const noteEl = document.createElement("p");
    noteEl.className = "basemap-toggle__note";
    noteEl.textContent = note;
    details.appendChild(noteEl);
  }

  host.appendChild(details);
}

// ── Left panel: landcover class filters ───────────────────────────────

export function renderLandcoverFilters({ host, site, allClasses, basinAreas, lang, onChange }) {
  if (!host) return;
  host.innerHTML = "";

  const areaByClass = new Map(
    (basinAreas?.classes || []).map(c => [c.id, c.area_ha || 0]),
  );
  const present = (allClasses || [])
    .filter(c => areaByClass.has(c.id) && areaByClass.get(c.id) > 0)
    .sort((a, b) => (areaByClass.get(b.id) || 0) - (areaByClass.get(a.id) || 0));

  const visible = new Set(present.filter(c => c.is_crop).map(c => c.id));
  const emit = () => onChange(new Set(visible));
  const onlyLabel = site?.viewer?.controls?.only_button ?? "Only";

  appendSection({
    host, lang, items: present.filter(c => c.is_crop),
    title:           site?.viewer?.controls?.crops_section    ?? "Crops",
    selectAllLabel:  site?.viewer?.controls?.crops_all_label  ?? "All crops",
    onlyLabel,
    open:            true,
    initiallyChecked: true,
    visible, emit, areaByClass,
  });

  appendSection({
    host, lang, items: present.filter(c => !c.is_crop),
    title:           site?.viewer?.controls?.other_section    ?? "Other land cover",
    selectAllLabel:  site?.viewer?.controls?.other_all_label  ?? "All other land cover",
    onlyLabel,
    open:            false,
    initiallyChecked: false,
    visible, emit, areaByClass,
  });

  emit();
}

// Render one collapsible filter section. Adds:
//   - a "Select all" toggle row whose state derives from the per-row
//     checkboxes (checked / unchecked / indeterminate);
//   - a per-row "Only" button (hidden until row hover / keyboard focus)
//     that selects just this row within the section, leaving other
//     sections untouched.
function appendSection({
  host, lang, items, title, selectAllLabel, onlyLabel,
  open, initiallyChecked, visible, emit, areaByClass,
}) {
  if (items.length === 0) return;

  const details = document.createElement("details");
  details.className = "lc-section";
  if (open) details.open = true;

  const summary = document.createElement("summary");
  summary.className = "lc-section__summary";
  summary.textContent = title;
  details.appendChild(summary);

  // ── Select-all row ────────────────────────────────────────────────
  const selectAllRow = document.createElement("div");
  selectAllRow.className = "lc-section__select-all";
  const allCb = document.createElement("input");
  allCb.type = "checkbox";
  allCb.id = `lc-all-${title.replace(/\s+/g, "-")}`;
  allCb.checked = initiallyChecked;
  const allLabelEl = document.createElement("label");
  allLabelEl.htmlFor = allCb.id;
  allLabelEl.textContent = selectAllLabel;
  selectAllRow.append(allCb, allLabelEl);
  details.appendChild(selectAllRow);

  const list = document.createElement("ul");
  list.className = "crop-filter-list";
  details.appendChild(list);

  // Track per-row controls so the "Select all" / "Only" handlers can
  // mutate them in lockstep.
  const rowCheckboxes = [];

  function refreshSelectAllState() {
    const checkedCount = rowCheckboxes.reduce((n, cb) => n + (cb.checked ? 1 : 0), 0);
    if (checkedCount === 0)                  { allCb.checked = false; allCb.indeterminate = false; }
    else if (checkedCount === rowCheckboxes.length) { allCb.checked = true;  allCb.indeterminate = false; }
    else                                     { allCb.checked = false; allCb.indeterminate = true;  }
  }

  for (const c of items) {
    const li = document.createElement("li");
    li.className = "crop-filter-list__item";

    const id = `lc-toggle-${c.id}`;
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.id = id;
    cb.checked = initiallyChecked;
    cb.addEventListener("change", () => {
      if (cb.checked) visible.add(c.id);
      else            visible.delete(c.id);
      refreshSelectAllState();
      emit();
    });
    rowCheckboxes.push(cb);

    const swatch = document.createElement("span");
    swatch.className = "crop-filter-list__swatch";
    swatch.style.background = c.color || "#999";

    const label = document.createElement("label");
    label.htmlFor = id;
    label.className = "crop-filter-list__label";
    label.append(swatch, document.createTextNode(
      (lang === "fr" ? c.label_fr : c.label_en) || `class ${c.id}`,
    ));

    const area = document.createElement("span");
    area.className = "crop-filter-list__area";
    area.textContent = formatHa(areaByClass.get(c.id));

    const onlyBtn = document.createElement("button");
    onlyBtn.type = "button";
    onlyBtn.className = "crop-filter-list__only";
    onlyBtn.textContent = onlyLabel;
    onlyBtn.addEventListener("click", () => {
      // Section-scoped: turn off every row in this section, then turn on
      // just the clicked one. Other sections are untouched on purpose
      // so a "Crops → Only Vineyards" click doesn't hide visible non-crops.
      for (let i = 0; i < rowCheckboxes.length; i++) {
        const otherCb = rowCheckboxes[i];
        const itemId  = items[i].id;
        const shouldBeChecked = otherCb === cb;
        otherCb.checked = shouldBeChecked;
        if (shouldBeChecked) visible.add(itemId);
        else                 visible.delete(itemId);
      }
      refreshSelectAllState();
      emit();
    });

    li.append(cb, label, area, onlyBtn);
    list.appendChild(li);
  }

  // ── Select-all handler: flip every row in the section together ───
  allCb.addEventListener("change", () => {
    const turnOn = allCb.checked;
    for (let i = 0; i < rowCheckboxes.length; i++) {
      rowCheckboxes[i].checked = turnOn;
      if (turnOn) visible.add(items[i].id);
      else        visible.delete(items[i].id);
    }
    allCb.indeterminate = false;
    emit();
  });

  refreshSelectAllState();
  host.appendChild(details);
}

function formatHa(ha) {
  if (ha == null) return "";
  if (ha >= 100) return `${Math.round(ha).toLocaleString()} ha`;
  return `${ha.toFixed(1)} ha`;
}

// ── Right panel ───────────────────────────────────────────────────────

// Variable-info card. Renders the active variable's name, plain-English
// description, what it's used for, source (for model inputs), and a tiny
// SVG sparkline of monthly basin means (for monthly variables that carry
// per-month stats in the manifest). All textual content is sourced from
// site.viewer.variables.items[<id>]; the i18n shell is the caller's job.
//
// `variable` is the lookupVariable() record (or null to clear).
// `currentMonth` is "YYYY-MM" — the month currently rendered on the map;
// the corresponding sparkline bar is highlighted.
export function renderVariableInfo({ host, variable, site, currentMonth }) {
  if (!host) return;
  host.innerHTML = "";
  if (!variable) return;

  const t = site?.viewer?.variables || {};

  const card = document.createElement("div");
  card.className = "variable-info";

  const titleRow = document.createElement("div");
  titleRow.className = "variable-info__header";
  const title = document.createElement("h3");
  title.className = "variable-info__title";
  title.textContent = variable.label;
  titleRow.appendChild(title);
  if (variable.unit) {
    const unit = document.createElement("span");
    unit.className = "variable-info__unit";
    unit.textContent = variable.unit;
    titleRow.appendChild(unit);
  }
  card.appendChild(titleRow);

  // Always-visible: plain-language description + what it's used for.
  if (variable.description) {
    const desc = document.createElement("p");
    desc.className = "variable-info__description";
    desc.textContent = variable.description;
    card.appendChild(desc);
  }
  if (variable.usedFor) {
    card.appendChild(makeLabelledLine(t.used_for_label || "Used for",
                                       variable.usedFor, "variable-info__used-for"));
  }

  // Sparkline is also always-visible — it's a visual headline.
  if (Array.isArray(variable.stats) && variable.stats.length) {
    const lbl = document.createElement("p");
    lbl.className = "variable-info__sparkline-label";
    lbl.textContent = t.project?.sparkline_label || "Monthly basin mean";
    card.appendChild(lbl);

    const sparkBox = document.createElement("div");
    sparkBox.className = "variable-info__sparkline";
    renderSparkline(sparkBox, variable.stats, currentMonth);
    card.appendChild(sparkBox);
  }

  // Collapsible "Data sources & quality" section. Anything that's about
  // data provenance / known caveats / coverage stats lives here, hidden
  // by default so the card stays scannable for a non-technical audience.
  const hasDetails = variable.source || variable.computedFrom
                  || variable.qualityNotes
                  || (Array.isArray(variable.stats) && variable.stats.length);
  if (hasDetails) {
    const details = document.createElement("details");
    details.className = "variable-info__details";
    const summary = document.createElement("summary");
    summary.textContent = t.details_label || "Data sources & quality";
    details.appendChild(summary);

    if (variable.source) {
      details.appendChild(makeLabelledLine(t.source_label || "Where it comes from",
                                           variable.source, "variable-info__source"));
    }
    if (variable.computedFrom) {
      details.appendChild(makeLabelledLine(t.computed_from_label || "How it's computed",
                                           variable.computedFrom, "variable-info__computed-from"));
    }
    if (variable.qualityNotes) {
      details.appendChild(makeLabelledLine(t.quality_notes_label || "Things to watch out for",
                                           variable.qualityNotes, "variable-info__quality"));
    }
    if (Array.isArray(variable.stats) && variable.stats.length) {
      details.appendChild(renderCoverageLine(variable.stats, currentMonth, t));
    }
    card.appendChild(details);
  }

  host.appendChild(card);
}

// Coverage summary line for the collapsible details: number of monthly
// aggregates, date range, and the current month's spatial coverage.
function renderCoverageLine(stats, currentMonth, t) {
  const months = stats.map(s => s.month).filter(Boolean).sort();
  const range = months.length
    ? (months.length === 1 ? months[0] : `${months[0]} – ${months[months.length - 1]}`)
    : "—";
  const cur = stats.find(s => s.month === currentMonth);
  const spatialPct = cur?.valid_pct;

  const wrap = document.createElement("p");
  wrap.className = "variable-info__coverage";
  const strong = document.createElement("strong");
  strong.textContent = (t.coverage_label || "Coverage") + ": ";
  wrap.appendChild(strong);
  const monthsTpl = (t.coverage_months || "{n} months processed ({range}).")
    .replace("{n}", months.length).replace("{range}", range);
  wrap.appendChild(document.createTextNode(monthsTpl));
  if (Number.isFinite(spatialPct)) {
    const spatialTpl = (t.coverage_spatial || " Spatial coverage this month: {pct}% of basin pixels.")
      .replace("{pct}", spatialPct.toFixed(1));
    wrap.appendChild(document.createTextNode(spatialTpl));
  }
  return wrap;
}

function makeLabelledLine(labelText, valueText, className) {
  const p = document.createElement("p");
  p.className = className;
  const strong = document.createElement("strong");
  strong.textContent = labelText + ": ";
  p.appendChild(strong);
  p.appendChild(document.createTextNode(valueText));
  return p;
}

// Tiny inline SVG sparkline of monthly means.
//   stats:        [{month, mean, min, max, valid_pct}, …] from the manifest.
//   currentMonth: "YYYY-MM" — the bar to highlight.
function renderSparkline(host, stats, currentMonth) {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const W = 210, H = 56, LABEL_H = 14, PAD = 6;
  const barW = (W - PAD * 2) / stats.length;

  const values   = stats.map(s => (s.mean == null ? 0 : s.mean));
  const valsForR = values.filter(v => Number.isFinite(v));
  const vMin = Math.min(0, ...valsForR);
  const vMax = Math.max(0, ...valsForR);
  const range = (vMax - vMin) || 1;

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H + LABEL_H}`);
  svg.setAttribute("class", "sparkline");
  svg.setAttribute("role", "img");

  for (let i = 0; i < stats.length; i++) {
    const v = values[i];
    const h = ((v - vMin) / range) * (H - PAD);
    const x = PAD + i * barW;
    const y = H - h;

    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", String(x + barW * 0.10));
    rect.setAttribute("y", String(y));
    rect.setAttribute("width", String(barW * 0.80));
    rect.setAttribute("height", String(Math.max(h, 1)));
    const isCurrent = stats[i].month === currentMonth;
    rect.setAttribute("class", isCurrent
      ? "sparkline__bar sparkline__bar--current" : "sparkline__bar");

    const title = document.createElementNS(SVG_NS, "title");
    title.textContent = `${stats[i].month}: ${Number(v).toFixed(2)}`;
    rect.appendChild(title);
    svg.appendChild(rect);

    const lbl = document.createElementNS(SVG_NS, "text");
    lbl.setAttribute("x", String(x + barW / 2));
    lbl.setAttribute("y", String(H + LABEL_H - 2));
    lbl.setAttribute("text-anchor", "middle");
    lbl.setAttribute("class", "sparkline__label");
    const m = parseInt(stats[i].month.slice(-2), 10);
    lbl.textContent = "JFMAMJJASOND"[m - 1] || "?";
    svg.appendChild(lbl);
  }

  host.appendChild(svg);

  const validValues = valsForR.filter(v => v !== 0 || true);  // keep all numeric
  const seasonalMean = validValues.reduce((a, b) => a + b, 0) / (validValues.length || 1);
  const summary = document.createElement("p");
  summary.className = "sparkline__summary";
  summary.textContent =
    `season mean ${seasonalMean.toFixed(2)} · range ${vMin.toFixed(2)}–${vMax.toFixed(2)}`;
  host.appendChild(summary);
}

export function renderEmptyStats({ host, site }) {
  if (!host) return;
  const t = site?.viewer?.stats || {};
  host.innerHTML = `
    <h2 class="viewer-grid__title">${escapeHtml(t.title || "Selected feature")}</h2>
    <p class="viewer-grid__hint">${escapeHtml(t.placeholder || "Click a parcel on the map to see its details.")}</p>
  `;
}

export function renderFeatureStats({ host, site, lang, classId, allClasses, manifest, basinAreas }) {
  if (!host) return;
  const t = site?.viewer?.stats || {};
  const metrics = site?.viewer?.metrics || {};

  const cls = (allClasses || []).find(c => c.id === classId);
  const label = (lang === "fr" ? cls?.label_fr : cls?.label_en) || `class ${classId}`;
  const color = cls?.color || "#999";
  const isCrop = !!cls?.is_crop;
  const basinArea = (basinAreas?.classes || []).find(c => c.id === classId)?.area_ha;

  host.innerHTML = "";

  const title = document.createElement("h2");
  title.className = "viewer-grid__title viewer-grid__title--with-swatch";
  const sw = document.createElement("span");
  sw.className = "title-swatch";
  sw.style.background = color;
  title.append(sw, document.createTextNode(label));
  host.appendChild(title);

  if (basinArea != null) {
    const a = document.createElement("p");
    a.className = "stats-meta";
    a.textContent = `${t.area_in_basin || "Area in basin"}: ${formatHa(basinArea)}`;
    host.appendChild(a);
  }

  if (!isCrop) {
    const note = document.createElement("p");
    note.className = "viewer-grid__hint";
    note.textContent = t.no_data_non_crop || "No pyWaPOR statistics for non-crop classes.";
    host.appendChild(note);
    return;
  }

  const matches = (manifest?.crops || []).filter(c => c.class_id === classId);
  if (matches.length === 0) {
    const note = document.createElement("p");
    note.className = "viewer-grid__hint";
    note.textContent = t.no_data_pending || "No pyWaPOR data for this class yet; analysis pending.";
    host.appendChild(note);
    return;
  }

  let showedAdequacy = false;

  for (const m of matches) {
    const subtitle = document.createElement("h3");
    subtitle.className = "viewer-panel__subtitle";
    subtitle.textContent = matches.length > 1 ? humanise(m.id) : (t.statistics || "Statistics");
    host.appendChild(subtitle);

    const grid = document.createElement("dl");
    grid.className = "stats-grid";
    for (const key of ["AETI_mean", "ETc_mean", "Adequacy_mean", "cWP_mean", "Yield_mean", "BWP_mean"]) {
      const value = m.stats?.[key];
      if (value == null) continue;
      if (key === "Adequacy_mean") showedAdequacy = true;
      const meta = metrics[key] || {};
      const dt = document.createElement("dt");
      dt.textContent = meta.label || key;
      const dd = document.createElement("dd");
      dd.textContent = `${formatNumber(value)}${meta.unit ? " " + meta.unit : ""}`;
      grid.append(dt, dd);
    }
    host.appendChild(grid);
  }

  if (showedAdequacy && t.adequacy_footnote_html) {
    const note = document.createElement("p");
    note.className = "stats-footnote";
    note.innerHTML = t.adequacy_footnote_html;     // sourced from site.<lang>.yml; trusted content
    host.appendChild(note);
  }
}

function formatNumber(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  if (Math.abs(n) >= 100) return Math.round(n).toLocaleString();
  return n.toFixed(2);
}

function humanise(crop_name) {
  return crop_name.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());
}

// ── Left panel: variable selector + opacity ───────────────────────────
//
// Renders sectioned variables (per-crop seasonal, basin-wide monthly), a
// "None" option that turns the COG raster off, and an opacity slider for
// the active raster. `sections` is an array of either:
//   { key, title, items: [{ id, label, unit }] }      (flat)
//   { key, title, subsections: [{ title, items }] }   (grouped, e.g. inputs/outputs)
// `current` is the active variable id (or null). `onVariableChange` fires
// with the new id (or null). User-facing strings (`noneLabel`,
// `opacityLabel`) come from the caller's site.<lang>.yml lookup; this file
// does no translation of its own.
export function renderVariableSelector({
  host, sections, current, opacity, noneLabel, opacityLabel,
  onVariableChange, onOpacityChange,
}) {
  if (!host) return;
  host.innerHTML = "";
  if (!sections?.length) return;

  const root = document.createElement("div");
  root.className = "variable-selector";

  // "None" toggle as its own section so it's always at the top.
  const noneSection = document.createElement("div");
  noneSection.className = "variable-section";
  const noneList = document.createElement("ul");
  noneList.className = "variable-list";
  noneList.appendChild(makeVariableRow({
    id: "__none", label: noneLabel || "None",
    unit: "", checked: !current, onChange: () => onVariableChange(null),
  }));
  noneSection.appendChild(noneList);
  root.appendChild(noneSection);

  for (const section of sections) {
    const sectionEl = document.createElement("div");
    sectionEl.className = "variable-section";
    const title = document.createElement("p");
    title.className = "variable-section__title";
    title.textContent = section.title;
    sectionEl.appendChild(title);

    if (Array.isArray(section.subsections)) {
      for (const sub of section.subsections) {
        if (!sub.items?.length) continue;
        const subTitle = document.createElement("p");
        subTitle.className = "variable-subsection__title";
        subTitle.textContent = sub.title;
        sectionEl.appendChild(subTitle);
        sectionEl.appendChild(makeVariableList(sub.items, current, onVariableChange));
      }
    } else {
      sectionEl.appendChild(makeVariableList(section.items || [], current, onVariableChange));
    }
    root.appendChild(sectionEl);
  }

  const slider = document.createElement("div");
  slider.className = "variable-opacity";
  const label = document.createElement("span");
  label.textContent = opacityLabel || "Opacity";
  const input = document.createElement("input");
  input.type = "range";
  input.min = "0";
  input.max = "100";
  input.step = "1";
  input.value = String(Math.round((opacity ?? 0.85) * 100));
  input.addEventListener("input", () => {
    onOpacityChange(Number(input.value) / 100);
  });
  // Disable the slider when no variable is active to make the link explicit.
  input.disabled = !current;
  slider.append(label, input);
  root.appendChild(slider);

  host.appendChild(root);
}

function makeVariableList(items, current, onVariableChange) {
  const list = document.createElement("ul");
  list.className = "variable-list";
  for (const v of items) {
    list.appendChild(makeVariableRow({
      id:       v.id,
      label:    v.label,
      unit:     v.unit,
      checked:  v.id === current,
      onChange: () => onVariableChange(v.id),
    }));
  }
  return list;
}

function makeVariableRow({ id, label, unit, checked, onChange }) {
  const li = document.createElement("li");
  const labelEl = document.createElement("label");
  labelEl.className = "variable-list__item";
  const input = document.createElement("input");
  input.type = "radio";
  input.name = "viewer-variable";
  input.checked = checked;
  input.addEventListener("change", () => { if (input.checked) onChange(); });
  const text = document.createElement("span");
  text.textContent = label;
  labelEl.append(input, text);
  if (unit) {
    const u = document.createElement("span");
    u.className = "variable-list__unit";
    u.textContent = unit;
    labelEl.appendChild(u);
  }
  li.appendChild(labelEl);
  return li;
}

// ── Map overlay: legend ───────────────────────────────────────────────
//
// Render a colormap legend over the map. `variable.gradient` is a CSS
// custom property name (e.g. "--gradient-blues") defined on :root in
// style.css; the bar pulls its background from there so the gradient
// palette stays editable as theming. `host` is hidden when `variable` is
// null.
export function renderLegend({ host, variable, hint }) {
  if (!host) return;
  if (!variable) {
    host.hidden = true;
    host.innerHTML = "";
    return;
  }
  host.hidden = false;
  host.innerHTML = "";

  const title = document.createElement("p");
  title.className = "map-legend__title";
  title.textContent = variable.label;
  host.appendChild(title);

  const bar = document.createElement("div");
  bar.className = "map-legend__bar";
  if (variable.gradient) bar.style.background = `var(${variable.gradient})`;
  host.appendChild(bar);

  const ticks = document.createElement("div");
  ticks.className = "map-legend__ticks";
  const [min, max] = variable.range || [0, 1];
  ticks.innerHTML = `<span>${formatNumber(min)}</span><span>${formatNumber(max)}</span>`;
  host.appendChild(ticks);

  if (variable.unit) {
    const u = document.createElement("p");
    u.className = "map-legend__unit";
    u.textContent = variable.unit;
    host.appendChild(u);
  }
  if (hint) {
    const h = document.createElement("p");
    h.className = "map-legend__hint";
    h.textContent = hint;
    host.appendChild(h);
  }
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
