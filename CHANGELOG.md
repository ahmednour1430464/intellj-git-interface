# Changelog

All notable changes to the "IntelliJ Git Interface" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-06-04

### Added
- **Git Log with Graphical Branch Tree**
  - Interactive commit graph visualization using D3.js
  - Branch relationship display with merge and divergence indicators
  - Commit filtering by author, message, and date range
  - Detailed commit information tooltips
  - Commit navigation and selection

- **Inline Diff Viewer**
  - Side-by-side diff view with VS Code's native diff engine
  - Unified diff view with syntax highlighting
  - Configurable diff options (whitespace, line numbers)
  - Hunk-level staging and unstaging (planned)

- **File/Folder Commit History**
  - File-specific commit history tracking
  - Git blame/annotate functionality with line-by-line authorship
  - Historical file content viewing at specific commits
  - Author and date information for each change

- **Staged/Unstaged Changes UI**
  - Visual separation of staged and unstaged changes
  - Individual file staging and unstaging
  - Change preview with integrated diff viewer
  - Bulk operations for multiple files

- **Commit Management Features**
  - Interactive commit creation with message validation
  - Commit amendment for the most recent commit
  - Commit message templates and formatting
  - Rich commit details display

- **Advanced Git Operations UI**
  - Cherry-pick functionality with conflict detection
  - Basic rebase operations
  - Commit squashing (planned)
  - Visual merge conflict resolution (planned)

- **Core Infrastructure**
  - TypeScript-based extension architecture
  - Integration with VS Code's Git API
  - Custom webview providers for complex UI
  - Comprehensive error handling and user feedback
  - Configurable settings and preferences

### Technical Features
- **Extension Architecture**
  - Modular TypeScript codebase with clear separation of concerns
  - Custom tree data providers for Git log and changes views
  - Webview-based graph visualization with D3.js
  - Event-driven architecture with proper state management

- **Git Integration**
  - Simple-git library for Git operations
  - Real-time Git state monitoring and updates
  - Support for all standard Git workflows
  - Efficient handling of large repositories

- **User Interface**
  - VS Code theme integration for consistent appearance
  - Responsive design for different screen sizes
  - Accessibility features and keyboard navigation
  - Intuitive context menus and command palette integration

### Configuration Options
- `intellijGit.maxCommitsToShow`: Control commit history depth (default: 1000)
- `intellijGit.showGraphInLog`: Toggle graphical branch visualization (default: true)
- `intellijGit.diffViewMode`: Choose between side-by-side or unified diff (default: "sideBySide")
- `intellijGit.ignoreWhitespace`: Ignore whitespace in diffs (default: false)
- `intellijGit.autoRefresh`: Auto-refresh views on Git changes (default: true)

### Commands Added
- `intellijGit.showGitLog`: Display the Git log view
- `intellijGit.showGitGraph`: Open the interactive Git graph
- `intellijGit.showChanges`: Show staged and unstaged changes
- `intellijGit.stageFile`: Stage individual files
- `intellijGit.unstageFile`: Unstage individual files
- `intellijGit.discardChanges`: Discard working directory changes
- `intellijGit.showFileHistory`: Display file-specific commit history
- `intellijGit.showBlame`: Show Git blame/annotate information
- `intellijGit.cherryPick`: Cherry-pick commits from other branches
- `intellijGit.amendCommit`: Amend the most recent commit
- `intellijGit.rewordCommit`: Edit commit messages

### Views Added
- **Git Log View**: Tree-based commit history with date grouping
- **Changes View**: Staged and unstaged file changes with status indicators
- **File History View**: File-specific commit history and blame information
- **Git Graph Webview**: Interactive branch visualization with D3.js

### Known Limitations
- Interactive rebase interface is not yet fully implemented
- Commit squashing workflow needs completion
- Advanced merge conflict resolution is planned for future release
- Hunk-level staging/unstaging requires additional Git operations
- Performance optimization needed for very large repositories (>10k commits)

### Dependencies
- `simple-git`: ^3.15.1 - Git operations library
- `d3`: ^7.6.1 - Graph visualization
- `moment`: ^2.29.4 - Date formatting and manipulation

### Minimum Requirements
- VS Code 1.74.0 or higher
- Git 2.0 or higher installed and accessible
- Node.js 16.x or higher (for development)

---

## [Unreleased]

### Planned Features
- **Interactive Rebase Interface**
  - Visual commit reordering and editing
  - Squash and fixup operations
  - Drop and edit commit workflows

- **Advanced Merge Conflict Resolution**
  - Three-way merge editor
  - Conflict navigation and resolution tools
  - Merge strategy selection

- **Stash Management**
  - Stash creation and application
  - Stash browsing and comparison
  - Partial stash operations

- **Performance Improvements**
  - Lazy loading for large repositories
  - Commit virtualization for better performance
  - Background loading and caching

- **Enhanced Filtering**
  - Advanced search with regex support
  - Saved filter presets
  - Branch-specific filtering

### Bug Fixes in Progress
- Improve error handling for network operations
- Fix memory leaks in webview components
- Enhance Git repository detection
- Better handling of detached HEAD state

---

## Development Notes

### Version 1.0.0 Development Timeline
- **Planning Phase**: 2024-05-01 to 2024-05-15
- **Core Development**: 2024-05-16 to 2024-05-30
- **Testing and Polish**: 2024-05-31 to 2024-06-03
- **Release**: 2024-06-04

### Architecture Decisions
- **TypeScript**: Chosen for type safety and better development experience
- **Simple-git**: Selected for comprehensive Git operation support
- **D3.js**: Used for flexible and powerful graph visualization
- **Webviews**: Implemented for complex UI components that exceed tree view capabilities
- **Modular Design**: Ensures maintainability and extensibility

### Testing Strategy
- Manual testing across different Git repository types
- Cross-platform testing (Windows, macOS, Linux)
- Performance testing with large repositories
- Integration testing with various Git workflows

---

*For more detailed information about specific features and implementation details, please refer to the [README.md](README.md) file.*
