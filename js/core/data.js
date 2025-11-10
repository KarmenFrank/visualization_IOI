import { state } from './state.js';


export async function loadTouristData() {
  const response = await fetch("data/tourist_data_grouped_smaller.json");
  state.touristData = await response.json();
  state.months = state.touristData.map(d => d.month);
}


export async function loadMapData() {
  const [munRes, regRes] = await Promise.all([
      fetch("data/OB_with_SR.geojson"),
      fetch("data/SR.geojson")
    ]);
    state.municipalityData = await munRes.json();
    state.regionData = await regRes.json();
}