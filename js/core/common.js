import { state } from './state.js';


export function normalizeAreaName(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}


function parseHexColor(hex) {
    hex = hex.replace('#', '').toLowerCase();
    if (hex.length === 8) hex = hex.slice(0, 6); // drop alpha
    if (hex.length !== 6) {
        throw new Error("Invalid hex color: " + hex);
    }
    return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16)
    ];
}

function toRgbArray(c) {
    return Array.isArray(c) ? c : parseHexColor(c);
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function lerpRgb(a, b, t) {
    const A = toRgbArray(a);
    const B = toRgbArray(b);

    return [
        Math.round(lerp(A[0], B[0], t)),
        Math.round(lerp(A[1], B[1], t)),
        Math.round(lerp(A[2], B[2], t))
    ];
}



export function calcAreaColor(area_data) {
    const { TOURIST_COLORS } = state.CONFIG;

    const total = area_data.countries.reduce((sum, c) => sum + (c.data.data || 0), 0);
    const vmin = TOURIST_COLORS.MIN_VALUE;
    const vmax = TOURIST_COLORS.MAX_VALUE;

    let t = (total - vmin) / (vmax - vmin);
    t = Math.min(1, Math.max(0, t));

    const rgb = lerpRgb(TOURIST_COLORS.low_color, TOURIST_COLORS.high_color, t);

    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}
