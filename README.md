# Spatiotemporal Visualization of Tourist Overnight Stays in Slovenia

### Project Description
This project presents an interactive spatiotemporal visualization of tourist overnight stays in Slovenia between 2020 and 2025. Users can explore differences between municipalities and statistical regions through time.

The project was developed as part of the *Interaction and Information Design* course.

### Data Sources
- [Prihodi in prenočitve turistov po državah, občine, Slovenija, mesečno](https://pxweb.stat.si/SiStatData/pxweb/sl/Data/-/2164466S.px)
- [Prihodi in prenočitve domačih in tujih turistov po skupinah nastanitvenih obratov, statistične regije, Slovenija, mesečno](https://pxweb.stat.si/SiStatData/pxweb/sl/Data/-/2164439S.px)
- [GURS RPE GitHub Repository](https://github.com/stefanb/gurs-rpe)
- [SURS - Slovenske statistične regije in občine](https://www.stat.si/obcine)


### How to Run the Visualization
This project is a client-side web visualization and must be served via a local web server.

#### Option 1: Using VS Code Live Server
1. Install **Visual Studio Code**.
2. Install the [**Live Server**](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension.
3. Open this repository folder in VS Code.
4. Right-click on `index.html` and select **"Open with Live Server"**.
5. The visualization will open automatically in your default web browser.


#### Option 2: Using Another Local Server
Alternatively, you can use any local HTTP server (e.g. Python):
```bash
python -m http.server
```
Then open http://localhost:8000 in your browser and navigate to `index.html`.


### License
Emoji graphics by Twitter (Twemoji)
Licensed under CC-BY 4.0: https://twemoji.twitter.com



# TODO
**BUGS**
- when zoomed in and clicking on municipality, it cuts off the shape - i cannot find a fix for it since it needs a delay for the rest to render in or something
- focusing and unfocusing areas while the timeline is playing causes graph line to go empty

**ESTETSKE SPREMEMBE**
- Treba bo prilagodit velikost pisave na grafu, zdej ko je večji. Mogoče spremenit barvo pike, da bo bolj opazna.
- Težave s prikazom area-card na manjših ekranih.
- V tabelci piše "Relative percentage" - preimenuj v "% of all".
- Preimenovanje grafa v "Seasonality of Overnight Stays".
- Težave z zoom in in panning v kombinaciji z area-card oz. izrisom občine.
- Večji default zoom out po defaultu.
- Opcijsko: Nekam dodamo svoja imena "Authors" pa ustvarjeno 2025 za IOI?


# DONE
- <s>**add legend** (could be possible to shrink graph card upwards and add legend bellow)</s>
- <s>add **limited** panning and zooming on the map</s>
- <s>if possible, make the timeline easier to click on
- <s>show important events on global graph -> korona 1. val, 2. val etc., **poletne sezone**</s>
- <s>Relative percentage preimenujemo v "% of All" </s>
- <s>Ime grafa preimenujemo v "Seasonality of Overnight Stays"</s>
- <s>Proper zoom initialization</s>
- <s>Area Card fitting</s>


**AESTHETHICS**
- <s>Sprememba velikosti (širine) grafa do zapolnitve ekrana (zemljevid pa pustimo enako širok).</s>
- <s>Dodajanje belih črt med kose pite.</s>
- <s>NOVO: tooltip skrajno desno na zemljevidu odreže.</s>
- <s>Robovi na kartici z grafom so malo preveč zaobljeni -> manj, mogoče jih tudi dodamo na zemljevid.</s>
- <s>Izgled območja z grafom -> brez senc, 1. mogoče samo belo ozadje s sivo obrobo (iste barve kot search bar) ali 2. brez senc in sive obrobe, samo modro ozadje kot na zemljevidu (po potrebi posvetlimo in posivimo, da bo graf bolj berljiv).</s>

**BUGS**
- <s>when timeline playing and unfocusing card - error but non fatal (make handling for it)</s>
- <s>possible bug of some municipalities just not having any tourists OR they just really that dead - investigate pipeline (check month where its all 0, check json for sanity check)</s>
