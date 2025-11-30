import { state } from './state.js';


export function initFilter() {
  const all = new Set();

  state.touristData.forEach(monthEntry => {
    const municipalities = monthEntry.municipalities;
    for (const munKey in municipalities) {
      const mun = municipalities[munKey];
      if (!mun.countries) continue;

      mun.countries.forEach(country => {
        const name = country.countryNameEnglish;
        if (name) all.add(name);
      });
    }
  });

  state.allNationalities = normalizeNationalityList(all);
  state.selectedNationalities = new Set();

  renderNationalityDropdown();
}


export function normalizeNationalityList(allNamesSet) {
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

      // Selected nationalities:
      console.log("Selected nationalities:", [...state.tempNationalities]);

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
  if (sel.length === state.allNationalities.length) {
    // Plot "Total":
    return;
  }

  // CASE 2: All except Domestic
  if (!state.selectedNationalities.has("Domestic") && sel.length === state.allNationalities.length - 1) {
    // Plot "Foreign":
    return;
  }

  // CASE 3: Mixed selection
  // Plot specific countries - TODO: filtering
}