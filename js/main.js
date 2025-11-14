import {loadMapData, loadSearchData, loadTouristData} from './core/data.js'
import { initMap, updateMapShape, updateMapColors, blurMap, unblurMap, selectByID } from './core/map.js';
import { populateTimelineWithMonths } from './core/timeline.js';
import {initSearch} from './core/search.js';
import { initGraph, setGraphData } from './core/graph.js';
import { state } from './core/state.js';

async function setupWithLoadingBlur() {
  blurMap();
  initMap();
  initGraph();

  try {
    await loadMapData();
    await loadTouristData();
    await loadSearchData();
    setGraphData(state.touristData);
    
  } finally {    
    updateMapShape();
    updateMapColors();
    populateTimelineWithMonths();
    initSearch();
    unblurMap();

  }
}

setupWithLoadingBlur();



