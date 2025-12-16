# Spatiotemporal Visualization of Tourist Overnight Stays in Slovenia
### Interaction and Information Design – Course Project

**Data available at:**
- [Prihodi in prenočitve turistov po državah, občine, Slovenija, mesečno](https://pxweb.stat.si/SiStatData/pxweb/sl/Data/-/2164466S.px)
- [Prihodi in prenočitve domačih in tujih turistov po skupinah nastanitvenih obratov, statistične regije, Slovenija, mesečno](https://pxweb.stat.si/SiStatData/pxweb/sl/Data/-/2164439S.px)
- [GURS RPE GitHub Repository](https://github.com/stefanb/gurs-rpe)
- [SURS - Slovenske statistične regije in občine](https://www.stat.si/obcine)



# TODO
- **add legend** (could be possible to shrink graph card upwards and add legend bellow)
- add **limited** panning and zooming on the map
- add tooltips on map (shows name of region/municipality when hovering) :D
- if possible, make the timeline easier to click on
- disable timeline month label selection

- show important events on global graph -> korona 1. val, 2. val etc., **poletne sezone**




**BUGS**
- when timeline playing and unfocusing card - error but non fatal (make handling for it)
- possible bug of some municipalities just not having any tourists OR they just really that dead - investigate pipeline (check month where its all 0, check json for sanity check)

**ESTETSKE SPREMEMBE**
- Sprememba velikosti (širine) grafa do zapolnitve ekrana (zemljevid pa pustimo enako širok).
- Dodajanje belih črt med kose pite.
- Težave s prikazom area-card na manjših ekranih.
- Izgled območja z grafom -> brez senc, 1. mogoče samo belo ozadje s sivo obrobo (iste barve kot search bar) ali 2. brez senc in sive obrobe, samo modro ozadje kot na zemljevidu (po potrebi posvetlimo in posivimo, da bo graf bolj berljiv).
- Robovi na kartici z grafom so malo preveč zaobljeni -> manj, mogoče jih tudi dodamo na zemljevid.
- V tabelci piše "Relative percentage", ampak mislm, da to ni ustrezen izraz. **to be decided**

- Opcijsko: Nekam dodamo svoja imena "Authors" pa ustvarjeno 2025 za IOI?




Emoji graphics by Twitter (Twemoji)
Licensed under CC-BY 4.0: https://twemoji.twitter.com
