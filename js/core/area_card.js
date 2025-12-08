import { state } from "./state.js";
import { normalizeAreaName, calcAreaColor } from './common.js';
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


function makeDummyTable() {
    let rows = "";
    for (let i = 1; i <= 50; i++) {
        const metric = `Metric ${i}`;
        const value = (Math.random() * 1000).toFixed(2);
        const notes = `Note ${Math.ceil(Math.random() * 10)}`;

        const striped = i % 2 === 0 ? 'style="background:#fafafa;"' : "";

        rows += `
            <tr ${striped}>
                <td style="padding: 8px 12px;">${metric}</td>
                <td style="padding: 8px 12px;">${value}</td>
                <td style="padding: 8px 12px;">${notes}</td>
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
                <tr style="background: #f0f0f0;">
                    <th style="padding: 8px 12px; text-align: left;">Metric</th>
                    <th style="padding: 8px 12px; text-align: left;">Value</th>
                    <th style="padding: 8px 12px; text-align: left;">Notes</th>
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
    return `
        <div class="focused-title" style="font-size: 20px; font-weight: bold; text-align: center;">
            ${name}
        </div>

        ${makeDummyPieChart()}

        ${makeDummyTable()}
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
    container.innerHTML = isMunicipality ? makeMunicipalityCard(name) : makeStatRegionCard(name);
}