# Padman Text Editor

A modern, feature-rich text editor built with Electron. This application provides a clean, intuitive interface for text editing with advanced features like find & replace, dark mode, and line numbering.

## Features

- **Clean Modern Interface**: Intuitive toolbar with commonly used actions
- **Find & Replace**: Powerful search functionality with replace capabilities
- **Dark Mode**: Toggle between light and dark themes
- **Line Numbering**: Visual line numbers for better code editing
- **File Operations**: New, Open, Save functionality with file dialogs
- **Keyboard Shortcuts**: Common shortcuts for improved productivity
- **Unsaved Changes Detection**: Warns before losing unsaved work
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Keyboard Shortcuts

- `Ctrl+N` - New file
- `Ctrl+O` - Open file
- `Ctrl+S` - Save file
- `Ctrl+F` - Find
- `Ctrl+H` - Find & Replace
- `F3` - Find next
- `Shift+F3` - Find previous
- `Esc` - Close find dialog

## Project Structure

```
src/
├── main/
│   └── main.js              # Main Electron process
├── renderer/
│   ├── index.html           # Application UI
│   ├── renderer.js          # Renderer process logic
│   └── styles/
│       └── style.css        # Application styles
└── assets/                  # Icons and images
```

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

```bash
# Run in development mode
npm start

# Run with auto-reload during development
npm run watch

# Run in development mode with dev tools
npm run dev
```

### Building

```bash
# Build for current platform
npm run build

# Create distribution package
npm run dist
```

## File Support

The editor supports various file formats:

- Text files (.txt)
- Markdown files (.md)
- JavaScript files (.js)
- CSS files (.css)
- HTML files (.html)
- JSON files (.json)
- And any other text-based files

## Technologies Used

- **Electron**: Cross-platform desktop application framework
- **HTML5/CSS3**: Modern web technologies for the UI
- **JavaScript (ES6+)**: Application logic and functionality
- **Node.js**: Backend functionality and file system operations

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues, questions, or contributions, please visit the project repository.
