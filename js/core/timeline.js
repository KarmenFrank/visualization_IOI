import { state } from './state.js';
import { updateMapColors } from './map.js';





export function populateTimelineWithMonths() {
  const { months, CONFIG } = state;

  const timeline = document.getElementById("timeline");
  const label = document.getElementById("timeline-label");
  const playButton = document.getElementById("play-button");
  const speedSlider = document.getElementById("speed-slider");

  state.timelineElements = { timeline, label, playButton, speedSlider };

  timeline.min = 0;
  timeline.max = months.length - 1;
  timeline.value = 0;
  label.textContent = months[0];

  speedSlider.min = CONFIG.TIMELINE_SPEED.min;
  speedSlider.max = CONFIG.TIMELINE_SPEED.max;
  speedSlider.step = CONFIG.TIMELINE_SPEED.step;
  speedSlider.value = CONFIG.TIMELINE_SPEED.default;

  speedSlider.addEventListener("input", () => {
    state.timelineSpeed = parseFloat(speedSlider.value);
    stopPlayback();
  });

  playButton.addEventListener("click", () => {
    if (state.timelinePlaying) {
      stopPlayback();
    } else {
      state.timelinePlaying = true;
      playButton.textContent = "⏸";
      playLoop();
    }
  });

  timeline.addEventListener("input", () => {
    state.currentMonthIndex = parseInt(timeline.value);
    label.textContent = months[state.currentMonthIndex];
    updateMapColors();
  });
}






export function stopPlayback() {
  const { timelineElements } = state;
  state.timelinePlaying = false;
  timelineElements.playButton.textContent = "▶";
  clearTimeout(state.timelineTimeout);
}






export function playLoop() {
  const { months, timelineElements } = state;
  const { timeline, label } = timelineElements;

  if (!state.timelinePlaying) return;

  state.currentMonthIndex = (state.currentMonthIndex + 1) % months.length;
  timeline.value = state.currentMonthIndex;
  label.textContent = months[state.currentMonthIndex];
  state.timelineTimeout = setTimeout(playLoop, 1000 / state.timelineSpeed);

  updateMapColors();
}
