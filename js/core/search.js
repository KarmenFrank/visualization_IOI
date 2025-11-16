import { state } from './state.js';
import { selectByID, unfocusArea } from './map.js';


export function initSearch() {
  state.searchInput = document.getElementById('searchBar');
  state.suggestionsList = document.getElementById('suggestions');
  state.clearBtn = document.getElementById('clearSearchBtn');

  // Prepare unique lists for suggestions:
  state.towns = [...new Set(state.searchData.map(d => d.town_name))];
  state.townSet = new Set(state.towns.map(t => t.toLowerCase()));
  state.municipalities = [...new Set(state.searchData.map(d => d.mun_name))];
  state.regions = [...new Set(state.searchData.map(d => d.stat_region_name))];

  state.searchInput.addEventListener('input', handleInput);
  state.clearBtn.addEventListener('click', () => unfocusArea(true));
}

// Typing in search bar:
function handleInput() {
  const query = state.searchInput.value.trim().toLowerCase();
  state.suggestionsList.innerHTML = '';

  if (!query) return;

  // If user modifies input during step 2, return to step 1:
  if (state.step === 2) {
    const selectedName =
      (state.searchSelect.town ?? state.searchSelect.municipality ?? "").toLowerCase();

    if (!query.startsWith(selectedName)) {
      state.step = 1;
      state.searchSelect = { town: null, municipality: null, region: null };
    }
  }

  // Step 1 - search across all three types of areas:
  if (state.step === 1) {
    const townMatches = rankedMatches(state.towns, query, 'town');

    // const munMatches = state.municipalities.filter(m => m.toLowerCase().includes(query) && !state.townSet.has(m.toLowerCase())).map(n => ({ name: n, type: 'municipality' }));
    const munMatches = rankedMatches(
      state.municipalities.filter(m => !state.townSet.has(m.toLowerCase())), //TODO: vnaprej zračunaj
      query,
      'municipality'
    );

    const regMatches = rankedMatches(state.regions, query, 'region');

    const matches = [...townMatches, ...munMatches, ...regMatches];
    if (matches.length > 0) showSuggestions(matches);

  } else if (state.step === 2) {
    // Step 2 - how municipality and region confirmation for town and municipality:
    let record = null;

    if (state.searchSelect.town) {
      record = state.searchData.find(d => d.town_name === state.searchSelect.town);
    } else if (state.searchSelect.municipality) {
      record = state.searchData.find(d => d.mun_name === state.searchSelect.municipality);
    }

    if (!record) return;
    showSuggestions([
        {name: `Municipality: ${record.mun_name}`, type: 'confirm'},
        {name: `Region: ${record.stat_region_name}`, type: 'confirm'}
      ]);
  }
}

// Rank matches, first prefix, then contains:
function rankedMatches(list, query, type) {
  const lowerQuery = query.toLowerCase();
  const prefix = [];
  const contains = [];

  for (const name of list) {
    const lower = name.toLowerCase();
    if (lower.startsWith(lowerQuery)) {
      prefix.push({name, type});
    } else if (lower.includes(lowerQuery)) {
      contains.push({name, type});
    }
  }

  // Sort by length and alphabetically:
  const sortFn = (a, b) => {
    if (a.name.length !== b.name.length) return a.name.length - b.name.length;
    return a.name.localeCompare(b.name);
  };

  prefix.sort(sortFn);
  contains.sort(sortFn);

  return [...prefix, ...contains];
}


// Show suggestions in a dropdown menu:
function showSuggestions(items) {
  state.suggestionsList.innerHTML = '';
  if (!items || items.length === 0) {
    state.suggestionsList.classList.remove('has-items');
    return;
  }
  document.body.appendChild(state.suggestionsList);

  const rect = state.searchInput.getBoundingClientRect();
  state.suggestionsList.style.top = `${rect.bottom + window.scrollY}px`;
  state.suggestionsList.style.left = `${rect.left + window.scrollX}px`;
  state.suggestionsList.style.width = `${rect.width}px`;

  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.name;
    li.classList.add('suggestion-item');
    li.addEventListener('click', () => selectSuggestion(item.name, item.type));
    state.suggestionsList.appendChild(li);
  });
  state.suggestionsList.classList.add('has-items');
}


// When a suggestion is clicked, update state.searchSelect:
function selectSuggestion(name, type) {
  state.suggestionsList.innerHTML = '';
  state.suggestionsList.classList.remove('has-items');
  state.searchInput.value = name;
  
  if (type === 'town') {
    state.searchSelect = { town: name, municipality: null, region: null };
    state.step = 2;
    handleInput();
  } else if (type === 'municipality') {
    state.searchSelect = { town: null, municipality: name, region: null };
    state.step = 2;
    handleInput();
  } else if (type === 'region') {
    state.searchSelect = { town: null, municipality: null, region: name };
    state.step = 1;
    console.log('Final selection:', state.searchSelect);
    // Trigger visualization:
    selectByID();
  } else if (type === 'confirm') {
    const mun = name.startsWith('Municipality: ') ? name.replace('Municipality: ', '') : null;
    const reg = name.startsWith('Region: ') ? name.replace('Region: ', '') : null;

    if (mun) state.searchSelect.municipality = mun;
    if (reg) state.searchSelect.region = reg;

    // Reset step
    state.step = 1;
    console.log('Final selection:', state.searchSelect);

    // Trigger visualization:
    selectByID();
  }
}


// Clear the search input and selection:
export function clearSearch() {
  state.searchInput.value = '';
  state.suggestionsList.innerHTML = '';
  state.suggestionsList.classList.remove('has-items');
  state.searchSelect = { region: null, municipality: null, town: null };
  state.step = 1;
}