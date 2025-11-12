import {loadMapData, loadSearchData, loadTouristData} from './core/data.js'
import { initMap, updateMapShape, updateMapColors, blurMap, unblurMap, selectByID } from './core/map.js';
import { populateTimelineWithMonths } from './core/timeline.js';
import {initSearch} from './core/search.js';

async function setupWithLoadingBlur() {
  blurMap();
  initMap();

  try {
    await loadMapData();
    await loadTouristData();
    await loadSearchData();
  } finally {    
    updateMapShape();
    updateMapColors();
    populateTimelineWithMonths();
    initSearch();
    unblurMap();

  }
}

setupWithLoadingBlur();



