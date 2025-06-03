# IntelliJ Git Interface for VS Code

A comprehensive Visual Studio Code extension that replicates IntelliJ IDEA's powerful Git interface functionality, bringing advanced Git visualization and management tools to VS Code.

## Features

### 🌳 Git Log with Graphical Branch Tree
- **Visual Commit Graph**: Interactive branch visualization showing commit relationships, merges, and divergences
- **Detailed Commit Information**: View commit messages, author details, timestamps, and commit hashes
- **Advanced Filtering**: Filter commits by author, date range, commit message content, and branch
- **Commit Navigation**: Click on commits to view detailed information and file changes

### 📊 Inline Diff Viewer
- **Side-by-Side Diff**: Compare file versions with intuitive side-by-side view
- **Unified Diff**: Traditional unified diff view with syntax highlighting
- **Change Navigation**: Navigate between changes within files with keyboard shortcuts
- **Customizable Options**: Toggle whitespace changes, line numbers, and diff algorithms

### 📁 File/Folder Commit History
- **File-Specific History**: View complete commit history for individual files or directories
- **Time-Based Navigation**: See how files evolved over time with commit-by-commit changes
- **Blame/Annotate**: Line-by-line authorship information showing who changed what and when
- **Historical File Viewing**: Open and compare file contents at any point in history

### 🔄 Staged/Unstaged Changes Management
- **Visual Change Overview**: Clear separation of staged and unstaged changes
- **Selective Staging**: Stage/unstage individual files or specific hunks within files
- **Change Preview**: View diffs before staging with inline diff viewer
- **Bulk Operations**: Stage all, unstage all, or discard multiple changes at once

### 💾 Commit Management Features
- **Interactive Commit Creation**: Rich commit message editor with templates and validation
- **Commit Amendment**: Modify the most recent commit message or add new changes
- **Commit Rewording**: Edit commit messages for better project history
- **Commit Templates**: Predefined commit message formats for consistency

### ⚡ Advanced Git Operations
- **Cherry-Pick**: Apply commits from other branches with conflict resolution support
- **Interactive Rebase**: Reorder, squash, edit, or drop commits with guided workflow
- **Commit Squashing**: Combine multiple commits into a single, clean commit
- **Merge Conflict Resolution**: Visual tools for resolving merge conflicts

## Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "IntelliJ Git Interface"
4. Click Install

### Manual Installation
1. Download the `.vsix` file from the releases page
2. Open VS Code
3. Run `Extensions: Install from VSIX...` command
4. Select the downloaded `.vsix` file

### From Source
```bash
git clone https://github.com/your-repo/intellij-git-interface.git
cd intellij-git-interface
npm install
npm run compile
```

## Usage

### Getting Started
1. Open a Git repository in VS Code
2. The extension will automatically activate and detect your Git repository
3. Access Git features through:
   - **Activity Bar**: Click the IntelliJ Git icon
   - **Command Palette**: Search for "IntelliJ Git" commands
   - **Explorer Context Menu**: Right-click files for Git operations

### Git Log and Graph
- **View Git Log**: `Ctrl+Shift+P` → "IntelliJ Git: Show Git Log"
- **Show Git Graph**: Click the graph icon in the Git Log view
- **Filter Commits**: Use the filter button or search box in the Git Log
- **Commit Details**: Click any commit to view detailed information

### Managing Changes
- **View Changes**: `Ctrl+Shift+P` → "IntelliJ Git: Show Changes"
- **Stage Files**: Click the "+" icon next to files or use context menu
- **View Diffs**: Click on any changed file to see the diff
- **Commit Changes**: Use the commit button after staging files

### File History
- **View File History**: Right-click any file → "Show File History"
- **Blame/Annotate**: Right-click any file → "Show Blame"
- **Historical Versions**: Click commits in file history to view file at that point

### Advanced Operations
- **Cherry-Pick**: Right-click commits in Git Log → "Cherry Pick"
- **Interactive Rebase**: `Ctrl+Shift+P` → "IntelliJ Git: Interactive Rebase"
- **Squash Commits**: Select multiple commits → "Squash Commits"

## Configuration

### Extension Settings
Configure the extension through VS Code settings (`Ctrl+,`):

```json
{
  "intellijGit.maxCommitsToShow": 1000,
  "intellijGit.showGraphInLog": true,
  "intellijGit.diffViewMode": "sideBySide",
  "intellijGit.ignoreWhitespace": false,
  "intellijGit.autoRefresh": true
}
```

### Available Settings
- **`intellijGit.maxCommitsToShow`**: Maximum number of commits to display (default: 1000)
- **`intellijGit.showGraphInLog`**: Show graphical branch representation (default: true)
- **`intellijGit.diffViewMode`**: Default diff view mode - "sideBySide" or "unified" (default: "sideBySide")
- **`intellijGit.ignoreWhitespace`**: Ignore whitespace changes in diffs (default: false)
- **`intellijGit.autoRefresh`**: Automatically refresh views when Git state changes (default: true)

## Keyboard Shortcuts

| Command | Shortcut | Description |
|---------|----------|-------------|
| Show Git Log | `Ctrl+Shift+G L` | Open the Git Log view |
| Show Git Graph | `Ctrl+Shift+G G` | Open the Git Graph visualization |
| Show Changes | `Ctrl+Shift+G C` | Open the Changes view |
| Commit | `Ctrl+Shift+G Enter` | Commit staged changes |
| Refresh Views | `Ctrl+Shift+G R` | Refresh all Git views |

## Requirements

- **VS Code**: Version 1.74.0 or higher
- **Git**: Git must be installed and accessible from the command line
- **Node.js**: Version 16.x or higher (for development)

## Supported Git Features

### ✅ Implemented
- [x] Git log with branch visualization
- [x] Commit details and navigation
- [x] File staging/unstaging
- [x] Diff viewing (side-by-side and unified)
- [x] File history and blame
- [x] Basic commit operations
- [x] Cherry-picking
- [x] Change filtering and search

### 🚧 In Progress
- [ ] Interactive rebase interface
- [ ] Commit squashing workflow
- [ ] Advanced merge conflict resolution
- [ ] Stash management
- [ ] Tag management

### 📋 Planned
- [ ] Pull request integration
- [ ] Remote branch management
- [ ] Submodule support
- [ ] Git hooks integration
- [ ] Performance optimizations for large repositories

## Troubleshooting

### Common Issues

**Extension not activating**
- Ensure you're in a Git repository
- Check that Git is installed and in your PATH
- Restart VS Code

**Git operations failing**
- Verify Git credentials are configured
- Check repository permissions
- Ensure no conflicting Git extensions

**Performance issues with large repositories**
- Reduce `intellijGit.maxCommitsToShow` setting
- Disable `intellijGit.autoRefresh` for very large repos
- Use filtering to limit displayed commits

### Getting Help
- Check the [Issues](https://github.com/your-repo/intellij-git-interface/issues) page
- Review the [Wiki](https://github.com/your-repo/intellij-git-interface/wiki) for detailed guides
- Join our [Discord community](https://discord.gg/your-invite) for support

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
git clone https://github.com/your-repo/intellij-git-interface.git
cd intellij-git-interface
npm install
npm run watch
```

Press `F5` to launch a new Extension Development Host window for testing.

### Building
```bash
npm run compile
npm run package
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by IntelliJ IDEA's excellent Git interface
- Built with the VS Code Extension API
- Uses D3.js for graph visualization
- Thanks to the VS Code and Git communities

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.

---

**Enjoy enhanced Git workflows in VS Code! 🚀**
