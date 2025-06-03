import * as vscode from 'vscode';
import { GitProvider } from '../gitProvider';
import { GitCommit, GitBlame } from '../models/gitModels';
import moment from 'moment';
import * as path from 'path';

export class FileHistoryViewProvider implements vscode.TreeDataProvider<FileHistoryItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<FileHistoryItem | undefined | null | void> = new vscode.EventEmitter<FileHistoryItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<FileHistoryItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private currentFile: string | null = null;
    private fileHistory: GitCommit[] = [];
    private blameData: GitBlame[] = [];

    constructor(private gitProvider: GitProvider) {
        this.gitProvider.onDidChangeGitState(() => this.refresh());
        
        // Listen for active editor changes
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor && editor.document.uri.scheme === 'file') {
                this.setCurrentFile(editor.document.uri.fsPath);
            }
        });

        // Set initial file if there's an active editor
        if (vscode.window.activeTextEditor) {
            this.setCurrentFile(vscode.window.activeTextEditor.document.uri.fsPath);
        }
    }

    refresh(): void {
        if (this.currentFile) {
            this.loadFileHistory(this.currentFile);
        }
        this._onDidChangeTreeData.fire();
    }

    public async setCurrentFile(filePath: string) {
        const workspaceRoot = this.gitProvider.getWorkspaceRoot();
        if (!workspaceRoot || !this.gitProvider.isGitRepository()) {
            return;
        }

        // Convert absolute path to relative path
        const relativePath = path.relative(workspaceRoot, filePath);
        if (relativePath.startsWith('..')) {
            // File is outside workspace
            return;
        }

        this.currentFile = relativePath;
        await this.loadFileHistory(relativePath);
        this._onDidChangeTreeData.fire();
    }

    private async loadFileHistory(filePath: string) {
        if (!this.gitProvider.isGitRepository()) {
            this.fileHistory = [];
            this.blameData = [];
            return;
        }

        try {
            const config = vscode.workspace.getConfiguration('intellijGit');
            const maxCommits = config.get<number>('maxCommitsToShow', 50);
            
            this.fileHistory = await this.gitProvider.getFileHistory(filePath, maxCommits);
            this.blameData = await this.gitProvider.getBlame(filePath);
        } catch (error) {
            console.error('Error loading file history:', error);
            this.fileHistory = [];
            this.blameData = [];
        }
    }

    getTreeItem(element: FileHistoryItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: FileHistoryItem): Thenable<FileHistoryItem[]> {
        if (!this.gitProvider.isGitRepository()) {
            return Promise.resolve([]);
        }

        if (!element) {
            // Root level
            const items: FileHistoryItem[] = [];

            if (!this.currentFile) {
                const noFileItem = new FileHistoryItem(
                    'No file selected',
                    vscode.TreeItemCollapsibleState.None,
                    'noFile'
                );
                noFileItem.iconPath = new vscode.ThemeIcon('info');
                items.push(noFileItem);
                return Promise.resolve(items);
            }

            // File info section
            const fileInfoItem = new FileHistoryItem(
                `File: ${path.basename(this.currentFile)}`,
                vscode.TreeItemCollapsibleState.Expanded,
                'fileInfo'
            );
            fileInfoItem.iconPath = new vscode.ThemeIcon('file');
            fileInfoItem.description = path.dirname(this.currentFile);
            items.push(fileInfoItem);

            return Promise.resolve(items);
        } else if (element.contextValue === 'fileInfo') {
            // Return history and blame sections
            const items: FileHistoryItem[] = [];

            if (this.fileHistory.length > 0) {
                const historyItem = new FileHistoryItem(
                    `History (${this.fileHistory.length} commits)`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'historyGroup'
                );
                historyItem.iconPath = new vscode.ThemeIcon('history');
                items.push(historyItem);
            }

            if (this.blameData.length > 0) {
                const blameItem = new FileHistoryItem(
                    'Blame/Annotate',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'blameGroup'
                );
                blameItem.iconPath = new vscode.ThemeIcon('person');
                items.push(blameItem);
            }

            return Promise.resolve(items);
        } else if (element.contextValue === 'historyGroup') {
            // Return commit history
            return Promise.resolve(this.fileHistory.map(commit => this.createCommitHistoryItem(commit)));
        } else if (element.contextValue === 'blameGroup') {
            // Return blame data grouped by commit
            return Promise.resolve(this.createBlameItems());
        }

        return Promise.resolve([]);
    }

    private createCommitHistoryItem(commit: GitCommit): FileHistoryItem {
        const timeAgo = moment(commit.date).fromNow();
        const label = `${commit.shortHash} ${commit.message}`;
        const description = `${commit.author} • ${timeAgo}`;

        const item = new FileHistoryItem(
            label,
            vscode.TreeItemCollapsibleState.None,
            'fileCommit'
        );

        item.description = description;
        item.tooltip = this.createCommitTooltip(commit);
        item.commit = commit;
        item.iconPath = new vscode.ThemeIcon('git-commit');

        // Add command to show file at this commit
        item.command = {
            command: 'intellijGit.showFileAtCommit',
            title: 'Show File at Commit',
            arguments: [this.currentFile, commit.hash]
        };

        return item;
    }

    private createBlameItems(): FileHistoryItem[] {
        const blameByCommit = new Map<string, GitBlame[]>();
        
        this.blameData.forEach(blame => {
            if (!blameByCommit.has(blame.hash)) {
                blameByCommit.set(blame.hash, []);
            }
            blameByCommit.get(blame.hash)!.push(blame);
        });

        const items: FileHistoryItem[] = [];
        blameByCommit.forEach((blames, hash) => {
            const firstBlame = blames[0];
            const lineCount = blames.length;
            const shortHash = hash.substring(0, 8);
            
            const item = new FileHistoryItem(
                `${shortHash} (${lineCount} lines)`,
                vscode.TreeItemCollapsibleState.None,
                'blameCommit'
            );

            item.description = firstBlame.author;
            item.tooltip = this.createBlameTooltip(blames);
            item.iconPath = new vscode.ThemeIcon('person');

            // Add command to show blame details
            item.command = {
                command: 'intellijGit.showBlameDetails',
                title: 'Show Blame Details',
                arguments: [this.currentFile, hash, blames]
            };

            items.push(item);
        });

        return items.sort((a, b) => {
            const aLines = parseInt(a.label!.toString().match(/\((\d+) lines\)/)![1]);
            const bLines = parseInt(b.label!.toString().match(/\((\d+) lines\)/)![1]);
            return bLines - aLines; // Sort by line count descending
        });
    }

    private createCommitTooltip(commit: GitCommit): vscode.MarkdownString {
        const tooltip = new vscode.MarkdownString();
        tooltip.appendMarkdown(`**${commit.message}**\n\n`);
        tooltip.appendMarkdown(`**Author:** ${commit.author} <${commit.email}>\n\n`);
        tooltip.appendMarkdown(`**Date:** ${moment(commit.date).format('LLLL')}\n\n`);
        tooltip.appendMarkdown(`**Hash:** \`${commit.hash}\`\n\n`);
        
        if (commit.body) {
            tooltip.appendMarkdown(`**Description:**\n${commit.body}\n\n`);
        }

        tooltip.appendMarkdown('Click to view file at this commit');
        return tooltip;
    }

    private createBlameTooltip(blames: GitBlame[]): vscode.MarkdownString {
        const tooltip = new vscode.MarkdownString();
        const firstBlame = blames[0];
        
        tooltip.appendMarkdown(`**Author:** ${firstBlame.author}\n\n`);
        tooltip.appendMarkdown(`**Date:** ${moment(firstBlame.date).format('LLLL')}\n\n`);
        tooltip.appendMarkdown(`**Lines:** ${blames.length}\n\n`);
        tooltip.appendMarkdown(`**Hash:** \`${firstBlame.hash}\`\n\n`);
        
        // Show first few lines as preview
        const previewLines = blames.slice(0, 3);
        tooltip.appendMarkdown('**Preview:**\n```\n');
        previewLines.forEach(blame => {
            tooltip.appendMarkdown(`${blame.lineNumber}: ${blame.content}\n`);
        });
        if (blames.length > 3) {
            tooltip.appendMarkdown(`... and ${blames.length - 3} more lines\n`);
        }
        tooltip.appendMarkdown('```\n\n');

        tooltip.appendMarkdown('Click to view blame details');
        return tooltip;
    }

    public getCurrentFile(): string | null {
        return this.currentFile;
    }

    public getFileHistory(): GitCommit[] {
        return this.fileHistory;
    }

    public getBlameData(): GitBlame[] {
        return this.blameData;
    }

    public async showFileAtCommit(filePath: string, commitHash: string) {
        try {
            const workspaceRoot = this.gitProvider.getWorkspaceRoot();
            if (!workspaceRoot) return;

            const fullPath = path.join(workspaceRoot, filePath);
            const uri = vscode.Uri.parse(`git:${fullPath}?${commitHash}`);
            
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document, {
                preview: true,
                viewColumn: vscode.ViewColumn.Beside
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to show file at commit: ${error}`);
        }
    }
}

export class FileHistoryItem extends vscode.TreeItem {
    public commit?: GitCommit;
    public blameData?: GitBlame[];

    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string
    ) {
        super(label, collapsibleState);
    }
}
