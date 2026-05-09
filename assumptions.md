# Analysis Assumptions

All assumptions below apply to `crop_wapor_analysis.py` and the viewer pipeline.
This file is a working log; items marked **[TO BE CITED]** require a literature reference
before finalising `methods.md`.

---

## 1. Crop Season Dates (SOS / EOS)

**Rule:** For crops with a range in `crop_kc.csv` (e.g., `sowing_or_start = "Apr-May"`),
the **earlier** date is used as SOS and the **later** harvest month as EOS.
EOS is set to the first day of the month **after** the last harvest month (exclusive end),
so that `sum_season(SOS ≤ date < EOS)` captures the full harvest month.

**Winter crops** (where sowing month > harvest month, e.g., rapeseed Aug→Jul, cereals Nov→Jun):
SOS is placed in `year - 1` (2017 for the 2018 analysis). The monthly raster filter
`SOS ≤ date < EOS` then spans into 2018, picking up the correct monthly files.

**Source:** `crop_kc.csv` columns `sowing_or_start` / `harvest_or_end`;
column `source_primary` and `source_local` document the agronomic reference per crop.

---

## 2. Kc Curve Construction (FAO-56 trapezoidal)

**Rule:** A piecewise-linear Kc(t) curve is built from four stage lengths and three Kc levels:
- Stage lengths: read from `crop_kc.csv` columns `L_ini_days`, `L_dev_days`, `L_mid_days`,
  `L_late_days`. Converted to fractions of total active days at runtime.
- Kc levels (kc_ini, kc_mid, kc_end): hardcoded in `CROP_PARAMS` dict in the script.

**Kc sources by crop:**

| Crop | kc_ini | kc_mid | kc_end | Source |
|------|--------|--------|--------|--------|
| Rapeseed | 0.35 | 1.05 | 0.35 | FAO-56 Table 12 |
| Cereals (winter wheat/barley) | 0.40 | 1.15 | 0.25 | FAO-56 Table 12 (Mediterranean) |
| Protein crops (faba bean/peas) | 0.40 | 1.15 | 0.30 | FAO-56 Table 12 |
| Soya | 0.40 | 1.15 | 0.50 | FAO-56 Table 12 |
| Sunflower | 0.35 | 1.10 | 0.35 | FAO-56 Table 12 (Mediterranean) |
| Maize (grain) | 0.40 | 1.20 | 0.60 | FAO-56 Table 12 (Spain) |
| Rice | 1.05 | 1.20 | 0.75 | FAO-56 Table 12 |
| Tubers (potato) | 0.50 | 1.15 | 0.75 | FAO-56 Table 12 |
| Grasslands | 0.30 | 0.75 | 0.75 | FAO-56 Table 12 |
| Orchards | 0.55 | 0.90 | 0.65 | FAO-56 Table 12 |
| Vineyards | 0.30 | **0.55** | 0.45 | FAO-56 kc_ini/kc_end; **kc_mid overridden to 0.55** per local Mediterranean calibration (methods.md §5) |
| Greenhouses | 0.60 | 0.60 | 0.60 | Expert estimate; constant Kc assumed |

**FAO-56 reference:** Allen, R.G., Pereira, L.S., Raes, D., Smith, M. (1998).
*Crop evapotranspiration – Guidelines for computing crop water requirements.*
FAO Irrigation and Drainage Paper 56. Rome.

---

## 3. Effective Precipitation (USDA SCS formula, monthly)

**Rule:** Monthly Peff is calculated from monthly PCP using the USDA Soil Conservation Service
formula applied per month:

```
For P ≤ 250 mm/month:  Peff = P × (125 − 0.2 × P) / 125
For P > 250 mm/month:  Peff = 125 + 0.1 × P
```

Monthly PCP totals are assembled from daily or dekadal input rasters before applying the formula.

**Source:** USDA Soil Conservation Service method as cited in FAO-56 Annex.
**Limitation:** This formula was developed for US conditions; applicability to Mediterranean
climate with dry summers and wet winters is approximate.

---

## 4. Total Biomass Production (TBP)

**Formula:** `TBP (t/ha) = NPP (g C/m²/season) × 22.222 / 1000`

**Derivation:** 1 g C/m² ≡ 1/0.45 g dry matter/m² ≡ 0.02222 t DM/ha
  → multiplier = 2.222 / 100 = 0.02222 = 22.222 / 1000

**Assumption:** carbon fraction of dry matter = 0.45 (standard plant biochemistry).

**Source:** WaPOR/pyWaPOR technical notes. **[TO BE CITED — add specific WaPOR document]**

---

## 5. Harvestable Yield

**Formula:** `Yield (t/ha) = HI × AOT × fc × TBP / (1 − MC)`

**Parameters (per CROP_PARAMS in script):**

| Crop | fc | AOT | HI | MC | Notes |
|------|-----|-----|-----|-----|-------|
| Rapeseed | 1.00 | 0.90 | 0.35 | 0.09 | **[TO BE CITED]** |
| Cereals (winter wheat) | 1.00 | 0.90 | 0.45 | 0.13 | **[TO BE CITED]** |
| Protein crops | 1.00 | 0.80 | 0.40 | 0.12 | **[TO BE CITED]** |
| Soya | 1.00 | 0.80 | 0.35 | 0.13 | **[TO BE CITED]** |
| Sunflower | 1.00 | 0.80 | 0.35 | 0.09 | **[TO BE CITED]** |
| Maize (grain) | **1.25** | 0.85 | 0.50 | 0.14 | fc=1.25 for C4 photosynthesis |
| Rice | 1.00 | 0.85 | 0.50 | 0.14 | **[TO BE CITED]** |
| Tubers | 1.00 | 0.80 | 0.65 | 0.78 | High MC (potato) **[TO BE CITED]** |
| Grasslands | 1.00 | 0.90 | 0.85 | 0.15 | **[TO BE CITED]** |
| Orchards | 1.00 | 0.55 | 0.80 | 0.85 | High MC (fresh fruit) **[TO BE CITED]** |
| Vineyards | 1.00 | 0.70 | 0.35 | 0.75 | Grape MC; **[TO BE CITED]** |
| Greenhouses | 1.00 | 0.85 | 0.75 | 0.90 | Expert estimate **[TO BE CITED]** |

**Definitions:**
- `fc`: light-use efficiency correction (1.0 for C3 plants; 1.25 for C4, e.g. maize).
- `AOT`: above-ground over total biomass ratio (fraction of biomass that is above ground).
- `HI`: harvest index (harvestable fraction of above-ground biomass).
- `MC`: moisture content of the harvested product (fresh-weight basis).

---

## 6. Water Productivity Metrics

**BWP (Biomass Water Productivity, kg/m³):**
```
BWP = TBP (t/ha) / AETI (mm) × 100
```
Unit derivation: 1 t/ha ÷ 1 mm = 100 kg/m³, so the × 100 factor is a unit conversion.

**cWP (Crop Water Productivity, kg/m³):**
```
cWP = Yield (t/ha) / AETI (mm) × 100
```

**Beneficial Fraction:** `BF = T / AETI` (transpiration fraction of total ET).

**Adequacy:** `Adequacy = AETI / ETc`. Values > 1 indicate ET above crop requirement
(possible measurement artefact or non-crop water use).

**Relative Water Deficit:** `RWD = 1 − AETI / ETx`
where `ETx` = 95th percentile of AETI across all pixels within the crop mask.

---

## 7. Productivity Gap Analysis

**Rule:** Target performance = `TARGET_PERCENTILE`-th percentile (default: 90th) of the
metric's spatial distribution across crop-mask pixels.

**Gap = Target − Mean** (a single basin-level scalar, not a per-pixel map).
Gap maps (`*_gap/*.tif`) show `Target − pixel_value` for each pixel.

**Assumption:** The 90th percentile is a reachable benchmark (best-farmer reference).
This is a common FAO Water Productivity framework assumption.

---

## 8. Spatial

- All rasters resampled to the AETI grid using **bilinear interpolation** (rasterio default).
- NODATA value = **−9999.0** (written to all output GeoTIFFs).
- Output CRS: inherited from input AETI rasters (EPSG:4326, WGS84).
- All season outputs are written as **Cloud-Optimized GeoTIFFs** (GDAL COG:
  TILED=YES, COMPRESS=DEFLATE, with overviews at levels 2/4/8/16/32).

---

## 9. Data Sources (explicit list)

| Data | Source | Version/Date | Notes |
|------|--------|--------------|-------|
| ET outputs (AETI, T, NPP) | pyWaPOR v3 ETLook model | `pywapor_lez_nw/et_look_out.nc` May 2026 | NW quarter only (validation) |
| Land cover / crop mask | Theia OSO 2018 classification | OSO 2018 v1.0; EPSG:2154, ~10 m | Inglada et al. 2017 |
| Precipitation | GEOS-5 `tavg1_2d_lnd_Nx` | 2018 | Weakest link; see methods.md §7 |
| Reference ET (RET/ET0) | ERA5 / AgERA5 (via pyWaPOR) | 2018 | Used for ETc/Kc calculation |
| Crop Kc coefficients | FAO-56 Table 12 | Allen et al. 1998 | Mediterranean values where available |
| Crop stage lengths | `crop_kc.csv` col. `source_primary` | Terres Inovia 2024-2025 + FAO-56 | Per-crop sources vary; see CSV |
| Local sowing/harvest dates | `crop_kc.csv` col. `source_local` | Préfecture de l'Hérault FSIDG 2016 | Legal deadlines; conservative range |
| Biomass/yield parameters (fc, AOT, HI, MC) | **[TO BE CITED per crop — see §5 above]** | — | Currently from FAO-56 and expert values |

---

## 10. Known Limitations (summary)

- Single year (2018): year-to-year variability not captured.
- GEOS-5 precipitation: coarse resolution (~0.5°); known underestimation in complex terrain.
- WaPOR statics (albedo, emissivity) calibrated primarily for sub-Saharan Africa.
- Mixed pixels: at ~20 m Sentinel-2 resolution, parcel boundaries introduce edge effects.
- Greenhouse Kc is a constant expert estimate; energy balance ET does not apply to greenhouses.
- Rapeseed and cereals season spans into 2017; only 2018 monthly rasters are available,
  so winter-crop season sums are incomplete (January–February contribution missing).
