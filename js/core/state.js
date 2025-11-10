export const state = {
  map: null,
  geoLayer: null,

  municipalityData: null,
  regionData: null,
  touristData: [],
  months: [],

  isMunicipalityView: true,
  selectedArea: null,
  clickLocked: false,
  currentMonthIndex: 0,


  timelinePlaying: false,
  timelineSpeed: 1,
  timelineTimeout: null,
  timelineElements: {
    timeline: null,
    label: null,
    playButton: null,
    speedSlider: null
  },

  
  CONFIG: {
    INITIAL_VIEW: { center: [46.15, 14.995], zoom: 9.25 },
    MAP_STYLE: { background: "#a5e1f0ff" },
    AREA_STYLE: { color: "#555", weight: 1, fillColor: "#e0e0e0", fillOpacity: 1.0 },
    FOCUSED_STYLE: { color: "#000", weight: 2, fillColor: "#fff", fillOpacity: 1.0 },
    BLUR_EFFECT: { blur: "20px", brightness: 0.9, duration: 0.3 },
    ENLARGE_EFFECT: {
      targetWidthRatio: 0.85,
      targetHeightRatio: 0.85,
      duration: 0.6,
      easing: "ease"
    },
    TOURIST_COLORS: {
      low_color: "#41e786ff",
      high_color: "#d16135ff",
      error_color: "#ff0000ff"
    },
    LOADING_EFFECT: {
      blur: "20px",
      brightness: 0.9,
      duration: 0.5,
      background: "rgba(255, 255, 255, 0.0)"
    },
    TIMELINE_SPEED: {
      min: 0.1,
      max: 10,
      step: 0.1,
      default: 1
    }
  }
};
