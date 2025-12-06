import { state } from './state.js';


export async function loadTouristData() {
  const [munRes, srRes] = await Promise.all([
    fetch("data/tourist_data_grouped_ENG.json"),
    fetch("data/sr_data_grouped.json")
  ]);
  
  state.touristDataMun = await munRes.json();
  state.touristDataSr = await srRes.json();
  
  state.touristData = structuredClone(state.touristDataMun);
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


export async function loadSearchData() {
  const response = await fetch("data/regije_obcine_naselja.json");
  state.searchData = await response.json();
}