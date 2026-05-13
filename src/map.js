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
    if (map.getLayer(LINE_LAYER)) {
      map.setFilter(LINE_LAYER, visibleFilter);
    }
  }

  map.on("load", () => {
    if (map.getSource(SOURCE_ID)) return;

    map.addSource(SOURCE_ID, { type: "vector", url: `pmtiles://${url}` });

    map.addLayer({
      id: FILL_LAYER, type: "fill", source: SOURCE_ID, "source-layer": layerName,
      paint: { "fill-color": colorExpression, "fill-opacity": 0.55 },
    }, "basin-outline");  // draw under basin border so it stays visible

    // Parcel outlines, coloured by each parcel's class so crops remain
    // visually distinct when the fill is hidden. Toggled by
    // setLandcoverDimmed(): hidden when no indicator is active (the fill
    // does the work); visible when an indicator is active (the COG below
    // shows the values and outlines mark parcel boundaries on top).
    map.addLayer({
      id: LINE_LAYER, type: "line", source: SOURCE_ID, "source-layer": layerName,
      paint: { "line-color": colorExpression, "line-width": 1, "line-opacity": 0.85 },
      layout: { visibility: "none" },
    }, "basin-outline");

    // Hover outline is always there — independent of fill/outline state.
    // Mouse-move toggles its filter from sentinel (-1) to the hovered
    // class_id, which is enough to make it visible only on the active
    // parcel(s).
    map.addLayer({
      id: HOVER_LAYER, type: "line", source: SOURCE_ID, "source-layer": layerName,
      paint: { "line-color": "#000", "line-width": 2 },
      filter: ["==", "class_id", -1],
    });

    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10 });

    // Two highlight states share the same outline layer (HOVER_LAYER):
    //
    //   hoveredId  — transient; follows the mouse, debounced for stability.
    //   selectedId — sticky; set by clicking a parcel, cleared by clicking
    //                anywhere outside a parcel or by clicking the same one
    //                again (toggle off).
    //
    // The filter shows the outline when class_id matches EITHER id, so the
    // selected parcel stays outlined while the user mouses around — and a
    // hovered-but-not-selected parcel also outlines so the user sees what
    // they're about to click on.
    const HOVER_DELAY_MS = 250;
    let hoverTimer = null;
    let hoveredId  = -1;
    let selectedId = -1;

    function applyHighlightFilter() {
      const ids = [];
      if (selectedId !== -1)                       ids.push(selectedId);
      if (hoveredId  !== -1 && hoveredId !== selectedId) ids.push(hoveredId);
      if (ids.length === 0) {
        map.setFilter(HOVER_LAYER, ["==", "class_id", -1]);
      } else if (ids.length === 1) {
        map.setFilter(HOVER_LAYER, ["==", "class_id", ids[0]]);
      } else {
        map.setFilter(HOVER_LAYER, ["in", ["get", "class_id"], ["literal", ids]]);
      }
    }

    map.on("mousemove", FILL_LAYER, (e) => {
      const f = e.features?.[0];
      map.getCanvas().style.cursor = f ? "pointer" : "";

      const targetId  = f ? f.properties.class_id : -1;
      const targetPos = f ? e.lngLat : null;
      const targetTxt = f ? (labelMap.get(f.properties.class_id) || `class ${f.properties.class_id}`) : "";

      // Already showing the right thing → just keep the popup near the pointer
      // (no debounce, no filter change, no flicker).
      if (targetId === hoveredId) {
        if (targetPos) popup.setLngLat(targetPos);
        return;
      }

      // Cancel any pending highlight; start a new debounce window.
      if (hoverTimer) clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        hoverTimer = null;
        hoveredId = targetId;
        applyHighlightFilter();
        if (targetId !== -1) {
          popup.setLngLat(targetPos).setText(targetTxt).addTo(map);
        } else {
          popup.remove();
        }
      }, HOVER_DELAY_MS);
    });

    map.on("mouseleave", FILL_LAYER, () => {
      map.getCanvas().style.cursor = "";
      if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
      hoveredId = -1;
      applyHighlightFilter();
      popup.remove();
    });

    // Map-level click handler — handles BOTH "clicked a parcel" and
    // "clicked off any parcel". A layer-scoped click handler would only
    // fire for the first case, leaving us no way to detect deselection.
    map.on("click", (e) => {
      const hits = map.queryRenderedFeatures(e.point, { layers: [FILL_LAYER] });
      const f = hits[0];
      const newSelected = f ? f.properties.class_id : -1;

      // Toggle: clicking the already-selected class again clears the selection.
      selectedId = (newSelected === selectedId) ? -1 : newSelected;
      applyHighlightFilter();

      clickHandler?.({
        class_id: selectedId === -1 ? null : selectedId,
        lngLat:   selectedId === -1 ? null : e.lngLat,
      });
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

// Register the maplibre-cog-protocol once. Safe to call multiple times.
// The protocol exposes COGs to MapLibre as raster sources via cog:// URLs;
// the library handles HTTP byte-range fetches under the hood.
let cogRegistered = false;
function ensureCogProtocol() {
  if (cogRegistered) return;
  if (typeof MaplibreCOGProtocol === "undefined") {
    throw new Error("MaplibreCOGProtocol not loaded; check the script tag in viewer.html");
  }
  maplibregl.addProtocol("cog", MaplibreCOGProtocol.cogProtocol);
  cogRegistered = true;
}

// Build the #color:... URL fragment for maplibre-cog-protocol. Per its docs:
//   #color:<scheme>,<min>,<max>[,<modifiers>]
// The modifier(s) (e.g. "c" for continuous, "-" for reverse) MUST come last.
// Our configs in data/variables.json store colormaps like "BrewerRdYlGn11,c"
// — scheme + modifier in one string — so we split on the first comma and
// re-assemble with min/max in between.
function buildColorFragment(colormap, min, max) {
  const [scheme, ...modParts] = String(colormap).split(",");
  const modifier = modParts.join(",").trim();
  return modifier
    ? `#color:${scheme},${min},${max},${modifier}`
    : `#color:${scheme},${min},${max}`;
}

// Show the given list of COGs as a single conceptual raster layer on the map.
// Multiple URLs are added as sibling sources so per-crop COGs can be mosaicked
// (the visible result is the union of pixel coverage). Calling this again
// removes prior COG layers before adding new ones.
//
// `cogs` is an array of `{ id, url }`; absolute URLs are required by the
// protocol. `colormap` is appended as #color:<scheme>,<min>,<max>[,<modifiers>]
// per maplibre-cog-protocol's docs — *modifiers come last*, not embedded in
// the scheme name. We allow `colormap` to be either "Scheme" or
// "Scheme,modifier" (e.g. "BrewerRdYlGn11,c") and re-arrange before emitting.
// `opacity` is 0..1.
//
// Layers are inserted just under the basin outline so the basin border still
// reads on top of the colormap fill.
const COG_LAYER_PREFIX = "cog-";
// COG rasters render *below* the landcover fill so the crop polygons (and
// any hover outline) stay on top of the indicator colormap. Callers can
// override beforeId to put a COG layer somewhere else if needed.
export function setCogLayer(map, { cogs, colormap, range, opacity = 0.85, beforeId = "landcover-fill" }) {
  ensureCogProtocol();

  const apply = () => {
    // Tear down anything from a previous variable.
    clearCogLayers(map);

    if (!Array.isArray(cogs) || cogs.length === 0) return;

    const [min, max] = range || [0, 1];
    const fragment = colormap
      ? buildColorFragment(colormap, min, max)
      : "";

    for (const c of cogs) {
      const sid = `${COG_LAYER_PREFIX}${c.id}`;
      if (map.getSource(sid)) continue;
      map.addSource(sid, {
        type:     "raster",
        url:      `cog://${c.url}${fragment}`,
        tileSize: 256,
      });
      map.addLayer({
        id:     sid,
        type:   "raster",
        source: sid,
        paint:  { "raster-opacity": opacity, "raster-resampling": "nearest" },
      }, map.getLayer(beforeId) ? beforeId : undefined);
    }
  };

  if (map.isStyleLoaded()) apply();
  else map.once("load", apply);
}

export function setCogOpacity(map, opacity) {
  for (const layer of map.getStyle().layers || []) {
    if (layer.id.startsWith(COG_LAYER_PREFIX)) {
      map.setPaintProperty(layer.id, "raster-opacity", opacity);
    }
  }
}

export function clearCogLayers(map) {
  // Iterate a snapshot since we're mutating during iteration.
  const layers = (map.getStyle().layers || []).filter(l => l.id.startsWith(COG_LAYER_PREFIX));
  for (const layer of layers) {
    if (map.getLayer(layer.id)) map.removeLayer(layer.id);
    if (map.getSource(layer.id)) map.removeSource(layer.id);
  }
}

// Toggle the landcover overlay between full-fill and outline-dominant modes.
// Used when a COG variable is active: the colored polygons would otherwise
// overpower the colormap, so we drop their fill to ~0.05 and let the outlines
// keep parcel structure visible.
export function setLandcoverDimmed(map, dimmed) {
  // When an indicator is active (dimmed=true): fade the landcover fill
  // to nearly invisible (so the COG indicator below reads cleanly) and
  // show parcel outlines instead. When inactive (dimmed=false): restore
  // the coloured fill and hide outlines.
  //
  // The fill is faded to opacity 0.001 rather than `visibility: none`
  // because MapLibre's hit-testing skips invisible layers entirely — and
  // the hover popup + crop-click handler are both wired to mousemove/click
  // on `landcover-fill`. A near-zero opacity keeps the layer hit-testable
  // (visually indistinguishable from hidden, but still interactive).
  //
  // Self-defer: addLandcoverOverlay registers a map.on("load") handler to
  // add the landcover layers, so a call made before "load" fires (e.g. on
  // first page render with a persisted variable in localStorage) would
  // otherwise silently no-op. Queue the dim for when the layer appears.
  if (!map.getLayer("landcover-fill")) {
    map.once("load", () => setLandcoverDimmed(map, dimmed));
    return;
  }
  map.setPaintProperty("landcover-fill", "fill-opacity", dimmed ? 0.001 : 0.55);
  if (map.getLayer("landcover-outline")) {
    map.setLayoutProperty("landcover-outline", "visibility", dimmed ? "visible" : "none");
  }
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
