/* --- STATE MANAGEMENT & DATA --- */

export const chordLibrary = {
  // --- Major ---
  C: [3, 3, 2, 0, 1, 0],
  D: [-1, 0, 0, 2, 3, 2],
  E: [0, 2, 2, 1, 0, 0],
  F: [1, 3, 3, 2, 1, 1],
  G: [3, 2, 0, 0, 0, 3],
  A: [-1, 0, 2, 2, 2, 0],
  B: [-1, 2, 4, 4, 4, 2],
  // --- Minor ---
  Cm: [-1, 3, 5, 5, 4, 3],
  Dm: [-1, 0, 0, 2, 3, 1],
  Em: [0, 2, 2, 0, 0, 0],
  Fm: [1, 3, 3, 1, 1, 1],
  Gm: [3, 5, 5, 3, 3, 3],
  Am: [-1, 0, 2, 2, 1, 0],
  Bm: [-1, 2, 4, 4, 3, 2],
  // --- 7ths ---
  C7: [-1, 3, 2, 3, 1, 0],
  D7: [-1, 0, 0, 2, 1, 2],
  E7: [0, 2, 0, 1, 0, 0],
  F7: [1, 3, 1, 2, 1, 1],
  G7: [3, 2, 0, 0, 0, 1],
  A7: [-1, 0, 2, 0, 2, 0],
  B7: [-1, 2, 1, 2, 0, 2],
  // --- Misc ---
  Cmaj7: [-1, 3, 2, 0, 0, 0],
  Fmaj7: [-1, -1, 3, 2, 1, 0],
  Gmaj7: [3, 2, 0, 0, 0, 2],
  Amaj7: [-1, 0, 2, 1, 2, 0],
  Am7: [-1, 0, 2, 0, 1, 0],
  Dm7: [-1, 0, 0, 2, 1, 1],
  Em7: [0, 2, 2, 0, 3, 0],
  Bm7: [-1, 2, 0, 2, 0, 2],
  Bb: [-1, 1, 3, 3, 3, 1],
  Eb: [-1, 6, 8, 8, 8, 6],
  "F#": [2, 4, 4, 3, 2, 2],
  "F#m": [2, 4, 4, 2, 2, 2],
  "C#m": [-1, 4, 6, 6, 5, 4],
  Ab: [4, 6, 6, 5, 4, 4],
};

// INITIALIZE STATE FROM LOCAL STORAGE
const storedChords = localStorage.getItem("activeChords");
const initialChords = storedChords
  ? JSON.parse(storedChords)
  : ["C", "G", "Am", "Em", "D", "F"];

export const state = {
  activeChords: initialChords,
  currentChord: initialChords[0],
  capo: 0,
  currentTone: "acoustic",
};

/* --- DOM ELEMENTS --- */
const chordBar = document.getElementById("chord-bar");
const settingsModal = document.getElementById("settings-modal");
const libraryGrid = document.getElementById("library-grid");
const capoDisplay = document.getElementById("capo-display");
const settingsTrigger = document.getElementById("settings-trigger");
const closeSettingsBtn = document.getElementById("close-settings");
const presetList = document.getElementById("preset-list");
const savePresetBtn = document.getElementById("save-preset-btn");

/* --- STORAGE HELPERS --- */
function persistChords() {
  localStorage.setItem("activeChords", JSON.stringify(state.activeChords));
}

function getPresets() {
  const p = localStorage.getItem("guitarPresets");
  return p ? JSON.parse(p) : {};
}

function savePreset() {
  if (state.activeChords.length === 0) return;

  // Prompt for name
  let name = prompt("Enter preset name:", state.activeChords.join(" - "));
  if (!name) return; // Cancelled or empty

  name = name.trim();
  if (name.length === 0) return;

  const presets = getPresets();
  presets[name] = { chords: state.activeChords, capo: state.capo };
  localStorage.setItem("guitarPresets", JSON.stringify(presets));
  renderPresets();

  // Optional: Scroll to bottom or highlight
  setTimeout(() => {
    const list = document.getElementById("preset-list");
    if (list) list.scrollTop = list.scrollHeight;
  }, 100);
}

function deletePreset(name) {
  const presets = getPresets();
  delete presets[name];
  localStorage.setItem("guitarPresets", JSON.stringify(presets));
  renderPresets();
}

/* --- RENDER FUNCTIONS --- */
export function updateCapoUI() {
  capoDisplay.textContent = state.capo === 0 ? "0" : `+${state.capo}`;
}

export function updateToneUI() {
  document.querySelectorAll(".sound-btn").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.tone === state.currentTone);
  });
}

// Render the list of saved presets in the modal
function renderPresets(renderBarCallback) {
  presetList.innerHTML = "";
  const presets = getPresets();
  const names = Object.keys(presets);

  if (names.length === 0) {
    presetList.innerHTML =
      '<div style="color:#666; font-size:0.8rem; font-style:italic;">No saved presets</div>';
    return;
  }

  names.forEach((name) => {
    const item = document.createElement("div");
    item.className = "preset-item";

    const label = document.createElement("span");
    label.className = "preset-name";
    label.textContent = name;
    label.onclick = () => {
      // Load Preset
      const data = presets[name];
      if (Array.isArray(data)) {
        // Backward compatibility
        state.activeChords = data;
        state.capo = 0;
      } else {
        state.activeChords = data.chords;
        state.capo = data.capo;
      }

      state.currentChord = state.activeChords[0];
      persistChords();
      updateCapoUI();

      if (renderBarCallback) renderBarCallback();

      // Visual feedback
      const allItems = document.querySelectorAll(".preset-item");
      allItems.forEach((i) => (i.style.borderColor = "#444"));
      item.style.borderColor = "#ff9800";

      // Re-render settings so library buttons update
      renderSettings(renderBarCallback);
    };

    const delBtn = document.createElement("button");
    delBtn.className = "preset-del";
    delBtn.textContent = "×";
    delBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm("Delete preset?")) deletePreset(name);
    };

    item.appendChild(label);
    item.appendChild(delBtn);
    presetList.appendChild(item);
  });
}

export function renderChordBar(openSettingsCallback) {
  chordBar.innerHTML = "";
  state.activeChords.forEach((chord) => {
    const btn = document.createElement("button");
    btn.className = `chord-btn ${chord === state.currentChord ? "active" : ""}`;
    if (chord.length > 3) btn.style.fontSize = "0.8rem";
    btn.textContent = chord;

    const activate = (e) => {
      e.preventDefault();
      e.stopPropagation();
      document
        .querySelectorAll(".chord-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.currentChord = chord;
    };
    btn.addEventListener("touchstart", activate);
    btn.addEventListener("mousedown", activate);
    chordBar.appendChild(btn);
  });

  const addBtn = document.createElement("button");
  addBtn.className = "chord-btn add-btn";
  addBtn.textContent = "+";
  addBtn.onclick = openSettingsCallback;
  chordBar.appendChild(addBtn);
}

export function renderSettings(renderBarCallback) {
  libraryGrid.innerHTML = "";
  const availableKeys = Object.keys(chordLibrary);

  availableKeys.sort().forEach((chord) => {
    const btn = document.createElement("button");
    const isAdded = state.activeChords.includes(chord);
    const typeClass =
      chord.includes("#") || chord.includes("b")
        ? "sharp"
        : chord.includes("m")
          ? "minor"
          : "";

    btn.className = `lib-btn ${isAdded ? "added" : ""} ${typeClass}`;
    btn.textContent = chord;
    btn.onclick = () => {
      if (state.activeChords.includes(chord)) {
        state.activeChords = state.activeChords.filter((c) => c !== chord);
        btn.classList.remove("added");
      } else {
        state.activeChords.push(chord);
        btn.classList.add("added");
      }
      if (state.activeChords.length === 0) state.activeChords = ["C"];
      if (!state.activeChords.includes(state.currentChord))
        state.currentChord = state.activeChords[0];

      persistChords();
      renderBarCallback();
    };
    libraryGrid.appendChild(btn);
  });

  updateToneUI();
  updateCapoUI();
  // Render presets too, passing callback so loading a preset refreshes the bar
  renderPresets(renderBarCallback);

  // Wire up save button
  savePresetBtn.onclick = () => {
    savePreset();
    if (renderBarCallback) renderBarCallback();
  };
}

/* --- ANIMATION --- */
export function animateString(index) {
  const el = document.querySelectorAll(".string-line")[index];
  if (el) {
    el.classList.remove("vibrating");
    void el.offsetWidth;
    el.classList.add("vibrating");
    setTimeout(() => el.classList.remove("vibrating"), 200);
  }
}

/* --- MODAL CONTROLS --- */
export function setupModalListeners(renderBarCallback) {
  const open = () => {
    renderSettings(renderBarCallback);
    settingsModal.style.display = "flex";
  };
  settingsTrigger.addEventListener("click", open);
  closeSettingsBtn.addEventListener(
    "click",
    () => (settingsModal.style.display = "none"),
  );
  return open;
}
