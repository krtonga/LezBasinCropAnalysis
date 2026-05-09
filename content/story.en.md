---
section: opening
visual: hero_image
visual_type: image
visual_alt: "Aerial view of Mediterranean farmland near Montpellier"
---

Montpellier and the farms around it both depend on the Lez source — a karst spring that feeds the city's drinking water and the basin's irrigation. As climate pressure grows, understanding who uses water for what becomes essential. This is what we found from satellite data for {{ findings.year }}.

---
section: 01
label: Setting
title: A small basin, two big users
visual: basin_overview
visual_type: image
visual_caption: "Lez basin extent with the Lez source, urban Montpellier, and surrounding agriculture."
---

The Lez basin covers around {{ findings.basin_area_km2 }} km². The Lez source supplies roughly {{ findings.urban_demand_mm3 }} million m³ of drinking water to Montpellier each year. Surrounding farmland — mostly vineyards, with cereals and orchards mixed in — adds its own demand on the same aquifer.

---
section: 02
label: Finding
title: Crops use water differently
visual: per_crop_aeti_chart
visual_type: chart
---

How much water does each crop consume per square metre of cropland over the season? `mm/season` is equivalent to **litres of water per m² of cropland**. Orchards and grasslands consume the most per area, vineyards are next, cereals consume the least. But this is *intensity per hectare* — it doesn't tell you how much water a crop consumes overall.

---
section: 02b
label: Context
title: Where the cropland is
visual: area_pies
visual_type: pie_pair
---

The pie on the left shows each crop's share of the basin's cropland — vineyards dominate, with cereals a distant second. The doughnut on the right places that cropland in the basin as a whole; cropland is roughly **14%** of the basin, while meadow, urban, forest, and water surfaces make up most of the rest.

**Note on the numbers.** Per-crop *areas* shown here come from the full-basin Theia OSO 2018 land-cover product. Per-crop *water use* (the charts in this story) currently reflects only the NW quarter of the basin — pyWaPOR processing for the other three quarters is in progress, and these figures will be replaced with full-basin values when that completes. Orchards (class 14) are not parcel-level classified; locally we treat them as ~60% olives / ~40% stone fruit.

---
section: 02c
label: Headline
title: Crops use much more water than the city
visual: total_water_chart
visual_type: chart
---

When you multiply each crop's water-use intensity by how much land it covers, vineyards alone consume roughly **{{ findings.headline.vineyard_total_mm3 }} million m³** in the season — about **{{ findings.headline.vineyard_vs_urban_ratio }}× the {{ findings.urban_demand_mm3 }} million m³** the Lez source delivers to Montpellier in a year. All cropland together totals roughly **{{ findings.headline.cropland_total_mm3 }} million m³**, around **{{ findings.headline.cropland_vs_urban_ratio }}× urban demand**.

Most of that is rainfall (water that would have evaporated regardless), not irrigation. The next chart separates the two.

---
section: 03
label: Where it comes from
title: Green water vs blue water
visual: green_blue_chart
visual_type: chart
---

Most cropland evapotranspiration comes from rainfall (**green water**) — water that would have evaporated regardless. The portion drawn from irrigation (**blue water**) is what actually competes with Montpellier's drinking-water supply, since both come ultimately from the same karst-fed system. Vineyards are by far the largest source of blue-water demand because of their dominant area; cereals are nearly entirely rainfed.

*Caveat: the GEOS-5 precipitation forcing used here overestimates Mediterranean rainfall, which inflates the green-water bars and depresses the blue-water bars. The blue-water totals are likely under-estimates; switching to a CHIRPS or in-situ precipitation record is a planned validation step.*

---
section: 03b
label: Tension
title: Summer is when everyone competes
visual: monthly_water_chart
visual_type: chart
---

Crop water demand isn't spread evenly across the year. The bars below show monthly cropland evapotranspiration across the basin: roughly **1 Mm³ in winter, peaking near 16 Mm³ in June** — about **8× a typical month of urban demand from the Lez source**. The blue line is monthly rainfall over the same cropland; **wherever the bar towers above the line, the gap has to come from irrigation** — competing with other users for the same regional water resource. In June and July alone the irrigation gap is roughly **13 Mm³ per month** — half a year's urban supply, every month, for two months. The dashed grey line is the average monthly urban demand for context.

---
section: 04
label: Tradeoff
title: Some crops produce more food per drop
visual: cwp_ranking_chart
visual_type: chart_toggleable
visual_data: findings.per_crop_cwp
visual_default_unit: kg_m3
---

Crop water productivity — kilograms of harvested produce per cubic metre of water *consumed* (not per m² of land) — varies by an order of magnitude. Stone fruit and apples score very high because the harvested fruit is mostly water by weight; olives and cereals look smaller in part because the harvested portion has lower water content. The same orchards class, split here into deciduous (peach, apple, pear) and olives, shows roughly a **9× gap** in cWP for the same per-area water use — a reminder that "kg per m³" depends as much on what you're harvesting as on how much water it takes to grow it.

Worth noting: olives have a **lower water requirement per hectare** than stone fruit — roughly **18% less** in our calculation, reflecting their sparser, slower-growing canopy (FAO-56 Kc ≈ 0.70 for olives vs ≈ 0.90 for deciduous orchards). The satellite *measured* evapotranspiration in this analysis is the same for both, because the Theia OSO classification doesn't separate them at parcel level, but the modeled crop demand does — and field studies consistently show olives are among the more drought-tolerant Mediterranean orchard choices. The picture would shift again if we measured calories or revenue per cubic metre.

---
section: 05
label: What this means
title: Looking ahead
visual_type: image_gallery
visual_images:
  - src: chart_lake_geneva_surface.png
    caption: "Evolution of surface temperatures (0–10 m) of Lake Geneva waters (CIPEL 2023)"
  - src: chart_urban_temp.png
    caption: "Average annual temperature: deviation from the 1961–1990 reference period — Metropolitan France (Météo-France 2021)"
  - src: chart_torrential_rainfall.png
    caption: "Evolution of the intensity of extreme rainfall in the Mediterranean regions of France since 1961 (Météo-France)"
caveat: true
---

{{ findings.year }} was one year. Climate projections for the western Mediterranean point to drier summers and more variable rainfall. The seasonal squeeze visible in this single year is likely to intensify. The questions for stakeholders are not just "how much water" but "when, for whom, and at what tradeoff."
