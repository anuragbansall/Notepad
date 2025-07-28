const { ipcRenderer } = require("electron");
const path = require("path");

// DOM Elements
const el = {
  openBtn: document.getElementById("open-button"),
  saveBtn: document.getElementById("save-button"),
  newBtn: document.getElementById("new-button"),
  findBtn: document.getElementById("find-button"),
  replaceBtn: document.getElementById("replace-button"),
  textArea: document.getElementById("editor"),
  lineNumbers: document.getElementById("line-numbers"),
  darkToggle: document.getElementById("dark-mode-toggle"),
  findDialog: document.getElementById("find-dialog"),
  dialogTitle: document.getElementById("dialog-title"),
  toggleReplace: document.getElementById("toggle-replace"),
  findInput: document.getElementById("find-input"),
  replaceInput: document.getElementById("replace-input"),
  replaceRow: document.getElementById("replace-row"),
  findNext: document.getElementById("find-next"),
  findPrev: document.getElementById("find-prev"),
  findClose: document.getElementById("close-find"),
  findResults: document.getElementById("find-results"),
  replaceCurrent: document.getElementById("replace-current"),
  replaceAll: document.getElementById("replace-all"),
};

// State
let currentMatches = [];
let currentMatchIndex = -1;
let lastSearchText = "";

// === Line Numbering ===
function updateLineNumbers() {
  const count = el.textArea.value.split("\n").length;
  el.lineNumbers.textContent = Array.from(
    { length: count },
    (_, i) => i + 1
  ).join("\n");
}

el.textArea.addEventListener("input", updateLineNumbers);
el.textArea.addEventListener("scroll", () => {
  el.lineNumbers.scrollTop = el.textArea.scrollTop;
});

// === File Operations ===
el.openBtn.addEventListener("click", () =>
  ipcRenderer.send("open-file-dialog")
);
el.saveBtn.addEventListener("click", () =>
  ipcRenderer.send("save-file-dialog", el.textArea.value, document.title)
);
el.newBtn.addEventListener("click", () => {
  let shouldCreateNew = true;
  if (el.textArea.value !== "") {
    shouldCreateNew = confirm(
      "You have unsaved changes. Do you want to create a new file?"
    );
  }

  if (!shouldCreateNew) return;

  el.textArea.value = "";
  document.title = "Padman - New File";
  updateLineNumbers();
  el.textArea.focus();
});

ipcRenderer.on("file-opened", (e, { filePath, fileContent }) => {
  let shouldOpen = true;
  if (el.textArea.value !== "") {
    shouldOpen = confirm(
      "You have unsaved changes. Do you want to open a new file?"
    );
  }

  if (!shouldOpen) return;

  el.textArea.value = fileContent;
  document.title = `Padman - ${path.basename(filePath)}`;
  updateLineNumbers();
  el.textArea.focus();
});

ipcRenderer.on("file-saved", (e, filePath) => {
  document.title = `Padman - ${path.basename(filePath)}`;
  alert(`File saved successfully at ${filePath}`);
});

// === Find Functionality ===
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findText(query, dir = "next", jump = true) {
  const content = el.textArea.value;
  const regex = new RegExp(escapeRegExp(query), "gi");
  currentMatches = [];
  let match;
  while ((match = regex.exec(content))) {
    currentMatches.push({
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  if (!currentMatches.length) {
    currentMatchIndex = -1;
    updateFindResults();
    return;
  }

  if (query !== lastSearchText) {
    const pos = el.textArea.selectionStart;
    currentMatchIndex = currentMatches.findIndex((m) => m.start >= pos) || 0;
  } else {
    currentMatchIndex =
      dir === "next"
        ? (currentMatchIndex + 1) % currentMatches.length
        : (currentMatchIndex - 1 + currentMatches.length) %
          currentMatches.length;
  }

  lastSearchText = query;

  if (jump) {
    const { start, end } = currentMatches[currentMatchIndex];
    el.textArea.setSelectionRange(start, end);
    el.textArea.focus();
  }

  updateFindResults();
}

function updateFindResults() {
  if (!currentMatches.length) {
    el.findResults.textContent = "No results";
    el.findNext.disabled = el.findPrev.disabled = true;
    el.replaceCurrent.disabled = el.replaceAll.disabled = true;
  } else {
    el.findResults.textContent = `${currentMatchIndex + 1} of ${
      currentMatches.length
    }`;
    el.findNext.disabled = el.findPrev.disabled = false;
    el.replaceCurrent.disabled = el.replaceAll.disabled = false;
  }
}

function showFindDialog(showReplace = false) {
  el.findDialog.style.display = "block";
  if (showReplace) {
    el.replaceRow.style.display = "flex";
    el.dialogTitle.textContent = "Find & Replace";
  } else {
    el.replaceRow.style.display = "none";
    el.dialogTitle.textContent = "Find";
  }
  el.findInput.focus();
  el.findInput.select();
}

function hideFindDialog() {
  el.findDialog.style.display = "none";
  el.replaceRow.style.display = "none";
  el.dialogTitle.textContent = "Find";
  currentMatches = [];
  currentMatchIndex = -1;
  el.findResults.textContent = "";
  el.textArea.focus();
}

function toggleReplaceMode() {
  const isReplaceVisible = el.replaceRow.style.display === "flex";
  if (isReplaceVisible) {
    el.replaceRow.style.display = "none";
    el.dialogTitle.textContent = "Find";
  } else {
    el.replaceRow.style.display = "flex";
    el.dialogTitle.textContent = "Find & Replace";
  }
}

function replaceCurrent() {
  if (currentMatchIndex === -1 || !currentMatches.length) return;

  const replaceText = el.replaceInput.value;
  const match = currentMatches[currentMatchIndex];
  const content = el.textArea.value;

  // Replace the current match
  const newContent =
    content.slice(0, match.start) + replaceText + content.slice(match.end);
  el.textArea.value = newContent;

  // Update cursor position
  const newCursorPos = match.start + replaceText.length;
  el.textArea.setSelectionRange(newCursorPos, newCursorPos);

  // Update line numbers
  updateLineNumbers();

  // Refresh the search to update match positions
  const searchText = el.findInput.value;
  if (searchText) {
    // Reset search state to refresh matches
    lastSearchText = "";
    findText(searchText, "next", true);
  }
}

function replaceAll() {
  if (!currentMatches.length) return;

  const searchText = el.findInput.value;
  const replaceText = el.replaceInput.value;

  if (!searchText) return;

  const content = el.textArea.value;
  const regex = new RegExp(escapeRegExp(searchText), "gi");
  const newContent = content.replace(regex, replaceText);

  const replacedCount = currentMatches.length;
  el.textArea.value = newContent;

  // Update line numbers
  updateLineNumbers();

  // Clear matches and update UI
  currentMatches = [];
  currentMatchIndex = -1;
  el.findResults.textContent = `Replaced ${replacedCount} occurrence${
    replacedCount !== 1 ? "s" : ""
  }`;

  // Disable replace buttons
  el.replaceCurrent.disabled = true;
  el.replaceAll.disabled = true;

  el.textArea.focus();
}

// Find Event Listeners
el.findBtn.addEventListener("click", () => showFindDialog(false));

// Check if replace button exists before adding listener
if (el.replaceBtn) {
  el.replaceBtn.addEventListener("click", () => showFindDialog(true));
}

el.findClose.addEventListener("click", hideFindDialog);
el.toggleReplace.addEventListener("click", toggleReplaceMode);

el.findInput.addEventListener("input", (e) => {
  if (e.target.value) findText(e.target.value, "next", false);
  else hideFindDialog();
});

el.findInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    findText(el.findInput.value, e.shiftKey ? "prev" : "next", true);
  } else if (e.key === "Escape") {
    hideFindDialog();
  }
});

el.replaceInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    replaceCurrent();
  } else if (e.key === "Escape") {
    hideFindDialog();
  }
});

el.findNext.addEventListener("click", () =>
  findText(el.findInput.value, "next", true)
);
el.findPrev.addEventListener("click", () =>
  findText(el.findInput.value, "prev", true)
);

el.replaceCurrent.addEventListener("click", replaceCurrent);
el.replaceAll.addEventListener("click", replaceAll);

document.addEventListener("click", (e) => {
  if (
    el.findDialog.style.display === "block" &&
    !el.findDialog.contains(e.target) &&
    e.target !== el.findBtn &&
    e.target !== el.replaceBtn
  ) {
    hideFindDialog();
  }
});

// === Keyboard Shortcuts ===
document.addEventListener("keydown", (e) => {
  if (el.findDialog.style.display === "block" && e.key === "F3") {
    findText(el.findInput.value, e.shiftKey ? "prev" : "next", true);
    e.preventDefault();
    return;
  }

  if (e.ctrlKey || e.metaKey) {
    const key = e.key.toLowerCase();
    if (key === "n") {
      e.preventDefault();
      el.newBtn.click();
    } else if (key === "o") {
      e.preventDefault();
      el.openBtn.click();
    } else if (key === "s") {
      e.preventDefault();
      el.saveBtn.click();
    } else if (key === "f") {
      e.preventDefault();
      showFindDialog(false);
    } else if (key === "h") {
      e.preventDefault();
      showFindDialog(true);
    }
    // Don't prevent default for other Ctrl combinations (like Ctrl+A, Ctrl+C, etc.)
  }

  if (e.key === "Escape" && el.findDialog.style.display === "block") {
    hideFindDialog();
  }
});

// === Dark Mode ===
function setDarkMode(enabled) {
  document.body.classList.toggle("dark-mode", enabled);
  el.darkToggle.innerText = enabled ? "☀️ Light Mode" : "🌙 Dark Mode";
  el.darkToggle.title = enabled
    ? "Switch to light mode"
    : "Switch to dark mode";
  localStorage.setItem("padman-dark-mode", enabled ? "1" : "0");
}

el.darkToggle.addEventListener("click", () => {
  setDarkMode(!document.body.classList.contains("dark-mode"));
});

// === Init on Load ===
window.addEventListener("DOMContentLoaded", () => {
  updateLineNumbers();
  setDarkMode(localStorage.getItem("padman-dark-mode") === "1");

  // Debug: Check if replace button exists
  console.log("Replace button found:", !!el.replaceBtn);
  if (!el.replaceBtn) {
    console.error("Replace button not found! Check the HTML ID.");
  }
});
