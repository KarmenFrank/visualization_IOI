import { state } from "./state.js";
import { normalizeAreaName, normalizeNationalityName, calcAreaColor } from './common.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";


function makeDummyPieChart() {
    // Dummy data
    const data = [
        { label: "A", value: 40 },
        { label: "B", value: 25 },
        { label: "C", value: 20 },
        { label: "D", value: 15 }
    ];

    const width = 150;
    const height = 150;
    const radius = Math.min(width, height) / 2;

    // Create an SVG container
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .style("display", "block")
        .style("margin", "10px auto");

    const g = svg.append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const color = d3.scaleOrdinal()
        .range(["#4e79a7", "#f28e2c", "#e15759", "#76b7b2"]);

    const pie = d3.pie()
        .sort(null)
        .value(d => d.value);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    // Draw slices
    g.selectAll("path")
        .data(pie(data))
        .join("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.label));

    // Convert SVG to HTML string
    return `
        <div style="text-align:center;">
            ${svg.node().outerHTML}
            <div style="font-size:12px; margin-top:4px;">Dummy Pie Chart</div>
        </div>
    `;
}


function makeTouristTableMunicipality(normalized_mun_name) {
    const { CONFIG, touristDataMun, geoLayer, currentMonthIndex, months, nationalityTranslations } = state;

    const month_string = months[currentMonthIndex];
    const tourist_data_for_month = touristDataMun.find(item => item.month === month_string);
    const mun_data = tourist_data_for_month.municipalities[normalized_mun_name];

    if (mun_data == null) {
        throw new Error(`makeTouristTableMunicipality: mun_data is null for month: ${month_string}`);
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
            nationality: item.name,
            tourists: item.data.data
        }));

    const list_unselected = nationality_data_slovenian_names
        .filter(item => {
            const slo_norm_name = normalizeNationalityName(item.name);
            const eng_name = nationalityTranslations[slo_norm_name];
            return unselected.has(eng_name);
        })
        .map(item => ({
            nationality: item.name,
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


    let rows = "";
    for (const item of final_list) {
        const eng_name = nationalityTranslations[normalizeNationalityName(item.nationality)];
        const nationality = eng_name ? eng_name : "Unselected";
        const tourists = item.tourists;
        const percent = totalTouristSum > 0
            ? ((tourists / totalTouristSum) * 100).toFixed(2) + "%"
            : "0%";

        rows += `
            <tr>
                <td style="padding: 8px 12px;">${nationality}</td>
                <td style="padding: 8px 12px;">${tourists}</td>
                <td style="padding: 8px 12px;">${percent}</td>
            </tr>
        `;
    }


    return `
    <div style="
        margin-top: 18px;
        max-width: 100%;
        overflow-x: auto;
        padding-bottom: 6px;
        max-height: 300px;
        overflow-y: auto;
    ">
        <table style="
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
            min-width: 320px;
        ">
            <thead>
                <tr style="
                    background: #f0f0f0;
                    position: sticky;
                    top: 0;
                    z-index: 1;
                ">
                    <th style="padding: 8px 12px; text-align: left;">Nationality</th>
                    <th style="padding: 8px 12px; text-align: left;">Number of tourists</th>
                    <th style="padding: 8px 12px; text-align: left;">Relative percentage</th>
                </tr>
            </thead>

            <tbody>
                ${rows}
            </tbody>
        </table>
    </div>
    `;

}




function makeMunicipalityCard(map_feature, name) {
    return `
        <div class="focused-title" style="font-size: 20px; font-weight: bold; text-align: center;">
            ${name}
        </div>

        ${makeDummyPieChart()}

        ${makeTouristTableMunicipality(name)}
    `;
}


function makeStatRegionCard(name) {
    return `
        <div class="focused-title" style="font-size: 20px; font-weight: bold; text-align: center;">
        TEMP REGION
        </div>
        <div class="focused-info" style="text-align: center;">
        <p>Population: 12,345</p>
        <p>Area: 678 km²</p>
        <p>Status: Test Info</p>
        </div>
    `;
}



export function generateFocusedAreaData(feature, container) {
    const isMunicipality = state.isMunicipalityView;
    const nameRaw = feature.properties.OB_UIME || feature.properties.SR_UIME;
    const name = nameRaw ? normalizeAreaName(nameRaw) : "slovenija";
    container.innerHTML = isMunicipality ? makeMunicipalityCard(feature, name) : makeStatRegionCard(name);
}