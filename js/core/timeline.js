import { state } from './state.js';
import { updateMapColors } from './map.js';





export function populateTimelineWithMonths() {
  const { months, CONFIG } = state;

  const timeline = document.getElementById("timeline");
  const label = document.getElementById("timeline-label");
  const playButton = document.getElementById("play-button");
  const speedSlider = document.getElementById("speed-slider");
  const speedLabel = document.getElementById("speed-label");


  state.timelineElements = { timeline, label, playButton, speedSlider, speedLabel };

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
    speedLabel.textContent = `${state.timelineSpeed.toFixed(1)} month/s`;
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

    stopPlayback();
    updateTimeline();
    updateMapColors();
  });


  renderTimelineTicks();
  updateTimeline();
}







function renderTimelineTicks() {
  const { months } = state;
  const container = document.getElementById("timeline-ticks");
  container.innerHTML = "";
  container.style.setProperty("--tick-count", months.length);

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  months.forEach((m, i) => {
    const match = m.match(/^(\d{4})M(\d{2})$/);
    if (!match) return;
    const [, year, monthNum] = match;
    const monthInt = parseInt(monthNum, 10);

    const tick = document.createElement("div");
    tick.className = "timeline-tick";

    const line = document.createElement("div");
    line.className = "timeline-tick-line";

    const label = document.createElement("div");
    label.className = "timeline-tick-label";
    label.textContent = monthInt === 1 ? year : monthNames[monthInt - 1];

    tick.appendChild(line);
    tick.appendChild(label);
    container.appendChild(tick);
  });
}









export function updateTimeline(){
  const { months, timelineElements } = state;

  const current = months[state.currentMonthIndex];
  const match = current.match(/^(\d{4})M(\d{2})$/);

  const [, year, month] = match;
  const monthNum = parseInt(month, 10);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  timelineElements.label.textContent = `${monthNames[monthNum - 1]} ${year}`;
  timelineElements.speedLabel.textContent = `${state.timelineSpeed.toFixed(1)} month/s`;

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
  state.timelineTimeout = setTimeout(playLoop, 1000 / state.timelineSpeed);

  updateMapColors();
  updateTimeline();
}

