# IntelliJ Git Interface - Usage Examples

This document provides practical examples of how to use the IntelliJ Git Interface extension in VS Code.

## Getting Started

### 1. Opening the Git Interface

After installing the extension, you can access the Git interface in several ways:

- **Activity Bar**: Click the IntelliJ Git icon in the activity bar
- **Command Palette**: Press `Ctrl+Shift+P` and search for "IntelliJ Git"
- **Explorer Context Menu**: Right-click on files to access Git operations

### 2. Basic Git Operations

#### Viewing Git Log
```
1. Open Command Palette (Ctrl+Shift+P)
2. Type "IntelliJ Git: Show Git Log"
3. Browse commits organized by date
4. Click on any commit to view details
```

#### Staging and Committing Files
```
1. Open the Changes view
2. See staged and unstaged files
3. Click "+" to stage files or "-" to unstage
4. Enter commit message and commit
```

## Advanced Features

### 1. Git Graph Visualization

The Git Graph provides a visual representation of your repository's branch structure:

```typescript
// Example: Viewing branch relationships
1. Open Git Log view
2. Click the "Show Git Graph" button
3. Interactive graph shows:
   - Commit nodes with messages
   - Branch lines and merges
   - Author information
   - Commit timestamps
```

### 2. File History and Blame

Track changes to specific files over time:

```typescript
// Example: Viewing file history
1. Right-click on any file in Explorer
2. Select "Show File History"
3. View all commits that modified the file
4. Click commits to see file content at that point
5. Use "Show Blame" to see line-by-line authorship
```

### 3. Interactive Diff Viewer

Compare file versions with advanced diff capabilities:

```typescript
// Example: Viewing file differences
1. In Changes view, click on a modified file
2. Choose between side-by-side or unified diff
3. Navigate between changes
4. Stage/unstage individual hunks
```

## Workflow Examples

### Feature Development Workflow

```bash
# 1. Start from main branch
git checkout main
git pull origin main

# 2. Create feature branch (use VS Code terminal or Git commands)
git checkout -b feature/new-feature

# 3. Make changes and use IntelliJ Git Interface:
#    - View changes in Changes panel
#    - Stage files selectively
#    - Write descriptive commit messages
#    - Use commit templates for consistency

# 4. View commit history
#    - Use Git Log to see your commits
#    - Use Git Graph to visualize branch structure

# 5. Before merging, review changes
#    - Use File History to see evolution
#    - Use Blame to understand code ownership
```

### Code Review Workflow

```typescript
// Example: Reviewing a pull request branch
1. Checkout the PR branch
2. Use Git Log to see all commits in the branch
3. For each commit:
   - Click to view commit details
   - See changed files and diffs
   - Use blame to understand context
4. Use Git Graph to understand merge strategy
```

### Bug Investigation Workflow

```typescript
// Example: Finding when a bug was introduced
1. Right-click on the problematic file
2. Select "Show File History"
3. Browse commits to find suspicious changes
4. Click commits to view file at that state
5. Use "Show Blame" to identify the author
6. Use Git Graph to see related commits
```

## Cherry-Picking and Advanced Operations

### Cherry-Picking Commits

```typescript
// Example: Applying a commit from another branch
1. Open Git Log or Git Graph
2. Find the commit you want to cherry-pick
3. Right-click on the commit
4. Select "Cherry Pick"
5. Resolve any conflicts if they occur
```

### Interactive Rebase (Planned Feature)

```typescript
// Example: Cleaning up commit history
1. Select multiple commits in Git Log
2. Choose "Interactive Rebase"
3. Reorder, squash, or edit commits
4. Follow guided workflow
```

## Configuration Examples

### Customizing the Interface

```json
// settings.json
{
  "intellijGit.maxCommitsToShow": 500,
  "intellijGit.showGraphInLog": true,
  "intellijGit.diffViewMode": "sideBySide",
  "intellijGit.ignoreWhitespace": false,
  "intellijGit.autoRefresh": true
}
```

### Keyboard Shortcuts

```json
// keybindings.json
[
  {
    "key": "ctrl+shift+g l",
    "command": "intellijGit.showGitLog"
  },
  {
    "key": "ctrl+shift+g g",
    "command": "intellijGit.showGitGraph"
  },
  {
    "key": "ctrl+shift+g c",
    "command": "intellijGit.showChanges"
  }
]
```

## Troubleshooting Common Issues

### Extension Not Activating

```typescript
// Check these conditions:
1. Ensure you're in a Git repository
2. Verify Git is installed and in PATH
3. Check VS Code output panel for errors
4. Restart VS Code if needed
```

### Performance with Large Repositories

```json
// Optimize settings for large repos:
{
  "intellijGit.maxCommitsToShow": 100,
  "intellijGit.autoRefresh": false
}
```

### Git Operations Failing

```typescript
// Common solutions:
1. Check Git credentials are configured
2. Ensure repository permissions are correct
3. Verify network connectivity for remote operations
4. Check VS Code Git settings
```

## Integration with Other Extensions

### GitLens Integration

The extension works alongside GitLens and other Git extensions:

```typescript
// Complementary features:
- Use GitLens for inline blame annotations
- Use IntelliJ Git for visual commit graph
- Combine both for comprehensive Git workflow
```

### Source Control Panel

The extension enhances the built-in Source Control panel:

```typescript
// Enhanced workflow:
1. Use built-in panel for quick staging
2. Use IntelliJ Git for detailed history
3. Switch between views as needed
```

## Best Practices

### Commit Message Guidelines

```typescript
// Good commit messages:
"feat(auth): add OAuth2 integration"
"fix(ui): resolve button alignment issue"
"docs: update API documentation"

// Use the extension's commit validation:
- Messages are validated for length and format
- Templates help maintain consistency
- History view shows message quality over time
```

### Branch Management

```typescript
// Effective branch visualization:
1. Use Git Graph to understand branch relationships
2. Keep feature branches focused and short-lived
3. Use descriptive branch names
4. Regular cleanup of merged branches
```

### Code Review Process

```typescript
// Thorough review workflow:
1. Use File History to understand changes
2. Use Blame to identify code ownership
3. Use Diff Viewer to examine changes carefully
4. Use Git Graph to understand merge impact
```

## Advanced Tips

### Filtering and Search

```typescript
// Efficient navigation:
1. Use search in Git Log to find specific commits
2. Filter by author to see individual contributions
3. Filter by date range for release planning
4. Use message search for bug tracking
```

### Performance Optimization

```typescript
// For better performance:
1. Limit commit history depth for large repos
2. Use selective file staging for large changesets
3. Disable auto-refresh for very active repos
4. Use filtering to reduce displayed data
```

### Workflow Automation

```typescript
// Streamline repetitive tasks:
1. Use commit templates for consistency
2. Set up keyboard shortcuts for common operations
3. Configure auto-staging rules if needed
4. Use VS Code tasks for complex Git workflows
```

This extension brings the power of IntelliJ IDEA's Git interface to VS Code, providing a comprehensive set of tools for Git repository management and visualization.
