# Crop Water Use in the Lez Basin: A Pre-Study Methods Paper

**Authors:**
Kristen Tonga¹ (primary)
Patute Ngetich¹, Angella Nakkungu¹, Santiago Gomez¹, Guy Charles Koffi¹, Lorlorli Blemayi-Honya¹

¹ IHE Delft Institute for Water Education, MSc Water and Sustainable Development

**Supervisors:** Leonardo Alfonso, Akosua Boakye-Ansah (IHE Delft)

**Date:** May 2026
**Status:** Pre-analysis / pre-fieldwork. Results pending.

---

## Abstract

This pre-study estimates 2018 agricultural water use in the Lez basin (Hérault, France) as one component of a Food–Water–Energy (FWE) nexus analysis conducted ahead of a two-week fieldwork visit with stakeholders. We combine the pyWaPOR ETLook pipeline (Sentinel-2 optical, VIIRS thermal, GEOS-5 meteorological forcing, ERA5 AgERA5 radiation) with the Theia OSO 2018 land cover product to derive per-crop actual evapotranspiration, crop water productivity, and blue/green water partitioning at parcel scale. The study deliberately uses open data and open tooling so that the methodology is transferable to other basins. Known limitations — coarse precipitation forcing, mixed pixels at sub-parcel scales, single-year coverage, and parameter defaults developed for non-European agriculture — are documented explicitly and should be considered before citing the numerical outputs. Findings will be presented through an interactive web viewer ahead of stakeholder interviews and at the field-trip closing session.

---

## 1. Context and motivation

The Lez basin (~750 km², southern France) is the karst-fed source of drinking water for Montpellier (~25 Mm³/year potable abstraction) and supports surrounding Mediterranean agriculture dominated by vineyards, with cereals, orchards, and market gardens in smaller proportions. The basin is regulated by a *débit réservé* on the Lez river and by Agence de l'Eau RMC abstraction frameworks. Climate projections for the western Mediterranean indicate warmer, drier summers and more variable autumn rainfall (Cramer et al. 2018; IPCC AR6 WG1 Ch. 12), intensifying competition between urban, agricultural, and ecological water uses precisely when the karst aquifer is at lowest storage.

This paper documents the methods for the agricultural water-use component of an FWE nexus analysis being conducted by an IHE Delft MSc team in collaboration with AgroParisTech ahead of a stakeholder fieldwork visit. The agricultural component is one of several lines of inquiry within the team's broader nexus framing; this paper does not address urban demand, hydropower, or aquifer dynamics in detail except where they bear directly on the agricultural analysis.

The pre-study deliberately answers a narrower question than the field trip will: *given satellite data for 2018, what can be inferred about how different crops in the Lez basin used water that year, and how do those uses compare on productivity terms?* The intention is not to deliver definitive numbers but to surface tensions worth raising with stakeholders.

## 2. Study area

The Lez basin extends from the karst plateau north of Montpellier to the urban delta. The Lez source (Source du Lez) is the principal spring; flow is highly seasonal, with summer minimums sustained largely by managed releases. Land cover is predominantly Mediterranean garrigue and forest in the upper basin, vineyards and mixed agriculture in the middle reaches, and urban/peri-urban land near Montpellier. Mean annual precipitation is approximately 700–900 mm, strongly seasonal (wet autumn–winter, dry summer). Reference evapotranspiration is approximately 1100–1300 mm/year (Météo-France SAFRAN climatology). The agricultural fraction of the basin is approximately 25% by area, with vineyards covering the majority of agricultural land.

## 3. Indicators

The analysis produces the following indicators per Theia OSO crop class and at basin aggregate, organized by the FWE nexus components they inform.

| Indicator | Why it matters for Lez nexus | What to look for |
|---|---|---|
| **Crop type map (Theia OSO 2018)** | Disaggregates ET, biomass, and water productivity by crop. Without this, all downstream values are basin averages and the nexus story is shallow. | Vineyards (likely dominant), winter cereals, market gardening, orchards, fallow. Validated against RPG 2018. Note class confusion in OSO between summer/winter cereals and orchard/vineyard. |
| **Irrigated vs. rainfed mask** | Lez agriculture is mixed — vineyards are often rainfed/deficit, market gardening is irrigated. Treating them together collapses the entire blue-water question. | Derived from ET₀–AETI gap during dry months (Jun–Aug); cross-checked with RPG irrigation declarations and BRGM/Agence de l'Eau abstraction data. |
| **Crop calendars / phenology** | Timing of ET peaks tells you when irrigation pressure on the karst aquifer is highest — exactly when urban demand also peaks. | NDVI time series per class. Mediterranean dormancy patterns, vineyard veraison/harvest signals. |
| **Actual ET (AETI)** | Core water-consumption variable. Annual and dekadal totals per crop. | Mediterranean range ~400–900 mm/yr depending on crop and irrigation. Compared with Lez ET literature (HSM Montpellier publications). |
| **Reference ET (ET₀)** | Atmospheric demand baseline; needed for stress and irrigation gap calculations. | ~1100–1300 mm/yr for Montpellier area. WaPOR ET₀ compared against Météo-France SAFRAN where available. |
| **ET deficit (ET₀ − AETI)** | Proxy for water stress and unmet demand; reveals where irrigation is or isn't compensating. | High deficit on rainfed parcels = stress. Low deficit on summer parcels = irrigation. Spatial pattern should track aquifer-fed irrigation zones. |
| **Transpiration / AETI ratio** | Beneficial vs. non-beneficial water consumption. Higher T/ET = more water going to crop growth vs. soil evaporation. | Mature, dense crops typically T/ET > 0.7. Sparse vineyards typically lower (0.4–0.6). |
| **Net biomass / NPP (AGBP)** | Production side of water productivity. Tons/ha equivalents per pixel. | Compared across crop classes against FAO/INRAE reference yields for Languedoc. |
| **Yield (derived)** | Translates biomass into the food/economic side of the nexus. | Harvest index per crop from Steduto et al. 2012 (FAO I&D 66). At 20m resolution, yields are pixel-mixed; reported at parcel-aggregated level. |
| **Crop water productivity (CWP)** | Headline nexus metric: kg yield / m³ ET, or €/m³, or kcal/m³. | Compared across crops on the same map. Trade-offs surface here (e.g., vineyards strong on €/m³, weak on kcal/m³). |
| **Precipitation** | Green-water input; basis for blue/green water split. | Lez basin annual ~700–900 mm, strongly seasonal. See §4 for caveats on precipitation forcing. |
| **Blue vs. green water split** | Separates rainfall-fed from irrigation/aquifer-fed consumption. The nexus tension lives here. | green = min(AETI, effective P); blue = AETI − green, monthly. Blue water totals reconciled against reported abstraction volumes where data permits. |
| **Karst aquifer linkage (Lez source)** | The Lez spring is the basin's hydrological pivot. Without this, it's not a Lez nexus study. | BRGM piezometric data, ADES portal, published Lez recession curves (Ladouche, Bicalho). Summer ET-blue compared against reported aquifer drawdown. |
| **Pumping / irrigation energy** | The "E" in WEF nexus. Most studies skip this; including it strengthens the analysis. | Energy (kWh) ≈ ρgQh / η. Inputs: groundwater depth (BRGM), abstraction volume, typical pump efficiency (~0.6–0.7). Reported as kWh per m³ delivered and per ha irrigated. |
| **Urban water demand (Montpellier)** | The competing user. The nexus framing is incomplete without it. | ~20–30 Mm³/yr potable from Lez source (Métropole de Montpellier, Veolia/SDEI reporting). Seasonal urban demand overlaid against agricultural ET. |
| **Reserved ecological flow (Débit Réservé)** | Regulatory floor on the river. Defines the operational envelope of the nexus. | Agence de l'Eau RMC documentation. Summer 2018 low flows compared against threshold. |
| **Economic / caloric value layer** | Makes water productivity meaningful in policy terms. | Agreste (French agricultural statistics) for crop prices and yields per Hérault département. FAO food composition tables for kcal. Reported €/m³ and kcal/m³ alongside kg/m³. |

## 4. Data sources and adequacy

The pyWaPOR ETLook pipeline is run locally with the configuration below. Each input is assessed for adequacy at the Lez basin scale, with limitations and recommended alternatives documented.

| Component | Source (configured) | Native resolution | Adequacy for Lez 2018 | Limitations | Alternatives |
|---|---|---|---|---|---|
| **Optical** | SENTINEL2.S2MSI2A_R20m | 20 m, 5-day revisit | Good. Best available free optical for parcel-scale work in France. | Cloud cover in autumn/winter reduces effective revisit. SCL-based masking quality varies. | S2 R10m for visible/NIR (red-edge/SWIR only at 20m); Landsat 8/9 as gap-fill in cloudy periods. |
| **Thermal** | VIIRSL1.VNP02IMG | 375 m, daily | Adequate, with caveats. Sharpened to optical resolution via DMS sharpener. | Sharpening is downscaling, not new measurement; true thermal information content remains ~375m. Mixed pixels over heterogeneous Mediterranean landscapes. | ECOSTRESS (~70m thermal, sparse 2018 coverage); Landsat 8 TIRS (100m, 16-day). |
| **Thermal sharpener** | pywapor.enhancers.dms.thermal_sharpener.sharpen | — | Standard pyWaPOR approach (Data Mining Sharpener, Gao et al. 2012). | Sharpener performance degrades over heterogeneous landscapes and at strong thermal contrasts (vineyards next to bare soil). | TsHARP (NDVI-based) as alternative. |
| **Meteorological forcing** | GEOS5.inst3_2d_asm_Nx | ~0.25–0.5°, 3-hourly | Marginal. Coarse for a ~750 km² basin in complex coastal Mediterranean terrain. | Single grid cell may cover most of the basin. Coastal sea breeze and local topographic effects unresolved. | ERA5-Land (9 km, hourly) — significant improvement, freely available. SAFRAN (Météo-France, 8 km) — gold standard for France. |
| **Precipitation** | GEOS5.tavg1_2d_lnd_Nx (substituted because CHIRPS returned 403 on IHE network) | ~0.25°, hourly | Weakest link. Reanalysis-based, no direct satellite precipitation assimilation. | Mediterranean autumn convective storms poorly captured by reanalysis. Affects soil moisture initialization and soil evaporation in ETLook; affects water balance closure and blue/green split heavily. | CHIRPS via Google Earth Engine (sidesteps IHE firewall); ERA5-Land precipitation; SAFRAN; Météo-France ground gauges for bias correction. |
| **Solar radiation** | ERA5.sis-agrometeorological-indicators (AgERA5) | 0.1°, daily | Good. AgERA5 is a respected agrometeorological product. | Daily resolution loses sub-daily ET dynamics; coarse vs. terrain on north-facing slopes. | CM SAF SARAH-3 (0.05°) if higher resolution needed. |
| **Soil moisture** | FILE:se_root_out*.nc (pyWaPOR internal) | Inherited from pipeline | Standard pipeline behavior — pyWaPOR computes SE_root from energy balance. | Quality depends entirely on upstream forcing quality, especially precipitation. | External SMAP L3/L4, ASCAT, Sentinel-1-derived SM for cross-validation rather than substitution. |
| **Statics & soils** | STATICS.WaPOR3 | Mixed | Verify before trusting. WaPOR3 statics parameterized primarily for Africa and the Near East. | Crop/landcover classes and parameter lookups may not represent French Mediterranean agriculture (especially vineyards, garrigue). Default rooting depths likely wrong for deep-rooted vines. | Substitute LCC with Theia OSO 2018; soil from SoilGrids 2.0 or European Soil Database (ESDB). Vineyard rooting depth overridden to 1.5–4 m. |
| **Elevation** | COPERNICUS.GLO30 | 30 m | Good. | None significant at basin scale. | IGN RGE ALTI (5m, France-specific) — overkill for ETLook. |
| **Whittaker smoothing (S2)** | linear | — | Acceptable. | Linear interpolation between cloud-free dates loses phenological curvature, especially around senescence and green-up. | Default Whittaker smoother (penalized) generally produces better NDVI/LAI time series. |
| **Whittaker smoothing (VIIRS thermal)** | linear | — | Questionable. | Thermal day-to-day variance from atmospheric water vapor and viewing geometry; linear interpolation propagates noise. | Default Whittaker smoother is more defensible for thermal. |
| **Land cover for ET parameterization** | WaPOR3 statics (default) | — | Likely inadequate for France. | Crop coefficients, canopy parameters, and rooting depths in WaPOR3 reflect African agricultural systems. | Theia OSO 2018 supplied directly into pipeline land cover input where possible; crop-specific parameters from FAO I&D 56 and 66. Vineyard parameters informed by Williams and Ayars (2005) and INRAE Montpellier publications. |
| **Validation reference** | None in current config | — | Missing. No independent check on ET outputs. | Without validation, defending the absolute numbers is difficult. | Puéchabon ICOS site (~30km, evergreen oak natural vegetation) for monthly ET sanity check; MODIS MOD16 ET as coarse cross-check; GLEAM v3.8 at 0.1° as independent product. Use ≥1 of these for cross-validation. |

The three priority improvements identified, in order, are: (1) replace GEOS-5 precipitation with CHIRPS via Google Earth Engine or ERA5-Land before final publication; (2) override the WaPOR3 statics land cover with Theia OSO and document parameter overrides for vineyards; (3) add at least one validation point — Puéchabon ICOS for monthly ET sanity check is low effort and high value.

## 5. Crop coefficient parameterization

Crop coefficients (Kc) are sourced from FAO Irrigation and Drainage Paper 56 Table 12 (Allen et al. 1998) with Mediterranean-specific adjustments per FAO-56 Equation 62 (RHmin ≈ 30%, u₂ ≈ 2.5 m/s for Lez summer conditions). Vineyard Kc_mid is overridden to 0.55 (vs. FAO-56 generic 0.70) to reflect Languedoc VSP-trained vineyards with bare-row management, following Williams and Ayars (2005). Greenhouses are assigned a constant Kc of 0.60 as a fraction of ET₀, following Möller and Assouline (2007) and Fernández et al. (2010); we note that energy-balance ET methods (including ETLook) are not strictly applicable to covered greenhouse surfaces and these values are nominal.

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

Kc curves require both per-stage coefficient values (§5) and per-stage durations to construct the time-varying Kc trajectory through the year. Stage durations are sourced from FAO-56 Table 11 (Mediterranean entries where available) and cross-checked against the Hérault préfecture's official crop harvest deadline document (Direction Départementale des Territoires et de la Mer de l'Hérault 2016), which is validated annually by the Formation Spécialisée des Indemnisations en Cas de Dommages (FSIDG) for crop loss insurance purposes and constitutes the authoritative local source on harvest timing. Where FAO-56 entries are absent or inappropriate (notably winter rapeseed, which dominates French oilseed production but has no FAO-56 entry), French institute sources are used: Terres Inovia for winter rapeseed and Joffre & Rambal (1993) for Mediterranean grassland phenology.

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
| 13 | grasslands | Year-round bimodal | Year-round bimodal | — | — | — | — | ~250 active | 365 |
| 14 | orchards (deciduous stone fruit) | March (leaf-out) | Nov–Dec (leaf drop) | 20 | 70 | 120 | 60 | 270 | 270 |
| 14 | orchards (olives, evergreen) | March (new leaves) | December | 30 | 90 | 60 | 90 | 270 | 365 |
| 15 | vineyards (wine grapes) | April (budbreak) | Sep–Nov (harvest + leaf fall) | 30 | 60 | 40 | 80 | 210 | 210 |
| 24 | greenhouses | Year-round (rotational) | Year-round (rotational) | — | — | — | — | 365 | 365 |

**Highest-impact assumption: Mediterranean grassland phenology.** Unlike temperate grasslands, Mediterranean grasslands exhibit a bimodal phenology with summer dormancy driven by drought (Joffre & Rambal 1993): active growth February–May and October–December, dormant June–September. The standard FAO-56 Grass Pasture entry implies continuous growth and substantially overestimates summer ET in Mediterranean conditions. We apply a dormancy-aware seasonal Kc cycle: Kc ≈ 0.30 in summer (Jun–Sep), Kc ≈ 0.75 in spring (Mar–May) and autumn (Oct–Nov), Kc ≈ 0.40 in winter (Dec–Feb). This is the most consequential timing assumption in the analysis and is documented explicitly in the limitations.

Detailed sources, decisions, and per-crop limitations for each entry are documented in **Appendix A**.

## 7. Pipeline and derived calculations

The pyWaPOR ETLook pipeline produces actual evapotranspiration (AETI), reference evapotranspiration (ET₀), transpiration/evaporation partitioning, and net biomass production at 20 m resolution, with thermal information sharpened from VIIRS native 375 m via the DMS thermal sharpener (Gao et al. 2012). Outputs are aggregated to Theia OSO 2018 crop polygons using area-weighted zonal statistics. The time domain is full-year 2018 at dekadal aggregation (36 timesteps).

From the ETLook outputs and Kc-based estimates, indicators listed in §3 are computed per crop class and aggregated to basin scale. Yield is derived by applying crop-specific harvest indices (Steduto et al. 2012, FAO I&D 66) to net biomass production. Economic and caloric productivity layers use Agreste regional price data and FAO food composition tables. Blue/green water partitioning is computed monthly as: green = min(AETI, effective P); blue = AETI − green. Pumping energy is computed as Energy (kWh) ≈ ρgQh / η using BRGM ADES piezometric data for groundwater depth, Agence de l'Eau RMC abstraction volumes, and standard pump efficiency assumptions.

Where possible, modelled monthly ET is compared against eddy covariance measurements at the Puéchabon ICOS site (~30 km from the Lez basin, evergreen oak natural vegetation) as a sanity check rather than formal validation. Discrepancies exceeding ~25% on monthly totals are flagged in the discussion.

## 8. Limitations and assumptions

Limitations are documented in detail in §4 and Appendix A. The most important to consider when interpreting results:

- **Precipitation forcing.** GEOS-5 substituted for CHIRPS due to network access constraints. Affects blue/green water partitioning more than AETI estimates. Bias correction against SAFRAN recommended before downstream use of blue/green numbers.
- **Coarse meteorological forcing.** GEOS-5 at ~0.25–0.5° is undersized for the Lez basin. ERA5-Land or SAFRAN re-run recommended if time permits.
- **Thermal information content.** Effectively ~375 m despite sharpening to 20 m. Affects per-parcel variance, not basin totals.
- **WaPOR3 statics calibration.** Defaults reflect African systems; vineyard rooting depth manually overridden to 1.5–4 m.
- **Mediterranean grassland phenology.** Standard FAO-56 Grass Pasture overestimates summer ET; we apply a bimodal dormancy-aware Kc cycle (§6, Joffre & Rambal 1993). Highest-impact timing assumption in the analysis.
- **Single year.** 2018 only. Single-year results should not be generalized to climate-change projections without multi-year analysis.
- **Mixed pixels.** Statistics aggregated to OSO polygons rather than reported at native pixel resolution.
- **Theia OSO class composition.** Several classes aggregate crops with different cycles and Kc values (protein_crops, orchards, tubers). RPG 2018 cross-reference is recommended as a follow-up.
- **Greenhouses.** Energy-balance ET methods do not apply cleanly; assigned values are nominal.
- **Urban and ecological flow.** Framed as context but not modelled in this paper. Covered by other components of the team's nexus analysis.

## 9. Expected outputs

The analysis produces the following deliverables, intended for publication via an interactive web viewer (`lez.opentech-international.org`) ahead of fieldwork:

- Per-crop annual AETI maps and basin aggregates (mm and Mm³)
- Monthly AETI and ET deficit animations through the 2018 calendar year
- Per-crop water productivity rankings (kg/m³, €/m³, kcal/m³)
- Blue/green water partitioning per crop and aggregated basin total
- Draft estimate of irrigation pumping energy (kWh) as the energy leg of the nexus framing

Findings will be summarized in a brief stakeholder-facing narrative (story page on the viewer) and in this methods paper's results section once the analysis run is finalized. Stakeholder interviews during fieldwork will inform interpretation; the methods paper and viewer are explicitly designed to be updated post-fieldwork to reflect insights gained on the ground.

## 10. Reproducibility and openness

All processing uses open data and open-source tooling. The pyWaPOR pipeline configuration, AOI shapefile, supplementary Kc parameter table (`crop_kc_lez_2018.csv`), supplementary crop seasons table (`crop_seasons_lez_2018.csv`), and post-processing scripts are archived alongside this paper. The web viewer is built as a no-build static site with a manifest-driven architecture and template-friendly content separation, allowing the same viewer to be adapted to other basins by editing content files and updating the data manifest. Source code and full configuration are available at the project GitHub repository [URL pending].

## 11. AI use disclosure

In the spirit of transparency required by IHE academic guidelines and current scientific norms regarding generative AI:

- **Script conversion.** The class materials provided in IHE Module 5 (Remote Sensing for Agricultural Management), including pyWaPOR and WaPORIPA Jupyter notebooks and supporting class scripts, were converted to standalone Python scripts to generate the analytical outputs documented here. This conversion was performed with supervised assistance from Anthropic's Claude Code, with all generated code reviewed and tested by the primary author before use.
- **Web viewer design and development.** The architecture, schema design, content/code separation strategy, wireframing, and build specification for the interactive viewer were developed in iterative dialogue with Anthropic's Claude (claude.ai). Implementation of the viewer used Claude Code under primary author supervision.
- **Writing assistance.** This methods paper was drafted with editorial assistance from Claude. The primary author is responsible for all factual claims, methodological choices, interpretation, and final wording. The draft is iterated by the author team prior to submission.
- **Translation.** French translation of associated stakeholder-facing materials (web viewer story page) is performed jointly by co-author Guy Charles Koffi and AI translation tools (DeepL and Claude), with manual review by Koffi.

No generative AI was used to fabricate data, citations, or results. All numerical outputs are produced by the documented pyWaPOR pipeline; all citations were independently verified by the primary author against original sources.

## 12. Acknowledgments

The authors thank IHE Delft Module 5 (Remote Sensing for Agricultural Management) instructors for the foundational scripts and WaPORIPA tooling that made this analysis possible. We thank Leonardo Alfonso and Akosua Boakye-Ansah for supervision throughout the pre-study. AgroParisTech colleagues are acknowledged for their forthcoming collaboration during the fieldwork phase. OpenTech International provided computational resources for the analysis runs.

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
| **Protein crops (7)** | Theia OSO aggregates faba bean, peas, lentils, chickpeas — different cycles. Adopted faba bean Mediterranean cycle (20/30/35/15, ~100 days, March/April sowing) as default. Hérault préfecture confirms peas harvest by July 31 (plain) / August 31 (mountain). Lentils typically autumn-sown if present; high-uncertainty class. | Allen et al. 1998 (FAO-56 Table 11, Faba bean / Peas Mediterranean); Préfecture de l'Hérault (FSIDG 2016) |
| **Soya (8)** | Uncommon in Hérault. FAO-56 Central USA analog (20/30-35/60/25, ~140 days, May sowing). Hérault préfecture sets harvest deadline November 30 (plain) / December 31 (mountain) — confirming late season relative to other oilseeds. Verify presence in OSO before relying on these numbers. | Allen et al. 1998 (FAO-56 Table 11, Soybeans Central USA); Préfecture de l'Hérault (FSIDG 2016) |
| **Sunflower (9)** | FAO-56 Mediterranean entry directly applicable (25/35/45/25, ~130 days, April/May sowing). Hérault préfecture confirms harvest deadline October 31 (plain) / November 30 (mountain). Well-aligned with French Mediterranean practice. | Allen et al. 1998 (FAO-56 Table 11, Sunflower Mediterranean/California); Préfecture de l'Hérault (FSIDG 2016) |
| **Maize (10)** | Hérault maize is summer grain maize. FAO-56 Spain spring/summer entry directly applicable (30/40/50/30, ~150 days, April sowing). Hérault préfecture confirms harvest deadline November 30 for grain and seed maize, consistent with grain-fill drying period. | Allen et al. 1998 (FAO-56 Table 11, Maize grain Spain); Préfecture de l'Hérault (FSIDG 2016) |
| **Rice (11)** | Almost certainly not present in the Lez basin (Camargue is the rice region). FAO-56 Mediterranean cycle (30/30/60/30, ~150 days, May start) included for completeness only. Recommend masking or treating any "rice" pixels as misclassification. Note: Hérault préfecture document does not list rice — supports the conclusion that it is not a recognized crop in the département. | Allen et al. 1998 (FAO-56 Table 11, Rice Mediterranean) |
| **Tubers (12)** | Hérault préfecture explicitly distinguishes two cycles: primeur (harvest by June 30 plain / July 31 mountain) and conservation (harvest by November 30). FAO-56 main-season Mediterranean cycle (25/30/30-45/30) used as default for the conservation crop. Primeur pixels (Feb–Jun cycle) are mis-parameterized; if RPG cross-reference can identify them, treat separately. | Allen et al. 1998 (FAO-56 Table 11, Potato semi-arid); Préfecture de l'Hérault (FSIDG 2016) |
| **Grasslands (13) — highest-impact assumption** | Mediterranean grasslands have bimodal phenology with summer dormancy. FAO-56 temperate Grass Pasture entries imply continuous growth and overestimate summer ET. Adopted: dormancy-aware seasonal Kc (Kc≈0.30 Jun–Sep, Kc≈0.75 Mar–May/Oct–Nov, Kc≈0.40 Dec–Feb). Hérault préfecture sets prairies (foin) harvest deadline November 1, consistent with autumn senescence/end-of-season cut. | Joffre & Rambal 1993; corroborated by Mediterranean ecology literature; Préfecture de l'Hérault (FSIDG 2016) |
| **Orchards (14)** | Theia OSO aggregates deciduous (peach, apricot, almond) and evergreen (olive). FAO-56 Stone Fruit Mediterranean cycle (20/70/120/60, ~270 days, March leaf-out). Hérault préfecture: peach/nectarine harvest by September 30, apple harvest by October 31 (plain) / November 30 (mountain). Olive orchards within the OSO class are mis-parameterized; FAO-56 olive Mediterranean entry (30/90/60/90) preferred for olive pixels if separable. | Allen et al. 1998 (FAO-56 Table 11, Stone Fruit / Olives); Préfecture de l'Hérault (FSIDG 2016) |
| **Vineyards (15)** | FAO-56 mid-latitude wine grape entry (30/60/40/80, ~210 days, April budbreak). Long late-season (~80 days, Aug–Oct) captures véraison. Hérault préfecture sets harvest deadline November 30 for all wine categories (vin de table, V.D.Q.S., vin de pays, Muscat AOC, Clairette du Languedoc, raisin de table), consistent with FAO-56 mid-latitude cycle. Year-specific budbreak varies by ±2 weeks. | Allen et al. 1998 (FAO-56 Table 11, Grapes mid-latitudes wine); Williams & Ayars 2005; Préfecture de l'Hérault (FSIDG 2016) |
| **Greenhouses (24)** | Greenhouse production rotates 2–3 short crops per year. No single season applies. Treat as continuous with Kc=0.60. Möller & Assouline 2007 measured ETc 38% lower than open field (supporting Kc≈0.60); Fernández et al. 2010 measured Almería plastic greenhouse ETo from <1 mm/day winter to ~4 mm/day summer. Energy-balance ET methods not strictly applicable; values are nominal. Hérault préfecture does not regulate greenhouses with a fixed harvest date. | Möller & Assouline 2007; Fernández et al. 2010; no FAO-56 entry |

### Cross-cutting limitations (applies to all crops)

- **Theia OSO class composition.** Several classes aggregate crops with different cycles (protein_crops, orchards, tubers). RPG 2018 cross-reference can disambiguate where parcel-level declarations are available; recommended as a follow-up improvement.
- **Year-specific timing.** 2018 had a wet spring and hot dry summer in southern France. Generic FAO-56 Mediterranean dates may miss 2018-specific phenology by 1–2 weeks. Probably not material for annual ET totals; could affect monthly attribution.
- **Hérault préfecture document vintage.** The fetched FSIDG document covers 2016–2017. Harvest deadlines are administrative and stable across years (set for crop loss insurance), not weather-dependent. Should be treated as authoritative for cycle endpoints; verify the most current year's version through Préfecture de l'Hérault if available.

---

*This is a pre-analysis methods paper. Results will be added once the pyWaPOR run completes. The paper is intended to accompany the interactive web viewer at [URL pending] as the linked methods document. Comments and corrections welcome to the primary author.*