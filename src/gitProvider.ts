import * as vscode from 'vscode';
import { simpleGit, SimpleGit, LogResult, StatusResult, DiffResult } from 'simple-git';
import * as path from 'path';
import { GitCommit, GitBranch, GitStatus, GitDiff, GitBlame } from './models/gitModels';

export class GitProvider {
    private git: SimpleGit | null = null;
    private workspaceRoot: string | null = null;
    private _onDidChangeGitState = new vscode.EventEmitter<void>();
    public readonly onDidChangeGitState = this._onDidChangeGitState.event;

    constructor() {
        this.initialize();
    }

    private async initialize() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            this.workspaceRoot = workspaceFolders[0].uri.fsPath;
            this.git = simpleGit(this.workspaceRoot);
            
            // Check if this is a git repository
            try {
                await this.git.status();
            } catch (error) {
                this.git = null;
                console.warn('Not a git repository:', this.workspaceRoot);
            }
        }
    }

    public async refresh() {
        await this.initialize();
        this._onDidChangeGitState.fire();
    }

    public isGitRepository(): boolean {
        return this.git !== null && this.workspaceRoot !== null;
    }

    public getWorkspaceRoot(): string | null {
        return this.workspaceRoot;
    }

    // Git Log Operations
    public async getCommits(maxCount: number = 100, branch?: string): Promise<GitCommit[]> {
        if (!this.git) return [];

        try {
            const options: any = {
                maxCount,
                format: {
                    hash: '%H',
                    date: '%ai',
                    message: '%s',
                    author_name: '%an',
                    author_email: '%ae',
                    body: '%b'
                }
            };

            if (branch) {
                options.from = branch;
            }

            const log: LogResult = await this.git.log(options);
            
            return log.all.map(commit => ({
                hash: commit.hash,
                shortHash: commit.hash.substring(0, 8),
                message: commit.message,
                author: commit.author_name,
                email: commit.author_email,
                date: new Date(commit.date),
                body: commit.body || '',
                refs: commit.refs || '',
                parents: []
            }));
        } catch (error) {
            console.error('Error getting commits:', error);
            return [];
        }
    }

    public async getCommitDetails(hash: string): Promise<GitCommit | null> {
        if (!this.git) return null;

        try {
            const log = await this.git.show([hash, '--format=fuller']);
            // Parse the git show output to extract commit details
            // This is a simplified implementation
            return {
                hash,
                shortHash: hash.substring(0, 8),
                message: 'Commit details',
                author: 'Unknown',
                email: '',
                date: new Date(),
                body: log,
                refs: '',
                parents: []
            };
        } catch (error) {
            console.error('Error getting commit details:', error);
            return null;
        }
    }

    // Branch Operations
    public async getBranches(): Promise<GitBranch[]> {
        if (!this.git) return [];

        try {
            const branches = await this.git.branch(['-a']);
            return branches.all.map(branch => ({
                name: branch,
                current: branch === branches.current,
                remote: branch.startsWith('remotes/'),
                hash: ''
            }));
        } catch (error) {
            console.error('Error getting branches:', error);
            return [];
        }
    }

    public async getCurrentBranch(): Promise<string | null> {
        if (!this.git) return null;

        try {
            const status = await this.git.status();
            return status.current || null;
        } catch (error) {
            console.error('Error getting current branch:', error);
            return null;
        }
    }

    // Status Operations
    public async getStatus(): Promise<GitStatus | null> {
        if (!this.git) return null;

        try {
            const status: StatusResult = await this.git.status();
            return {
                current: status.current || '',
                ahead: status.ahead || 0,
                behind: status.behind || 0,
                staged: status.staged || [],
                modified: status.modified || [],
                created: status.created || [],
                deleted: status.deleted || [],
                renamed: status.renamed || [],
                conflicted: status.conflicted || []
            };
        } catch (error) {
            console.error('Error getting status:', error);
            return null;
        }
    }

    // Diff Operations
    public async getDiff(file?: string, staged: boolean = false): Promise<string> {
        if (!this.git) return '';

        try {
            const options = staged ? ['--cached'] : [];
            if (file) {
                options.push(file);
            }
            return await this.git.diff(options);
        } catch (error) {
            console.error('Error getting diff:', error);
            return '';
        }
    }

    public async getFileDiff(file: string, hash1?: string, hash2?: string): Promise<string> {
        if (!this.git) return '';

        try {
            if (hash1 && hash2) {
                return await this.git.diff([`${hash1}..${hash2}`, '--', file]);
            } else if (hash1) {
                return await this.git.diff([hash1, '--', file]);
            } else {
                return await this.git.diff(['--', file]);
            }
        } catch (error) {
            console.error('Error getting file diff:', error);
            return '';
        }
    }

    // File History Operations
    public async getFileHistory(filePath: string, maxCount: number = 50): Promise<GitCommit[]> {
        if (!this.git) return [];

        try {
            const log = await this.git.log({
                file: filePath,
                maxCount,
                format: {
                    hash: '%H',
                    date: '%ai',
                    message: '%s',
                    author_name: '%an',
                    author_email: '%ae'
                }
            });

            return log.all.map(commit => ({
                hash: commit.hash,
                shortHash: commit.hash.substring(0, 8),
                message: commit.message,
                author: commit.author_name,
                email: commit.author_email,
                date: new Date(commit.date),
                body: '',
                refs: '',
                parents: []
            }));
        } catch (error) {
            console.error('Error getting file history:', error);
            return [];
        }
    }

    // Blame Operations
    public async getBlame(filePath: string): Promise<GitBlame[]> {
        if (!this.git) return [];

        try {
            const blame = await this.git.raw(['blame', '--line-porcelain', filePath]);
            return this.parseBlameOutput(blame);
        } catch (error) {
            console.error('Error getting blame:', error);
            return [];
        }
    }

    private parseBlameOutput(blameOutput: string): GitBlame[] {
        const lines = blameOutput.split('\n');
        const blameData: GitBlame[] = [];
        let currentCommit = '';
        let currentAuthor = '';
        let currentDate = '';
        let lineNumber = 0;

        for (const line of lines) {
            if (line.match(/^[a-f0-9]{40}/)) {
                currentCommit = line.split(' ')[0];
                lineNumber = parseInt(line.split(' ')[2]);
            } else if (line.startsWith('author ')) {
                currentAuthor = line.substring(7);
            } else if (line.startsWith('author-time ')) {
                currentDate = new Date(parseInt(line.substring(12)) * 1000).toISOString();
            } else if (line.startsWith('\t')) {
                blameData.push({
                    lineNumber,
                    hash: currentCommit,
                    author: currentAuthor,
                    date: currentDate,
                    content: line.substring(1)
                });
            }
        }

        return blameData;
    }

    // Staging Operations
    public async stageFile(filePath: string): Promise<void> {
        if (!this.git) return;

        try {
            await this.git.add(filePath);
            this._onDidChangeGitState.fire();
        } catch (error) {
            console.error('Error staging file:', error);
            throw error;
        }
    }

    public async unstageFile(filePath: string): Promise<void> {
        if (!this.git) return;

        try {
            await this.git.reset(['HEAD', filePath]);
            this._onDidChangeGitState.fire();
        } catch (error) {
            console.error('Error unstaging file:', error);
            throw error;
        }
    }

    public async discardChanges(filePath: string): Promise<void> {
        if (!this.git) return;

        try {
            await this.git.checkout(['--', filePath]);
            this._onDidChangeGitState.fire();
        } catch (error) {
            console.error('Error discarding changes:', error);
            throw error;
        }
    }

    // Commit Operations
    public async commit(message: string, amend: boolean = false): Promise<void> {
        if (!this.git) return;

        try {
            const options = amend ? ['--amend'] : [];
            await this.git.commit(message, options);
            this._onDidChangeGitState.fire();
        } catch (error) {
            console.error('Error committing:', error);
            throw error;
        }
    }

    // Advanced Operations
    public async cherryPick(hash: string): Promise<void> {
        if (!this.git) return;

        try {
            await this.git.raw(['cherry-pick', hash]);
            this._onDidChangeGitState.fire();
        } catch (error) {
            console.error('Error cherry-picking:', error);
            throw error;
        }
    }

    public async rebase(branch: string, interactive: boolean = false): Promise<void> {
        if (!this.git) return;

        try {
            const options = interactive ? ['-i', branch] : [branch];
            await this.git.rebase(options);
            this._onDidChangeGitState.fire();
        } catch (error) {
            console.error('Error rebasing:', error);
            throw error;
        }
    }
}
