import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { state } from "./state.js";

// GRAPH STATE
let svg, xScale, yScale, lineGen;
const width = 600;
const height = 300;
const margin = { top: 30, right: 40, bottom: 40, left: 80 };

const WINDOW_SIZE = 12; // months visible at once
let currentIndex = 0;

// time series for the currently selected area
let currentSeries = [];

// "slovenija" by default when nothing is selected
let currentAreaKey = "slovenija";

let titleText;


// --------------- HELPERS ---------------

function monthStringToDate(monthStr) {
    // "2020M01" -> Date(2020, 0)
    const [yearStr, monthStrNum] = monthStr.split("M");
    const year = Number(yearStr);
    const month = Number(monthStrNum); // 1..12
    return new Date(year, month - 1);
}

// Build a time series [{ date, value }, ...] for the current area.
//
// Uses state.touristData and state.isMunicipalityView.
// Falls back to slovenija if the key is missing for some months.
function buildSeriesForArea(areaKey) {
    const src = state.touristData || [];
    if (!src.length) return [];

    const key = areaKey || "slovenija";

    return src.map(entry => {
        const date = monthStringToDate(entry.month);

        const container = state.isMunicipalityView
            ? entry.municipalities
            : entry.regions;

        if (!container) {
            return { date, value: 0 };
        }

        // try selected area, fallback to slovenija
        let unit = container[key] || container["slovenija"];
        if (!unit) {
            return { date, value: 0 };
        }

        const countries = unit.countries || [];
        const totalCountry =
            countries.find(c => c.countryNameEnglish === "Total") || countries[0];

        const value = totalCountry && totalCountry.data
            ? Number(totalCountry.data.data) || 0
            : 0;

        return { date, value };
    }).sort((a, b) => a.date - b.date);
}


// --------------- INIT SVG ---------------

export function initGraph() {
    svg = d3.select("#overnight-graph")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("overflow", "visible");

    // axis groups
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height - margin.bottom})`);

    svg.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${margin.left}, 0)`);

    // main line path
    svg.append("path")
        .attr("class", "slovenia-line")
        .attr("fill", "none")
        .attr("stroke", "#b33")
        .attr("stroke-width", 2);

    // circle element
    svg.append("circle")
        .attr("class", "current-point")
        .attr("r", 4)
        .attr("fill", "rgba(48, 192, 55, 1)")
        .attr("stroke", "white")
        .attr("stroke-width", 1.5)
        .style("pointer-events", "none")
        .style("display", "none");

    titleText = svg.append("text")
        .attr("class", "graph-title")
        .attr("x", margin.left)
        .attr("y", margin.top - 10)
        .attr("font-size", 14)
        .attr("font-weight", "600")
        .text("Slovenia");

}


// --------------- INITIAL DATA HOOK ---------------

// Called once from main.js after loadTouristData.
// We ignore the argument and read from state.touristData directly.
export function setGraphData() {
    currentSeries = buildSeriesForArea(currentAreaKey);

    if (!currentSeries.length) return;

    const startIndex = state.currentMonthIndex || 0;
    setGraphIndex(startIndex);
}


// --------------- EXTERNAL API ---------------

// Called from timeline.js whenever the month index changes.
export function setGraphIndex(idx) {
    if (!svg) return;

    // always rebuild series from the latest state.touristData
    currentSeries = buildSeriesForArea(currentAreaKey);
    if (!currentSeries.length) return;

    const n = currentSeries.length;
    const windowSize = Math.min(WINDOW_SIZE, n);
    const half = Math.floor(windowSize / 2);

    currentIndex = Math.max(0, Math.min(idx, n - 1));

    // decide which slice of data is visible
    let startIdx, endIdx;
    if (currentIndex <= half) {
        // at the beginning: window sticks to start
        startIdx = 0;
        endIdx = windowSize - 1;
    } else if (currentIndex >= n - half) {
        // at the end: window sticks to end
        endIdx = n - 1;
        startIdx = Math.max(0, n - windowSize);
    } else {
        // middle: window slides with the index
        startIdx = currentIndex - half;
        endIdx = currentIndex + half;
    }

    const windowData = currentSeries.slice(startIdx, endIdx + 1);

    if (!windowData.length) return;

    const maxValue = d3.max(currentSeries, d => d.value) || 0;

    // scales
    xScale = d3.scaleTime()
        .domain(d3.extent(windowData, d => d.date))
        .range([margin.left, width - margin.right]);

    yScale = d3.scaleLinear()
        .domain([0, maxValue])
        .nice()
        .range([height - margin.bottom, margin.top]);

    // axes
    svg.select(".x-axis")
        .call(d3.axisBottom(xScale).ticks(5));

    svg.select(".y-axis")
        .call(d3.axisLeft(yScale));

    // line generator
    lineGen = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.value));

    // draw main line
    svg.select(".slovenia-line")
        .datum(windowData)
        .attr("d", lineGen);

    // move the circle
    const point = currentSeries[currentIndex];
    if (!point) return;

    const centerX = (margin.left + (width - margin.right)) / 2;

    let xPos;
    if (currentIndex <= half || currentIndex >= n - half) {
        // beginning / end: circle moves horizontally
        xPos = xScale(point.date);
    } else {
        // middle: circle stays in the center, line scrolls
        xPos = centerX;
    }

    svg.select(".current-point")
        .style("display", "block")
        .attr("cx", xPos)
        .attr("cy", yScale(point.value));
}


// Called from map.js when a user selects or clears an area.
export function setGraphRegion(areaKey) {
    // null or undefined means go back to whole Slovenia
    currentAreaKey = areaKey || "slovenija";

    // rebuild and redraw at the current month index
    const idx = state.currentMonthIndex || 0;
    setGraphIndex(idx);
}

export function setGraphTitle(label) {
    if (!titleText) return;
    titleText.text(label);
}

