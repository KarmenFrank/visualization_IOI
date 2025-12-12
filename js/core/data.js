import { state } from './state.js';
import { normalizeNationalityName } from './common.js';

export async function loadTouristData() {
  const [munRes1, munRes2, srRes, munTotal, srTotal, nationalityTranslations] = await Promise.all([
    fetch("data/tourist_data_grouped_ENG.json"),
    fetch("data/tourist_data_grouped_ENG_2.json"),
    fetch("data/sr_data_grouped.json"),
    fetch("data/tourist_data_grouped_total.json"),
    fetch("data/sr_data_grouped_total.json"),
    fetch("data/nationality_translations.json")
  ]);

  const mun1 = await munRes1.json();
  const mun2 = await munRes2.json();
  
  state.touristDataMun = [...mun1, ...mun2];
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













export function getFilteredMunicipalityData(normalized_mun_name){
    const { CONFIG, touristDataMun, currentMonthIndex, months, nationalityTranslations } = state;

    const month_string = months[currentMonthIndex];
    const tourist_data_for_month = touristDataMun.find(item => item.month === month_string);
    const mun_data = tourist_data_for_month.municipalities[normalized_mun_name];

    if (mun_data == null) {
        throw new Error(`getFilteredMunicipalityData: mun_data is null for month: ${month_string}`);
    }

    const mun_display_name = mun_data.display_name;
    const nationality_data_slovenian_names = mun_data.countries;

    const selected =
        state.selectedNationalities.size > 0
            ? new Set(state.selectedNationalities)
            : new Set(state.allNationalities);

    const unselected = new Set(
        [...state.allNationalities].filter(n => !selected.has(n))
    );

    const list_selected = nationality_data_slovenian_names
        .filter(item => {
            const slo_norm_name = normalizeNationalityName(item.name);
            const eng_name = nationalityTranslations[slo_norm_name];
            return selected.has(eng_name);
        })
        .map(item => ({
            nationality: nationalityTranslations[normalizeNationalityName(item.name)],
            tourists: item.data.data
        }));

    const list_unselected = nationality_data_slovenian_names
        .filter(item => {
            const slo_norm_name = normalizeNationalityName(item.name);
            const eng_name = nationalityTranslations[slo_norm_name];
            return unselected.has(eng_name);
        })
        .map(item => ({
            nationality: nationalityTranslations[normalizeNationalityName(item.name)],
            tourists: item.data.data
        }));


    const unselected_sum = list_unselected.reduce(
        (acc, item) => acc + item.tourists,
        0
    );

    const list_selected_sorted = [...list_selected].sort(
        (a, b) => b.tourists - a.tourists
    );

    const final_list = [
        ...list_selected_sorted,
        ...(unselected.size > 0
            ? [{ nationality: "Unselected", tourists: unselected_sum }]
            : [])
    ];

    const totalTouristSum = final_list.reduce(
        (sum, item) => sum + item.tourists,
        0
    );




    const selectedTotal = list_selected_sorted.reduce(
        (sum, item) => sum + item.tourists,
        0
    );
    const threshold = selectedTotal * 0.02;

    let otherSum = 0;
    let mergedNames = [];

    const pieChartBase = list_selected_sorted.reduce((acc, item) => {
        if (item.tourists < threshold) {
            otherSum += item.tourists;
            mergedNames.push(item.nationality);
        } else {
            acc.push({
                ...item,
                relativePercentage: item.tourists / selectedTotal
            });
        }
        return acc;
    }, []);

    if (otherSum > 0) {
        pieChartBase.push({
            nationality: "Other",
            tourists: otherSum,
            relativePercentage: otherSum / selectedTotal,
            merged: mergedNames
        });
    }

    return {
        month_string : month_string,
        table_list: final_list,
        total_tourist_sum: totalTouristSum,
        total_tourists_filtered : selectedTotal,
        pie_chart_list: pieChartBase,
        pie_chart_sum : selectedTotal,
        display_name : mun_display_name
    };
}




export function getFilteredStatRegionData(normalized_region_name){
    const { CONFIG, touristDataSr, currentMonthIndex, months, nationalityTranslations } = state;

    const month_string = months[currentMonthIndex];
    const tourist_data_for_month = touristDataSr.find(item => item.month === month_string);
    const sr_data = tourist_data_for_month.regions[normalized_region_name];

    if (sr_data == null) {
        throw new Error(`getFilteredStatRegionData: sr_data is null for month: ${month_string}`);
    }

    const sr_display_name = sr_data.display_name;
    const nationality_data_slovenian_names = sr_data.countries;

    const selected =
        state.selectedNationalities.size > 0
            ? new Set(state.selectedNationalities)
            : new Set(state.allNationalities);

    const unselected = new Set(
        [...state.allNationalities].filter(n => !selected.has(n))
    );

    const list_selected = nationality_data_slovenian_names
        .filter(item => {
            const slo_norm_name = normalizeNationalityName(item.name);
            const eng_name = nationalityTranslations[slo_norm_name];
            return selected.has(eng_name);
        })
        .map(item => ({
            nationality: nationalityTranslations[normalizeNationalityName(item.name)],
            tourists: item.data.data
        }));

    const list_unselected = nationality_data_slovenian_names
        .filter(item => {
            const slo_norm_name = normalizeNationalityName(item.name);
            const eng_name = nationalityTranslations[slo_norm_name];
            return unselected.has(eng_name);
        })
        .map(item => ({
            nationality: nationalityTranslations[normalizeNationalityName(item.name)],
            tourists: item.data.data
        }));

      
    const unselected_sum = list_unselected.reduce((acc, item) => acc + item.tourists, 0);

    const list_selected_sorted = [...list_selected].sort((a, b) => b.tourists - a.tourists);

    const final_list = [
        ...list_selected_sorted,
        ...(unselected.size > 0
            ? [{ nationality: "Unselected", tourists: unselected_sum }]
            : [])
    ];

    const totalTouristSum = final_list.reduce((sum, item) => sum + item.tourists, 0);

    const selectedTotal = list_selected_sorted.reduce((sum, item) => sum + item.tourists, 0);
    const threshold = selectedTotal * 0.02;

    let otherSum = 0;
    let mergedNames = [];

    const pieChartBase = list_selected_sorted.reduce((acc, item) => {
        if (item.tourists < threshold) {
            otherSum += item.tourists;
            mergedNames.push(item.nationality);
        } else {
            acc.push({
                ...item,
                relativePercentage: item.tourists / selectedTotal
            });
        }
        return acc;
    }, []);

    if (otherSum > 0) {
        pieChartBase.push({
            nationality: "Other",
            tourists: otherSum,
            relativePercentage: otherSum / selectedTotal,
            merged: mergedNames
        });
    }

    return {
        month_string : month_string,
        table_list: final_list,
        total_tourist_sum: totalTouristSum,
        total_tourists_filtered : selectedTotal,
        pie_chart_list: pieChartBase,
        pie_chart_sum : selectedTotal,
        display_name : sr_display_name
    };
}


export const FLAG_CODE_MAP = {
    // --- Standard countries ---
    "Australia": "1f1e6-1f1fa",
    "Austria": "1f1e6-1f1f9",
    "Belgium": "1f1e7-1f1ea",
    "Bulgaria": "1f1e7-1f1ec",
    "Bosnia and Herzegovina": "1f1e7-1f1e6",
    "Brazil": "1f1e7-1f1f7",
    "Cyprus": "1f1e8-1f1fe",

    "Domestic": "1f1f8-1f1ee",

    "Denmark": "1f1e9-1f1f0",

    "Other African countries": "1f30d",                 // 🌍
    "Other Asian countries": "1f30f",                   // 🌏
    "Other countries of South and Middle America": "1f30e", // 🌎
    "Other countries of Oceania": "1f30a",              // 🌊
    "Other countries of North America": "1f30e",        // 🌎
    "Other European countries": "1f30d",                // 🌍

    "Total": "1f310",                                   // 🌐

    "Estonia": "1f1ea-1f1ea",
    "Finland": "1f1eb-1f1ee",
    "France": "1f1eb-1f1f7",
    "Greece": "1f1ec-1f1f7",
    "Croatia": "1f1ed-1f1f7",
    "Ireland": "1f1ee-1f1ea",
    "Iceland": "1f1ee-1f1f8",
    "Italy": "1f1ee-1f1f9",
    "Israel": "1f1ee-1f1f1",
    "Japan": "1f1ef-1f1f5",
    "South Africa": "1f1ff-1f1e6",
    "Canada": "1f1e8-1f1e6",
    "China (People's Republic)": "1f1e8-1f1f3",
    "Korea (Republic of)": "1f1f0-1f1f7",
    "Latvia": "1f1f1-1f1fb",
    "Lithuania": "1f1f1-1f1f9",
    "Luxembourg": "1f1f1-1f1fa",
    "Hungary": "1f1ed-1f1fa",
    "North Macedonia": "1f1f2-1f1f0",
    "Malta": "1f1f2-1f1f9",
    "Germany": "1f1e9-1f1ea",
    "Netherlands": "1f1f3-1f1f1",
    "Norway": "1f1f3-1f1f4",
    "New Zealand": "1f1f3-1f1ff",
    "Poland": "1f1f5-1f1f1",
    "Portugal": "1f1f5-1f1f9",
    "Romania": "1f1f7-1f1f4",
    "Russian Federation": "1f1f7-1f1fa",
    "Slovakia": "1f1f8-1f1f0",
    "Serbia": "1f1f7-1f1f8",

    "Foreign": "1f30d",

    "Turkey": "1f1f9-1f1f7",
    "Ukraine": "1f1fa-1f1e6",
    "United States of America": "1f1fa-1f1f8",
    "United Kingdom": "1f1ec-1f1e7",
    "Czech Republic": "1f1e8-1f1ff",
    "Montenegro": "1f1f2-1f1ea",
    "Spain": "1f1ea-1f1f8",
    "Sweden": "1f1f8-1f1ea",
    "Switzerland": "1f1e8-1f1ed",
    
    "Other" : "1f310"
};

export const COUNTRY_COLORS = {

    // --- Standard countries ---
    "Australia": "#4C84FF",
    "Austria": "#FF6B6B",
    "Belgium": "#4CC276",
    "Bulgaria": "#FF8484",
    "Bosnia and Herzegovina": "#36D1C4",
    "Brazil": "#63D38C",
    "Cyprus": "#3EC7B5",

    // Domestic
    "Domestic": "#ff3f3fff",

    // Denmark
    "Denmark": "#4FBFAF",

    // --- Regional "Other" groups ---
    "Other African countries": "#5ADFC5",
    "Other Asian countries": "#81EAD6",
    "Other countries of South and Middle America": "#73E7D3",
    "Other countries of Oceania": "#91F0DF",
    "Other countries of North America": "#7BE3CC",
    "Other European countries": "#66DBC9",

    // Total
    "Total": "#C4C4C4",

    // --- Europe / nearby ---
    "Estonia": "#7BA9FF",
    "Finland": "#5D9BFF",
    "France": "#F27CCF",
    "Greece": "#9C7BFF",
    "Croatia": "#3AAE64",
    "Ireland": "#53C06C",
    "Iceland": "#3F82E8",
    "Italy": "#8C63FF",
    "Israel": "#7552E5",
    "Japan": "#FF5C8A",
    "South Africa": "#FFB44C",
    "Canada": "#FF9B4C",
    "China (People's Republic)": "#E960B1",
    "Korea (Republic of)": "#52D6D0",
    "Latvia": "#F4AD4F",
    "Lithuania": "#FFCA5C",
    "Luxembourg": "#A58BFF",
    "Hungary": "#CBEA5E",
    "North Macedonia": "#B4D856",
    "Malta": "#EA5FA0",
    "Germany": "#4AA9D9",
    "Netherlands": "#4AE0D0",
    "Norway": "#FFBB78",
    "New Zealand": "#6AD390",
    "Poland": "#D3F26E",
    "Portugal": "#FFB86A",
    "Romania": "#C9E56A",
    "Russian Federation": "#B59CFF",
    "Slovakia": "#D8F07F",
    "Serbia": "#F48AD8",

    // Foreign
    "Foreign": "#56C7B5",

    // Remaining countries
    "Turkey": "#FF7A7A",
    "Ukraine": "#29B8D0",
    "United States of America": "#2F62FF",
    "United Kingdom": "#FF8C4A",
    "Czech Republic": "#B57CFF",
    "Montenegro": "#FF4F4F",
    "Spain": "#FFA34C",
    "Sweden": "#C08AFF",
    "Switzerland": "#F48AC8",

    // Final catch-all
    "Other": "#c6c6c6ff"
};





export function getLocalFlagURL(nationality_eng) {
    if (!nationality_eng) {
        return "./data/emoji_svg/1f480.svg";
    }

    const code = FLAG_CODE_MAP[nationality_eng];

    if (!code) {
        return "./data/emoji_svg/1f480.svg";
    }

    return `./data/emoji_svg/${code}.svg`;
}
