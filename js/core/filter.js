import { state } from './state.js';


export function initFilter() {
  const all = new Set();

  // TODO: put Foreign and Domestic on top, "Other" on the bottom
  // Total should not be in the list (it is the default)
  // Does select all make sense for all countries+domestic+foregin??
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

  state.allNationalities = [...all].sort();
  state.selectedNationalities = new Set();

  renderNationalityDropdown();
}


function renderNationalityDropdown() {
  const dropdown = document.getElementById("filterDropdown");
  const list = document.getElementById("filterList");

  list.innerHTML = "";

  // TODO: check for municipality selection
  // choose only those nationalities or print in lighter color the amount of data available


  // Select ALL row:
  const selectAllRow = document.createElement("label");
  selectAllRow.classList.add("nationality-row", "select-all-row");

  const selectAllCheckbox = document.createElement("input");
  selectAllCheckbox.type = "checkbox";
  const selectAllText = document.createTextNode("Select All");

  selectAllRow.appendChild(selectAllCheckbox);
  selectAllRow.appendChild(selectAllText);
  list.appendChild(selectAllRow);


  // Add nationalities:
  state.allNationalities.forEach(name => {
    const row = document.createElement("label");
    row.classList.add("filter-row");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = name;

    checkbox.addEventListener("change", e => {
      if (e.target.checked) {
        state.selectedNationalities.add(name);
      } else {
        state.selectedNationalities.delete(name);
      }

      // Selected nationalities:
      console.log("Selected nationalities:", [...state.selectedNationalities]);

      // Update Select All checkbox state:
      selectAllCheckbox.checked = state.selectedNationalities.size === state.allNationalities.length;
    });

    row.appendChild(checkbox);
    row.appendChild(document.createTextNode(name));
    list.appendChild(row);
  });

  // Select all:
  selectAllCheckbox.addEventListener("change", e => {
    const checkAll = e.target.checked;

    state.selectedNationalities = new Set(); // reset
    list.querySelectorAll("input[type='checkbox']").forEach(cb => {
      if (cb !== selectAllCheckbox) {
        cb.checked = checkAll;
        if (checkAll) state.selectedNationalities.add(cb.value);
      }
    });
  });

  document.getElementById("filterBtn").onclick = () => {
    dropdown.classList.toggle("hidden");
  };
}