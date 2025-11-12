import {loadMapData, loadSearchData, loadTouristData} from './core/data.js'
import { initMap, updateMapShape, updateMapColors, blurMap, unblurMap } from './core/map.js';
import { populateTimelineWithMonths } from './core/timeline.js';
import {initSearch} from './core/search.js';

async function setupWithLoadingBlur() {
  blurMap();
  initMap();

  try {
    await loadMapData();
    await loadTouristData();
    await loadSearchData();

    updateMapShape();
    updateMapColors();

    populateTimelineWithMonths();
    initSearch();
  } finally {
    unblurMap();
  }
}

setupWithLoadingBlur();



