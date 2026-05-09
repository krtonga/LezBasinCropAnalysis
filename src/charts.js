// charts.js: Chart.js wrappers for the v1a story page (spec §4 Step 2).
// All theming reads from CSS custom properties on :root so the entire
// chart palette can be reskinned by editing style.css alone.

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Apply CSS-driven defaults to Chart.js. Call once at page init.
export function applyChartTheme() {
  if (typeof Chart === "undefined") return;
  Chart.defaults.font.family = cssVar("--font-family");
  Chart.defaults.font.size   = parseFloat(cssVar("--font-size-chart")) || 13;
  Chart.defaults.color       = cssVar("--fg");
  Chart.defaults.borderColor = cssVar("--chart-grid");
  Chart.defaults.scale.grid.color = cssVar("--chart-grid");
  Chart.defaults.animation.duration = 250;
}

// Resolve crop_id → label/color from a manifest-style class list
// (typically theia_oso_colors.json or manifest.crop_map.classes).
function lookupCrop(cropClasses, cropId, lang) {
  const c = (cropClasses || []).find(x => x.id === cropId);
  if (!c) return { label: `class ${cropId}`, color: cssVar("--fg-muted"), outline: cssVar("--fg-muted") };
  const labelKey = lang === "fr" ? "label_fr" : "label_en";
  return {
    label:   c[labelKey] || c.label_en || c.label_fr || `class ${cropId}`,
    color:   c.color   || cssVar("--accent"),
    outline: c.outline || c.color || cssVar("--fg"),
  };
}

// When two items share crop_id (e.g. orchards split into olives + deciduous),
// disambiguate the label using the row's `params_key` so the bars don't
// collide visually. Returns a copy of base with an updated `label`.
function disambiguate(base, item, lang) {
  const k = item.params_key || item.crop_name;
  if (!k) return base;
  const suffixMap = lang === "fr" ? {
    orchards_deciduous: " (fruits à noyau / décidus)",
    orchards_olives:    " (oliviers)",
    tubers_potato_main_season: " (saison principale)",
    tubers_potato_primeur:     " (primeur)",
  } : {
    orchards_deciduous: " (stone fruit / deciduous)",
    orchards_olives:    " (olives)",
    tubers_potato_main_season: " (main-season)",
    tubers_potato_primeur:     " (primeur)",
  };
  const suffix = suffixMap[k];
  return suffix ? { ...base, label: base.label + suffix } : base;
}

// Render a horizontal bar chart for a single-metric per-crop array.
// `items` is an array of objects: [{ crop_id, <metricKey>: value }, ...]
// `metricKey` selects the field; `unit` becomes the x-axis label and tooltip suffix.
// Optional `title` puts a chart-level title above the bars.
export function renderBarChart(canvas, items, metricKey, unit, cropClasses, lang, title) {
  // Detect class_id collisions so we can disambiguate labels for sub-classes
  // sharing one mask (e.g. orchards: olives vs deciduous).
  const classIdCounts = new Map();
  for (const it of items || []) {
    if (!it || it[metricKey] == null) continue;
    classIdCounts.set(it.crop_id, (classIdCounts.get(it.crop_id) || 0) + 1);
  }
  const usable = (items || [])
    .filter(it => it && it[metricKey] != null && Number.isFinite(Number(it[metricKey])))
    .map(it => {
      const base = lookupCrop(cropClasses, it.crop_id, lang);
      const labeled = classIdCounts.get(it.crop_id) > 1 ? disambiguate(base, it, lang) : base;
      return { ...labeled, value: Number(it[metricKey]) };
    })
    .sort((a, b) => b.value - a.value);

  if (usable.length === 0) {
    showPlaceholder(canvas, "Visual not available; no data yet");
    return null;
  }

  return new Chart(canvas, {
    type: "bar",
    data: {
      labels: usable.map(u => u.label),
      datasets: [{
        data: usable.map(u => u.value),
        backgroundColor: usable.map(u => u.color),
        borderColor:     usable.map(u => u.outline),
        borderWidth: 1,
      }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: title ? { display: true, text: title, padding: { top: 4, bottom: 12 } } : { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.parsed.x.toLocaleString()} ${unit}`,
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          title: { display: !!unit, text: unit },
        },
      },
    },
  });
}

// Render a pie/doughnut chart from a list of {label, value, color} entries.
// `total` (optional): if given, slices smaller than `minShareLabel` are
// grouped into a single "Other" slice.
export function renderPieChart(canvas, slices, opts = {}) {
  const {
    title, doughnut = false, minShareLabel = 0.02,
    unitFormatter = (v) => v.toLocaleString(),
    legendPosition = "right",
  } = opts;

  if (!slices || slices.length === 0) {
    showPlaceholder(canvas, "Visual not available; no data yet");
    return null;
  }

  // Aggregate small slices into "Other" so the legend stays readable.
  const total = slices.reduce((s, x) => s + x.value, 0);
  const big = [], small = [];
  for (const s of slices) {
    (s.value / total >= minShareLabel ? big : small).push(s);
  }
  const grouped = small.length
    ? [...big, {
        label: "Other",
        value: small.reduce((s, x) => s + x.value, 0),
        color: cssVar("--chart-grid"),
      }]
    : big;

  return new Chart(canvas, {
    type: doughnut ? "doughnut" : "pie",
    data: {
      labels: grouped.map(s => s.label),
      datasets: [{
        data:            grouped.map(s => s.value),
        backgroundColor: grouped.map(s => s.color),
        borderColor:     "white",
        borderWidth: 1,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: legendPosition, labels: { boxWidth: 14, padding: 8 } },
        title: title ? { display: true, text: title, padding: { top: 4, bottom: 12 } } : { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed;
              const pct = (v / total * 100).toFixed(1);
              return `${ctx.label}: ${unitFormatter(v)} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

// Bar chart with unit-toggle pills (e.g. kg/m³ / €/m³ / kcal/m³).
// `units` is an array of { key, label } where key matches a field on each item.
export function renderToggleableChart(container, items, units, defaultKey, cropClasses, lang) {
  container.innerHTML = "";

  const pills = document.createElement("div");
  pills.className = "chart-toggles";
  for (const u of units) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chart-toggle";
    btn.dataset.unitKey = u.key;
    btn.textContent = u.label;
    if (u.key === defaultKey) btn.classList.add("is-active");
    pills.appendChild(btn);
  }
  container.appendChild(pills);

  const canvasWrap = document.createElement("div");
  canvasWrap.className = "chart-canvas-wrap";
  const canvas = document.createElement("canvas");
  canvasWrap.appendChild(canvas);
  container.appendChild(canvasWrap);

  let activeKey = defaultKey;
  let chart = null;

  function draw() {
    if (chart) chart.destroy();
    const u = units.find(x => x.key === activeKey);
    chart = renderBarChart(canvas, items, activeKey, u?.label || "", cropClasses, lang);
  }

  pills.addEventListener("click", (ev) => {
    const btn = ev.target.closest(".chart-toggle");
    if (!btn) return;
    const k = btn.dataset.unitKey;
    if (!k || k === activeKey) return;
    activeKey = k;
    pills.querySelectorAll(".chart-toggle").forEach(b => b.classList.toggle("is-active", b === btn));
    draw();
  });

  draw();
  return () => chart?.destroy();
}

// Render a horizontal bar chart of pre-computed { label, value, color } items.
// Used by the new total-water and similar derived charts where the value
// isn't a raw manifest field but a calculation done by the caller.
// `extras` is an optional list of extra bars (e.g. an urban-demand
// reference) appended verbatim with their own color.
export function renderDirectBarChart(canvas, items, unit, opts = {}) {
  const { title, extras = [] } = opts;
  const all = [...items, ...extras]
    .filter(it => it && Number.isFinite(Number(it.value)))
    .sort((a, b) => b.value - a.value);

  if (all.length === 0) {
    showPlaceholder(canvas, "Visual not available; no data yet");
    return null;
  }

  return new Chart(canvas, {
    type: "bar",
    data: {
      labels: all.map(u => u.label),
      datasets: [{
        data: all.map(u => u.value),
        backgroundColor: all.map(u => u.color || cssVar("--accent")),
        borderColor:     all.map(u => u.outline || u.color || cssVar("--fg")),
        borderWidth: 1,
      }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: title ? { display: true, text: title, padding: { top: 4, bottom: 12 } } : { display: false },
        tooltip: {
          callbacks: { label: (ctx) => `${formatNumber(ctx.parsed.x)} ${unit}` },
        },
      },
      scales: { x: { beginAtZero: true, title: { display: !!unit, text: unit } } },
    },
  });
}

// Render a horizontal stacked bar chart (e.g. Green vs Blue water).
// `items` is an array of { label, color, stacks: { <stackKey>: value } }.
// `stacks` is the ordered list of { key, label, color } describing each
// stack segment. Tooltips show the per-stack value and the row total.
export function renderStackedBarChart(canvas, items, stacks, unit, opts = {}) {
  const { title } = opts;

  const usable = (items || [])
    .filter(it => stacks.some(s => Number.isFinite(Number(it[s.key]))))
    .sort((a, b) =>
      sumStacks(b, stacks) - sumStacks(a, stacks),
    );

  if (usable.length === 0) {
    showPlaceholder(canvas, "Visual not available; no data yet");
    return null;
  }

  const datasets = stacks.map(s => ({
    label: s.label,
    data:  usable.map(it => Number(it[s.key]) || 0),
    backgroundColor: s.color,
  }));

  return new Chart(canvas, {
    type: "bar",
    data: { labels: usable.map(it => it.label), datasets },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top", labels: { boxWidth: 14 } },
        title: title ? { display: true, text: title, padding: { top: 4, bottom: 12 } } : { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${formatNumber(ctx.parsed.x)} ${unit}`,
            footer: (ctxs) => {
              const total = ctxs.reduce((s, c) => s + c.parsed.x, 0);
              return `Total: ${formatNumber(total)} ${unit}`;
            },
          },
        },
      },
      scales: {
        x: { beginAtZero: true, stacked: true, title: { display: !!unit, text: unit } },
        y: { stacked: true },
      },
    },
  });
}

function sumStacks(item, stacks) {
  return stacks.reduce((s, k) => s + (Number(item[k.key]) || 0), 0);
}

// Vertical stacked bar chart with month labels on the x-axis. Each row
// in `series` is one stack (typically one crop class):
//   { label, color, values: [m0, m1, …] }
// `monthLabels` are the x-axis tick labels (length must match values).
// Optional:
//   - `referenceLine = { value, label, color }` draws a horizontal dashed
//     line at y = value (e.g. monthly urban demand).
//   - `lines = [{ label, color, values: [...] }, …]` overlays one or more
//     line series on top of the stacked bars (e.g. monthly rainfall).
export function renderMonthlyStackedChart(canvas, monthLabels, series, unit, opts = {}) {
  const { title, referenceLine, lines = [] } = opts;

  const stackedDatasets = (series || [])
    .filter(s => Array.isArray(s.values))
    .map(s => ({
      type: "bar",
      label: s.label,
      data:  s.values,
      backgroundColor: s.color,
      stack: "crops",
      order: 2,                  // bars draw under lines
    }));

  const lineDatasets = (lines || [])
    .filter(l => Array.isArray(l.values))
    .map(l => ({
      type: "line",
      label: l.label,
      data:  l.values,
      borderColor:     l.color,
      backgroundColor: l.color,
      borderWidth: 2.5,
      pointRadius: 3,
      pointHoverRadius: 5,
      tension: 0.25,
      fill: false,
      order: 1,                  // lines draw on top
      stack: undefined,           // not part of the stack
    }));

  const datasets = [...stackedDatasets, ...lineDatasets];

  if (datasets.length === 0) {
    showPlaceholder(canvas, "Visual not available; no data yet");
    return null;
  }

  // Plugin: draw a horizontal dashed reference line at y = refValue
  // with a small label. Cleaner than pulling in chartjs-plugin-annotation.
  const refLinePlugin = referenceLine && Number.isFinite(Number(referenceLine.value)) ? {
    id: "ref-line",
    afterDatasetsDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      const y = scales.y.getPixelForValue(Number(referenceLine.value));
      if (y < chartArea.top || y > chartArea.bottom) return;
      ctx.save();
      ctx.strokeStyle = referenceLine.color || cssVar("--reference-bar");
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(chartArea.left, y);
      ctx.lineTo(chartArea.right, y);
      ctx.stroke();
      ctx.setLineDash([]);
      if (referenceLine.label) {
        ctx.fillStyle = referenceLine.color || cssVar("--reference-bar");
        ctx.font = `${cssVar('--font-size-chart') || '13px'} ${cssVar('--font-family')}`;
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        ctx.fillText(referenceLine.label, chartArea.right - 4, y - 2);
      }
      ctx.restore();
    },
  } : null;

  return new Chart(canvas, {
    type: "bar",
    data: { labels: monthLabels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top", labels: { boxWidth: 14 } },
        title: title ? { display: true, text: title, padding: { top: 4, bottom: 12 } } : { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${formatNumber(ctx.parsed.y)} ${unit}`,
            footer: (ctxs) => {
              // Sum only the stacked bar segments for the per-month total;
              // line overlays (e.g. rainfall) shouldn't be added in.
              const total = ctxs
                .filter(c => c.dataset.stack)
                .reduce((s, c) => s + c.parsed.y, 0);
              return `Total: ${formatNumber(total)} ${unit}`;
            },
          },
        },
      },
      scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true, title: { display: !!unit, text: unit } },
      },
    },
    plugins: refLinePlugin ? [refLinePlugin] : [],
  });
}

function formatNumber(n) {
  if (!Number.isFinite(n)) return String(n);
  if (Math.abs(n) >= 100) return Math.round(n).toLocaleString();
  return n.toFixed(2);
}

function showPlaceholder(canvas, msg) {
  const wrap = canvas.parentElement;
  if (!wrap) return;
  const div = document.createElement("div");
  div.className = "placeholder";
  div.textContent = msg;
  wrap.replaceChild(div, canvas);
}
