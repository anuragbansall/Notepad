const { ipcRenderer } = require("electron");
const path = require("path");

const openButton = document.getElementById("open-button");
const saveButton = document.getElementById("save-button");
const newButton = document.getElementById("new-button");
const textArea = document.getElementById("editor");
const lineNumbers = document.getElementById("line-numbers");

const darkModeToggle = document.getElementById("dark-mode-toggle");

function updateLineNumbers() {
  const count = textArea.value.split("\n").length;
  lineNumbers.textContent = Array.from({ length: count }, (_, i) => i + 1).join(
    "\n"
  );
}

textArea.addEventListener("input", updateLineNumbers);
textArea.addEventListener("scroll", () => {
  lineNumbers.scrollTop = textArea.scrollTop;
});

window.addEventListener("DOMContentLoaded", updateLineNumbers);

// Open file dialog
openButton.addEventListener("click", () => {
  ipcRenderer.send("open-file-dialog");
});

ipcRenderer.on("file-opened", (event, { filePath, fileContent }) => {
  textArea.value = fileContent;
  document.title = `Padman - ${path.basename(filePath)}`;
  updateLineNumbers();
  textArea.focus();
});

// Save file dialog
saveButton.addEventListener("click", () => {
  ipcRenderer.send("save-file-dialog", textArea.value, document.title);
});

ipcRenderer.on("file-saved", (event, filePath) => {
  document.title = `Padman - ${path.basename(filePath)}`;
  alert(`File saved successfully at ${filePath}`);
});

// New file functionality
newButton.addEventListener("click", () => {
  textArea.value = "";
  document.title = "Padman - New File";
  updateLineNumbers();
  textArea.focus();
});

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key.toLowerCase()) {
      case "n": // New file
        event.preventDefault();
        newButton.click();
        break;
      case "o": // Open file
        event.preventDefault();
        openButton.click();
        break;
      case "s": // Save file
        event.preventDefault();
        saveButton.click();
        break;
      default:
        break;
    }
  }
});

// Dark mode toggle logic
function setDarkMode(enabled) {
  document.body.classList.toggle("dark-mode", enabled);
  if (enabled) {
    darkModeToggle.innerText = "☀️ Light Mode";
    darkModeToggle.title = "Switch to light mode";
  } else {
    darkModeToggle.innerText = "🌙 Dark Mode";
    darkModeToggle.title = "Switch to dark mode";
  }
  localStorage.setItem("padman-dark-mode", enabled ? "1" : "0");
}

darkModeToggle.addEventListener("click", () => {
  const enabled = !document.body.classList.contains("dark-mode");
  setDarkMode(enabled);
});

// On load, set dark mode from localStorage
window.addEventListener("DOMContentLoaded", () => {
  updateLineNumbers();
  const darkPref = localStorage.getItem("padman-dark-mode") === "1";
  setDarkMode(darkPref);
});
