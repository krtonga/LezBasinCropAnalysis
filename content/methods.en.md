# Crop Water Use in the Lez Basin: A Pre-Study Methods Paper

**Authors:**
Kristen Tonga¹ (primary)
Lorlorli Blemayi-Honya¹, Santiago Gomez¹, Guy Charles Koffi¹, Angella Nakkungu¹, Patute Ngetich¹

¹ IHE Delft Institute for Water Education, MSc Water and Sustainable Development

**Supervisor:** {{ site.attribution.supervisors_formatted }} (IHE Delft)

**Date:** May {{ site.attribution.year }}
**Status:** Pre-fieldwork; results draft. Numerical findings will be summarised once the analysis run is complete and stakeholder fieldwork has concluded.

---

## Abstract

This pre-study estimates 2018 agricultural water use in the Lez basin (Hérault, France) as one component of a Food–Water–Energy (FWE) nexus analysis conducted ahead of a two-week fieldwork visit with stakeholders. We combine the **pyWaPOR ETLook** pipeline (an open satellite-based energy-balance model for evapotranspiration developed by FAO and IHE Delft, drawing on Sentinel-2 optical, VIIRS thermal, GEOS-5 meteorological forcing, and ERA5 AgERA5 radiation inputs) with the **Theia OSO 2018** land-cover product (a national-scale crop classification distributed by the French Theia data centre) to derive per-crop actual evapotranspiration, crop water productivity, and blue/green water partitioning at parcel scale. The study deliberately uses open data and open tooling so that the methodology is transferable to other basins. Known limitations are documented explicitly and should be considered before citing the numerical outputs: coarse precipitation forcing, mixed pixels at sub-parcel scales, single-year coverage, and parameter defaults developed for non-European agriculture. Findings are presented through an interactive web viewer to be used in stakeholder interviews and at the field-trip closing session.

---

## Contents

1. [Context and motivation](#1-context-and-motivation)
2. [Study area](#2-study-area)
3. [Indicators computed in this analysis](#3-indicators-computed-in-this-analysis)
4. [Data sources and adequacy](#4-data-sources-and-adequacy)
5. [Crop coefficient parameterization](#5-crop-coefficient-parameterization)
6. [Crop seasons and growth stage durations](#6-crop-seasons-and-growth-stage-durations)
7. [Pipeline and derived calculations](#7-pipeline-and-derived-calculations) (incl. [§7.1 derived indicator formulas](#71-derived-indicator-formulas))
8. [Limitations and assumptions](#8-limitations-and-assumptions)
9. [Outputs delivered](#9-outputs-delivered)
10. [Reproducibility and openness](#10-reproducibility-and-openness)
11. [AI use disclosure](#11-ai-use-disclosure)
12. [Acknowledgments](#12-acknowledgments)
13. [References](#13-references)

[Appendix A. Crop seasons: per-crop decisions, limitations, and sources](#appendix-a-crop-seasons-per-crop-decisions-limitations-and-sources)

---

## 1. Context and motivation

The Lez basin (~750 km², southern France) is the karst-fed source of drinking water for Montpellier (~25 Mm³/year potable abstraction) and supports surrounding Mediterranean agriculture dominated by vineyards, with cereals, orchards, and market gardens in smaller proportions. The basin is regulated by a *débit réservé* (a regulatory minimum streamflow that must be maintained year-round) on the Lez river and by Agence de l'Eau RMC abstraction frameworks. Climate projections for the western Mediterranean indicate warmer, drier summers and more variable autumn rainfall (Cramer et al. 2018; IPCC AR6 WG1 Ch. 12), intensifying competition between urban, agricultural, and ecological water uses precisely when the karst aquifer is at lowest storage.

The **Food–Water–Energy (FWE) nexus** framing treats these three resource systems as interdependent: irrigated agriculture consumes both water and the energy needed to pump it; urban water supply consumes energy to abstract and treat it; competition between users intensifies when one of the three is constrained. This pre-study addresses only the agricultural water-use leg of that framing.

This paper documents the methods for the agricultural water-use component of an FWE nexus analysis being conducted by an IHE Delft MSc team in collaboration with AgroParisTech ahead of a stakeholder fieldwork visit. The agricultural component is one of several lines of inquiry within the team's broader nexus framing; this paper does not address urban demand, hydropower, or aquifer dynamics in detail except where they bear directly on the agricultural analysis.

The pre-study deliberately answers a narrower question than the field trip will: *given satellite data for 2018, what can be inferred about how different crops in the Lez basin used water that year, and how do those uses compare on productivity terms?* The intention is not to deliver definitive numbers but to surface tensions worth raising with stakeholders.

## 2. Study area

The Lez basin extends from the karst plateau north of Montpellier to the urban delta. The Lez source (Source du Lez) is the principal spring; flow is highly seasonal, with summer minimums sustained largely by managed releases. Land cover is predominantly Mediterranean **garrigue** (low, drought-adapted shrubland) and forest in the upper basin, vineyards and mixed agriculture in the middle reaches, and urban/peri-urban land near Montpellier. Mean annual precipitation is approximately 700–900 mm, strongly seasonal (wet autumn–winter, dry summer). **Reference evapotranspiration** (ET₀: the water demand the atmosphere would impose on a hypothetical, well-watered short-grass surface; a baseline against which actual crop water use is compared) is approximately 1100–1300 mm/year (Météo-France SAFRAN climatology). Cropland covers approximately **14%** of the basin (≈9,800 ha out of ≈71,000 ha clipped from the Theia OSO 2018 vector dataset), with vineyards dominating that cropland share.

## 3. Indicators computed in this analysis

The analysis produces the following indicators per Theia OSO crop class and at basin aggregate. Formulas and per-crop parameter values are in §7.1.

| Indicator | Why it matters for the Lez nexus |
|---|---|
| **Crop type map (Theia OSO 2018)** | Disaggregates ET, biomass, and water productivity by crop. Without this, all downstream values are basin averages and the nexus story is shallow. |
| **Crop seasonality / growth-stage Kc curves** | Timing of ET peaks tells you when irrigation pressure is highest, exactly when urban demand also peaks. Built from FAO-56 stage durations (§6) and per-crop Kc trajectories (§5). |
| **Actual ET (AETI)** | Core water-consumption variable. Per-crop seasonal and monthly totals. |
| **Crop water requirement (ETc)** | Modelled atmospheric demand × Kc baseline; used in the Adequacy ratio. |
| **Adequacy (AETI / ETc)** | How fully the crop's modelled water requirement is being met by actual ET. Values >1 indicate measurement / forcing artefacts (see §8). |
| **Transpiration / AETI ratio (T/ET, "beneficial fraction")** | Beneficial vs. non-beneficial water consumption. Higher T/ET = more water going to crop growth vs. soil evaporation. |
| **Net biomass / NPP and total biomass production (TBP)** | Production side of water productivity. Tonnes of dry matter per hectare. |
| **Harvestable yield** | Per-crop conversion from TBP via harvest index, above-ground ratio, photosynthesis correction, and harvested-product moisture content (§7.1). |
| **Biomass and crop water productivity (BWP, cWP)** | Headline nexus metrics in kg/m³: kilograms of biomass / harvested product per cubic metre of water consumed. |
| **Precipitation (PCP) and effective precipitation (Peff)** | Green-water input; PCP from forcing data, Peff via the USDA SCS formula (§7.1). |
| **Blue vs. green water split** | Separates rainfall-fed from irrigation-derived consumption. Computed per crop, on seasonal totals: green = min(AETI, Peff); blue = AETI − green. (Peff is built from monthly PCP and then summed to season; the green/blue partition itself is a per-crop seasonal scalar, not a monthly time series.) The nexus tension lives here. |
| **Productivity gap** | Per-indicator gap between the basin mean and the 90th-percentile pixel; a within-class "best-pixel" benchmark. |

## 4. Data sources and adequacy

The pyWaPOR ETLook pipeline is run locally with the configuration below. Each input is assessed for adequacy at the Lez basin scale, with limitations and recommended alternatives documented. Two of the inputs (GEOS-5 meteorological forcing, ERA5 / AgERA5 radiation) are **reanalysis** products: gridded historical estimates of past atmospheric conditions produced by running a physics-based weather model constrained by all available observations. They are continuous in space and time but smooth out small-scale features and can carry systematic biases over complex terrain.

| Component | Source (configured) | Native resolution | Adequacy for Lez 2018 | Limitations | Alternatives |
|---|---|---|---|---|---|
| **Optical** | SENTINEL2.S2MSI2A_R20m | 20 m, 5-day revisit | Good. Best available free optical for parcel-scale work in France. | Cloud cover in autumn/winter reduces effective revisit. SCL-based masking quality varies. | S2 R10m for visible/NIR (red-edge/SWIR only at 20m); Landsat 8/9 as gap-fill in cloudy periods. |
| **Thermal** | VIIRSL1.VNP02IMG | 375 m, daily | Adequate, with caveats. Sharpened to optical resolution via DMS sharpener. | Sharpening is downscaling, not new measurement; true thermal information content remains ~375m. Mixed pixels over heterogeneous Mediterranean landscapes. | ECOSTRESS (~70m thermal, sparse 2018 coverage); Landsat 8 TIRS (100m, 16-day). |
| **Thermal sharpener** | pywapor.enhancers.dms.thermal_sharpener.sharpen | n/a | Standard pyWaPOR approach (Data Mining Sharpener, Gao et al. 2012). | Sharpener performance degrades over heterogeneous landscapes and at strong thermal contrasts (vineyards next to bare soil). | TsHARP (NDVI-based) as alternative. |
| **Meteorological forcing** | GEOS5.inst3_2d_asm_Nx | ~0.25–0.5°, 3-hourly | Marginal. Coarse for a ~750 km² basin in complex coastal Mediterranean terrain. | Single grid cell may cover most of the basin. Coastal sea breeze and local topographic effects unresolved. | ERA5-Land (9 km, hourly), a significant improvement, freely available. SAFRAN (Météo-France, 8 km), gold standard for France. |
| **Precipitation** | GEOS5.tavg1_2d_lnd_Nx (substituted because CHIRPS returned 403 on IHE network) | ~0.25°, hourly | Weakest link. Reanalysis-based, no direct satellite precipitation assimilation. | Mediterranean autumn convective storms poorly captured by reanalysis. Affects soil moisture initialization and soil evaporation in ETLook; affects water balance closure and blue/green split heavily. | CHIRPS via Google Earth Engine (sidesteps IHE firewall); ERA5-Land precipitation; SAFRAN; Météo-France ground gauges for bias correction. |
| **Solar radiation** | ERA5.sis-agrometeorological-indicators (AgERA5) | 0.1°, daily | Good. AgERA5 is a respected agrometeorological product. | Daily resolution loses sub-daily ET dynamics; coarse vs. terrain on north-facing slopes. | CM SAF SARAH-3 (0.05°) if higher resolution needed. |
| **Soil moisture** | FILE:se_root_out*.nc (pyWaPOR internal) | Inherited from pipeline | Standard pipeline behavior; pyWaPOR computes SE_root from energy balance. | Quality depends entirely on upstream forcing quality, especially precipitation. | External SMAP L3/L4, ASCAT, Sentinel-1-derived SM for cross-validation rather than substitution. |
| **Statics & soils** | STATICS.WaPOR3 | Mixed | Verify before trusting. WaPOR3 statics parameterized primarily for Africa and the Near East. | Crop/landcover classes and parameter lookups may not represent French Mediterranean agriculture (especially vineyards, garrigue). Default rooting depths likely wrong for deep-rooted vines. | Substitute LCC with Theia OSO 2018; soil from SoilGrids 2.0 or European Soil Database (ESDB). Vineyard rooting depth overridden to 1.5–4 m. |
| **Elevation** | COPERNICUS.GLO30 | 30 m | Good. | None significant at basin scale. | IGN RGE ALTI (5m, France-specific), overkill for ETLook. |
| **Whittaker smoothing (S2)** | linear | n/a | Acceptable. | Linear interpolation between cloud-free dates loses phenological curvature, especially around senescence and green-up. | Default Whittaker smoother (penalized) generally produces better NDVI/LAI time series. |
| **Whittaker smoothing (VIIRS thermal)** | linear | n/a | Questionable. | Thermal day-to-day variance from atmospheric water vapor and viewing geometry; linear interpolation propagates noise. | Default Whittaker smoother is more defensible for thermal. |
| **Land cover for ET parameterization** | WaPOR3 statics (default) | n/a | WaPOR3 statics drive pyWaPOR's internal parameterization (rooting depth, canopy fraction, surface roughness); Theia OSO 2018 is used **post-hoc** for masking and zonal statistics, not as a pipeline input. | Crop coefficients, canopy parameters, and rooting depths in WaPOR3 reflect African agricultural systems and are not Mediterranean-tuned. | Substitute Theia OSO into the pipeline land cover input directly (currently post-hoc only); apply crop-specific Kc / canopy / rooting overrides where Mediterranean defaults differ from WaPOR3's African calibration (vineyard rooting depth manually overridden to 1.5–4 m; FAO I&D 56 and 66 crop coefficients; Williams and Ayars 2005 for vineyards; INRAE Montpellier publications). |
| **Validation reference** | None in current config | n/a | Missing. No independent check on ET outputs. | Without validation, defending the absolute numbers is difficult. | Puéchabon ICOS site (~30km, evergreen oak natural vegetation) for monthly ET sanity check; MODIS MOD16 ET as coarse cross-check; GLEAM v3.8 at 0.1° as independent product. Use ≥1 of these for cross-validation. |

Potential data-source improvements that would strengthen future iterations, in rough order of priority: (1) replace GEOS-5 precipitation with CHIRPS via Google Earth Engine or ERA5-Land; (2) substitute Theia OSO for WaPOR3 statics *inside the pyWaPOR run itself* (Theia OSO is currently used post-hoc for masking and zonal statistics, but the WaPOR3 statics still drive ETLook's internal land-cover parameterization: rooting depth, canopy fraction, and similar); (3) add at least one independent ET validation point such as the Puéchabon ICOS site.

## 5. Crop coefficient parameterization

A **crop coefficient** (Kc) is a dimensionless multiplier that scales the reference atmospheric demand (ET₀, §2) up or down to the actual demand of a specific crop at a specific point in its growth cycle. A young crop with little leaf area has a low Kc (e.g. 0.3); a fully developed canopy approaches 1.0–1.2; a senescent or harvested crop drops back. Multiplying day-by-day ET₀ by the time-varying Kc gives **ETc**, the modelled crop water requirement (§7.1). Crop coefficients (Kc) are sourced from FAO Irrigation and Drainage Paper 56 Table 12 (Allen et al. 1998) with Mediterranean-specific adjustments per FAO-56 Equation 62 (RHmin ≈ 30%, u₂ ≈ 2.5 m/s for Lez summer conditions). Vineyard Kc_mid is overridden to 0.55 (vs. FAO-56 generic 0.70) to reflect Languedoc VSP-trained vineyards with bare-row management, following Williams and Ayars (2005). Greenhouses are assigned a constant Kc of 0.60 as a fraction of ET₀, following Möller and Assouline (2007) and Fernández et al. (2010); see §8 for the limitation that energy-balance ET methods do not apply cleanly to covered greenhouse surfaces.

| Theia OSO ID | Class | Kc_ini | Kc_mid | Kc_end | Crop height (m) | Notes |
|---|---|---|---|---|---|---|
| 5 | rapeseed | 0.35 | 1.05 | 0.35 | 0.6 | FAO-56 (Rapeseed/Canola). Lez likely rainfed; lower end of 1.00–1.15 range. |
| 6 | cereals | 0.40 | 1.15 | 0.25 | 1.0 | FAO-56 (Winter Wheat/Barley/Oats). Mediterranean-adjusted Kc_mid ≈ 1.20. |
| 7 | protein_crops | 0.40 | 1.15 | 0.30 | 0.5 | FAO-56 (Legumes group). Aggregates faba bean, peas, lentils, chickpea (dry-harvested). |
| 8 | soya | 0.40 | 1.15 | 0.50 | 0.8 | FAO-56 (Soybeans). Verify class has any pixels in Lez basin. |
| 9 | sunflower | 0.35 | 1.10 | 0.35 | 2.0 | FAO-56 (Sunflower). Mediterranean rainfed/deficit; tall canopy adjustment pushes Kc_mid toward 1.15–1.20. |
| 10 | maize | 0.40 | 1.20 | 0.60 | 2.0 | FAO-56 (Maize Field grain). Mediterranean-adjusted Kc_mid ≈ 1.25. |
| 11 | rice | 1.05 | 1.20 | 0.75 | 1.0 | FAO-56 (Rice). Almost certainly zero pixels in Lez basin; verify before including. |
| 12 | tubers | 0.50 | 1.15 | 0.75 | 0.6 | FAO-56 (Potato). Assumes potato-dominant. |
| 13 | grasslands | 0.30 | 0.75 | 0.75 | 0.20 | FAO-56 (Extensive Grazing Pasture). Conservative for Mediterranean garrigue/extensive pasture. See §6 for dormancy-aware seasonal Kc cycle. |
| 14 | orchards | 0.55 | 0.90 | 0.65 | 4.0 | FAO-56 (Stone fruit no ground cover, no frosts). Generic mixed orchard; olives separately would be 0.65/0.70/0.70. |
| 15 | vineyards | 0.30 | 0.55 | 0.45 | 1.8 | FAO-56 + Williams & Ayars (2005). Override of FAO-56 generic Kc_mid 0.70; Languedoc VSP-trained, bare-row management. Cover-cropped vineyards would be 0.70–0.85. |
| 24 | greenhouses | 0.60 | 0.60 | 0.60 | 3.0 | Möller & Assouline (2007); Fernández et al. (2010). Constant fraction of ET₀; Mediterranean greenhouse range 0.50–0.70. Energy-balance methods not strictly applicable; consider masking instead. |

Where Theia OSO classes aggregate multiple FAO-56 crops (e.g., "protein_crops"), group-level Kc values from FAO-56 Table 12 are used.

## 6. Crop seasons and growth stage durations

Kc curves require both per-stage coefficient values (§5) and per-stage durations to construct the time-varying Kc trajectory through the year. FAO-56 splits a crop's growing season into four stages: **Lini** (initial: sowing through ~10% canopy cover, low Kc), **Ldev** (development: rapid canopy expansion, Kc rising), **Lmid** (mid-season: full canopy, peak Kc), and **Llate** (late-season: senescence, Kc declining). Stage durations are sourced from FAO-56 Table 11 (Mediterranean entries where available) and cross-checked against the Hérault préfecture's official crop harvest deadline document (Direction Départementale des Territoires et de la Mer de l'Hérault 2016), which is validated annually by the Formation Spécialisée des Indemnisations en Cas de Dommages (FSIDG) for crop loss insurance purposes and constitutes the authoritative local source on harvest timing. Where FAO-56 entries are absent or inappropriate (notably winter rapeseed, which dominates French oilseed production but has no FAO-56 entry), French institute sources are used: Terres Inovia for winter rapeseed and Joffre & Rambal (1993) for Mediterranean grassland phenology.

| Theia OSO ID | Class | Sowing/Start | Harvest/End | Lini (d) | Ldev (d) | Lmid (d) | Llate (d) | Total active (d) | Total cycle (d) |
|---|---|---|---|---|---|---|---|---|---|
| 5 | rapeseed (winter) | Aug 15–Sep 5 | July–early Aug | 30 | 120 | 60 | 30 | 240 | ~330 (with winter dormancy) |
| 6 | cereals (winter wheat/barley) | November | June–July | 30 | 140 | 40 | 30 | 240 | 240 |
| 7 | protein_crops (faba bean, peas) | Mar–Apr | Jun–Jul | 20 | 30 | 35 | 15 | 100 | 100 |
| 8 | soya | May | Sep–Oct | 20 | 32 | 60 | 25 | 137 | 137 |
| 9 | sunflower | Apr–May | Aug–Sep | 25 | 35 | 45 | 25 | 130 | 130 |
| 10 | maize (grain) | April | Aug–Sep | 30 | 40 | 50 | 30 | 150 | 150 |
| 11 | rice | May | October | 30 | 30 | 60 | 30 | 150 | 150 |
| 12 | tubers (potato, main season) | Mar–Apr | Aug–Sep | 25 | 30 | 38 | 30 | 123 | 123 |
| 12 | tubers (potato, primeur) | Jan–Feb | May–Jun | 20 | 25 | 30 | 20 | 95 | 95 |
| 13 | grasslands | Year-round bimodal | Year-round bimodal | n/a | n/a | n/a | n/a | ~250 active | 365 |
| 14 | orchards (deciduous stone fruit) | March (leaf-out) | Nov–Dec (leaf drop) | 20 | 70 | 120 | 60 | 270 | 270 |
| 14 | orchards (olives, evergreen) | March (new leaves) | December | 30 | 90 | 60 | 90 | 270 | 365 |
| 15 | vineyards (wine grapes) | April (budbreak) | Sep–Nov (harvest + leaf fall) | 30 | 60 | 40 | 80 | 210 | 210 |
| 24 | greenhouses | Year-round (rotational) | Year-round (rotational) | n/a | n/a | n/a | n/a | 365 | 365 |

**Highest-impact assumption: Mediterranean grassland phenology.** Unlike temperate grasslands, Mediterranean grasslands exhibit a bimodal phenology with summer dormancy driven by drought (Joffre & Rambal 1993): active growth February–May and October–December, dormant June–September. The standard FAO-56 Grass Pasture entry implies continuous growth and substantially overestimates summer ET in Mediterranean conditions. We apply a dormancy-aware seasonal Kc cycle: Kc ≈ 0.30 in summer (Jun–Sep), Kc ≈ 0.75 in spring (Mar–May) and autumn (Oct–Nov), Kc ≈ 0.40 in winter (Dec–Feb). This is the most consequential timing assumption in the analysis and is documented explicitly in the limitations.

Detailed sources, decisions, and per-crop limitations for each entry are documented in **Appendix A**.

## 7. Pipeline and derived calculations

The pyWaPOR ETLook pipeline produces actual evapotranspiration (**AETI**, the total water leaving the soil-plant surface as vapour: soil evaporation, plant transpiration, and intercepted rainfall re-evaporated from leaves), alongside reference evapotranspiration (ET₀, §2), the **transpiration / evaporation split** (T versus E within AETI; T is the "useful" part going through plants, E is direct evaporation from soil), and **net primary production** (NPP, the net mass of carbon plants fix into biomass per unit area per unit time). Outputs are at 20 m resolution, with thermal information sharpened from VIIRS native 375 m via the DMS thermal sharpener (Gao et al. 2012). Outputs are aggregated to Theia OSO 2018 crop polygons using per-class binary masks. The time domain is full-year 2018 at monthly aggregation (12 timesteps); seasonal totals are accumulated per crop using the per-crop **SOS** (start of season) / **EOS** (end of season) dates from §6.

From the ETLook outputs and Kc-based estimates, the indicators listed in §3 are computed per crop class. Yield is derived by applying crop-specific harvest indices, above-ground ratios, photosynthesis corrections, and harvested-product moisture contents (§7.1). Blue/green water partitioning is computed once per crop, on seasonal totals: green = min(AETI, effective P); blue = AETI − green. The monthly cropland-water chart shown in the viewer plots total cropland AETI per month against a separate rainfall-on-cropland line; it is not a per-crop blue/green time series.

### 7.1 Derived indicator formulas

The implementation-level formulas used to derive the indicators listed in §3 are documented below. Per-crop parameters in the yield table are preliminary; entries marked **[TO BE CITED]** require literature references before the study has concluded.

**Effective precipitation (USDA SCS, monthly).** Computed from monthly PCP totals:

```
For P ≤ 250 mm/month:  Peff = P × (125 − 0.2 × P) / 125
For P > 250 mm/month:  Peff = 125 + 0.1 × P
```

The formula was developed for US conditions (USDA Soil Conservation Service, cited in FAO-56 Annex); applicability to Mediterranean climates with dry summers and wet winters is approximate.

**Total biomass production (TBP).** From pyWaPOR NPP outputs:

```
TBP (t/ha) = NPP (g C/m²/season) × 22.222 / 1000
```

Derivation: 1 g C/m² ≡ (1 / 0.45) g dry matter/m² ≡ 0.02222 t DM/ha, with carbon fraction of dry matter = 0.45 (standard plant biochemistry). Source: WaPOR/pyWaPOR technical notes **[TO BE CITED: specific WaPOR document]**.

**Harvestable yield.** From TBP and four crop-specific factors:

```
Yield (t/ha) = HI × AOT × fc × TBP / (1 − MC)
```

where HI = harvest index (the harvestable fraction of above-ground biomass: for example, the peaches in an orchard make up the HI portion, while the trunk, branches, and leaves do not), AOT = above-ground over total biomass ratio (above-ground biomass divided by above-ground + roots), fc = light-use efficiency correction (1.0 for C3 crops; 1.25 for C4 crops, e.g. maize; **C3** and **C4** are two photosynthesis pathways, with C4 plants converting sunlight to biomass more efficiently per unit of water, particularly under hot, dry conditions), MC = moisture content of the harvested product on a fresh-weight basis.

| Crop | fc | AOT | HI | MC | Notes |
|------|----|-----|-----|------|-------|
| Rapeseed | 1.00 | 0.90 | 0.35 | 0.09 | **[TO BE CITED]** |
| Cereals (winter wheat) | 1.00 | 0.90 | 0.45 | 0.13 | **[TO BE CITED]** |
| Protein crops | 1.00 | 0.80 | 0.40 | 0.12 | **[TO BE CITED]** |
| Soya | 1.00 | 0.80 | 0.35 | 0.13 | **[TO BE CITED]** |
| Sunflower | 1.00 | 0.80 | 0.35 | 0.09 | **[TO BE CITED]** |
| Maize (grain) | **1.25** | 0.85 | 0.50 | 0.14 | fc=1.25 reflects C4 photosynthesis |
| Rice | 1.00 | 0.85 | 0.50 | 0.14 | **[TO BE CITED]** |
| Tubers (potato) | 1.00 | 0.80 | 0.65 | 0.78 | High MC (fresh-weight basis) **[TO BE CITED]** |
| Grasslands | 1.00 | 0.90 | 0.85 | 0.15 | **[TO BE CITED]** |
| Orchards (deciduous stone fruit) | 1.00 | 0.55 | 0.80 | 0.85 | Apple/peach/pear; high MC fresh fruit **[TO BE CITED]** |
| Orchards (olives) | 1.00 | 0.55 | 0.30 | 0.50 | Mediterranean olives; lower HI (oil/pulp ratio); see §6 and Appendix A on the local 60% olive / 40% deciduous orchard mix used in this analysis |
| Vineyards | 1.00 | 0.70 | 0.35 | 0.75 | Wine grapes **[TO BE CITED]** |
| Greenhouses | 1.00 | 0.85 | 0.75 | 0.90 | Expert estimate **[TO BE CITED]** |

Yield draws on harvest indices from Steduto et al. 2012 (FAO I&D 66) where literature values are available; the entries above currently mix FAO-56 / Steduto-derived defaults with expert estimates for crops without direct literature values, as flagged.

**Water productivity metrics.**

```
BWP (kg/m³)            = TBP (t/ha) / AETI (mm) × 100
cWP (kg/m³)            = Yield (t/ha) / AETI (mm) × 100
Beneficial fraction    = T / AETI                       (dimensionless)
Adequacy               = AETI / ETc                     (dimensionless)
Relative water deficit = 1 − AETI / ETx                 (dimensionless)
```

The × 100 in BWP/cWP is a unit conversion: 1 t/ha ÷ 1 mm = 100 kg/m³. Adequacy values > 1 indicate measured ET above modelled crop water requirement, which is physically implausible for water-limited crops. For the present 2018 run this reflects the GEOS-5 wet bias on the precipitation forcing (see §4 and §8). ETx in the relative-water-deficit formula is the 95th percentile of AETI across all pixels within the crop mask, treated as a within-class "best-pixel" benchmark.

**Productivity gap analysis.** Per indicator, the target performance is the TARGET_PERCENTILE-th percentile (default 90th) of the indicator's spatial distribution across crop-mask pixels:

```
Gap (basin scalar)  = Target − Mean
Gap map (per pixel) = Target − pixel value, where pixel < Target;  NaN otherwise
```

The 90th-percentile target follows the FAO Water Productivity framework convention of treating top-decile observed performance as a reachable benchmark.

**Spatial conventions.**

- **Numerical rasters** (PCP, ET₀, AETI inputs) are resampled to the AETI grid using **bilinear interpolation** (rasterio default).
- **Crop masks** are rasterized via `gdal_rasterize` at the pyWaPOR grid (~22 m WGS84) and resampled to the AETI grid using **nearest-neighbour** in `resample_crop_masks.py`. Binary masks must not blur — bilinear would produce intermediate values that are neither "in the class" nor "out of it".
- **CRS choices through the pipeline** (three coordinate systems are involved end-to-end):
  - Theia OSO source shapefiles: **Lambert-93 (EPSG:2154)**.
  - Crop masks reprojected to **WGS84 (EPSG:4326)** at the rasterization step (~0.0002°, ~22 m), aligned to the pyWaPOR output grid.
  - pyWaPOR analysis outputs: **UTM zone 31N (EPSG:32631)** for the NW quarter.
  - Viewer COGs reprojected to **Web Mercator (EPSG:3857)** by `viewer_prep_cogs.py` using nearest-neighbour resampling, because `maplibre-cog-protocol` does not reproject at render time.
- NODATA value = **−9999.0** (written to all output GeoTIFFs).
- Season-scale outputs are written as **Cloud-Optimized GeoTIFFs** (`TILED=YES`, `COMPRESS=DEFLATE`, with overviews at zoom levels 2 / 4 / 8 / 16 / 32).

## 8. Limitations and assumptions

Limitations are documented in detail in §4 and Appendix A. The most important to consider when interpreting results:

- **Precipitation forcing.** GEOS-5 substituted for CHIRPS due to network access constraints. Affects blue/green water partitioning more than AETI estimates. Bias correction against SAFRAN recommended before downstream use of blue/green numbers.
- **Coarse meteorological forcing.** GEOS-5 at ~0.25–0.5° is undersized for the Lez basin. ERA5-Land or SAFRAN re-run recommended if time permits.
- **Thermal information content.** Effectively ~375 m despite sharpening to 20 m. Affects per-parcel variance, not basin totals.
- **WaPOR3 statics calibration.** Defaults reflect African systems; vineyard rooting depth manually overridden to 1.5–4 m.
- **Mediterranean grassland phenology.** Standard FAO-56 Grass Pasture overestimates summer ET; we apply a bimodal dormancy-aware Kc cycle (§6, Joffre & Rambal 1993). Highest-impact timing assumption in the analysis.
- **Single year.** 2018 only. Single-year results should not be generalized to climate-change projections without multi-year analysis.
- **Quarter extrapolation.** Per-crop pyWaPOR coverage is currently the NW quarter only. Basin-scale numbers in the viewer are computed by multiplying the NW-quarter per-class pixel mean by the **full-basin** OSO area for that class. This assumes the per-class water-use behaviour observed in the NW quarter is representative of the same class across the rest of the basin (microclimate, slope, aspect, and irrigation-practice variation are not modelled). The other three quarters' pyWaPOR runs are pending; once they complete, this extrapolation step is removed.
- **No within-year crop rotation.** Crop class is treated as static for 2018: each pixel belongs to one Theia OSO class for the whole year. Multi-crop rotations on the same parcel (e.g. winter cereal followed by summer maize) are not represented; the dominant cycle for each Theia class governs Kc and season.
- **Mixed pixels.** Statistics aggregated to OSO polygons rather than reported at native pixel resolution.
- **Theia OSO class composition.** Several classes aggregate crops with different cycles and Kc values (protein_crops, orchards, tubers). RPG 2018 cross-reference is recommended as a follow-up.
- **Greenhouses kept in pipeline as nominal.** Greenhouses (class 24) are processed with Kc=0.60 rather than masked out, but the energy-balance ET physics does not apply cleanly to covered surfaces. Treat reported AETI / cWP / Yield for class 24 as nominal placeholders, not measurements; consider masking before publication of greenhouse-specific numbers.
- **Urban and ecological flow.** Framed as context but not modelled in this paper.

## 9. Outputs delivered

This pre-study produces the following artefacts, published via the interactive web viewer at {{ site.links.github }}:

- **Basin-wide land-cover statistics** for all 24 Theia OSO 2018 classes (per-class hectares and basin shares, derived from the OSO vector clip to the Lez basin polygon).
- **Per-crop seasonal water-use indicators** for the NW quarter of the basin (current pyWaPOR coverage): AETI, ETc, Adequacy, transpiration, BlueETa, GreenETa, total biomass production (TBP), harvestable yield, biomass and crop water productivity (BWP, cWP), and productivity-gap maps.
- **Basin-wide monthly raster overlays** (interactive map, full basin extent regardless of crop selection): inputs PCP and RET (the model forcing), and intermediate / total pyWaPOR outputs E, I, NPP, RSM, AETI, T. Surfaced for stakeholders to inspect the inputs and intermediate outputs that feed the per-crop indicators.
- **Monthly cropland water consumption** at basin scale (per-crop monthly Mm³ vectors, derived as mean per-class AETI from the NW quarter × full-basin OSO area), with a monthly rainfall-on-cropland overlay.
- **Stakeholder-facing story page** (English + French) summarising key findings with interactive bar / pie / stacked / line charts.
- **Interactive landcover viewer** with the Theia OSO crop overlay (PMTiles), basemap toggle (cartographic / satellite), and click-to-inspect per-class statistics.
- **Methods white paper** (this document).
- **Source code, scripts, and conda environment specification** for full reproducibility.

## 10. Reproducibility and openness

All processing uses open data and open-source tooling. The pyWaPOR pipeline configuration, AOI shapefile, crop parameter tables, and post-processing scripts are archived alongside this paper. The web viewer is built as a no-build static site with a manifest-driven architecture and template-friendly content separation, allowing the same viewer to be adapted to other basins by editing content files and updating the data manifest. Source code and full configuration are available at {{ site.links.github }}.

## 11. AI use disclosure

In the spirit of transparency required by IHE academic guidelines and current scientific norms regarding generative AI:

- **Script conversion.** The class materials provided in IHE Module 5 (Remote Sensing for Agricultural Management), including pyWaPOR and WaPORIPA Jupyter notebooks and supporting class scripts, were converted to standalone Python scripts to generate the analytical outputs documented here. This conversion was performed with supervised assistance from Anthropic's Claude Code, with all generated code reviewed and tested by the primary author before use.
- **Web viewer design and development.** The architecture, schema design, content/code separation strategy, wireframing, and build specification for the interactive viewer were developed in iterative dialogue with Anthropic's Claude (claude.ai). Implementation of the viewer used Claude Code under primary author supervision.
- **Writing assistance.** This methods paper was drafted with editorial assistance from Claude. The primary author is responsible for all factual claims, methodological choices, interpretation, and final wording. The draft is iterated by the author team prior to submission.
- **Translation.** French translation of associated stakeholder-facing materials (web viewer story page) is performed jointly by co-author Guy Charles Koffi and AI translation tools (DeepL and Claude), with manual review by Koffi.

No generative AI was used to fabricate data, citations, or results. All numerical outputs are produced by the documented pyWaPOR pipeline; all citations were independently verified by the primary author against original sources.

## 12. Acknowledgments

The authors thank IHE Delft Module 5 (Remote Sensing for Agricultural Management) instructors for the foundational scripts and WaPORIPA tooling that made this analysis possible. We thank {{ site.attribution.supervisors_formatted }} for supervision throughout the pre-study. AgroParisTech colleagues are acknowledged for their forthcoming collaboration during the fieldwork phase.

## 13. References

Allen, R.G., Pereira, L.S., Raes, D., Smith, M. (1998). *Crop evapotranspiration — Guidelines for computing crop water requirements.* FAO Irrigation and Drainage Paper 56, Tables 11 and 12. FAO, Rome. Available at https://www.fao.org/4/x0490e/x0490e0b.htm

Cramer, W., Guiot, J., Fader, M., et al. (2018). Climate change and interconnected risks to sustainable development in the Mediterranean. *Nature Climate Change* 8: 972–980.

Direction Départementale des Territoires et de la Mer de l'Hérault (2016). *Département Hérault — Dates extrêmes de levée des récoltes 01/07/2016 - 30/06/2017.* Validated by FSIDG (Formation Spécialisée des Indemnisations en Cas de Dommages) on 13 December 2016. Préfecture de l'Hérault. Available at https://www.herault.gouv.fr/content/download/21016/156716/file/Dates_levee_RAA.pdf

Fernández, M.D., Bonachela, S., Orgaz, F., Thompson, R.B., López, J.C., Granados, M.R., Gallardo, M., Fereres, E. (2010). Measurement and estimation of plastic greenhouse reference evapotranspiration in a Mediterranean climate. *Irrigation Science* 28(6): 497–509. doi:10.1007/s00271-010-0210-z

Gao, F., Kustas, W.P., Anderson, M.C. (2012). A Data Mining approach for sharpening thermal satellite imagery over land. *Remote Sensing* 4: 3287–3319.

Inglada, J., Vincent, A., Arias, M., Tardy, B., Morin, D., Rodes, I. (2017). Operational high resolution land cover map production at the country scale using satellite image time series. *Remote Sensing* 9: 95.

IPCC (2021). *Climate Change 2021: The Physical Science Basis. Contribution of Working Group I to the Sixth Assessment Report of the Intergovernmental Panel on Climate Change.* Cambridge University Press.

Joffre, R., Rambal, S. (1993). How tree cover influences the water balance of Mediterranean rangelands. *Ecology* 74(2): 570–582.

Möller, M., Assouline, S. (2007). Effects of a shading screen on microclimate and crop water requirements. *Irrigation Science* 25: 171–181. doi:10.1007/s00271-006-0045-9

Steduto, P., Hsiao, T.C., Fereres, E., Raes, D. (2012). *Crop yield response to water.* FAO Irrigation and Drainage Paper 66. FAO, Rome.

Terres Inovia (2024). *Guide de culture colza, édition 2024.* Institut technique des professionnels de la filière des huiles et protéines végétales et de la filière chanvre. Available at https://www.terresinovia.fr

Williams, L.E., Ayars, J.E. (2005). Grapevine water use and the crop coefficient are linear functions of the shaded area measured beneath the canopy. *Agricultural and Forest Meteorology* 132(3-4): 201–211. doi:10.1016/j.agrformet.2005.07.010

---

## Appendix A. Crop seasons: per-crop decisions, limitations, and sources

This appendix documents the per-crop reasoning behind the growth stage durations adopted in §6, including local Hérault-specific evidence cross-checked against FAO-56 Mediterranean entries.

| Crop (Theia OSO) | Decision and limitation | Sources |
|---|---|---|
| **Rapeseed (5)** | FAO-56 Table 11 has no rapeseed entry. Winter rapeseed (colza d'hiver) is dominant in France. Verified Terres Inovia practice: sow mid-August to early September, target emergence before September 1, "4 leaves" by late September; harvest July to early August. Hérault préfecture sets harvest deadline July 31 (plain) / August 31 (mountain). Adopted cycle: Lini 30 / Ldev 120 / Lmid 60 / Llate 30 (~240 days active, with winter dormancy bringing total ~330 days). | Allen et al. 1998 (FAO-56); Terres Inovia 2024–2025 implantation guidance; Préfecture de l'Hérault (FSIDG 2016) |
| **Cereals (6)** | Hérault dominated by winter wheat and winter barley. FAO-56 Mediterranean winter wheat (30/140/40/30, November sowing). Hérault préfecture confirms harvest deadline July 31 (plain) / August 31 (mountain) for tender wheat, durum wheat, barley, and oats. Spring cereals assumed negligible; verify via RPG 2018 cross-reference. | Allen et al. 1998 (FAO-56 Table 11, Winter Wheat Mediterranean); Préfecture de l'Hérault (FSIDG 2016) |
| **Protein crops (7)** | Theia OSO aggregates faba bean, peas, lentils, chickpeas (different cycles). Adopted faba bean Mediterranean cycle (20/30/35/15, ~100 days, March/April sowing) as default. Hérault préfecture confirms peas harvest by July 31 (plain) / August 31 (mountain). Lentils typically autumn-sown if present; high-uncertainty class. | Allen et al. 1998 (FAO-56 Table 11, Faba bean / Peas Mediterranean); Préfecture de l'Hérault (FSIDG 2016) |
| **Soya (8)** | Uncommon in Hérault. FAO-56 Central USA analog (20/30-35/60/25, ~140 days, May sowing). Hérault préfecture sets harvest deadline November 30 (plain) / December 31 (mountain), confirming late season relative to other oilseeds. Verify presence in OSO before relying on these numbers. | Allen et al. 1998 (FAO-56 Table 11, Soybeans Central USA); Préfecture de l'Hérault (FSIDG 2016) |
| **Sunflower (9)** | FAO-56 Mediterranean entry directly applicable (25/35/45/25, ~130 days, April/May sowing). Hérault préfecture confirms harvest deadline October 31 (plain) / November 30 (mountain). Well-aligned with French Mediterranean practice. | Allen et al. 1998 (FAO-56 Table 11, Sunflower Mediterranean/California); Préfecture de l'Hérault (FSIDG 2016) |
| **Maize (10)** | Hérault maize is summer grain maize. FAO-56 Spain spring/summer entry directly applicable (30/40/50/30, ~150 days, April sowing). Hérault préfecture confirms harvest deadline November 30 for grain and seed maize, consistent with grain-fill drying period. | Allen et al. 1998 (FAO-56 Table 11, Maize grain Spain); Préfecture de l'Hérault (FSIDG 2016) |
| **Rice (11)** | Almost certainly not present in the Lez basin (Camargue is the rice region). FAO-56 Mediterranean cycle (30/30/60/30, ~150 days, May start) included for completeness only. Recommend masking or treating any "rice" pixels as misclassification. Note: Hérault préfecture document does not list rice, supporting the conclusion that it is not a recognized crop in the département. | Allen et al. 1998 (FAO-56 Table 11, Rice Mediterranean) |
| **Tubers (12)** | Hérault préfecture explicitly distinguishes two cycles: primeur (harvest by June 30 plain / July 31 mountain) and conservation (harvest by November 30). FAO-56 main-season Mediterranean cycle (25/30/30-45/30) used as default for the conservation crop. Primeur pixels (Feb–Jun cycle) are mis-parameterized; if RPG cross-reference can identify them, treat separately. | Allen et al. 1998 (FAO-56 Table 11, Potato semi-arid); Préfecture de l'Hérault (FSIDG 2016) |
| **Grasslands (13): highest-impact assumption** | Mediterranean grasslands have bimodal phenology with summer dormancy. FAO-56 temperate Grass Pasture entries imply continuous growth and overestimate summer ET. Adopted: dormancy-aware seasonal Kc (Kc≈0.30 Jun–Sep, Kc≈0.75 Mar–May/Oct–Nov, Kc≈0.40 Dec–Feb). Hérault préfecture sets prairies (foin) harvest deadline November 1, consistent with autumn senescence/end-of-season cut. | Joffre & Rambal 1993; corroborated by Mediterranean ecology literature; Préfecture de l'Hérault (FSIDG 2016) |
| **Orchards (14)** | Theia OSO aggregates deciduous (peach, apricot, almond) and evergreen (olive). FAO-56 Stone Fruit Mediterranean cycle (20/70/120/60, ~270 days, March leaf-out). Hérault préfecture: peach/nectarine harvest by September 30, apple harvest by October 31 (plain) / November 30 (mountain). Olive orchards within the OSO class are mis-parameterized; FAO-56 olive Mediterranean entry (30/90/60/90) preferred for olive pixels if separable. | Allen et al. 1998 (FAO-56 Table 11, Stone Fruit / Olives); Préfecture de l'Hérault (FSIDG 2016) |
| **Vineyards (15)** | FAO-56 mid-latitude wine grape entry (30/60/40/80, ~210 days, April budbreak). Long late-season (~80 days, Aug–Oct) captures véraison. Hérault préfecture sets harvest deadline November 30 for all wine categories (vin de table, V.D.Q.S., vin de pays, Muscat AOC, Clairette du Languedoc, raisin de table), consistent with FAO-56 mid-latitude cycle. Year-specific budbreak varies by ±2 weeks. | Allen et al. 1998 (FAO-56 Table 11, Grapes mid-latitudes wine); Williams & Ayars 2005; Préfecture de l'Hérault (FSIDG 2016) |
| **Greenhouses (24)** | Greenhouse production rotates 2–3 short crops per year. No single season applies. Treat as continuous with Kc=0.60. Möller & Assouline 2007 measured ETc 38% lower than open field (supporting Kc≈0.60); Fernández et al. 2010 measured Almería plastic greenhouse ETo from <1 mm/day winter to ~4 mm/day summer. Energy-balance ET methods not strictly applicable; values are nominal. Hérault préfecture does not regulate greenhouses with a fixed harvest date. | Möller & Assouline 2007; Fernández et al. 2010; no FAO-56 entry |

### Cross-cutting limitations (applies to all crops)

- **Theia OSO class composition.** Several classes aggregate crops with different cycles (protein_crops, orchards, tubers). RPG 2018 cross-reference can disambiguate where parcel-level declarations are available; recommended as a follow-up improvement.
- **Year-specific timing.** 2018 had a wet spring and hot dry summer in southern France. Generic FAO-56 Mediterranean dates may miss 2018-specific phenology by 1–2 weeks. Probably not material for annual ET totals; could affect monthly attribution.
- **Hérault préfecture document vintage.** The fetched FSIDG document covers 2016–2017. Harvest deadlines are administrative and stable across years (set for crop loss insurance), not weather-dependent. Should be treated as authoritative for cycle endpoints; verify the most current year's version through Préfecture de l'Hérault if available.

---

*This is a pre-fieldwork methods paper. Results will be added once the pyWaPOR run completes and stakeholder fieldwork has concluded. Comments and corrections welcome; open an issue at {{ site.links.github }} or email [{{ site.links.contact }}](mailto:{{ site.links.contact }}).*
