import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// GRAPH STATE
let svg, xScale, yScale, lineGen;
const width = 600;
const height = 300;
const margin = { top: 20, right: 40, bottom: 40, left: 50 };
let currentMarkerDate = null;
const WINDOW_SIZE = 12; //12 months visible
let currentIndex = 0;

let sloveniaSeries = [];

// --------------- INIT SVG ---------------
export function initGraph() {
    svg = d3.select("#overnight-graph")
        .attr("width", width)
        .attr("height", height);

    // axis groups
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height - margin.bottom})`);

    svg.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${margin.left}, 0)`);

    // line path for Slovenia total
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
        .style("display", "none");   // hidden until we have a date
}

// --------------- SET DATA ---------------
export function setGraphData(rawData) {
    // transform structure
    sloveniaSeries = rawData.map(entry => {
        // "2020M01" -> year=2020, month=1
        const [yearStr, monthStr] = entry.month.split("M");
        const year = Number(yearStr);
        const month = Number(monthStr); // 1..12

        const slovenija = entry.municipalities.slovenija;

        // find "Država - skupaj"
        const totalCountry = slovenija.countries.find(
            c => c.name === "Država - skupaj"
        );

        const value = totalCountry && totalCountry.data
            ? Number(totalCountry.data.data)
            : 0;

        return {
            date: new Date(year, month - 1),
            value
        };
    });

    // sort by date
    sloveniaSeries.sort((a, b) => a.date - b.date);

    updateGraph();
}

export function setGraphIndex(idx) {
    if (!svg || !sloveniaSeries.length || !yScale || !lineGen) return;

    const n = sloveniaSeries.length;
    const windowSize = Math.min(WINDOW_SIZE, n);
    const half = Math.floor(windowSize / 2);

    currentIndex = Math.max(0, Math.min(idx, n - 1));

    // --- Decide which slice of data is visible ---
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

    const windowData = sloveniaSeries.slice(startIdx, endIdx + 1);

    // --- Update x-scale to only this window ---
    xScale.domain(d3.extent(windowData, d => d.date));

    svg.select(".x-axis")
        .call(d3.axisBottom(xScale).ticks(5));

    // --- Redraw line only for this window ---
    svg.select(".slovenia-line")
        .datum(windowData)
        .attr("d", lineGen);

    // --- Position the circle ---
    const point = sloveniaSeries[currentIndex];
    if (!point) return;

    const centerX = (margin.left + (width - margin.right)) / 2;

    let xPos;
    if (currentIndex <= half || currentIndex >= n - half) {
        // at start or end: circle moves horizontally with the line
        xPos = xScale(point.date);
    } else {
        // middle: circle stays in the center, only line scrolls
        xPos = centerX;
    }

    svg.select(".current-point")
        .style("display", "block")
        .attr("cx", xPos)
        .attr("cy", yScale(point.value));
}

// --------------- DRAW GRAPH ---------------
export function updateGraph() {
    if (!svg || !sloveniaSeries.length) return;

    const maxValue = d3.max(sloveniaSeries, d => d.value) || 0;

    xScale = d3.scaleTime()
        .domain(d3.extent(sloveniaSeries, d => d.date))
        .range([margin.left, width - margin.right]);

    yScale = d3.scaleLinear()
        .domain([0, maxValue])
        .range([height - margin.bottom, margin.top]);

    // axes
    svg.select(".x-axis")
        .call(d3.axisBottom(xScale).ticks(8));

    svg.select(".y-axis")
        .call(d3.axisLeft(yScale));

    // line generator
    lineGen = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.value));

    // draw Slovenia line
    svg.select(".slovenia-line")
        .datum(sloveniaSeries)
        .attr("d", lineGen);
}

