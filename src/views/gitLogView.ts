import * as vscode from 'vscode';
import { GitProvider } from '../gitProvider';
import { GitCommit } from '../models/gitModels';
import moment from 'moment';

export class GitLogViewProvider implements vscode.TreeDataProvider<GitLogItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<GitLogItem | undefined | null | void> = new vscode.EventEmitter<GitLogItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<GitLogItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private commits: GitCommit[] = [];
    private filteredCommits: GitCommit[] = [];
    private currentBranch: string | null = null;

    constructor(private gitProvider: GitProvider) {
        this.gitProvider.onDidChangeGitState(() => this.refresh());
        this.loadCommits();
    }

    refresh(): void {
        this.loadCommits();
        this._onDidChangeTreeData.fire();
    }

    private async loadCommits() {
        if (!this.gitProvider.isGitRepository()) {
            this.commits = [];
            this.filteredCommits = [];
            return;
        }

        const config = vscode.workspace.getConfiguration('intellijGit');
        const maxCommits = config.get<number>('maxCommitsToShow', 1000);
        
        try {
            this.commits = await this.gitProvider.getCommits(maxCommits);
            this.filteredCommits = [...this.commits];
            this.currentBranch = await this.gitProvider.getCurrentBranch();
        } catch (error) {
            console.error('Error loading commits:', error);
            vscode.window.showErrorMessage(`Failed to load git commits: ${error}`);
        }
    }

    getTreeItem(element: GitLogItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: GitLogItem): Thenable<GitLogItem[]> {
        if (!this.gitProvider.isGitRepository()) {
            return Promise.resolve([]);
        }

        if (!element) {
            // Root level - return commits grouped by date
            return Promise.resolve(this.getCommitGroups());
        } else if (element.contextValue === 'commitGroup') {
            // Return commits for this date group
            return Promise.resolve(element.commits || []);
        } else {
            // Leaf node - no children
            return Promise.resolve([]);
        }
    }

    private getCommitGroups(): GitLogItem[] {
        const groups = new Map<string, GitCommit[]>();
        
        this.filteredCommits.forEach(commit => {
            const dateKey = moment(commit.date).format('YYYY-MM-DD');
            if (!groups.has(dateKey)) {
                groups.set(dateKey, []);
            }
            groups.get(dateKey)!.push(commit);
        });

        const groupItems: GitLogItem[] = [];
        groups.forEach((commits, dateKey) => {
            const displayDate = this.getDisplayDate(dateKey);
            const groupItem = new GitLogItem(
                `${displayDate} (${commits.length} commits)`,
                vscode.TreeItemCollapsibleState.Expanded,
                'commitGroup'
            );
            groupItem.commits = commits.map(commit => this.createCommitItem(commit));
            groupItems.push(groupItem);
        });

        return groupItems.sort((a, b) => b.label!.toString().localeCompare(a.label!.toString()));
    }

    private getDisplayDate(dateKey: string): string {
        const date = moment(dateKey);
        const today = moment();
        const yesterday = moment().subtract(1, 'day');

        if (date.isSame(today, 'day')) {
            return 'Today';
        } else if (date.isSame(yesterday, 'day')) {
            return 'Yesterday';
        } else if (date.isSame(today, 'week')) {
            return date.format('dddd');
        } else {
            return date.format('MMMM D, YYYY');
        }
    }

    private createCommitItem(commit: GitCommit): GitLogItem {
        const timeAgo = moment(commit.date).fromNow();
        const label = `${commit.shortHash} ${commit.message}`;
        const description = `${commit.author} • ${timeAgo}`;

        const item = new GitLogItem(
            label,
            vscode.TreeItemCollapsibleState.None,
            'commit'
        );
        
        item.description = description;
        item.tooltip = this.createCommitTooltip(commit);
        item.commit = commit;
        item.iconPath = new vscode.ThemeIcon('git-commit');
        
        // Add command to show commit details
        item.command = {
            command: 'intellijGit.showCommitDetails',
            title: 'Show Commit Details',
            arguments: [commit]
        };

        return item;
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
        
        if (commit.refs) {
            tooltip.appendMarkdown(`**Refs:** ${commit.refs}\n\n`);
        }

        return tooltip;
    }

    // Filter methods
    public filterByAuthor(author: string) {
        if (!author) {
            this.filteredCommits = [...this.commits];
        } else {
            this.filteredCommits = this.commits.filter(commit => 
                commit.author.toLowerCase().includes(author.toLowerCase())
            );
        }
        this._onDidChangeTreeData.fire();
    }

    public filterByMessage(message: string) {
        if (!message) {
            this.filteredCommits = [...this.commits];
        } else {
            this.filteredCommits = this.commits.filter(commit => 
                commit.message.toLowerCase().includes(message.toLowerCase()) ||
                commit.body.toLowerCase().includes(message.toLowerCase())
            );
        }
        this._onDidChangeTreeData.fire();
    }

    public filterByDateRange(startDate: Date, endDate: Date) {
        this.filteredCommits = this.commits.filter(commit => 
            commit.date >= startDate && commit.date <= endDate
        );
        this._onDidChangeTreeData.fire();
    }

    public clearFilters() {
        this.filteredCommits = [...this.commits];
        this._onDidChangeTreeData.fire();
    }

    public getCurrentBranch(): string | null {
        return this.currentBranch;
    }

    public getCommits(): GitCommit[] {
        return this.filteredCommits;
    }
}

export class GitLogItem extends vscode.TreeItem {
    public commit?: GitCommit;
    public commits?: GitLogItem[];

    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string
    ) {
        super(label, collapsibleState);
    }
}
