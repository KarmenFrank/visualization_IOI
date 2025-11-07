// ======================= CONFIGURATION =======================
const CONFIG = {
  INITIAL_VIEW: { center: [46.15, 14.995], zoom: 9.25 },
  MAP_STYLE: { background: "#8bd8ddff" },
  AREA_STYLE: { color: "#555", weight: 1, fillColor: "#e0e0e0", fillOpacity: 1.0 },
  FOCUSED_STYLE: { color: "#000", weight: 2, fillColor: "#fff", fillOpacity: 1.0 },
  BLUR_EFFECT: { blur: "40px", brightness: 0.8, duration: 0.3 },
  ENLARGE_EFFECT: {
    targetWidthRatio: 0.6,
    targetHeightRatio: 0.6,
    duration: 0.6,
    easing: "ease"
  }
};
// =============================================================

let map, geoLayer, municipalityData, regionData;
let isMunicipalityView = false;
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

// Load GeoJSON
async function loadData() {
  const [munRes, regRes] = await Promise.all([
    fetch("data/OB_with_SR.geojson"),
    fetch("data/SR.geojson")
  ]);
  municipalityData = await munRes.json();
  regionData = await regRes.json();
  drawAreas(regionData);
}

// Toggle between region and municipality layers
function toggleView() {
  if (clickLocked) return;
  resetView();
  isMunicipalityView = !isMunicipalityView;
  drawAreas(isMunicipalityView ? municipalityData : regionData);
}

// Run
initMap();
loadData();
document.getElementById("toggle-btn").addEventListener("click", toggleView);
