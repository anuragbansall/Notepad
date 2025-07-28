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
let hasUnsavedChanges = false;

// === Line Numbering ===
function updateLineNumbers() {
  const count = el.textArea.value.split("\n").length;
  el.lineNumbers.textContent = Array.from(
    { length: count },
    (_, i) => i + 1
  ).join("\n");
}

// Track changes for unsaved indicator
el.textArea.addEventListener("input", () => {
  updateLineNumbers();
  hasUnsavedChanges = true;
  updateTitle();
});

el.textArea.addEventListener("scroll", () => {
  el.lineNumbers.scrollTop = el.textArea.scrollTop;
});

// === Title Management ===
function updateTitle(filePath = null) {
  const fileName = filePath ? path.basename(filePath) : "New File";
  const unsavedIndicator = hasUnsavedChanges ? "• " : "";
  document.title = `${unsavedIndicator}Notepad - ${fileName}`;
}

// === File Operations ===
el.openBtn.addEventListener("click", () => {
  if (hasUnsavedChanges) {
    const shouldOpen = confirm(
      "You have unsaved changes. Do you want to open a new file without saving?"
    );
    if (!shouldOpen) return;
  }
  ipcRenderer.send("open-file-dialog");
});

el.saveBtn.addEventListener("click", () => {
  ipcRenderer.send("save-file-dialog", el.textArea.value, document.title);
});

el.newBtn.addEventListener("click", () => {
  if (hasUnsavedChanges) {
    const shouldCreateNew = confirm(
      "You have unsaved changes. Do you want to create a new file without saving?"
    );
    if (!shouldCreateNew) return;
  }

  el.textArea.value = "";
  hasUnsavedChanges = false;
  updateTitle();
  updateLineNumbers();
  el.textArea.focus();
});

// IPC Event Handlers
ipcRenderer.on("file-opened", (e, { filePath, fileContent }) => {
  el.textArea.value = fileContent;
  hasUnsavedChanges = false;
  updateTitle(filePath);
  updateLineNumbers();
  el.textArea.focus();
});

ipcRenderer.on("file-saved", (e, filePath) => {
  hasUnsavedChanges = false;
  updateTitle(filePath);
  // Show a brief success message instead of alert
  showStatusMessage(`File saved: ${path.basename(filePath)}`);
});

ipcRenderer.on("file-error", (e, { message, error }) => {
  alert(`${message}: ${error}`);
});

// === Status Message System ===
function showStatusMessage(message, duration = 3000) {
  // Remove existing status message if any
  const existingMessage = document.getElementById("status-message");
  if (existingMessage) {
    existingMessage.remove();
  }

  const statusDiv = document.createElement("div");
  statusDiv.id = "status-message";
  statusDiv.textContent = message;
  statusDiv.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: #28a745;
    color: white;
    padding: 10px 15px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 1001;
    font-size: 14px;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;

  document.body.appendChild(statusDiv);

  // Fade in
  setTimeout(() => (statusDiv.style.opacity = "1"), 10);

  // Fade out and remove
  setTimeout(() => {
    statusDiv.style.opacity = "0";
    setTimeout(() => statusDiv.remove(), 300);
  }, duration);
}

// === Find Functionality ===
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findText(query, dir = "next", jump = true) {
  if (!query) {
    currentMatches = [];
    currentMatchIndex = -1;
    updateFindResults();
    return;
  }

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
    currentMatchIndex = currentMatches.findIndex((m) => m.start >= pos);
    if (currentMatchIndex === -1) currentMatchIndex = 0;
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

  // Mark as changed
  hasUnsavedChanges = true;
  updateTitle();

  // Update cursor position
  const newCursorPos = match.start + replaceText.length;
  el.textArea.setSelectionRange(newCursorPos, newCursorPos);

  // Update line numbers
  updateLineNumbers();

  // Refresh the search to update match positions
  const searchText = el.findInput.value;
  if (searchText) {
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

  // Mark as changed
  hasUnsavedChanges = true;
  updateTitle();

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

// === Event Listeners ===
el.findBtn.addEventListener("click", () => showFindDialog(false));

if (el.replaceBtn) {
  el.replaceBtn.addEventListener("click", () => showFindDialog(true));
}

el.findClose.addEventListener("click", hideFindDialog);
el.toggleReplace.addEventListener("click", toggleReplaceMode);

el.findInput.addEventListener("input", (e) => {
  if (e.target.value) {
    findText(e.target.value, "next", false);
  } else {
    currentMatches = [];
    currentMatchIndex = -1;
    updateFindResults();
  }
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

// Close dialog when clicking outside
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
  // Find dialog shortcuts
  if (el.findDialog.style.display === "block" && e.key === "F3") {
    findText(el.findInput.value, e.shiftKey ? "prev" : "next", true);
    e.preventDefault();
    return;
  }

  // Global shortcuts
  if (e.ctrlKey || e.metaKey) {
    const key = e.key.toLowerCase();
    switch (key) {
      case "n":
        e.preventDefault();
        el.newBtn.click();
        break;
      case "o":
        e.preventDefault();
        el.openBtn.click();
        break;
      case "s":
        e.preventDefault();
        el.saveBtn.click();
        break;
      case "f":
        e.preventDefault();
        showFindDialog(false);
        break;
      case "h":
        e.preventDefault();
        showFindDialog(true);
        break;
    }
  }

  // ESC to close find dialog
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
  localStorage.setItem("notepad-dark-mode", enabled ? "1" : "0");
}

el.darkToggle.addEventListener("click", () => {
  setDarkMode(!document.body.classList.contains("dark-mode"));
});

// === Window Events ===
window.addEventListener("beforeunload", (e) => {
  if (hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
    return e.returnValue;
  }
});

// === Initialization ===
window.addEventListener("DOMContentLoaded", () => {
  updateLineNumbers();
  updateTitle();
  setDarkMode(localStorage.getItem("notepad-dark-mode") === "1");
  el.textArea.focus();

  // Debug info
  console.log("Notepad Text Editor initialized");
  console.log("Replace button found:", !!el.replaceBtn);
});
