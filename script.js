
// Constant values
const INITIAL_VIEW = {
  center: [46.15, 14.995],
  zoom: 8.5
};

// Global variables:
let map;
let geoLayer = null;
let municipalityData = null;
let regionData = null;
let isMunicipalityView = false; // switch between municipalities and statistical regions
let selectedFeature = null; // to know which region is selected



// Initialize the map for Slovenia:
function initMap() {
  map = L.map("map", {
    center: INITIAL_VIEW.center,
    zoom: INITIAL_VIEW.zoom,
    minZoom: 9,
    maxZoom: 12,
    zoomControl: true
  });

  // Set background to white:
  L.DomUtil.get('map').style.background = "#ffffffff";
}


// Draw municipalities or regions:
function drawAreas(data) {
  if (!map || !data) return;

  // Remove old layer if it exists:
  if (geoLayer) {
    map.removeLayer(geoLayer);
  }

  // Create new GeoJSON layer:
  geoLayer = L.geoJSON(data, {
    style: {
      color: "#555",          // Border color
      weight: 1,                // Border thickness
      fillColor: "#e0e0e0",   // Light grey fill
      fillOpacity: 1.0
    },
    onEachFeature: (feature, layer) => {
      layer.on("click", () => {
        selectedFeature = feature;
        map.fitBounds(layer.getBounds(), {padding: [50, 50], maxZoom: 10});

        const obcinaName = feature.properties.OB_UIME || "";
        const regijaName = feature.properties.SR_UIME;

        let popupHtml = ""

        // municipalities
        if(isMunicipalityView) {
          popupHtml = `
            <div>
              <b>${obcinaName}</b>
              <br><span>${regijaName}</span>
            </div>
          `;
        } else {
          // statistical regions
          popupHtml = `
            <div>
              <b>${regijaName}</b>
            </div>
          `;
        }

        layer.bindPopup(`<b>${popupHtml}</b>`).openPopup();

        // Highlight selected area:
        layer.setStyle({
          color: "#000",
          weight: 2,
          fillColor: "#bbbbbb"
        });
      });
      // After leaving region, reset style:
      layer.on("popupclose", () => {
        geoLayer.resetStyle(layer);

        //return to original view
        map.flyTo(INITIAL_VIEW.center, INITIAL_VIEW.zoom, {
          animate: true,
          duration: 0.2
        });
      });
    }
  });

  geoLayer.addTo(map);
}


// Load GeoJSON data:
async function loadData() {
  const [munResponse, regResponse] = await Promise.all([
    fetch("data/OB_with_SR.geojson"),
    fetch("data/SR.geojson")
  ]);

  municipalityData = await munResponse.json();
  regionData = await regResponse.json();

  // Default view are statistical regions:
  drawAreas(regionData);
}


// Toggle between municipalities and regions
function toggleView() {
  isMunicipalityView = !isMunicipalityView;
  if (isMunicipalityView) {
    drawAreas(municipalityData);
  } else {
    drawAreas(regionData);
  }
}



// Run:
initMap();
loadData();

// Button switch between municipalities and regions:
document.getElementById("toggle-btn").addEventListener("click", toggleView);