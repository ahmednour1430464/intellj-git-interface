import * as vscode from 'vscode';
import * as path from 'path';

export class GitUtils {
    /**
     * Checks if the current workspace contains a Git repository
     */
    public static async isGitRepository(workspaceRoot?: string): Promise<boolean> {
        if (!workspaceRoot) {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                return false;
            }
            workspaceRoot = workspaceFolders[0].uri.fsPath;
        }

        try {
            const gitDir = path.join(workspaceRoot, '.git');
            const stat = await vscode.workspace.fs.stat(vscode.Uri.file(gitDir));
            return stat.type === vscode.FileType.Directory;
        } catch {
            return false;
        }
    }

    /**
     * Gets the relative path from workspace root
     */
    public static getRelativePath(absolutePath: string, workspaceRoot: string): string {
        return path.relative(workspaceRoot, absolutePath);
    }

    /**
     * Formats a commit hash for display (short version)
     */
    public static formatCommitHash(hash: string, length: number = 8): string {
        return hash.substring(0, length);
    }

    /**
     * Formats file size in human readable format
     */
    public static formatFileSize(bytes: number): string {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Validates commit message format
     */
    public static validateCommitMessage(message: string): string | null {
        if (!message || message.trim().length === 0) {
            return 'Commit message cannot be empty';
        }

        if (message.length > 72) {
            return 'Commit message should be 72 characters or less';
        }

        // Check for common commit message patterns
        const patterns = [
            /^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+/,
            /^(Add|Update|Fix|Remove|Refactor|Improve) .+/,
            /^.{1,50}$/
        ];

        const hasValidPattern = patterns.some(pattern => pattern.test(message));
        if (!hasValidPattern) {
            return 'Consider using conventional commit format: type(scope): description';
        }

        return null;
    }

    /**
     * Parses Git status output
     */
    public static parseGitStatus(statusOutput: string): { staged: string[], unstaged: string[] } {
        const lines = statusOutput.split('\n').filter(line => line.trim().length > 0);
        const staged: string[] = [];
        const unstaged: string[] = [];

        for (const line of lines) {
            if (line.length < 3) continue;
            
            const stagedStatus = line[0];
            const unstagedStatus = line[1];
            const filePath = line.substring(3);

            if (stagedStatus !== ' ' && stagedStatus !== '?') {
                staged.push(filePath);
            }

            if (unstagedStatus !== ' ') {
                unstaged.push(filePath);
            }
        }

        return { staged, unstaged };
    }

    /**
     * Gets the Git status icon for a file
     */
    public static getStatusIcon(status: string): vscode.ThemeIcon {
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

    /**
     * Gets the status description for a file
     */
    public static getStatusDescription(status: string): string {
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

    /**
     * Formats a date for display
     */
    public static formatDate(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            if (diffHours === 0) {
                const diffMinutes = Math.floor(diffMs / (1000 * 60));
                return diffMinutes <= 1 ? 'just now' : `${diffMinutes} minutes ago`;
            }
            return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
        } else if (diffDays === 1) {
            return 'yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else if (diffDays < 30) {
            const diffWeeks = Math.floor(diffDays / 7);
            return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
        } else if (diffDays < 365) {
            const diffMonths = Math.floor(diffDays / 30);
            return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
        } else {
            const diffYears = Math.floor(diffDays / 365);
            return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
        }
    }

    /**
     * Truncates text to specified length with ellipsis
     */
    public static truncateText(text: string, maxLength: number): string {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 3) + '...';
    }

    /**
     * Escapes HTML characters
     */
    public static escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Generates a random color for branch visualization
     */
    public static generateBranchColor(index: number): string {
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
            '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
            '#10ac84', '#ee5a24', '#0abde3', '#3867d6', '#8854d0'
        ];
        return colors[index % colors.length];
    }

    /**
     * Debounces a function call
     */
    public static debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number
    ): (...args: Parameters<T>) => void {
        let timeout: NodeJS.Timeout;
        return (...args: Parameters<T>) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }

    /**
     * Creates a VS Code URI for a Git object
     */
    public static createGitUri(filePath: string, ref: string): vscode.Uri {
        return vscode.Uri.parse(`git:${filePath}?${ref}`);
    }

    /**
     * Checks if a string is a valid Git hash
     */
    public static isValidGitHash(hash: string): boolean {
        return /^[a-f0-9]{7,40}$/i.test(hash);
    }

    /**
     * Parses a Git reference (branch, tag, or commit)
     */
    public static parseGitRef(ref: string): { type: 'branch' | 'tag' | 'commit', name: string } {
        if (ref.startsWith('refs/heads/')) {
            return { type: 'branch', name: ref.substring(11) };
        } else if (ref.startsWith('refs/tags/')) {
            return { type: 'tag', name: ref.substring(10) };
        } else if (this.isValidGitHash(ref)) {
            return { type: 'commit', name: ref };
        } else {
            return { type: 'branch', name: ref };
        }
    }
}
