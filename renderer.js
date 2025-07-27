const { ipcRenderer } = require("electron");
const path = require("path");

const openButton = document.getElementById("open-button");
const saveButton = document.getElementById("save-button");
const newButton = document.getElementById("new-button");
const textArea = document.getElementById("editor");
const lineNumbers = document.getElementById("line-numbers");

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
