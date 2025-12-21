# Spatiotemporal Visualization of Tourist Overnight Stays in Slovenia
### Interaction and Information Design – Course Project

**Data available at:**
- [Prihodi in prenočitve turistov po državah, občine, Slovenija, mesečno](https://pxweb.stat.si/SiStatData/pxweb/sl/Data/-/2164466S.px)
- [Prihodi in prenočitve domačih in tujih turistov po skupinah nastanitvenih obratov, statistične regije, Slovenija, mesečno](https://pxweb.stat.si/SiStatData/pxweb/sl/Data/-/2164439S.px)
- [GURS RPE GitHub Repository](https://github.com/stefanb/gurs-rpe)
- [SURS - Slovenske statistične regije in občine](https://www.stat.si/obcine)



# TODO
- show important events on global graph -> korona 1. val, 2. val etc., **poletne sezone**

**BUGS**
- when zoomed in and clicking on municipality, it cuts off the shape - i cannot find a fix for it since it needs a delay for the rest to render in or something
- focusing and unfocusing areas while the timeline is playing causes graph line to go empty

**ESTETSKE SPREMEMBE**

- NOVO: treba bo prilagodit velikost pisave na grafu, zdej ko je večji. Mogoče spremenit barvo pike, da bo bolj opazna.
- Težave s prikazom area-card na manjših ekranih.
- Izgled območja z grafom -> brez senc, 1. mogoče samo belo ozadje s sivo obrobo (iste barve kot search bar) ali 2. brez senc in sive obrobe, samo modro ozadje kot na zemljevidu (po potrebi posvetlimo in posivimo, da bo graf bolj berljiv).
- V tabelci piše "Relative percentage", ampak mislm, da to ni ustrezen izraz. **to be decided**

- Opcijsko: Nekam dodamo svoja imena "Authors" pa ustvarjeno 2025 za IOI?


# DONE
- <s>**add legend** (could be possible to shrink graph card upwards and add legend bellow)</s>
- <s>add **limited** panning and zooming on the map</s>
- <s>if possible, make the timeline easier to click on</s>

**AESTHETHICS**
- <s>Sprememba velikosti (širine) grafa do zapolnitve ekrana (zemljevid pa pustimo enako širok).</s>
- <s>Dodajanje belih črt med kose pite.</s>
- <s>NOVO: tooltip skrajno desno na zemljevidu odreže.</s>
- <s>Robovi na kartici z grafom so malo preveč zaobljeni -> manj, mogoče jih tudi dodamo na zemljevid.</s>

**BUGS**
- <s>when timeline playing and unfocusing card - error but non fatal (make handling for it)</s>
- <s>possible bug of some municipalities just not having any tourists OR they just really that dead - investigate pipeline (check month where its all 0, check json for sanity check)</s>


# LICENSE
Emoji graphics by Twitter (Twemoji)
Licensed under CC-BY 4.0: https://twemoji.twitter.com