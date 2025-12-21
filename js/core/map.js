import { state } from './state.js';
import { normalizeAreaName, calcAreaColor, normalizeNationalityName } from './common.js';
import { clearSearch } from './search.js';
import { clearFilters, copyTouristData } from './filter.js';
import { setGraphRegion, setGraphTitle } from './graph.js';
import { generateFocusedAreaData, cleanUpPieChartTooltips } from './area_card.js';
import { getTouristsSums } from './data.js';

export function initMap() {
  const { CONFIG } = state;

  const MIN_ZOOM = 9;
  const MAX_ZOOM = 11;
  const INITIAL_CENTER = CONFIG.INITIAL_VIEW.center;

  state.map = L.map("map", {
    center: INITIAL_CENTER,
    zoom: MIN_ZOOM,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,

    zoomControl: false,
    dragging: true,
    scrollWheelZoom: false,
    doubleClickZoom: true,
    keyboard: true,
    touchZoom: true,
    inertia: false
  });

  // --- Custom zoom control ---
  const ZoomHomeControl = L.Control.extend({
    options: { position: "topleft" },
    onAdd(map) {
      const c = L.DomUtil.create("div", "leaflet-bar leaflet-control");
      const zin = L.DomUtil.create("a", "", c);
      const zout = L.DomUtil.create("a", "", c);

      zin.innerHTML = "+";
      zout.innerHTML = "−";
      zin.href = zout.href = "#";

      L.DomEvent.disableClickPropagation(c);

      L.DomEvent.on(zin, "click", e => {
        L.DomEvent.preventDefault(e);
        if (map.getZoom() < MAX_ZOOM) {
          map.zoomIn(1);
        }
      });

      L.DomEvent.on(zout, "click", e => {
        L.DomEvent.preventDefault(e);
        const z = map.getZoom();

        if (z - 1 <= MIN_ZOOM) {
          map.flyTo(INITIAL_CENTER, MIN_ZOOM, {
            duration: 0.4,
            easeLinearity: 0.25
          });
        } else {
          map.zoomOut(1);
        }
      });

      return c;
    }
  });

  state.map.addControl(new ZoomHomeControl());

  state.map.on("zoomend", () => {
    if (state.map.getZoom() === MIN_ZOOM) {
      state.map.dragging.disable();
    } else {
      state.map.dragging.enable();
    }
  });

  state.map.dragging.disable();

  L.DomUtil.get("map").style.background = CONFIG.MAP_STYLE.background;

  state.map.on("click", () => {
    if (state.selectedArea && !state.clickLocked) unfocusArea();
  });

  document.getElementById("toggle-btn").addEventListener("click", toggleView);

  createLegend();
}










function getAreaTooltipContent(feature) {
  const { touristData, currentMonthIndex, isMunicipalityView } = state;

  const nameRaw = feature.properties.OB_UIME || feature.properties.SR_UIME;
  if (!nameRaw) return "";

  const norm_name = normalizeAreaName(nameRaw);

  const monthData = touristData?.[currentMonthIndex];
  if (!monthData) return `<strong>${nameRaw}</strong>`;

  const areaData = isMunicipalityView ? monthData.municipalities : monthData.regions;
  const entry = areaData?.[norm_name];

  if (!entry) return `<strong>${nameRaw}</strong>`;

  const sums = getTouristsSums(norm_name);

  return `
    <strong>${nameRaw}</strong><br>
    Selected overnight stays: ${sums.selectedTouristSum}<br>
    Total overnight stays: ${sums.totalTouristSum}
  `;
  }







export function clearMapTooltips() {
  if (!state.geoLayer) return;

  state.geoLayer.eachLayer(layer => {
    if (layer.isTooltipOpen && layer.isTooltipOpen()) {
      layer.closeTooltip();
    }
  });
}

export function refreshHoveredTooltip() {
  const layer = state.hoveredLayer;
  if (!layer) return;

  if (layer.isTooltipOpen && layer.isTooltipOpen()) {
    layer.closeTooltip();
    layer.openTooltip();
  }
}


function getTooltipDirection(map, latlng, padding = 80) {
  const size = map.getSize();
  const p = map.latLngToContainerPoint(latlng);

  if (p.x < padding) return "right";
  if (p.x > size.x - padding) return "left";
  if (p.y < padding) return "bottom";
  if (p.y > size.y - padding) return "top";

  return "right";
}

export function updateMapShape() {
  const { map, CONFIG, isMunicipalityView } = state;
  const data = isMunicipalityView ? state.municipalityData : state.regionData;

  if (!map || !data) return;
  if (state.geoLayer) map.removeLayer(state.geoLayer);

  const NORMAL_OPACITY = CONFIG.AREA_STYLE.fillOpacity;

  state.geoLayer = L.geoJSON(data, {
    style: CONFIG.AREA_STYLE,
    onEachFeature: (feature, layer) => {

      layer.bindTooltip(
        () => getAreaTooltipContent(feature),
        {
          sticky: false,
          opacity: 0.95,
          offset: L.point(12, 0),
          className: "map-tooltip"
        }
      );

      layer.on("tooltipopen", () => {
        if (state.selectedArea) layer.closeTooltip();
      });

      layer.on("mouseover", () => {
        if (state.selectedArea) return;

        state.hoveredLayer = layer;

        const centroid = layer.getBounds().getCenter();
        const direction = getTooltipDirection(map, centroid);

        layer.openTooltip(centroid, { direction });

        state.geoLayer.eachLayer(other => {
          if (other === layer) {
            other.setStyle({
              weight: 3,
              fillOpacity: NORMAL_OPACITY
            });
            other.bringToFront();
          } else {
            other.setStyle({
              fillOpacity: NORMAL_OPACITY
            });
          }
        });
      });

      layer.on("mouseout", () => {
        if (state.selectedArea) return;

        state.hoveredLayer = null;
        layer.closeTooltip();

        state.geoLayer.eachLayer(other => {
          other.setStyle({
            weight: CONFIG.AREA_STYLE.weight,
            fillOpacity: NORMAL_OPACITY
          });
        });
      });

      layer.on("click", (e) => {
        clearMapTooltips();
        e.originalEvent.stopPropagation();
        if (state.clickLocked) return;
        handleAreaClick(feature);
      });

    }
  });

  state.geoLayer.addTo(map);
}








export function updateMapColors() {
  const { CONFIG, touristData, geoLayer, isMunicipalityView } = state;

  if (touristData.length < 0)  return;

  const month = touristData[state.currentMonthIndex]?.month || touristData[0]?.month;

  const selectedMonth = touristData.find(d => d.month === month);
  
  if (!selectedMonth || !geoLayer) return;

  const areaData = isMunicipalityView 
    ? selectedMonth.municipalities 
    : selectedMonth.regions;

  geoLayer.eachLayer(layer => {
    const nameRaw = layer.feature.properties.OB_UIME || layer.feature.properties.SR_UIME;
    if (!nameRaw) return;

    const name = normalizeAreaName(nameRaw);
    const entry = areaData[name]; // selected municipality or region


    if (entry) {
      layer.setStyle({ fillColor: calcAreaColor(entry) });
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







// switch between municipality and statistical area view
function toggleView() {
  state.isMunicipalityView = !state.isMunicipalityView;

  copyTouristData()

  unfocusArea();
  updateMapShape();
  updateMapColors();

  // Clear filters:
  clearMapTooltips();
  clearFilters();
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






function handleAreaClick(feature) {
  if (state.selectedArea) {
    unfocusArea();
    return;
  }

  state.selectedArea = feature;
  state.clickLocked = true;

  const nameRaw = feature.properties.OB_UIME || feature.properties.SR_UIME;
  const name = nameRaw ? normalizeAreaName(nameRaw) : "slovenija";
  setGraphRegion(name);
  setGraphTitle(nameRaw);

  blurMap();
  drawFocusedArea(feature);
}



export function unfocusArea(calledBySearch = false) {
  const { CONFIG } = state;

  if (calledBySearch) clearSearch();
  if (!state.selectedArea) return;

  state.clickLocked = true;
  unblurMap();

  const wrapper = document.getElementById("focused-area-wrapper");
  const svgOverlay = document.getElementById("focused-area-svg");
  const panel = document.getElementById("focused-area-panel");

  wrapper.style.transition =
    `transform ${CONFIG.ENLARGE_EFFECT.duration}s ${CONFIG.ENLARGE_EFFECT.easing}`;
  wrapper.style.transform = "none";

  svgOverlay.innerHTML = "";
  cleanUpPieChartTooltips();

  const card = panel.querySelector(".panel-card");
  if (card) {
    card.style.opacity = "0";
    card.style.transform = "scale(0.6)";
  }

  panel.style.opacity = "0";
  panel.style.pointerEvents = "none";

  setTimeout(() => {
    panel.innerHTML = "";
  }, 350);

  state.selectedArea = null;
  setGraphRegion(null);
  setGraphTitle("Slovenia");

  setTimeout(
    () => (state.clickLocked = false),
    CONFIG.ENLARGE_EFFECT.duration * 1000
  );
}










function drawFocusedArea(feature) {
  const { map, CONFIG } = state;

  const wrapper = document.getElementById("focused-area-wrapper");
  const svgOverlay = document.getElementById("focused-area-svg");
  const panel = document.getElementById("focused-area-panel");

  svgOverlay.innerHTML = "";
  panel.innerHTML = "";

  const tempLayer = L.geoJSON(feature, { style: CONFIG.FOCUSED_STYLE }).addTo(map);

  requestAnimationFrame(() => {

    const leafletSvg = map.getPanes().overlayPane.querySelector("svg");
    const leafletPath = leafletSvg?.querySelector("path:last-of-type");
    if (!leafletPath) return;

    // Clone municipality outline
    const svgPath = leafletPath.cloneNode();
    svgPath.setAttribute("fill", "#ffffff");
    svgPath.setAttribute("fill-opacity", "1");
    svgOverlay.appendChild(svgPath);

    map.removeLayer(tempLayer);

    // --- BBOX + screen position ---
    const bbox = svgPath.getBBox();
    const box = wrapper.getBoundingClientRect();

    const W = box.width;
    const H = box.height;

    // Left-side target position
    const targetX = W * 0.17;
    const targetY = H * 0.5;

    // Original centroid IN SVG SPACE
    const fx = bbox.x + bbox.width / 2;
    const fy = bbox.y + bbox.height / 2;

    // Convert centroid to screen coordinates
    // This gives us the starting point for the card animation
    const pt = wrapper.querySelector("svg").createSVGPoint();
    pt.x = fx;
    pt.y = fy;
    const screenPoint = pt.matrixTransform(wrapper.querySelector("svg").getScreenCTM());

    const dx = targetX - fx;
    const dy = targetY - fy;

    // Scale fit in left 1/3
    const maxWidth = W * 0.28;
    const scaleX = maxWidth / bbox.width;
    const scaleY = (H * 0.8) / bbox.height;
    const scale = Math.min(scaleX, scaleY);

    const transformValue = `translate(${dx}px, ${dy}px) scale(${scale})`;

    wrapper.style.transition =
      `transform ${CONFIG.ENLARGE_EFFECT.duration}s ${CONFIG.ENLARGE_EFFECT.easing}`;
    wrapper.style.transformOrigin = `${fx}px ${fy}px`;
    wrapper.style.transform = transformValue;

    // Stroke width fix
    const stroke = parseFloat(svgPath.getAttribute("stroke-width")) || 1;
    svgPath.style.strokeWidth = (stroke / scale) + "px";

    // ======================================================================
    // PANEL + CARD ANIMATION (new)
    // ======================================================================

    panel.style.pointerEvents = "none";
    panel.style.width = "67%";
    panel.style.opacity = "1";
    panel.innerHTML = "";

    const card = document.createElement("div");
    card.className = "panel-card";
    panel.appendChild(card);

    // Fill the card with text
    generateFocusedAreaData(feature, card);

    // Compute panel center (final position)
    const panelBox = panel.getBoundingClientRect();
    const finalX = panelBox.width / 2;
    const finalY = panelBox.height / 2;

    // INITIAL position: municipality centroid (screen coords)
    const localStartX = screenPoint.x - panelBox.left;
    const localStartY = screenPoint.y - panelBox.top;

    // Card starts here, tiny
    card.style.position = "absolute";
    card.style.left = `${localStartX}px`;
    card.style.top = `${localStartY}px`;
    card.style.opacity = "0";
    card.style.transformOrigin = "50% 50%";
    card.style.transform = "translate(-50%, -50%) scale(0.0)";
    card.style.pointerEvents = "auto";


    // Animate into center of panel
    requestAnimationFrame(() => {
      card.style.transition =
        `transform ${CONFIG.ENLARGE_EFFECT.duration}s ${CONFIG.ENLARGE_EFFECT.easing},
         opacity ${CONFIG.ENLARGE_EFFECT.duration}s ${CONFIG.ENLARGE_EFFECT.easing},
         left ${CONFIG.ENLARGE_EFFECT.duration}s ${CONFIG.ENLARGE_EFFECT.easing},
         top ${CONFIG.ENLARGE_EFFECT.duration}s ${CONFIG.ENLARGE_EFFECT.easing}`;

      card.style.left = `${finalX}px`;
      card.style.top = `${finalY}px`;
      card.style.opacity = "1";
      card.style.transform = "translate(-50%, -50%) scale(1)";
    });

    setTimeout(
      () => (state.clickLocked = false),
      CONFIG.ENLARGE_EFFECT.duration * 1000
    );
  });
}



function createLegend() {
  const gradient = document.querySelector(".legend-gradient");
  const labels = document.querySelectorAll(".legend-labels div");

  if (!gradient || !labels.length) {
    console.error("Legend elements not found");
    return;
  }

  const { MIN_VALUE, MAX_VALUE } = state.CONFIG.TOURIST_COLORS;

  // Gradient:
  const exponent = 0.5;
  const steps = 30;
  const stops = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const value = MIN_VALUE + Math.pow(t, 1/exponent) * (MAX_VALUE - MIN_VALUE);

    const color = calcAreaColor({
      countries: [{ countryNameEnglish: "Total", data: { data: value } }]
    });

    stops.push(`${color} ${t * 100}%`);
  }

  gradient.style.background = `linear-gradient(to top, ${stops.join(",")})`;

  // Label positioning:
  labels.forEach(label => {
    const value = Number(label.dataset.value);
    let t = (value - MIN_VALUE) / (MAX_VALUE - MIN_VALUE);
    t = Math.min(1, Math.max(0, t));
    t = Math.pow(t, exponent);

    label.style.top = `${(1 - t) * 100}%`;
  });
}