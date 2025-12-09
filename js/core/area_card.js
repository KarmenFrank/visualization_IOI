import { state } from "./state.js";
import { normalizeAreaName, normalizeNationalityName, calcAreaColor } from './common.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";


function makeMunicipalityPieChart(display_data) {

    const total_sum = display_data.pie_chart_sum;
    const country_data = display_data.pie_chart_list;

    const width = 150;
    const height = 150;
    const radius = Math.min(width, height) / 2;

    // Wrapper DOM element (not string)
    const wrapper = document.createElement("div");
    wrapper.style.textAlign = "center";

    // ===========================================================
    // NO DATA CASE
    // ===========================================================
    if (total_sum === 0) {
        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .style("display", "block")
            .style("margin", "10px auto");

        const g = svg.append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`);

        g.append("circle")
            .attr("r", radius)
            .attr("fill", "#cccccc")
            .attr("stroke", "#999");

        wrapper.appendChild(svg.node());
        const label = document.createElement("div");
        label.textContent = "No data";
        label.style.fontSize = "12px";
        label.style.marginTop = "4px";
        wrapper.appendChild(label);

        return wrapper;
    }

    // ===========================================================
    // PIE DATA
    // ===========================================================
    const pieData = country_data.map(item => ({
        nationality: item.nationality,
        tourists: item.tourists,
        relativePercentage: item.relativePercentage,
        merged: item.merged || []
    }));

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .style("display", "block")
        .style("margin", "10px auto");

    const g = svg.append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const color = d3.scaleOrdinal().range(d3.schemeCategory10);

    const pie = d3.pie()
        .sort(null)
        .value(d => d.relativePercentage);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    // ===========================================================
    // TOOLTIP (HTML DIV)
    // ===========================================================
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "pie-tooltip")
        .style("position", "absolute")
        .style("padding", "6px 10px")
        .style("background", "rgba(0,0,0,0.75)")
        .style("color", "white")
        .style("fontSize", "12px")
        .style("borderRadius", "4px")
        .style("pointerEvents", "none")
        .style("opacity", 0);

    // ===========================================================
    // DRAW WITH EVENT LISTENERS
    // ===========================================================
    g.selectAll("path")
        .data(pie(pieData))
        .join("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.nationality))
        .on("mousemove", (event, d) => {
            const pct = (d.data.relativePercentage * 100).toFixed(2);
            const tourists = d.data.tourists.toLocaleString();

            let html = `
                <strong>${d.data.nationality}</strong><br>
                ${pct}%<br>
                ${tourists} tourists
            `;

            if (d.data.nationality === "Other" && d.data.merged.length > 0) {
                html += `<br><strong>Includes:</strong><br>${d.data.merged.join(", ")}`;
            }

            tooltip
                .style("opacity", 1)
                .html(html)
                .style("left", event.pageX + 12 + "px")
                .style("top", event.pageY + 12 + "px");
        })
        .on("mouseleave", () => {
            tooltip.style("opacity", 0);
        });

    // ===========================================================
    // APPEND SVG + LABEL TO WRAPPER
    // ===========================================================
    wrapper.appendChild(svg.node());

    const label = document.createElement("div");
    label.textContent = "Tourists by nationality";
    label.style.fontSize = "12px";
    label.style.marginTop = "4px";
    wrapper.appendChild(label);

    return wrapper;
}




function getFilteredMunicipalityData(normalized_mun_name){
    const { CONFIG, touristDataMun, currentMonthIndex, months, nationalityTranslations } = state;

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
        table_list: final_list,
        total_tourist_sum: totalTouristSum,
        pie_chart_list: pieChartBase,
        pie_chart_sum : selectedTotal,
        display_name : mun_display_name
    };
}


function makeTouristTableMunicipality(display_data) {

    const table_data = display_data.table_list;
    const total_tourists = display_data.total_tourist_sum;

    let rows = "";
    for (const item of table_data) {
        const nationality = item.nationality;
        const tourists = item.tourists;
        const percent = total_tourists > 0
            ? ((tourists / total_tourists) * 100).toFixed(2) + "%"
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

    const display_data = getFilteredMunicipalityData(name);

    const wrapper = document.createElement("div");

    const title = document.createElement("div");
    title.className = "focused-title";
    title.style.fontSize = "20px";
    title.style.fontWeight = "bold";
    title.style.textAlign = "center";
    title.textContent = name;
    wrapper.appendChild(title);

    // Pie chart
    wrapper.appendChild(makeMunicipalityPieChart(display_data));

    // Table (string → HTML)
    const tableContainer = document.createElement("div");
    tableContainer.innerHTML = makeTouristTableMunicipality(display_data);
    wrapper.appendChild(tableContainer);

    return wrapper;
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

    container.innerHTML = "";

    if (isMunicipality) {
        container.appendChild(makeMunicipalityCard(feature, name));
    } else {
        container.appendChild(makeStatRegionCard(name));
    }
}



export function updateAreaCard() {
    const panel = document.getElementById("focused-area-panel");
    const wrapper = document.getElementById("focused-area-wrapper");

    const card = panel?.querySelector(".panel-card");
    const isOpen = !!card && wrapper.style.transform !== "";

    if (!isOpen) return;

    card.innerHTML = "";
    generateFocusedAreaData(state.selectedArea, card);
}
