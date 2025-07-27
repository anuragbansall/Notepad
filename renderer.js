const { ipcRenderer } = require("electron");
const path = require("path");

// DOM Elements
const el = {
  openBtn: document.getElementById("open-button"),
  saveBtn: document.getElementById("save-button"),
  newBtn: document.getElementById("new-button"),
  findBtn: document.getElementById("find-button"),
  textArea: document.getElementById("editor"),
  lineNumbers: document.getElementById("line-numbers"),
  darkToggle: document.getElementById("dark-mode-toggle"),
  findDialog: document.getElementById("find-dialog"),
  findInput: document.getElementById("find-input"),
  findNext: document.getElementById("find-next"),
  findPrev: document.getElementById("find-prev"),
  findClose: document.getElementById("close-find"),
  findResults: document.getElementById("find-results"),
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
  el.textArea.value = "";
  document.title = "Padman - New File";
  updateLineNumbers();
  el.textArea.focus();
});

ipcRenderer.on("file-opened", (e, { filePath, fileContent }) => {
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
  } else {
    el.findResults.textContent = `${currentMatchIndex + 1} of ${
      currentMatches.length
    }`;
    el.findNext.disabled = el.findPrev.disabled = false;
  }
}

function showFindDialog() {
  el.findDialog.style.display = "block";
  el.findInput.focus();
  el.findInput.select();
}

function hideFindDialog() {
  el.findDialog.style.display = "none";
  currentMatches = [];
  currentMatchIndex = -1;
  el.findResults.textContent = "";
  el.textArea.focus();
}

// Find Event Listeners
el.findBtn.addEventListener("click", showFindDialog);
el.findClose.addEventListener("click", hideFindDialog);
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
el.findNext.addEventListener("click", () =>
  findText(el.findInput.value, "next", true)
);
el.findPrev.addEventListener("click", () =>
  findText(el.findInput.value, "prev", true)
);

document.addEventListener("click", (e) => {
  if (
    el.findDialog.style.display === "block" &&
    !el.findDialog.contains(e.target) &&
    e.target !== el.findBtn
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
    if (key === "n") el.newBtn.click();
    else if (key === "o") el.openBtn.click();
    else if (key === "s") el.saveBtn.click();
    else if (key === "f") showFindDialog();
    e.preventDefault();
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
});
