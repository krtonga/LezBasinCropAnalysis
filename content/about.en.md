## About this project

This site presents a one-year, satellite-derived view of how water is consumed across the Lez basin around Montpellier, France. It was produced by **{{ site.attribution.group }}** as part of an MSc programme at IHE Delft, Institute for Water Education, exploring water-productivity tradeoffs in Mediterranean food–water–energy systems.

The goal is to give stakeholders — local farmers, water authorities, and other students — a clearer picture of *who uses water for what*, in a basin where urban supply (the Lez source) and irrigation share the same karstic aquifer.

## Methods summary

The analysis combines four data products to estimate seasonal water use per crop:

1. **Theia OSO 2018** land-cover classification gives the spatial distribution of crop classes (vineyards, cereals, orchards, etc.) at parcel level for the Hérault and Gard départements.
2. **pyWaPOR 3.5** processes Sentinel-2, VIIRS, and reanalysis inputs to produce daily and monthly actual evapotranspiration (AETI), transpiration (T), net primary production (NPP), and root-zone soil moisture (RSM) at 20 m × 20 m.
3. **FAO-56 crop coefficients** (Kc) are applied to reference evapotranspiration (RET) to compute seasonal crop water requirement (ETc) for each growing season.
4. **Productivity ratios** (HI, AOT, MC from FAO-56 Tables 11/12) translate biomass into yield, water-productivity, and yield-gap maps.

The full pipeline and all algorithmic assumptions are documented in [methods.md](methods.md). A condensed white paper is at [{{ site.links.methods_pdf }}]({{ site.links.methods_pdf }}).

## Data sources

- **Theia OSO 2018** — CES OSO land cover map produced by CESBIO from Sentinel-2 time series, distributed by Theia ([theia.cnes.fr](https://theia.cnes.fr)). Inglada et al., 2017.
- **WaPOR / pyWaPOR** — WaPOR data accessed via FAO ([data.apps.fao.org/wapor](https://data.apps.fao.org/wapor)). pyWaPOR processing pipeline, FAO/IHE Delft.
- **Sentinel-2** — Copernicus Sentinel-2 data (2018). European Space Agency.
- **VIIRS VNP02IMG** — VIIRS Imagery Resolution Calibrated Radiances. NASA LAADS DAAC.
- **GEOS-5** — NASA Global Modeling and Assimilation Office (GMAO). GEOS-5 reanalysis (used as precipitation forcing in this analysis; see limitations).
- **ERA5 / AgERA5** — Copernicus Climate Change Service (C3S), ECMWF.
- **Copernicus DEM GLO-30** — European Space Agency / Airbus.

## Limitations

- **Single year (2018).** Year-to-year variability in Mediterranean climate is large; one year is not a trend.
- **GEOS-5 precipitation forcing.** CHIRPS was unavailable on the IHE network during this analysis. GEOS-5 is known to overestimate Mediterranean rainfall, which biases AETI and Adequacy upward. Comparing this run against a CHIRPS or in-situ rainfall record is a planned validation step.
- **Mixed pixels.** The 20 m mask resolution is coarser than many parcel boundaries, so per-class statistics include some bleed from neighbouring classes.
- **Orchards are a reasoned mix, not parcel-level.** Class 14 covers both olive groves and other fruit orchards (peach, apricot, apple, pear). Regional context — the Lez basin sits in the Montpellier-periphery arboriculture zone, with active peri-urban olive expansion since the 1980s, while the higher-altitude stone-fruit zones (Espinouse, Caroux, Séranne) lie outside the basin — suggests olives make up roughly **60–80%** of orchard area. We use **60%** here as the conservative end of that range. A parcel-level survey would refine this.

## How to cite

> {{ site.attribution.authors_formatted }} ({{ site.attribution.year }}). *{{ site.title }}: {{ site.subtitle }}*. {{ site.attribution.primary }}, {{ site.attribution.group }}. Available at {{ site.links.github }}.

## Acknowledgments

Supervised by L. Alfonso and A. Boakye-Ansah at IHE Delft. The pyWaPOR pipeline is developed and maintained by FAO and IHE Delft. The OSO classification is produced by CESBIO and distributed by Theia.

## Contact

[{{ site.links.contact }}](mailto:{{ site.links.contact }})

## License

Code: MIT. Content (text, figures): CC BY 4.0. Underlying datasets retain their original licenses (see *Data sources* above).
