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