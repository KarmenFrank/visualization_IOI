import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { state } from "./state.js";

// GRAPH STATE
let svg, xScale, yScale, lineGen;
const width = 600;
const height = 300;
const margin = { top: 70, right: 40, bottom: 40, left: 80 };
const marginTitle = { top: -20, left: 20 };

const WINDOW_SIZE = 12; // months visible at once
let currentIndex = 0;

// time series for the currently selected area
let currentSeries = [];

// "slovenija" by default when nothing is selected
let currentAreaKey = "slovenia";
let lastAreaKey = "slovenia";

let titleText;

// UI: false = show 12-month window, true = show full period
let showFullWindow = false;

// Tooltip
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "graph-tooltip")
    .style("position", "absolute")
    .style("background", "rgba(0,0,0,0.75)")
    .style("color", "white")
    .style("padding", "6px 10px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", 0);

const BACKGROUND_INTERVALS = [
    // poletna sezona (ponavljajoče)
    {
        type: "summer",
        from: { month: 6 },
        to: { month: 9 },
        color: "rgba(255, 200, 0, 0.15)"
    },

    // covid
    {
        type: "covid",
        from: { year: 2020, month: 3 },
        to: { year: 2020, month: 5 }
    },
    {
        type: "covid",
        from: { year: 2020, month: 9 },
        to: { year: 2021, month: 5 }
    }
];


// --------------- HELPERS ---------------

function monthStringToDate(monthStr) {
    const [yearStr, monthStrNum] = monthStr.split("M");
    const year = Number(yearStr);
    const month = Number(monthStrNum);
    return new Date(year, month - 1);
}

// Build a time series [{ date, value }, ...] for the current area.
function buildSeriesForArea(areaKey) {
    const src = state.touristData || [];
    if (!src.length) return [];

    const key = areaKey || "slovenija";

    return src.map(entry => {
        const date = monthStringToDate(entry.month);

        const container = state.isMunicipalityView
            ? entry.municipalities
            : entry.regions;

        if (!container) return { date, value: 0 };

        const unit = container[key] || container["slovenija"];
        if (!unit) return { date, value: 0 };

        const countries = unit.countries || [];
        const totalCountry = countries.find(c => c.countryNameEnglish === "Total") || countries[0];

        const value = totalCountry && totalCountry.data
            ? Number(totalCountry.data.data) || 0
            : 0;

        return { date, value };
    }).sort((a, b) => a.date - b.date);
}

// Stroke-draw animation for a path
function animatePathDraw(pathSelection, duration = 700) {
    const node = pathSelection.node();
    if (!node) return;

    const length = node.getTotalLength();

    pathSelection
        .attr("stroke-dasharray", `${length} ${length}`)
        .attr("stroke-dashoffset", length)
        .attr("opacity", 1)
        .transition()
        .duration(duration)
        .ease(d3.easeCubicOut)
        .attr("stroke-dashoffset", 0)
        .on("end", () => {
            pathSelection.attr("stroke-dasharray", null).attr("stroke-dashoffset", null);
        });
}

// Compute window slice indices for the currentIndex
function computeWindow(n, idx) {
    if (showFullWindow) {
        return { startIdx: 0, endIdx: n - 1, half: 0, windowSize: n };
    }

    const windowSize = Math.min(WINDOW_SIZE, n);
    const half = Math.floor(windowSize / 2);

    let startIdx;
    let endIdx;

    if (idx <= half) {
        startIdx = 0;
        endIdx = windowSize - 1;
    } else if (idx >= n - half) {
        endIdx = n - 1;
        startIdx = Math.max(0, n - windowSize);
    } else {
        startIdx = idx - half;
        endIdx = idx + half;
    }

    return { startIdx, endIdx, half, windowSize };
}

function ensureGraphToggleButton() {
    const container = document.getElementById("graph-container");
    if (!container) return;

    let btn = document.getElementById("graph-window-toggle");
    if (btn) return;

    btn = document.createElement("button");
    btn.id = "graph-window-toggle";
    btn.type = "button";
    btn.textContent = "Show whole timeline";
    container.appendChild(btn);

    btn.addEventListener("click", () => {
        showFullWindow = !showFullWindow;
        btn.textContent = showFullWindow ? "Show only 12 months" : "Show whole timeline";
        setGraphIndex(currentIndex); // re-render at current month
    });
}

function drawBackgroundIntervals(series) {
    const g = svg.selectAll(".background-intervals")
        .data([null])
        .join("g")
        .attr("class", "background-intervals")
        .attr("clip-path", "url(#plot-area-clip)");

    g.selectAll("rect").remove();

    const yTop = margin.top;
    const heightRect = height - margin.top - margin.bottom;

    BACKGROUND_INTERVALS.forEach(interval => {

        if (interval.type === "summer") {
            // ponavljajoče se za vsako leto v seriji
            const years = [...new Set(series.map(d => d.date.getFullYear()))];

            years.forEach(year => {
                const start = new Date(year, interval.from.month - 1, 1);
                const end = new Date(year, interval.to.month, 0);

                g.append("rect")
                    .attr("x", xScale(start))
                    .attr("y", yTop)
                    .attr("width", xScale(end) - xScale(start))
                    .attr("height", heightRect)
                    .attr("fill", interval.color);
            });

        } else {
            // enkratni interval (covid)
            const start = new Date(interval.from.year, interval.from.month - 1, 1);
            const end = new Date(interval.to.year, interval.to.month, 0);

            g.append("rect")
                .attr("x", xScale(start))
                .attr("y", yTop)
                .attr("width", xScale(end) - xScale(start))
                .attr("height", heightRect)
                .attr("fill", "url(#covid-hatch)");
        }
    });

    svg.select(".top-layer").raise();
}


function ensureGraphLegend() {
    const container = d3.select("#graph-container");
    if (container.empty()) return;

    // Če legenda že obstaja, ne delaj še ene
    if (!container.select("#graph-legend").empty()) return;

    const legend = container.append("div")
        .attr("id", "graph-legend");

    const items = [
        { key: "summer", label: "Summer tourist season" },
        { key: "covid", label: "COVID-19 restrictions" }
    ];

    const row = legend.selectAll(".legend-item")
        .data(items)
        .enter()
        .append("div")
        .attr("class", "legend-item");

    row.append("span")
        .attr("class", d => `legend-swatch ${d.key}`);

    row.append("span")
        .attr("class", "legend-label")
        .text(d => d.label);
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
        .attr("stroke", "#e64934ff")
        .attr("stroke-width", 2)
        .attr("opacity", 1);

    // Title + subtitle
    svg.append("text")
        .attr("class", "graph-title")
        .attr("x", marginTitle.left)
        .attr("y", marginTitle.top)
        .attr("font-size", 16)
        .attr("font-weight", "700")
        .text("Seasonality of Overnight Stays");

    titleText = svg.append("text")
        .attr("class", "graph-subtitle")
        .attr("x", marginTitle.left)
        .attr("y", marginTitle.top + 20)
        .attr("font-size", 14)
        .attr("fill", "#555")
        .text("Slovenia");

    // Y axis label (units)
    svg.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height / 2))
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .attr("font-size", 14)
        .attr("fill", "#333")
        .text("Overnight stays (count)");

    //clip the background intervals so that trhey don't fall outside the graph axes
    svg.append("defs")
        .append("clipPath")
        .attr("id", "plot-area-clip")
        .append("rect")
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom);

    const defs = svg.select("defs").empty() ? svg.append("defs") : svg.select("defs");

    defs.append("pattern")
        .attr("id", "covid-hatch")
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", 6)
        .attr("height", 6)
        .attr("patternTransform", "rotate(45)")
        .append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", 8)
        .attr("stroke", "rgba(200, 0, 0, 0.6)")
        .attr("stroke-width", 1);

    const topLayer = svg.append("g").attr("class", "top-layer");

    topLayer.append("circle")
        .attr("class", "current-point")
        .attr("r", 6)
        .attr("fill", "#22eb76ff")
        .attr("stroke", "white")
        .attr("stroke-width", 1.5)
        .style("pointer-events", "none")
        .style("display", "none");

    ensureGraphToggleButton();
    ensureGraphLegend();

}

// --------------- INITIAL DATA HOOK ---------------

export function setGraphData() {
    currentSeries = buildSeriesForArea(currentAreaKey);
    if (!currentSeries.length) return;

    const startIndex = state.currentMonthIndex || 0;
    setGraphIndex(startIndex);
}

// --------------- MAIN RENDER ---------------

export function setGraphIndex(idx) {
    if (!svg) return;

    currentSeries = buildSeriesForArea(currentAreaKey);
    if (!currentSeries.length) return;

    const n = currentSeries.length;
    currentIndex = Math.max(0, Math.min(idx, n - 1));

    const { startIdx, endIdx, half } = computeWindow(n, currentIndex);
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

    drawBackgroundIntervals(currentSeries);
    // animated axes
    const axisT = svg.transition().duration(500).ease(d3.easeCubicOut);

    svg.select(".x-axis")
        .transition(axisT)
        .call(d3.axisBottom(xScale).ticks(5));

    svg.select(".y-axis")
        .transition(axisT)
        .call(d3.axisLeft(yScale));

    // line generator
    lineGen = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.value));

    const path = svg.select(".slovenia-line");
    const newD = lineGen(windowData);

    // animate line when area changes
    const areaChanged = currentAreaKey !== lastAreaKey;
    lastAreaKey = currentAreaKey;

    if (areaChanged) {
        path.interrupt()
            .transition()
            .duration(200)
            .ease(d3.easeCubicOut)
            .attr("opacity", 0)
            .on("end", () => {
                path.attr("d", newD);
                animatePathDraw(path, 700);
            });
    } else {
        path.interrupt()
            .attr("opacity", 1)
            .transition()
            .duration(250)
            .ease(d3.easeCubicOut)
            .attr("d", newD);
    }

    // move the circle
    const point = currentSeries[currentIndex];
    if (point) {
        let xPos;

        // In full-window mode, always place dot on its true x position.
        if (showFullWindow) {
            xPos = xScale(point.date);
        } else {
            // Windowed mode: keep your "center" behavior
            const centerX = (margin.left + (width - margin.right)) / 2;

            if (currentIndex <= half || currentIndex >= n - half) {
                xPos = xScale(point.date);
            } else {
                xPos = centerX;
            }
        }

        svg.select(".current-point")
            .style("display", "block")
            .interrupt()
            .transition()
            .duration(250)
            .ease(d3.easeCubicOut)
            .attr("cx", xPos)
            .attr("cy", yScale(point.value));
    } else {
        svg.select(".current-point").style("display", "none");
    }

    // ---- HOVER OVERLAY ----
    svg.selectAll(".hover-overlay").remove();

    svg.append("rect")
        .attr("class", "hover-overlay")
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom)
        .attr("fill", "transparent")
        .on("mousemove", function (event) {
            const [mx] = d3.pointer(event);
            const date = xScale.invert(mx);

            const bisect = d3.bisector(d => d.date).left;
            const i = bisect(currentSeries, date, 1);
            const a = currentSeries[i - 1];
            const b = currentSeries[i];
            const d = b && a && (date - a.date > b.date - date) ? b : a;

            if (!d) return;

            const formatMonth = d3.timeFormat("%b %Y");
            const formatValue = d3.format(",");

            tooltip
                .style("opacity", 1)
                .html(`${formatMonth(d.date)}<br>${formatValue(d.value)} overnight stays`)
                .style("left", (event.pageX + 12) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseleave", () => {
            tooltip.style("opacity", 0);
        });
}

// Called from map.js when a user selects or clears an area.
export function setGraphRegion(areaKey) {
    currentAreaKey = areaKey || "slovenija";
    const idx = state.currentMonthIndex || 0;
    setGraphIndex(idx);
}

export function setGraphTitle(label) {
    if (!titleText) return;
    titleText.text(label || "Slovenia");
}



