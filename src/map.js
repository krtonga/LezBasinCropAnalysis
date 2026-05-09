// map.js: MapLibre wrapper for the viewer page.
// Exposes a small API for the viewer entry to:
//   - initialise the map at the manifest's center / extent / zoom
//   - drape the basin polygon as a styled overlay
//   - (later steps will add: COG raster, crop overlay, click handler, etc.)
//
// Library: MapLibre GL JS via CDN (no API key, free tile sources).
// Basemap: OpenStreetMap raster tiles (Carto Positron-style fallback below).

// Registry of available basemaps. The `id` matches site.<lang>.yml
// basemap_options[].id; URLs and attribution stay here so they can be
// served to MapLibre. Add a new entry + a matching site.yml entry to
// expose another basemap to users. All basemap layers stay in the style
// at all times; the toggle just flips their `visibility` (cheaper than
// add/remove and lets MapLibre's attribution control auto-update).
const BASEMAPS = {
  map: {
    tiles: ["https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"],
    tileSize: 256,
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a>',
  },
  satellite: {
    // Esri World Imagery: free with attribution. Mixed-source aerial /
    // satellite imagery, current (NOT 2018). The site.yml basemap_note
    // flags this for the user.
    tiles: ["https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
    tileSize: 256,
    attribution:
      '© <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics, and the GIS User Community',
  },
};
const DEFAULT_BASEMAP = "map";

// Read the accent color once so the basin outline matches the rest of the
// site palette without hardcoding a hex. (Spec preference: theming via CSS.)
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function createMap({ container, center, zoom, extent, basemap = DEFAULT_BASEMAP }) {
  const accent = cssVar("--accent") || "#550000";

  // Build sources/layers for every basemap so toggling later is just a
  // visibility flip; no source swap or style.setStyle round-trip.
  const sources = {};
  const layers = [];
  for (const [id, cfg] of Object.entries(BASEMAPS)) {
    const sid = `basemap-${id}`;
    sources[sid] = {
      type:        "raster",
      tiles:       cfg.tiles,
      tileSize:    cfg.tileSize,
      attribution: cfg.attribution,
    };
    layers.push({
      id: sid,
      type: "raster",
      source: sid,
      layout: { visibility: id === basemap ? "visible" : "none" },
    });
  }

  const map = new maplibregl.Map({
    container,
    style: { version: 8, sources, layers },
    center: center || [3.795, 43.608],   // manifest.run.center fallback
    zoom:   zoom   ?? 11,
  });

  map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-right");
  map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

  if (extent && extent.length === 4) {
    // Constrain panning to the basin bbox (a small buffer keeps it forgiving).
    const [w, s, e, n] = extent;
    const buf = 0.05;
    map.setMaxBounds([[w - buf, s - buf], [e + buf, n + buf]]);
  }

  return { map, accent };
}

// Add the basin polygon as a styled outline + soft fill. The basin is
// purely a reference frame; no hover tooltip and no cursor change so
// it doesn't compete with the crop overlay (which IS clickable).
export function addBasinOverlay(map, geojson, accent) {
  if (!geojson) return;
  map.on("load", () => {
    if (map.getSource("basin")) return;
    map.addSource("basin", { type: "geojson", data: geojson });
    map.addLayer({
      id: "basin-fill",
      type: "fill",
      source: "basin",
      paint: { "fill-color": accent, "fill-opacity": 0.06 },
    });
    map.addLayer({
      id: "basin-outline",
      type: "line",
      source: "basin",
      paint: { "line-color": accent, "line-width": 2, "line-opacity": 0.9 },
    });
  });
}

// Switch the active basemap by toggling layer visibility. `name` must be
// a key in BASEMAPS (and an `id` in site.yml `basemap_options`). Unknown
// names are ignored; the previously active basemap stays.
export function setBasemap(map, name) {
  if (!BASEMAPS[name]) return;
  const apply = () => {
    for (const id of Object.keys(BASEMAPS)) {
      const lid = `basemap-${id}`;
      if (!map.getLayer(lid)) continue;
      map.setLayoutProperty(lid, "visibility", id === name ? "visible" : "none");
    }
  };
  if (map.isStyleLoaded()) apply();
  else map.once("load", apply);
}

// Resize the map when the container changes size (e.g. responsive
// breakpoint switch when the side panels collapse). Idempotent.
export function bindResize(map, container) {
  const obs = new ResizeObserver(() => map.resize());
  obs.observe(container);
  return () => obs.disconnect();
}

// Register the pmtiles protocol once. Safe to call multiple times.
let pmtilesRegistered = false;
function ensurePmtilesProtocol() {
  if (pmtilesRegistered) return;
  if (typeof pmtiles === "undefined") {
    throw new Error("pmtiles library not loaded; add the CDN script tag to viewer.html");
  }
  const protocol = new pmtiles.Protocol();
  maplibregl.addProtocol("pmtiles", protocol.tile);
  pmtilesRegistered = true;
}

// Add the Theia OSO landcover overlay as a vector layer driven by the
// PMTiles archive at viewer/data/landcover_overlay.pmtiles. Polygons are
// filled by `class_id` using the canonical Theia OSO palette
// (theia_oso_colors.json). The PMTiles ships ALL 24 classes; the page
// hides non-crop classes by default and reveals them via the left panel.
//
// Returns a small handle so the page can wire left-panel checkbox filters
// and the right-panel click-to-inspect behaviour without reaching into
// MapLibre internals:
//   { setVisibleClasses(idsSetOrNull), onClickFeature(callback) }
export function addLandcoverOverlay(map, { url, cropClasses, layerName = "landcover" }) {
  ensurePmtilesProtocol();

  const SOURCE_ID   = "landcover-source";
  const FILL_LAYER  = "landcover-fill";
  const LINE_LAYER  = "landcover-outline";
  const HOVER_LAYER = "landcover-hover";

  const colorExpression = buildColorExpression(cropClasses, "#999");
  let clickHandler = null;
  let visibleFilter = null;
  // class_id → display label, refreshed by setLabels() on each language
  // render so the hover tooltip switches with the page language. Empty
  // until viewer.js wires it.
  const labelMap = new Map();

  function applyVisibleFilter() {
    if (!map.getLayer(FILL_LAYER)) return;
    map.setFilter(FILL_LAYER, visibleFilter);
    map.setFilter(LINE_LAYER, visibleFilter);
  }

  map.on("load", () => {
    if (map.getSource(SOURCE_ID)) return;

    map.addSource(SOURCE_ID, { type: "vector", url: `pmtiles://${url}` });

    map.addLayer({
      id: FILL_LAYER, type: "fill", source: SOURCE_ID, "source-layer": layerName,
      paint: { "fill-color": colorExpression, "fill-opacity": 0.55 },
    }, "basin-outline");  // draw under basin border so it stays visible

    map.addLayer({
      id: LINE_LAYER, type: "line", source: SOURCE_ID, "source-layer": layerName,
      paint: { "line-color": "rgba(0,0,0,0.25)", "line-width": 0.4 },
    }, "basin-outline");

    map.addLayer({
      id: HOVER_LAYER, type: "line", source: SOURCE_ID, "source-layer": layerName,
      paint: { "line-color": "#000", "line-width": 2 },
      filter: ["==", "class_id", -1],
    });

    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10 });

    map.on("mousemove", FILL_LAYER, (e) => {
      const f = e.features?.[0];
      map.getCanvas().style.cursor = f ? "pointer" : "";
      map.setFilter(HOVER_LAYER, f ? ["==", "class_id", f.properties.class_id] : ["==", "class_id", -1]);
      if (f) {
        const id = f.properties.class_id;
        const text = labelMap.get(id) || `class ${id}`;
        popup.setLngLat(e.lngLat).setText(text).addTo(map);
      } else {
        popup.remove();
      }
    });
    map.on("mouseleave", FILL_LAYER, () => {
      map.getCanvas().style.cursor = "";
      map.setFilter(HOVER_LAYER, ["==", "class_id", -1]);
      popup.remove();
    });

    map.on("click", FILL_LAYER, (e) => {
      const f = e.features?.[0];
      if (!f || !clickHandler) return;
      clickHandler({ class_id: f.properties.class_id, lngLat: e.lngLat });
    });

    applyVisibleFilter();
  });

  return {
    setVisibleClasses(idsSet) {
      visibleFilter = idsSet
        ? ["in", ["get", "class_id"], ["literal", [...idsSet]]]
        : null;
      applyVisibleFilter();
    },
    onClickFeature(cb) { clickHandler = cb; },
    // Update the hover-popup labels (e.g. when the page language changes).
    // Accepts a {classId: string} mapping; missing ids fall back to
    // "class N" inside the mousemove handler.
    setLabels(idToLabel) {
      labelMap.clear();
      for (const [k, v] of Object.entries(idToLabel || {})) {
        labelMap.set(Number(k), v);
      }
    },
  };
}

// Build a MapLibre `match` expression mapping each class id to its color.
// Returns an expression (not a hex string); paired with charts.js
// lookupCrop, which returns synchronous { label, color } for a single class.
// Different shapes for different consumers; not worth merging.
function buildColorExpression(cropClasses, fallbackColor) {
  const expr = ["match", ["get", "class_id"]];
  for (const c of cropClasses || []) {
    expr.push(c.id, c.color || fallbackColor);
  }
  expr.push(fallbackColor);
  return expr;
}
