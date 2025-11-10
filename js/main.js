import {loadMapData, loadTouristData} from './core/data.js'
import { initMap, updateMapShape, updateMapColors, blurMap, unblurMap } from './core/map.js';
import { populateTimelineWithMonths } from './core/timeline.js';

async function setupWithLoadingBlur() {
  blurMap();
  initMap();

  try {
    await loadMapData();
    await loadTouristData();

    updateMapShape();
    updateMapColors();

    populateTimelineWithMonths();
  } finally {
    unblurMap();
  }
}

setupWithLoadingBlur();



