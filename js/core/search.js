import { state } from './state.js';

// For storing the search selection:
let searchSelect = {
  region: null,
  municipality: null,
  town: null
};


let towns = [];
let municipalities = [];
let regions = [];
let suggestionsList;
let searchInput;
let step = 1; // for confirming municipality/region


export function initSearch() {
  searchInput = document.getElementById('searchBar');
  suggestionsList = document.getElementById('suggestions');

  // Prepare unique lists for suggestions:
  towns = [...new Set(state.searchData.map(d => d.town_name))];
  municipalities = [...new Set(state.searchData.map(d => d.mun_name))];
  regions = [...new Set(state.searchData.map(d => d.stat_region_name))];

  searchInput.addEventListener('input', handleInput);
}

// Typing in search bar:
function handleInput() {
  const query = searchInput.value.trim().toLowerCase();
  suggestionsList.innerHTML = '';

  if (!query) return;

  // Step 1 - search across all three types of areas:
  if (step === 1) {
    const townSet = new Set(towns.map(t => t.toLowerCase()));
    const townMatches = towns.filter(t => t.toLowerCase().includes(query)).map(n => ({ name: n, type: 'town' }));

    const munMatches = municipalities.filter(m => m.toLowerCase().includes(query) && !townSet.has(m.toLowerCase())).map(n => ({ name: n, type: 'municipality' }));

    const regMatches = regions.filter(r => r.toLowerCase().includes(query)).map(n => ({ name: n, type: 'region' }));

    const matches = [...townMatches, ...munMatches, ...regMatches];
    if (matches.length > 0) showSuggestions(matches);

  } else if (step === 2) {
    // Show municipality and region confirmation for town and municipality:
    let record = null;

    if (searchSelect.town) {
      record = state.searchData.find(d => d.town_name === searchSelect.town);
    } else if (searchSelect.municipality) {
      record = state.searchData.find(d => d.mun_name === searchSelect.municipality);
    }

    if (!record) return;
    showSuggestions([
        {name: `Municipality: ${record.mun_name}`, type: 'confirm'},
        {name: `Region: ${record.stat_region_name}`, type: 'confirm'}
      ]);
  }
}

/**
 * Show suggestions in a dropdown menu:
 * @param {string[]} items - Matching items
 * @param {string} type - 'town', 'municipality', or 'region'
 */
function showSuggestions(items, type) {
  suggestionsList.innerHTML = '';
  document.body.appendChild(suggestionsList);

  const rect = searchInput.getBoundingClientRect();
  suggestionsList.style.top = `${rect.bottom + window.scrollY}px`;
  suggestionsList.style.left = `${rect.left + window.scrollX}px`;
  suggestionsList.style.width = `${rect.width}px`;

  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.name;
    li.classList.add('suggestion-item');
    li.addEventListener('click', () => selectSuggestion(item.name, item.type));
    suggestionsList.appendChild(li);
  });
}

/**
 * When a suggestion is clicked, update searchSelect
 * @param {string} name
 * @param {string} type
 */
function selectSuggestion(name, type) {
  suggestionsList.innerHTML = '';
  searchInput.value = name;

  if (type === 'town') {
    searchSelect = { town: name, municipality: null, region: null };
    step = 2;
    handleInput();
  } else if (type === 'municipality') {
    searchSelect = { town: null, municipality: name, region: null };
    step = 2;
    handleInput();
  } else if (type === 'region') {
    searchSelect = { town: null, municipality: null, region: name };
    step = 1;
    console.log('Final selection:', searchSelect);
    // Trigger visualization
  } else if (type === 'confirm') {
    const mun = name.startsWith('Municipality: ') ? name.replace('Municipality: ', '') : null;
    const reg = name.startsWith('Region: ') ? name.replace('Region: ', '') : null;

    if (mun) searchSelect.municipality = mun;
    if (reg) searchSelect.region = reg;

    // Reset step
    step = 1;
    console.log('Final selection:', searchSelect);

    // Trigger your visualization update here
    // updateMap(searchSelect.municipality, searchSelect.region);
  }
}

// Clear the search input and selection
export function clearSearch() {
  searchInput.value = '';
  suggestionsList.innerHTML = '';
  searchSelect = { region: null, municipality: null, town: null };
}