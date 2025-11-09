// ======================= CONFIGURATION =======================
const CONFIG = {
  INITIAL_VIEW: { center: [46.15, 14.995], zoom: 9.25 },
  MAP_STYLE: { background: "#a5e1f0ff" },
  AREA_STYLE: { color: "#555", weight: 1, fillColor: "#e0e0e0", fillOpacity: 1.0 },
  FOCUSED_STYLE: { color: "#000", weight: 2, fillColor: "#fff", fillOpacity: 1.0 },
  BLUR_EFFECT: { blur: "20px", brightness: 0.9, duration: 0.3 },
  ENLARGE_EFFECT: {
    targetWidthRatio: 0.85,
    targetHeightRatio: 0.85,
    duration: 0.6,
    easing: "ease"
  },
  TOURIST_COLORS: {
    low_color: "#41e786ff",
    high_color: "#d16135ff",
    error_color: "#ff0000ff"
  },
  LOADING_EFFECT: {
    blur: "20px",
    brightness: 0.9,
    duration: 0.5,
    background: "rgba(255, 255, 255, 0.0)"
  }
};

// =============================================================

let map, geoLayer, municipalityData, regionData;
let isMunicipalityView = true;
let selectedArea = null;
let clickLocked = false;

// Initialize map
function initMap() {
  map = L.map("map", {
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

  // Clicking empty map clears selection
  map.on("click", () => {
    if (selectedArea && !clickLocked) resetView();
  });
}

// Draw regions or municipalities
function drawAreas(data) {
  if (!map || !data) return;
  if (geoLayer) map.removeLayer(geoLayer);

  geoLayer = L.geoJSON(data, {
    style: CONFIG.AREA_STYLE,
    onEachFeature: (feature, layer) => {
      layer.on("click", (e) => {
        e.originalEvent.stopPropagation();
        if (clickLocked) return;
        handleFeatureClick(feature);
      });
    }
  });

  geoLayer.addTo(map);
}

// Handle municipality click
function handleFeatureClick(feature) {
  if (selectedArea) {
    resetView();
    return;
  }

  selectedArea = feature;
  clickLocked = true;

  const name = feature.properties.OB_UIME || feature.properties.SR_UIME;
  const popupHtml = `<b>${name}</b>`;

  // Apply blur and start enlargement at the same time
  const mapDiv = document.getElementById("map");
  mapDiv.style.transition = `filter ${CONFIG.BLUR_EFFECT.duration}s ${CONFIG.ENLARGE_EFFECT.easing}`;
  mapDiv.style.filter = `blur(${CONFIG.BLUR_EFFECT.blur}) brightness(${CONFIG.BLUR_EFFECT.brightness})`;

  drawFocusedFeature(feature, popupHtml);
}

// Draw high-res vector overlay (sharp vector)
function drawFocusedFeature(feature, popupHtml) {
  const overlay = document.getElementById("focus-overlay");
  overlay.innerHTML = "";

  const tempLayer = L.geoJSON(feature, { style: CONFIG.FOCUSED_STYLE }).addTo(map);

  // Wait one frame for Leaflet to render the path, then clone and animate
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

    // Animate enlargement at the same time as blur
    svgPath.style.transition = `transform ${CONFIG.ENLARGE_EFFECT.duration}s ${CONFIG.ENLARGE_EFFECT.easing}`;
    svgPath.style.transformOrigin = `${fx}px ${fy}px`;
    svgPath.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;

    // Add popup label
    const label = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
    label.setAttribute("x", cx - 75);
    label.setAttribute("y", cy - 25);
    label.setAttribute("width", 150);
    label.setAttribute("height", 50);
    label.innerHTML = `<div xmlns="http://www.w3.org/1999/xhtml"
                         style="text-align:center;font:14px sans-serif;color:black;
                                background:white;border-radius:4px;padding:4px;">
                         ${popupHtml}
                       </div>`;
    overlay.appendChild(label);

    // Unlock after animations complete
    setTimeout(() => (clickLocked = false), CONFIG.ENLARGE_EFFECT.duration * 1000);
  });
}

// Reset map and overlay
function resetView() {
  if (!selectedArea) return;
  clickLocked = true;

  const mapDiv = document.getElementById("map");
  mapDiv.style.transition = `filter ${CONFIG.BLUR_EFFECT.duration}s ${CONFIG.ENLARGE_EFFECT.easing}`;
  mapDiv.style.filter = "";

  const overlay = document.getElementById("focus-overlay");
  overlay.innerHTML = "";
  selectedArea = null;

  // Allow new click after transition ends
  setTimeout(() => (clickLocked = false), CONFIG.BLUR_EFFECT.duration * 1000);
}


let touristData = [];
let currentMonthIndex = 0;
let timeline, label;


async function loadTouristData() {
  const response = await fetch("data/tourist_data_grouped_smaller.json");
  touristData = await response.json();

  const months = touristData.map(d => d.month);
  createTimeline(months);
}




function createTimeline(months) {
  const timeline = document.getElementById("timeline");
  const label = document.getElementById("timeline-label");
  const playButton = document.getElementById("play-button");
  const speedSlider = document.getElementById("speed-slider");

  timeline.min = 0;
  timeline.max = months.length - 1;
  timeline.value = 0;
  label.textContent = months[0];

  speedSlider.min = 0.1;
  speedSlider.max = 10;
  speedSlider.step = 0.1;
  speedSlider.value = 1;

  updateMonthData(months[0]);

  let playing = false;
  let speedMultiplier = 1;
  let playTimeout = null;

  function stopPlayback() {
    playing = false;
    playButton.textContent = "▶";
    clearTimeout(playTimeout);
  }

  speedSlider.addEventListener("input", () => {
    speedMultiplier = parseFloat(speedSlider.value);
    stopPlayback();
  });

  function playLoop() {
    if (!playing) return;

    currentMonthIndex = (currentMonthIndex + 1) % months.length;
    timeline.value = currentMonthIndex;
    label.textContent = months[currentMonthIndex];
    updateMonthData(months[currentMonthIndex]);

    playTimeout = setTimeout(playLoop, 1000 / speedMultiplier);
  }

  playButton.addEventListener("click", () => {
    if (playing) {
      stopPlayback();
    } else {
      playing = true;
      playButton.textContent = "⏸";
      playLoop();
    }
  });

  timeline.addEventListener("input", () => {
    currentMonthIndex = parseInt(timeline.value);
    label.textContent = months[currentMonthIndex];
    updateMonthData(months[currentMonthIndex]);
  });
}






function normalizeName(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function lerpColor(color1, color2, t) {
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);

  const r = Math.round(((c2 >> 16) - (c1 >> 16)) * t + (c1 >> 16));
  const g = Math.round((((c2 >> 8) & 0xff) - ((c1 >> 8) & 0xff)) * t + ((c1 >> 8) & 0xff));
  const b = Math.round(((c2 & 0xff) - (c1 & 0xff)) * t + (c1 & 0xff));

  return `rgb(${r},${g},${b})`;
}

function updateMonthData(month) {
  const selectedMonth = touristData.find(d => d.month === month);
  if (!selectedMonth || !geoLayer) return;

  const municipalities = selectedMonth.municipalities;

  geoLayer.eachLayer(layer => {
    const nameRaw = layer.feature.properties.OB_UIME || layer.feature.properties.SR_UIME;
    if (!nameRaw) return;

    const name = normalizeName(nameRaw);
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


async function loadData() {
  const overlay = document.getElementById("focus-overlay");

  overlay.classList.add("loading");
  overlay.style.backdropFilter = `blur(${CONFIG.LOADING_EFFECT.blur}) brightness(${CONFIG.LOADING_EFFECT.brightness})`;
  overlay.style.background = CONFIG.LOADING_EFFECT.background;

  try {
    const [munRes, regRes] = await Promise.all([
      fetch("data/OB_with_SR.geojson"),
      fetch("data/SR.geojson")
    ]);
    municipalityData = await munRes.json();
    regionData = await regRes.json();
    drawAreas(municipalityData);

    await loadTouristData();
  } finally {
    overlay.style.transition = `opacity ${CONFIG.LOADING_EFFECT.duration}s ease`;
    overlay.style.opacity = "0";

    setTimeout(() => {
      overlay.classList.remove("loading");
      overlay.style.opacity = "";
      overlay.style.backdropFilter = "";
      overlay.style.background = "";
    }, CONFIG.LOADING_EFFECT.duration * 1000);
  }
}





function toggleView() {
  if (clickLocked) return;
  resetView();
  isMunicipalityView = !isMunicipalityView;
  drawAreas(isMunicipalityView ? municipalityData : regionData)
  if (touristData.length > 0) {
    const currentMonth = touristData[currentMonthIndex]?.month || touristData[0]?.month;
    updateMonthData(currentMonth);
  }
}


// Run
initMap();
loadData();
document.getElementById("toggle-btn").addEventListener("click", toggleView);
