// viewer-panels.js — render the left (controls) and right (stats) panels
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

  // ── Select-all handler — flip every row in the section together ───
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
    note.textContent = t.no_data_pending || "No pyWaPOR data for this class yet — analysis pending.";
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
    note.innerHTML = t.adequacy_footnote_html;     // sourced from site.<lang>.yml — trusted content
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

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
