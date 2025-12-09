import { state } from './state.js';


export async function loadTouristData() {
  const [munRes, srRes, munTotal, srTotal, nationalityTranslations] = await Promise.all([
    fetch("data/tourist_data_grouped_ENG.json"),
    fetch("data/sr_data_grouped.json"),
    fetch("data/tourist_data_grouped_total.json"),
    fetch("data/sr_data_grouped_total.json"),
    fetch("data/nationality_translations.json")
  ]);
  

  state.touristDataMun = await munRes.json();
  state.touristDataSr = await srRes.json();
  state.touristDataMunTotal = await munTotal.json();
  state.touristDataSrTotal = await srTotal.json();
  state.nationalityTranslations = await nationalityTranslations.json();
  
  state.touristData = structuredClone(state.touristDataMunTotal);
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