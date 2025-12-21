import { state } from "./state.js";
import { normalizeAreaName, normalizeNationalityName, calcAreaColor, formatMonthString } from './common.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { getFilteredMunicipalityData, getFilteredStatRegionData, FLAG_CODE_MAP, getLocalFlagURL, COUNTRY_COLORS } from "./data.js";


function getPieTooltip() {
    let tooltip = d3.select(".municipality-chart-tooltip");

    if (tooltip.empty()) {
        tooltip = d3.select("body")
            .append("div")
            .attr("class", "municipality-chart-tooltip")
            .style("opacity", 0)
            .style("pointer-events", "none");
    }

    return tooltip;
}



function makePieChart(display_data) {

    const EMOJI_SIZE = 22;
    const EMOJI_RADIUS = 0.85;

    const total_sum = display_data.pie_chart_sum;
    const country_data = display_data.pie_chart_list;

    const width = 350;
    const height = width;
    const radius = Math.min(width, height) / 2;

    const wrapper = document.createElement("div");
    wrapper.className = "municipality-chart-wrapper";

    // NO DATA CASE
    if (total_sum === 0) {
        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("class", "municipality-chart-svg nodata")
            .style("display", "block")
            .style("margin", "10px auto");

        const g = svg.append("g")
            .attr("class", "municipality-chart-group")
            .attr("transform", `translate(${width / 2}, ${height / 2})`);

        g.append("circle")
            .attr("class", "municipality-chart-nodata-circle")
            .attr("r", radius)
            .attr("fill", "#cccccc")
            .attr("stroke", "#999");

        wrapper.appendChild(svg.node());

        const label = document.createElement("div");
        label.className = "municipality-chart-label";
        label.textContent = "No data";
        wrapper.appendChild(label);

        return wrapper;
    }

    // PIE DATA
    const pieData = country_data.map(item => ({
        nationality: item.nationality,
        tourists: item.tourists,
        relativePercentage: item.relativePercentage,
        merged: item.merged || []
    }));

    // Sort pie data into stable order based on keys in COUNTRY_COLORS
    const order = Object.keys(COUNTRY_COLORS);
    pieData.sort((a, b) =>
        order.indexOf(a.nationality) - order.indexOf(b.nationality)
    );

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "municipality-chart-svg")
        .style("display", "block")
        .style("margin", "10px auto");

    const g = svg.append("g")
        .attr("class", "municipality-chart-group")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie()
        .sort(null)
        .value(d => d.relativePercentage);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    // TOOLTIP
    const tooltip = getPieTooltip();


    // GROUP EACH SLICE + EMOJI
    const sliceGroups = g.selectAll(".slice-group")
        .data(pie(pieData))
        .join("g")
        .attr("class", "slice-group");

    // DRAW PATHS
    sliceGroups.append("path")
        .attr("class", "municipality-chart-slice")
        .attr("d", arc)
        .attr("fill", d => COUNTRY_COLORS[d.data.nationality] || "#cccccc")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2)
        .attr("stroke-linejoin", "round")
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

    // TWEMOJI FLAG ICONS
    sliceGroups.append("image")
        .attr("href", d => getLocalFlagURL(d.data.nationality))
        .attr("width", EMOJI_SIZE)
        .attr("height", EMOJI_SIZE)
        .attr("pointer-events", "none")
        .attr("x", d => {
            const [cx, cy] = arc.centroid(d);
            const angle = Math.atan2(cy, cx);
            const r = EMOJI_RADIUS * radius;
            return Math.cos(angle) * r - EMOJI_SIZE / 2;
        })
        .attr("y", d => {
            const [cx, cy] = arc.centroid(d);
            const angle = Math.atan2(cy, cx);
            const r = EMOJI_RADIUS * radius;
            return Math.sin(angle) * r - EMOJI_SIZE / 2;
        });

    // FINISH
    wrapper.appendChild(svg.node());

    const label = document.createElement("div");
    label.className = "municipality-chart-label";
    label.textContent = "Tourists by nationality";
    wrapper.appendChild(label);

    return wrapper;
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

export function cleanUpPieChartTooltips() {
    d3.selectAll(".municipality-chart-tooltip")
        .style("opacity", 0);
}






function makeTouristTableStatRegion(display_data) {

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



function makeMunicipalityCard(name) {

    const display_data = getFilteredMunicipalityData(name);
    const month_string = formatMonthString(display_data.month_string);
    const display_name = display_data.display_name;
    const total_tourists_no_filter = display_data.total_tourist_sum;
    const total_tourists_filter = display_data.total_tourists_filtered;

    const wrapper = document.createElement("div");
    wrapper.className = "municipality-card";
    wrapper.id = `municipality-card-${name}`;

    // Title
    const title = document.createElement("div");
    title.className = "municipality-card-title";
    title.id = `municipality-card-title-${name}`;
    title.textContent = display_name;
    wrapper.appendChild(title);

    // Main tourist count text
    const mainText = document.createElement("div");
    mainText.className = "municipality-card-main-text";
    mainText.id = `municipality-card-main-text-${name}`;
    mainText.textContent =
        `${total_tourists_no_filter.toLocaleString()} tourists visited the Municipality of ${display_name} in ${month_string}`;
    wrapper.appendChild(mainText);

    // Filtered tourist count (smaller text)
    const subText = document.createElement("div");
    subText.className = "municipality-card-sub-text";
    subText.id = `municipality-card-sub-text-${name}`;
    subText.textContent =
        `${total_tourists_filter.toLocaleString()} tourists visiting from selected countries`;
    wrapper.appendChild(subText);

    // Pie chart
    const chartWrapper = document.createElement("div");
    chartWrapper.className = "municipality-card-chart";
    chartWrapper.id = `municipality-card-chart-${name}`;
    chartWrapper.appendChild(makePieChart(display_data));
    wrapper.appendChild(chartWrapper);

    // Table
    const tableContainer = document.createElement("div");
    tableContainer.className = "municipality-card-table";
    tableContainer.id = `municipality-card-table-${name}`;
    tableContainer.innerHTML = makeTouristTableMunicipality(display_data);
    wrapper.appendChild(tableContainer);

    return wrapper;
}



function makeStatRegionCard(name) {

    const display_data = getFilteredStatRegionData(name);
    const display_name = display_data.display_name;
    const month_string = formatMonthString(display_data.month_string);
    const total_tourists_no_filter = display_data.total_tourist_sum;
    const total_tourists_filter = display_data.total_tourists_filtered;

    const wrapper = document.createElement("div");
    wrapper.className = "statregion-card";
    wrapper.id = `statregion-card-${name}`;

    // Title
    const title = document.createElement("div");
    title.className = "statregion-card-title";
    title.id = `statregion-card-title-${name}`;
    title.textContent = display_name;
    wrapper.appendChild(title);

    // Main tourist count
    const mainText = document.createElement("div");
    mainText.className = "statregion-card-main-text";
    mainText.id = `statregion-card-main-text-${name}`;
    mainText.textContent =
        `${total_tourists_no_filter.toLocaleString()} tourists visited the statistical region of ${display_name} in ${month_string}`;
    wrapper.appendChild(mainText);

    // Filtered tourist count
    const subText = document.createElement("div");
    subText.className = "statregion-card-sub-text";
    subText.id = `statregion-card-sub-text-${name}`;
    subText.textContent =
        `${total_tourists_filter.toLocaleString()} tourists visiting from selected countries`;
    wrapper.appendChild(subText);

    // Pie chart
    const chartWrapper = document.createElement("div");
    chartWrapper.className = "statregion-card-chart";
    chartWrapper.id = `statregion-card-chart-${name}`;
    chartWrapper.appendChild(makePieChart(display_data));
    wrapper.appendChild(chartWrapper);

    // Table
    const tableContainer = document.createElement("div");
    tableContainer.className = "statregion-card-table";
    tableContainer.id = `statregion-card-table-${name}`;
    tableContainer.innerHTML = makeTouristTableStatRegion(display_data);
    wrapper.appendChild(tableContainer);

    return wrapper;
}









export function generateFocusedAreaData(feature, container) {
    const isMunicipality = state.isMunicipalityView;
    const nameRaw = feature.properties.OB_UIME || feature.properties.SR_UIME;
    const name = nameRaw ? normalizeAreaName(nameRaw) : "slovenija";

    container.innerHTML = "";

    if (isMunicipality) {
        container.appendChild(makeMunicipalityCard(name));
    } else {
        container.appendChild(makeStatRegionCard(name));
    }
}



export function updateAreaCard() {
    if (!state.selectedArea) return;

    const panel = document.getElementById("focused-area-panel");
    const wrapper = document.getElementById("focused-area-wrapper");

    const card = panel?.querySelector(".panel-card");
    const isOpen = !!card && wrapper.style.transform !== "";

    if (!isOpen) return;

    card.innerHTML = "";
    cleanUpPieChartTooltips();
    generateFocusedAreaData(state.selectedArea, card);
}
