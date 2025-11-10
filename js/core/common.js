
export function normalizeAreaName(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function lerpColor(color1, color2, t) {
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);
  const r = Math.round(((c2 >> 16) - (c1 >> 16)) * t + (c1 >> 16));
  const g = Math.round((((c2 >> 8) & 0xff) - ((c1 >> 8) & 0xff)) * t + ((c1 >> 8) & 0xff));
  const b = Math.round(((c2 & 0xff) - (c1 & 0xff)) * t + (c1 & 0xff));
  return `rgb(${r},${g},${b})`;
}