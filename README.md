# Spatiotemporal Visualization of Tourist Overnight Stays in Slovenia
### Interaction and Information Design – Course Project

**Data available at:**
- [Prihodi in prenočitve turistov po državah, občine, Slovenija, mesečno](https://pxweb.stat.si/SiStatData/pxweb/sl/Data/-/2164466S.px)
- [Prihodi in prenočitve domačih in tujih turistov po skupinah nastanitvenih obratov, statistične regije, Slovenija, mesečno](https://pxweb.stat.si/SiStatData/pxweb/sl/Data/-/2164439S.px)
- [GURS RPE GitHub Repository](https://github.com/stefanb/gurs-rpe)
- [SURS - Slovenske statistične regije in občine](https://www.stat.si/obcine)



# TODO
- add detailed information about SR/municipality when the clicked area zooms in
- zoomed area - box as canvas
* ime zgoraj, pitachart (bottom n% zdruzimo), zastavice + tooltip z imenom in statistiko

- add legend
- update color min and max to better match the data
- add **limited** panning and zooming on the map
- add tooltips (shows name of region/municipality when hovering) :D
- if possible, make the timeline easier to click on
- disable timeline month label selection

- show important events on global graph
- korona 1. val, 2. val etc.
- poletne sezone




**BUGS**
- when timeline playing and unfocusing card - error but non fatal (make handling for it)
- possible bug of some municipalities just not having any tourists OR they just really that dead - investigate pipeline (check month where its all 0, check json for sanity check)


**DONE**
- hook up data for statistical regions on map
- check if filtering works with statistical regions
- fixed color mapping for showing counts
- touristData contains only total values - faster switching
- hook up nationality filtering to displaying counts with map -> add in applyNationalityFilter function (filter.js), three cases (also depends on isMunicipalityView)



