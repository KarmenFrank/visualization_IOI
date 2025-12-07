import { state } from './state.js';
import { updateMapColors } from './map.js';


export function initFilter() {
  state.nationalitiesMun = normalizeNationalityList(state.nationalitiesMun);

  state.allNationalities = state.isMunicipalityView
    ? state.nationalitiesMun
    : state.nationalitiesSr;

  state.selectedNationalities = new Set();

  renderNationalityDropdown();
}


function normalizeNationalityList(allNamesSet) {
  let list = [...allNamesSet];

  // Remove Total and Foreign:
  list = list.filter(name => {
    return name !== "Total" && name !== "Foreign";
  });

  const domestic = [];
  const others   = [];
  const normal   = [];

  list.forEach(name => {
    if (name === "Domestic") {
      domestic.push(name);
    } else if (name.startsWith("Other")) {
      others.push(name);
    } else {
      normal.push(name);
    }
  });

  // Sort alphabetically:
  normal.sort((a, b) => a.localeCompare(b));
  others.sort((a, b) => a.localeCompare(b));

  // Put Domestic on top, Others on the bottom:
  return [
    ...domestic,
    ...normal,
    ...others
  ];
}


export function clearFilters() {
  // When switching between regions and municipalities,
  // filters are reset:
  state.selectedNationalities = new Set();
  state.tempNationalities = new Set();

  state.allNationalities = state.isMunicipalityView
  ? state.nationalitiesMun
  : state.nationalitiesSr;

  // Close dropdown if open, remove red dot if shown:
  const dropdown = document.getElementById("filterDropdown");
  dropdown.classList.add("hidden");
  const filterBtn = document.getElementById("filterBtn");
  filterBtn.classList.remove("active");

  renderNationalityDropdown();
}


export function copyTouristData() {
  if (state.isMunicipalityView) {
    state.touristData = structuredClone(state.touristDataMunTotal);
  } else {
    state.touristData = structuredClone(state.touristDataSrTotal);
  }
}


function renderNationalityDropdown() {
  const dropdown = document.getElementById("filterDropdown");
  const list = document.getElementById("filterList");

  list.innerHTML = "";

  // Selection before confirming:
  state.tempNationalities = new Set(state.selectedNationalities);


  // SELECT ALL row:
  const selectAllRow = document.createElement("label");
  selectAllRow.classList.add("nationality-row", "select-all-row");

  const selectAllCheckbox = document.createElement("input");
  selectAllCheckbox.type = "checkbox";
  const selectAllText = document.createTextNode("Select All");

  selectAllRow.appendChild(selectAllCheckbox);
  selectAllRow.appendChild(selectAllText);
  list.appendChild(selectAllRow);

  // Init select all:
  selectAllCheckbox.checked = state.tempNationalities.size === state.allNationalities.length;

  
  // NATIONALITIES:
  state.allNationalities.forEach(name => {
    const row = document.createElement("label");
    row.classList.add("filter-row");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = name;
    checkbox.checked = state.tempNationalities.has(name);

    checkbox.addEventListener("change", e => {
      if (e.target.checked) {
        state.tempNationalities.add(name);
      } else {
        state.tempNationalities.delete(name);
      }

      // Update Select All checkbox state:
      selectAllCheckbox.checked = state.tempNationalities.size === state.allNationalities.length;
    });

    row.appendChild(checkbox);
    row.appendChild(document.createTextNode(name));
    list.appendChild(row);
  });


  // Select all:
  selectAllCheckbox.addEventListener("change", e => {
    const checkAll = e.target.checked;
    state.tempNationalities = new Set(); // reset

    list.querySelectorAll(".filter-row input").forEach(cb => {
      cb.checked = checkAll;
      if (checkAll) state.tempNationalities.add(cb.value);
    });
  });

  // Confirm button:
  const confirmBtn = document.getElementById("filter-confirm-btn");
  confirmBtn.onclick = () => {
    state.selectedNationalities = new Set(state.tempNationalities);
    dropdown.classList.add("hidden");
    applyNationalityFilter();

    // If filters are selected, plot red dot:
    if (state.selectedNationalities.size > 0) {
      filterBtn.classList.add('active');
    } else {
      filterBtn.classList.remove('active');
    }
  };


  // Open and close:
  const btn = document.getElementById("filterBtn");

  btn.onclick = e => {
    dropdown.classList.toggle("hidden");

    if (!dropdown.classList.contains("hidden")) {
      // Open → re-render with fresh data
      renderNationalityDropdown();
    }
  };

  // Click outside to close:
  document.addEventListener("click", function outsideHandler(e) {
    if (!dropdown.contains(e.target) && e.target !== btn) {
      dropdown.classList.add("hidden");

      // Rollback unconfirmed changes:
      state.tempNationalities = new Set(state.selectedNationalities);

      document.removeEventListener("click", outsideHandler);
    }
  });
}


function applyNationalityFilter() {
  const sel = [...state.selectedNationalities];

  // CASE 1: All selected
  if (sel.length === state.allNationalities.length || sel.length === 0) {
    // No recomputing needed, just copy all totals:
    copyTouristData()
    updateMapColors()
    return;
  }


  // CASE 2: All except Domestic
  if (!state.selectedNationalities.has("Domestic") && sel.length === state.allNationalities.length - 1) {
    // Copy Foreign values:
    const sourceData = state.isMunicipalityView ? state.touristDataMun : state.touristDataSr;

    state.touristData = sourceData.map(monthEntry => {
      // For municipalities:
      if (state.isMunicipalityView) {
        const newMunicipalities = {};

        for (const [munKey, munData] of Object.entries(monthEntry.municipalities)) {
          newMunicipalities[munKey] = {
            ...munData,
            countries: (munData.countries || [])
              .filter(c => c.countryNameEnglish === "Foreign")
              .map(c => ({ ...c, countryNameEnglish: "Total", name: "skupaj" }))
          };
        }
        return { ...monthEntry, municipalities: newMunicipalities };

      // For regions:
      } else {
        const newRegions = {};

        for (const [regionKey, regionData] of Object.entries(monthEntry.regions)) {
          newRegions[regionKey] = {
            ...regionData,
            countries: (regionData.countries || [])
              .filter(c => c.countryNameEnglish === "Foreign")
              .map(c => ({ ...c, countryNameEnglish: "Total", name: "skupaj" }))
          };
        }
        return { ...monthEntry, regions: newRegions };
      }
    });
    console.log(state.touristData)
    
    updateMapColors()
    return;
  }


  // CASE 3: Mixed selection
  const selectedSet = new Set(sel); // for faster lookups
  const sourceData = state.isMunicipalityView ? state.touristDataMun : state.touristDataSr;

  state.touristData = sourceData.map(monthEntry => {
    // For municipalities:
    if (state.isMunicipalityView) {
      const newMunicipalities = {};

      for (const [munKey, munData] of Object.entries(monthEntry.municipalities)) {
        // Sum data for selected countries
        const totalData = munData.countries
          .filter(c => selectedSet.has(c.countryNameEnglish))
          .reduce((acc, c) => {
            const value = c.data?.data || 0;
            return acc + value;
          }, 0);

        // Create a single "Total" country
        newMunicipalities[munKey] = {
          ...munData,
          countries: [
            {
              name: "skupaj",
              countryNameEnglish: "Total",
              data: { ...munData.countries[0].data, data: totalData }
            }
          ]
        };
      }
      return { ...monthEntry, municipalities: newMunicipalities };

    // For regions:
    } else {
      const newRegions = {};

      for (const [regionKey, regionData] of Object.entries(monthEntry.regions)) {
        const totalData = regionData.countries
          .filter(c => selectedSet.has(c.countryNameEnglish))
          .reduce((acc, c) => acc + (c.data?.data || 0), 0);

        newRegions[regionKey] = {
          ...regionData,
          countries: [
            {
              name: "skupaj",
              countryNameEnglish: "Total",
              data: { ...regionData.countries[0].data, data: totalData }
            }
          ]
        };
      }
      return { ...monthEntry, regions: newRegions };
    }
  });

  updateMapColors()
}