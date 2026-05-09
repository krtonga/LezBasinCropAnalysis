---
section: opening
visual: hero_image
visual_type: image
visual_alt: "Vue aérienne de terres agricoles méditerranéennes près de Montpellier"
---

Montpellier et les fermes qui l'entourent dépendent toutes deux de la source du Lez — une résurgence karstique qui alimente l'eau potable de la ville et l'irrigation du bassin. Avec la pression climatique croissante, comprendre qui utilise l'eau et pour quoi devient essentiel. Voici ce que les données satellitaires nous ont révélé pour {{ findings.year }}.

---
section: 01
label: Cadre
title: Un petit bassin, deux grands consommateurs
visual: basin_overview
visual_type: image
visual_caption: "Étendue du bassin du Lez avec la source du Lez, la zone urbaine de Montpellier et l'agriculture environnante."
---

Le bassin du Lez couvre environ {{ findings.basin_area_km2 }} km². La source du Lez fournit chaque année environ {{ findings.urban_demand_mm3 }} millions de m³ d'eau potable à Montpellier. Les terres agricoles environnantes — principalement des vignobles, avec des céréales et des vergers en complément — ajoutent leur propre demande sur le même aquifère.

---
section: 02
label: Constat
title: Les cultures consomment l'eau différemment
visual: per_crop_aeti_chart
visual_type: chart
---

Combien d'eau chaque culture consomme-t-elle par mètre carré de terre cultivée pendant la saison ? `mm/saison` équivaut à des **litres d'eau par m² de terre cultivée**. Les vergers et les prairies en consomment le plus par surface, les vignobles arrivent ensuite, les céréales en consomment le moins. Mais ce n'est qu'une *intensité par hectare* — cela ne dit pas combien d'eau une culture consomme au total.

---
section: 02b
label: Contexte
title: Où se trouvent les terres cultivées
visual: area_pies
visual_type: pie_pair
---

Le diagramme de gauche montre la part de chaque culture dans les terres agricoles du bassin — les vignobles dominent, les céréales arrivant loin derrière. La partie droite (en anneau) replace ces terres agricoles dans l'ensemble du bassin ; les terres cultivées représentent environ **14 %** du bassin, tandis que les pelouses, les zones urbaines, les forêts et les surfaces en eau occupent la majeure partie du reste.

**Note sur les chiffres.** Les *surfaces* par culture présentées ici proviennent du produit de couverture des sols Theia OSO 2018 pour l'ensemble du bassin. La *consommation d'eau* par culture (les graphiques de ce récit) ne reflète actuellement que le quart NO du bassin — le traitement pyWaPOR pour les trois autres quarts est en cours, et ces chiffres seront remplacés par des valeurs à l'échelle du bassin une fois ce traitement terminé. Les vergers (classe 14) ne sont pas classés au niveau parcellaire ; localement, nous les considérons comme ~60 % oliviers / ~40 % fruits à noyau.

---
section: 02c
label: Constat principal
title: Les cultures consomment beaucoup plus d'eau que la ville
visual: total_water_chart
visual_type: chart
---

Lorsqu'on multiplie l'intensité d'utilisation d'eau de chaque culture par la surface qu'elle couvre, les vignobles à eux seuls consomment environ **{{ findings.headline.vineyard_total_mm3 }} millions de m³** sur la saison — soit environ **{{ findings.headline.vineyard_vs_urban_ratio }}× les {{ findings.urban_demand_mm3 }} millions de m³** que la source du Lez fournit à Montpellier en une année. L'ensemble des terres cultivées totalise environ **{{ findings.headline.cropland_total_mm3 }} millions de m³**, soit environ **{{ findings.headline.cropland_vs_urban_ratio }}× la demande urbaine**.

L'essentiel provient de la pluie (eau qui se serait évaporée de toute façon), pas de l'irrigation. Le graphique suivant sépare les deux.

---
section: 03
label: D'où elle vient
title: Eau verte vs eau bleue
visual: green_blue_chart
visual_type: chart
---

L'essentiel de l'évapotranspiration agricole provient des précipitations (**eau verte**) — eau qui se serait évaporée de toute façon. La part issue de l'irrigation (**eau bleue**) est ce qui entre réellement en concurrence avec l'approvisionnement en eau potable de Montpellier, puisque les deux proviennent finalement du même système karstique. Les vignobles sont de loin la plus grande source de demande en eau bleue en raison de leur surface dominante ; les céréales sont presque entièrement pluviales.

*Mise en garde : le forçage des précipitations GEOS-5 utilisé ici surestime les pluies méditerranéennes, ce qui gonfle les barres « eau verte » et réduit les barres « eau bleue ». Les totaux d'eau bleue sont probablement sous-estimés ; passer à un enregistrement CHIRPS ou pluviomètres au sol est une étape de validation prévue.*

---
section: 03b
label: Tension
title: L'été, tout le monde se dispute la ressource
visual: monthly_water_chart
visual_type: chart
---

La demande en eau des cultures n'est pas répartie uniformément dans l'année. Les barres ci-dessous montrent l'évapotranspiration mensuelle des cultures à l'échelle du bassin : environ **1 Mm³ en hiver, avec un pic proche de 16 Mm³ en juin** — soit environ **8× un mois typique de demande urbaine depuis la source du Lez**. La ligne bleue représente la pluviométrie mensuelle sur ces mêmes terres cultivées ; **partout où la barre dépasse la ligne, l'écart doit être comblé par l'irrigation** — entrant en concurrence avec d'autres utilisateurs pour la même ressource en eau régionale. En juin et juillet à eux seuls, l'écart d'irrigation atteint environ **13 Mm³ par mois** — soit la moitié d'une année d'approvisionnement urbain, chaque mois, pendant deux mois. La ligne grise en pointillés indique la demande urbaine moyenne mensuelle, pour référence.

---
section: 04
label: Compromis
title: Certaines cultures produisent davantage par goutte d'eau
visual: cwp_ranking_chart
visual_type: chart_toggleable
visual_default_unit: kg_m3
---

La productivité de l'eau par culture — kilogrammes de produit récolté par mètre cube d'eau *consommée* (et non par m² de terre) — varie d'un ordre de grandeur. Les fruits à noyau et les pommes obtiennent un score très élevé car la portion récoltée est principalement constituée d'eau en poids ; les olives et les céréales semblent plus faibles, en partie parce que la portion récoltée a une teneur en eau plus basse. La même classe « vergers », ici séparée entre fruits à noyau (pêcher, pommier, poirier) et oliviers, montre un écart de cWP d'environ **9×** pour la même consommation d'eau par hectare — un rappel que « kg par m³ » dépend autant de ce que l'on récolte que de l'eau nécessaire pour la cultiver.

À noter : les oliviers ont un **besoin en eau par hectare plus faible** que les fruits à noyau — environ **18 % de moins** dans nos calculs, reflétant leur canopée plus clairsemée et à croissance plus lente (FAO-56 Kc ≈ 0,70 pour les oliviers contre ≈ 0,90 pour les vergers décidus). L'évapotranspiration *mesurée* par satellite dans cette analyse est identique pour les deux, parce que la classification Theia OSO ne les sépare pas au niveau parcellaire, mais la demande modélisée le fait — et les études de terrain montrent que les oliviers font partie des choix d'arboriculture méditerranéenne les plus tolérants à la sécheresse. Le tableau changerait à nouveau si l'on mesurait les calories ou le revenu par mètre cube.

---
section: 05
label: Ce que cela signifie
title: Perspectives
visual_type: image_gallery
visual_images:
  - src: chart_lake_geneva_surface.png
    caption: "Évolution des températures de surface (0–10 m) des eaux du lac Léman (CIPEL 2023)"
  - src: chart_urban_temp.png
    caption: "Température annuelle moyenne : écart à la période de référence 1961–1990 — France métropolitaine (Météo-France 2021)"
  - src: chart_torrential_rainfall.png
    caption: "Évolution de l'intensité des précipitations extrêmes dans les régions méditerranéennes de France depuis 1961 (Météo-France)"
caveat: true
---

{{ findings.year }} n'a été qu'une seule année. Les projections climatiques pour la Méditerranée occidentale indiquent des étés plus secs et des précipitations plus variables. Le pic saisonnier visible dans cette seule année risque de s'intensifier. Les questions pour les parties prenantes ne sont pas seulement « combien d'eau » mais « quand, pour qui, et avec quel compromis ? »
