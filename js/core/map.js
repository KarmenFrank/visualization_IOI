import { state } from './state.js';
import { normalizeAreaName, lerpColor } from './common.js';


export function initMap() {
  const { CONFIG } = state;

  state.map = L.map("map", {
    center: CONFIG.INITIAL_VIEW.center,
    zoom: CONFIG.INITIAL_VIEW.zoom,
    minZoom: CONFIG.INITIAL_VIEW.zoom,
    maxZoom: CONFIG.INITIAL_VIEW.zoom,
    zoomControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    tap: false,
    touchZoom: false
  });

  L.DomUtil.get("map").style.background = CONFIG.MAP_STYLE.background;

  state.map.on("click", () => {
    if (state.selectedArea && !state.clickLocked) unfocusArea();
  });

  document.getElementById("toggle-btn").addEventListener("click", toggleView);
}






export function updateMapShape() {
  const { map, CONFIG, isMunicipalityView } = state;
  const data = isMunicipalityView ? state.municipalityData : state.regionData;

  if (!map || !data) return;
  if (state.geoLayer) map.removeLayer(state.geoLayer);

  state.geoLayer = L.geoJSON(data, {
    style: CONFIG.AREA_STYLE,
    onEachFeature: (feature, layer) => {

      layer.on("click", (e) => {
        e.originalEvent.stopPropagation();
        if (state.clickLocked) return;
        handleAreaClick(feature);
      });
    }
  });

  state.geoLayer.addTo(map);
}






export function updateMapColors() {
  const { CONFIG, touristData, geoLayer } = state;

  if (touristData.length < 0)  return;

  const month = touristData[state.currentMonthIndex]?.month || touristData[0]?.month;

  const selectedMonth = touristData.find(d => d.month === month);
  
  if (!selectedMonth || !geoLayer) return;

  const municipalities = selectedMonth.municipalities;

  geoLayer.eachLayer(layer => {
    const nameRaw = layer.feature.properties.OB_UIME || layer.feature.properties.SR_UIME;
    if (!nameRaw) return;

    const name = normalizeAreaName(nameRaw);
    const entry = municipalities[name];

    if (entry) {
      const total = entry.countries.reduce((sum, c) => sum + (c.data.data || 0), 0);
      const linear_interpolant = Math.min(total / 20000, 1.0);
      const fill = lerpColor(CONFIG.TOURIST_COLORS.low_color, CONFIG.TOURIST_COLORS.high_color, linear_interpolant);
      layer.setStyle({ fillColor: fill });
    } else {
      layer.setStyle({ fillColor: CONFIG.TOURIST_COLORS.error_color });
    }
  });
}










export function blurMap() {
  const { CONFIG } = state;
  const mapDiv = document.getElementById("map");

  mapDiv.style.transition = `filter ${CONFIG.BLUR_EFFECT.duration}s ${CONFIG.ENLARGE_EFFECT.easing}`;
  mapDiv.style.filter = `blur(${CONFIG.BLUR_EFFECT.blur}) brightness(${CONFIG.BLUR_EFFECT.brightness})`;
}

export function unblurMap() {
  const { CONFIG } = state;
  const mapDiv = document.getElementById("map");

  mapDiv.style.transition = `filter ${CONFIG.BLUR_EFFECT.duration}s`;
  mapDiv.style.filter = "";
}







//switch between municipality and statistical area view
function toggleView() {
  state.isMunicipalityView = !state.isMunicipalityView;

  unfocusArea();
  updateMapShape();
  updateMapColors();

}






export function selectByID(){
  const { selectedArea, municipalityData, regionData, isMunicipalityView, searchSelect } = state;

  const searched_is_municipality = searchSelect.region == null ? true : false;
  const id = searched_is_municipality ? searchSelect.municipality : searchSelect.region;

  if (selectedArea) unfocusArea();
  if (searched_is_municipality != isMunicipalityView) toggleView();

  const data = searched_is_municipality ? municipalityData : regionData;

  data.features.forEach(feature => {
    const ob_ime = feature.properties.OB_UIME;
    const sr_ime = feature.properties.SR_UIME;

    if ((searched_is_municipality && ob_ime === id) || (!searched_is_municipality && sr_ime === id)){      
      return handleAreaClick(feature);
    }

  });
  
}






//handler for clicking on municipalities/statistical areas
function handleAreaClick(feature) {
  if (state.selectedArea) {
    unfocusArea();
    return;
  }

  state.selectedArea = feature;
  state.clickLocked = true;

  blurMap();
  drawFocusedArea(feature);
}

//clicking off the focused area
function unfocusArea() {
  const { CONFIG } = state;
  if (!state.selectedArea) return;

  state.clickLocked = true;
  unblurMap();

  const overlay = document.getElementById("focused-area");
  overlay.innerHTML = "";
  state.selectedArea = null;

  setTimeout(() => (state.clickLocked = false), CONFIG.BLUR_EFFECT.duration * 1000);
}



//displaying the focused area - WIP
function drawFocusedArea(feature) {
  const { map, CONFIG } = state;

  const overlay = document.getElementById("focused-area");
  overlay.innerHTML = "";

  const tempLayer = L.geoJSON(feature, { style: CONFIG.FOCUSED_STYLE }).addTo(map);

  requestAnimationFrame(() => {
    const svg = map.getPanes().overlayPane.querySelector("svg");
    const leafletPath = svg?.querySelector("path:last-of-type");
    if (!leafletPath) return;

    const svgPath = leafletPath.cloneNode();
    svgPath.setAttribute("vector-effect", "non-scaling-stroke");
    overlay.appendChild(svgPath);

    map.removeLayer(tempLayer);

    const bbox = svgPath.getBBox();
    const box = overlay.getBoundingClientRect();
    const cx = box.width / 2;
    const cy = box.height / 2;
    const fx = bbox.x + bbox.width / 2;
    const fy = bbox.y + bbox.height / 2;
    const dx = cx - fx;
    const dy = cy - fy;

    const scaleX = (box.width * CONFIG.ENLARGE_EFFECT.targetWidthRatio) / bbox.width;
    const scaleY = (box.height * CONFIG.ENLARGE_EFFECT.targetHeightRatio) / bbox.height;
    const scale = Math.min(scaleX, scaleY);

    svgPath.style.transition = `transform ${CONFIG.ENLARGE_EFFECT.duration}s ${CONFIG.ENLARGE_EFFECT.easing}`;
    svgPath.style.transformOrigin = `${fx}px ${fy}px`;
    svgPath.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;

    setTimeout(() => (state.clickLocked = false), CONFIG.ENLARGE_EFFECT.duration * 1000);
  });
}



