## À propos de ce projet

Ce site présente une vue, dérivée de données satellitaires sur une année, de la consommation d'eau dans le bassin du Lez autour de Montpellier, en France. Il a été produit par **{{ site.attribution.group }}** dans le cadre du programme de Master à IHE Delft, Institute for Water Education, et explore les compromis de productivité de l'eau dans les systèmes méditerranéens alimentation–eau–énergie.

L'objectif est de donner aux parties prenantes — agriculteurs locaux, autorités de l'eau et autres étudiants — une vision plus claire de *qui utilise l'eau et pour quoi*, dans un bassin où l'approvisionnement urbain (la source du Lez) et l'irrigation partagent le même aquifère karstique.

## Résumé de la méthodologie

L'analyse combine quatre produits de données pour estimer la consommation d'eau saisonnière par culture :

1. La classification d'occupation du sol **Theia OSO 2018** fournit la distribution spatiale des classes de cultures (vignobles, céréales, vergers, etc.) au niveau parcellaire pour les départements de l'Hérault et du Gard.
2. **pyWaPOR 3.5** traite les entrées Sentinel-2, VIIRS et de réanalyses pour produire l'évapotranspiration réelle (AETI), la transpiration (T), la production primaire nette (NPP) et l'humidité du sol racinaire (RSM) journalières et mensuelles à 20 m × 20 m.
3. Les **coefficients culturaux FAO-56** (Kc) sont appliqués à l'évapotranspiration de référence (RET) pour calculer le besoin en eau saisonnier de la culture (ETc) pour chaque saison de croissance.
4. Les **ratios de productivité** (HI, AOT, MC issus des tableaux 11/12 de la FAO-56) traduisent la biomasse en cartes de rendement, de productivité de l'eau et d'écart de rendement.

La pipeline complète et toutes les hypothèses algorithmiques sont documentées dans [methods.md](methods.md). Une note technique condensée est disponible à [{{ site.links.methods_pdf }}]({{ site.links.methods_pdf }}).

## Sources des données

- **Theia OSO 2018** — Carte d'occupation du sol CES OSO produite par le CESBIO à partir des séries temporelles Sentinel-2, distribuée par Theia ([theia.cnes.fr](https://theia.cnes.fr)). Inglada et al., 2017.
- **WaPOR / pyWaPOR** — Données WaPOR consultées via la FAO ([data.apps.fao.org/wapor](https://data.apps.fao.org/wapor)). Pipeline de traitement pyWaPOR, FAO/IHE Delft.
- **Sentinel-2** — Données Copernicus Sentinel-2 (2018). Agence spatiale européenne.
- **VIIRS VNP02IMG** — VIIRS Imagery Resolution Calibrated Radiances. NASA LAADS DAAC.
- **GEOS-5** — NASA Global Modeling and Assimilation Office (GMAO). Réanalyse GEOS-5 (utilisée comme forçage des précipitations dans cette analyse ; voir les limitations).
- **ERA5 / AgERA5** — Service Copernicus de surveillance du climat (C3S), CEPMMT.
- **Copernicus DEM GLO-30** — Agence spatiale européenne / Airbus.

## Limitations

- **Une seule année (2018).** La variabilité interannuelle du climat méditerranéen est importante ; une année ne fait pas une tendance.
- **Forçage des précipitations GEOS-5.** CHIRPS n'était pas disponible sur le réseau IHE pendant cette analyse. GEOS-5 surestime les précipitations méditerranéennes, ce qui biaise AETI et l'Adéquation vers le haut. La comparaison de ce résultat avec un enregistrement CHIRPS ou de pluviomètres au sol est une étape de validation prévue.
- **Pixels mixtes.** La résolution du masque (20 m) est plus grossière que de nombreuses limites parcellaires, donc les statistiques par classe incluent un certain mélange avec les classes voisines.
- **Les vergers sont une estimation raisonnée, non une classification parcellaire.** La classe 14 couvre à la fois les oliveraies et d'autres vergers (pêcher, abricotier, pommier, poirier). Le contexte régional — le bassin du Lez se situe dans la zone d'arboriculture en périphérie de Montpellier, avec une expansion active des oliviers péri-urbains depuis les années 1980, tandis que les zones d'altitude des fruits à noyau (Espinouse, Caroux, Séranne) se trouvent en dehors du bassin — suggère que les oliviers représentent environ **60–80 %** de la surface en vergers. Nous utilisons **60 %** ici, soit l'extrémité conservatrice de cette plage. Une enquête au niveau parcellaire affinerait cette estimation.

## Pour citer ce travail

> {{ site.attribution.authors_formatted }} ({{ site.attribution.year }}). *{{ site.title }} : {{ site.subtitle }}*. {{ site.attribution.primary }}, {{ site.attribution.group }}. Disponible à {{ site.links.github }}.

## Remerciements

Encadré par L. Alfonso et A. Boakye-Ansah à IHE Delft. La pipeline pyWaPOR est développée et maintenue par la FAO et IHE Delft. La classification OSO est produite par le CESBIO et distribuée par Theia.

## Contact

[{{ site.links.contact }}](mailto:{{ site.links.contact }})

## Licence

Code : MIT. Contenu (texte, figures) : CC BY 4.0. Les jeux de données sous-jacents conservent leurs licences originales (voir *Sources des données* ci-dessus).
