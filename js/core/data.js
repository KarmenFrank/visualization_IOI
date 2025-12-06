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

export async function loadFilterData() {
  const [mun, sr] = await Promise.all([
    fetch("data/nationalities_mun.json").then(r => r.json()),
    fetch("data/nationalities_sr.json").then(r => r.json())
  ]);
  state.nationalitiesMun = mun;
  state.nationalitiesSr = sr;
}