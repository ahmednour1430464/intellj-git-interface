import * as vscode from 'vscode';
import { GitProvider } from '../gitProvider';
import { GitFileChange, GitDiff, GitDiffHunk, GitDiffLine } from '../models/gitModels';
import * as path from 'path';

export class DiffViewProvider {
    constructor(private gitProvider: GitProvider) {}

    public async showFileDiff(fileChange: GitFileChange, staged: boolean = false) {
        try {
            const workspaceRoot = this.gitProvider.getWorkspaceRoot();
            if (!workspaceRoot) return;

            const config = vscode.workspace.getConfiguration('intellijGit');
            const diffViewMode = config.get<string>('diffViewMode', 'sideBySide');

            if (diffViewMode === 'sideBySide') {
                await this.showSideBySideDiff(fileChange, staged);
            } else {
                await this.showUnifiedDiff(fileChange, staged);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to show diff: ${error}`);
        }
    }

    private async showSideBySideDiff(fileChange: GitFileChange, staged: boolean) {
        const workspaceRoot = this.gitProvider.getWorkspaceRoot();
        if (!workspaceRoot) return;

        const filePath = path.join(workspaceRoot, fileChange.path);
        const fileUri = vscode.Uri.file(filePath);

        let leftUri: vscode.Uri;
        let rightUri: vscode.Uri;
        let title: string;

        if (staged) {
            // Compare staged version with HEAD
            leftUri = vscode.Uri.parse(`git:${filePath}?HEAD`);
            rightUri = vscode.Uri.parse(`git:${filePath}?~`); // Staged version
            title = `${path.basename(fileChange.path)} (Staged ↔ HEAD)`;
        } else {
            // Compare working directory with HEAD
            leftUri = vscode.Uri.parse(`git:${filePath}?HEAD`);
            rightUri = fileUri;
            title = `${path.basename(fileChange.path)} (Working Directory ↔ HEAD)`;
        }

        await vscode.commands.executeCommand(
            'vscode.diff',
            leftUri,
            rightUri,
            title,
            {
                preview: true,
                viewColumn: vscode.ViewColumn.Active
            }
        );
    }

    private async showUnifiedDiff(fileChange: GitFileChange, staged: boolean) {
        const diffContent = await this.gitProvider.getDiff(fileChange.path, staged);
        const parsedDiff = this.parseDiff(diffContent);

        const panel = vscode.window.createWebviewPanel(
            'unifiedDiff',
            `Diff: ${path.basename(fileChange.path)}`,
            vscode.ViewColumn.Active,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = this.getUnifiedDiffHtml(parsedDiff, fileChange);

        // Handle messages from webview
        panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.type) {
                    case 'stageHunk':
                        await this.stageHunk(fileChange.path, message.hunkIndex);
                        break;
                    case 'unstageHunk':
                        await this.unstageHunk(fileChange.path, message.hunkIndex);
                        break;
                    case 'discardHunk':
                        await this.discardHunk(fileChange.path, message.hunkIndex);
                        break;
                }
            }
        );
    }

    private parseDiff(diffContent: string): GitDiff {
        const lines = diffContent.split('\n');
        const hunks: GitDiffHunk[] = [];
        let currentHunk: GitDiffHunk | null = null;
        let oldLineNumber = 0;
        let newLineNumber = 0;

        for (const line of lines) {
            if (line.startsWith('@@')) {
                // Hunk header
                const match = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
                if (match) {
                    if (currentHunk) {
                        hunks.push(currentHunk);
                    }

                    oldLineNumber = parseInt(match[1]);
                    newLineNumber = parseInt(match[3]);
                    const oldLines = match[2] ? parseInt(match[2]) : 1;
                    const newLines = match[4] ? parseInt(match[4]) : 1;

                    currentHunk = {
                        oldStart: oldLineNumber,
                        oldLines,
                        newStart: newLineNumber,
                        newLines,
                        lines: []
                    };
                }
            } else if (currentHunk && (line.startsWith('+') || line.startsWith('-') || line.startsWith(' '))) {
                const type = line.startsWith('+') ? 'add' : line.startsWith('-') ? 'delete' : 'context';
                const content = line.substring(1);

                const diffLine: GitDiffLine = {
                    type,
                    content,
                    oldLineNumber: type !== 'add' ? oldLineNumber : undefined,
                    newLineNumber: type !== 'delete' ? newLineNumber : undefined
                };

                currentHunk.lines.push(diffLine);

                if (type !== 'add') oldLineNumber++;
                if (type !== 'delete') newLineNumber++;
            }
        }

        if (currentHunk) {
            hunks.push(currentHunk);
        }

        return {
            file: '',
            hunks,
            binary: false,
            deleted: false,
            created: false,
            renamed: false
        };
    }

    private getUnifiedDiffHtml(diff: GitDiff, fileChange: GitFileChange): string {
        const hunksHtml = diff.hunks.map((hunk, index) => {
            const linesHtml = hunk.lines.map(line => {
                const lineClass = `diff-line diff-${line.type}`;
                const lineNumbers = `
                    <td class="line-number old">${line.oldLineNumber || ''}</td>
                    <td class="line-number new">${line.newLineNumber || ''}</td>
                `;
                return `
                    <tr class="${lineClass}">
                        ${lineNumbers}
                        <td class="line-content">
                            <span class="line-prefix">${line.type === 'add' ? '+' : line.type === 'delete' ? '-' : ' '}</span>
                            <span class="line-text">${this.escapeHtml(line.content)}</span>
                        </td>
                    </tr>
                `;
            }).join('');

            return `
                <div class="hunk" data-hunk-index="${index}">
                    <div class="hunk-header">
                        <span class="hunk-info">@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@</span>
                        <div class="hunk-actions">
                            <button class="stage-hunk" onclick="stageHunk(${index})">Stage Hunk</button>
                            <button class="unstage-hunk" onclick="unstageHunk(${index})">Unstage Hunk</button>
                            <button class="discard-hunk" onclick="discardHunk(${index})">Discard Hunk</button>
                        </div>
                    </div>
                    <table class="diff-table">
                        ${linesHtml}
                    </table>
                </div>
            `;
        }).join('');

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Unified Diff</title>
            <style>
                body {
                    font-family: 'Courier New', monospace;
                    margin: 0;
                    padding: 20px;
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                }
                
                .file-header {
                    background-color: var(--vscode-editorGroupHeader-tabsBackground);
                    padding: 10px;
                    border-radius: 4px;
                    margin-bottom: 20px;
                }
                
                .hunk {
                    margin-bottom: 20px;
                    border: 1px solid var(--vscode-editorGroup-border);
                    border-radius: 4px;
                }
                
                .hunk-header {
                    background-color: var(--vscode-editorGroupHeader-tabsBackground);
                    padding: 8px 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid var(--vscode-editorGroup-border);
                }
                
                .hunk-info {
                    font-weight: bold;
                    color: var(--vscode-textPreformat-foreground);
                }
                
                .hunk-actions button {
                    margin-left: 8px;
                    padding: 4px 8px;
                    border: 1px solid var(--vscode-button-border);
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border-radius: 2px;
                    cursor: pointer;
                }
                
                .hunk-actions button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                
                .diff-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 12px;
                }
                
                .line-number {
                    width: 50px;
                    padding: 2px 8px;
                    text-align: right;
                    background-color: var(--vscode-editorLineNumber-background);
                    color: var(--vscode-editorLineNumber-foreground);
                    border-right: 1px solid var(--vscode-editorGroup-border);
                    user-select: none;
                }
                
                .line-content {
                    padding: 2px 8px;
                    white-space: pre;
                    font-family: inherit;
                }
                
                .diff-add {
                    background-color: var(--vscode-diffEditor-insertedTextBackground);
                }
                
                .diff-delete {
                    background-color: var(--vscode-diffEditor-removedTextBackground);
                }
                
                .diff-context {
                    background-color: var(--vscode-editor-background);
                }
                
                .line-prefix {
                    margin-right: 8px;
                    font-weight: bold;
                }
                
                .diff-add .line-prefix {
                    color: var(--vscode-gitDecoration-addedResourceForeground);
                }
                
                .diff-delete .line-prefix {
                    color: var(--vscode-gitDecoration-deletedResourceForeground);
                }
            </style>
        </head>
        <body>
            <div class="file-header">
                <h2>${fileChange.path}</h2>
                <p>Status: ${this.getStatusDescription(fileChange.status)}</p>
            </div>
            
            ${hunksHtml}
            
            <script>
                const vscode = acquireVsCodeApi();
                
                function stageHunk(hunkIndex) {
                    vscode.postMessage({ type: 'stageHunk', hunkIndex });
                }
                
                function unstageHunk(hunkIndex) {
                    vscode.postMessage({ type: 'unstageHunk', hunkIndex });
                }
                
                function discardHunk(hunkIndex) {
                    if (confirm('Are you sure you want to discard this hunk? This action cannot be undone.')) {
                        vscode.postMessage({ type: 'discardHunk', hunkIndex });
                    }
                }
            </script>
        </body>
        </html>`;
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
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

    private async stageHunk(filePath: string, hunkIndex: number) {
        // Implementation for staging specific hunks would require more complex git operations
        vscode.window.showInformationMessage('Hunk staging not yet implemented');
    }

    private async unstageHunk(filePath: string, hunkIndex: number) {
        // Implementation for unstaging specific hunks
        vscode.window.showInformationMessage('Hunk unstaging not yet implemented');
    }

    private async discardHunk(filePath: string, hunkIndex: number) {
        // Implementation for discarding specific hunks
        vscode.window.showInformationMessage('Hunk discarding not yet implemented');
    }

    public async showCommitDiff(commitHash: string) {
        try {
            const diff = await this.gitProvider.getDiff(undefined, false);
            // Show commit diff in a new panel
            const panel = vscode.window.createWebviewPanel(
                'commitDiff',
                `Commit Diff: ${commitHash.substring(0, 8)}`,
                vscode.ViewColumn.Active,
                { enableScripts: true }
            );

            panel.webview.html = `
                <html>
                <body>
                    <h1>Commit Diff: ${commitHash}</h1>
                    <pre>${diff}</pre>
                </body>
                </html>
            `;
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to show commit diff: ${error}`);
        }
    }
}
