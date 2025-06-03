import * as vscode from 'vscode';
import { GitProvider } from '../gitProvider';
import { GitStatus, GitFileChange } from '../models/gitModels';
import * as path from 'path';

export class ChangesViewProvider implements vscode.TreeDataProvider<ChangeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ChangeItem | undefined | null | void> = new vscode.EventEmitter<ChangeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ChangeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private status: GitStatus | null = null;
    private stagedChanges: GitFileChange[] = [];
    private unstagedChanges: GitFileChange[] = [];

    constructor(private gitProvider: GitProvider) {
        this.gitProvider.onDidChangeGitState(() => this.refresh());
        this.loadStatus();
    }

    refresh(): void {
        this.loadStatus();
        this._onDidChangeTreeData.fire();
    }

    private async loadStatus() {
        if (!this.gitProvider.isGitRepository()) {
            this.status = null;
            this.stagedChanges = [];
            this.unstagedChanges = [];
            return;
        }

        try {
            this.status = await this.gitProvider.getStatus();
            if (this.status) {
                this.categorizeChanges();
            }
        } catch (error) {
            console.error('Error loading git status:', error);
            vscode.window.showErrorMessage(`Failed to load git status: ${error}`);
        }
    }

    private categorizeChanges() {
        if (!this.status) return;

        this.stagedChanges = [];
        this.unstagedChanges = [];

        // Process staged files
        this.status.staged.forEach(file => {
            this.stagedChanges.push({
                path: file,
                status: 'M', // Modified (staged)
                staged: true
            });
        });

        // Process modified files
        this.status.modified.forEach(file => {
            this.unstagedChanges.push({
                path: file,
                status: 'M', // Modified
                staged: false
            });
        });

        // Process created files
        this.status.created.forEach(file => {
            this.unstagedChanges.push({
                path: file,
                status: 'A', // Added
                staged: false
            });
        });

        // Process deleted files
        this.status.deleted.forEach(file => {
            this.unstagedChanges.push({
                path: file,
                status: 'D', // Deleted
                staged: false
            });
        });

        // Process renamed files
        this.status.renamed.forEach(rename => {
            this.unstagedChanges.push({
                path: rename.to,
                status: 'R', // Renamed
                staged: false,
                oldPath: rename.from
            });
        });

        // Process conflicted files
        this.status.conflicted.forEach(file => {
            this.unstagedChanges.push({
                path: file,
                status: 'U', // Unmerged (conflicted)
                staged: false
            });
        });
    }

    getTreeItem(element: ChangeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ChangeItem): Thenable<ChangeItem[]> {
        if (!this.gitProvider.isGitRepository()) {
            return Promise.resolve([]);
        }

        if (!element) {
            // Root level - return staged and unstaged groups
            const items: ChangeItem[] = [];

            if (this.stagedChanges.length > 0) {
                const stagedGroup = new ChangeItem(
                    `Staged Changes (${this.stagedChanges.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'stagedGroup'
                );
                stagedGroup.iconPath = new vscode.ThemeIcon('check');
                items.push(stagedGroup);
            }

            if (this.unstagedChanges.length > 0) {
                const unstagedGroup = new ChangeItem(
                    `Changes (${this.unstagedChanges.length})`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'unstagedGroup'
                );
                unstagedGroup.iconPath = new vscode.ThemeIcon('edit');
                items.push(unstagedGroup);
            }

            if (items.length === 0) {
                const noChanges = new ChangeItem(
                    'No changes',
                    vscode.TreeItemCollapsibleState.None,
                    'noChanges'
                );
                noChanges.iconPath = new vscode.ThemeIcon('check-all');
                items.push(noChanges);
            }

            return Promise.resolve(items);
        } else if (element.contextValue === 'stagedGroup') {
            return Promise.resolve(this.stagedChanges.map(change => this.createFileChangeItem(change, true)));
        } else if (element.contextValue === 'unstagedGroup') {
            return Promise.resolve(this.unstagedChanges.map(change => this.createFileChangeItem(change, false)));
        }

        return Promise.resolve([]);
    }

    private createFileChangeItem(change: GitFileChange, staged: boolean): ChangeItem {
        const fileName = path.basename(change.path);
        const dirName = path.dirname(change.path);
        const label = dirName === '.' ? fileName : `${fileName} • ${dirName}`;

        const item = new ChangeItem(
            label,
            vscode.TreeItemCollapsibleState.None,
            staged ? 'stagedFile' : 'unstagedFile'
        );

        item.fileChange = change;
        item.description = this.getStatusDescription(change.status);
        item.tooltip = this.createFileTooltip(change);
        item.iconPath = this.getStatusIcon(change.status);
        item.resourceUri = vscode.Uri.file(path.join(this.gitProvider.getWorkspaceRoot() || '', change.path));

        // Add command to show diff
        item.command = {
            command: 'intellijGit.showFileDiff',
            title: 'Show Diff',
            arguments: [change]
        };

        return item;
    }

    private getStatusDescription(status: string): string {
        switch (status) {
            case 'M': return 'Modified';
            case 'A': return 'Added';
            case 'D': return 'Deleted';
            case 'R': return 'Renamed';
            case 'C': return 'Copied';
            case 'U': return 'Unmerged';
            case '?': return 'Untracked';
            default: return 'Unknown';
        }
    }

    private getStatusIcon(status: string): vscode.ThemeIcon {
        switch (status) {
            case 'M': return new vscode.ThemeIcon('diff-modified', new vscode.ThemeColor('gitDecoration.modifiedResourceForeground'));
            case 'A': return new vscode.ThemeIcon('diff-added', new vscode.ThemeColor('gitDecoration.addedResourceForeground'));
            case 'D': return new vscode.ThemeIcon('diff-removed', new vscode.ThemeColor('gitDecoration.deletedResourceForeground'));
            case 'R': return new vscode.ThemeIcon('diff-renamed', new vscode.ThemeColor('gitDecoration.renamedResourceForeground'));
            case 'C': return new vscode.ThemeIcon('copy');
            case 'U': return new vscode.ThemeIcon('warning', new vscode.ThemeColor('gitDecoration.conflictingResourceForeground'));
            case '?': return new vscode.ThemeIcon('question', new vscode.ThemeColor('gitDecoration.untrackedResourceForeground'));
            default: return new vscode.ThemeIcon('file');
        }
    }

    private createFileTooltip(change: GitFileChange): vscode.MarkdownString {
        const tooltip = new vscode.MarkdownString();
        tooltip.appendMarkdown(`**File:** ${change.path}\n\n`);
        tooltip.appendMarkdown(`**Status:** ${this.getStatusDescription(change.status)}\n\n`);
        tooltip.appendMarkdown(`**Staged:** ${change.staged ? 'Yes' : 'No'}\n\n`);
        
        if (change.oldPath) {
            tooltip.appendMarkdown(`**Old Path:** ${change.oldPath}\n\n`);
        }

        tooltip.appendMarkdown('Click to view diff');
        return tooltip;
    }

    public getStagedChanges(): GitFileChange[] {
        return this.stagedChanges;
    }

    public getUnstagedChanges(): GitFileChange[] {
        return this.unstagedChanges;
    }

    public getStatus(): GitStatus | null {
        return this.status;
    }

    public async stageFile(filePath: string): Promise<void> {
        try {
            await this.gitProvider.stageFile(filePath);
            vscode.window.showInformationMessage(`Staged ${path.basename(filePath)}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to stage file: ${error}`);
        }
    }

    public async unstageFile(filePath: string): Promise<void> {
        try {
            await this.gitProvider.unstageFile(filePath);
            vscode.window.showInformationMessage(`Unstaged ${path.basename(filePath)}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to unstage file: ${error}`);
        }
    }

    public async discardChanges(filePath: string): Promise<void> {
        const fileName = path.basename(filePath);
        const result = await vscode.window.showWarningMessage(
            `Are you sure you want to discard changes in ${fileName}? This action cannot be undone.`,
            { modal: true },
            'Discard Changes'
        );

        if (result === 'Discard Changes') {
            try {
                await this.gitProvider.discardChanges(filePath);
                vscode.window.showInformationMessage(`Discarded changes in ${fileName}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to discard changes: ${error}`);
            }
        }
    }
}

export class ChangeItem extends vscode.TreeItem {
    public fileChange?: GitFileChange;

    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string
    ) {
        super(label, collapsibleState);
    }
}
