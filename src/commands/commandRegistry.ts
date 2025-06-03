import * as vscode from 'vscode';
import { GitProvider } from '../gitProvider';
import { GitLogViewProvider } from '../views/gitLogView';
import { ChangesViewProvider } from '../views/changesView';
import { FileHistoryViewProvider } from '../views/fileHistoryView';
import { GitGraphWebviewProvider } from '../webviews/gitGraphWebview';
import { DiffViewProvider } from '../views/diffView';
import { GitCommit, GitFileChange } from '../models/gitModels';
import * as path from 'path';

export function registerCommands(
    context: vscode.ExtensionContext,
    gitProvider: GitProvider,
    gitLogProvider: GitLogViewProvider,
    changesProvider: ChangesViewProvider,
    fileHistoryProvider: FileHistoryViewProvider,
    gitGraphProvider: GitGraphWebviewProvider,
    diffProvider: DiffViewProvider
) {
    // Git Log Commands
    const showGitLogCommand = vscode.commands.registerCommand('intellijGit.showGitLog', () => {
        vscode.commands.executeCommand('workbench.view.scm');
        vscode.commands.executeCommand('intellijGit.gitLog.focus');
    });

    const showGitGraphCommand = vscode.commands.registerCommand('intellijGit.showGitGraph', () => {
        vscode.commands.executeCommand('intellijGit.gitGraph.focus');
    });

    const refreshGitLogCommand = vscode.commands.registerCommand('intellijGit.refreshGitLog', () => {
        gitLogProvider.refresh();
    });

    const filterByAuthorCommand = vscode.commands.registerCommand('intellijGit.filterByAuthor', async () => {
        const author = await vscode.window.showInputBox({
            prompt: 'Enter author name to filter by',
            placeHolder: 'Author name'
        });
        if (author !== undefined) {
            gitLogProvider.filterByAuthor(author);
        }
    });

    const filterByMessageCommand = vscode.commands.registerCommand('intellijGit.filterByMessage', async () => {
        const message = await vscode.window.showInputBox({
            prompt: 'Enter commit message to search for',
            placeHolder: 'Commit message'
        });
        if (message !== undefined) {
            gitLogProvider.filterByMessage(message);
        }
    });

    const clearFiltersCommand = vscode.commands.registerCommand('intellijGit.clearFilters', () => {
        gitLogProvider.clearFilters();
    });

    // Commit Details Commands
    const showCommitDetailsCommand = vscode.commands.registerCommand('intellijGit.showCommitDetails', async (commit: GitCommit) => {
        const panel = vscode.window.createWebviewPanel(
            'commitDetails',
            `Commit ${commit.shortHash}`,
            vscode.ViewColumn.Beside,
            { enableScripts: true }
        );

        panel.webview.html = getCommitDetailsHtml(commit);
    });

    // Changes Commands
    const showChangesCommand = vscode.commands.registerCommand('intellijGit.showChanges', () => {
        vscode.commands.executeCommand('workbench.view.scm');
        vscode.commands.executeCommand('intellijGit.changes.focus');
    });

    const stageFileCommand = vscode.commands.registerCommand('intellijGit.stageFile', async (item: any) => {
        let filePath: string;
        
        if (item && item.fileChange) {
            filePath = item.fileChange.path;
        } else if (item && item.resourceUri) {
            const workspaceRoot = gitProvider.getWorkspaceRoot();
            filePath = workspaceRoot ? path.relative(workspaceRoot, item.resourceUri.fsPath) : item.resourceUri.fsPath;
        } else {
            vscode.window.showErrorMessage('No file selected for staging');
            return;
        }

        await changesProvider.stageFile(filePath);
    });

    const unstageFileCommand = vscode.commands.registerCommand('intellijGit.unstageFile', async (item: any) => {
        let filePath: string;
        
        if (item && item.fileChange) {
            filePath = item.fileChange.path;
        } else if (item && item.resourceUri) {
            const workspaceRoot = gitProvider.getWorkspaceRoot();
            filePath = workspaceRoot ? path.relative(workspaceRoot, item.resourceUri.fsPath) : item.resourceUri.fsPath;
        } else {
            vscode.window.showErrorMessage('No file selected for unstaging');
            return;
        }

        await changesProvider.unstageFile(filePath);
    });

    const discardChangesCommand = vscode.commands.registerCommand('intellijGit.discardChanges', async (item: any) => {
        let filePath: string;
        
        if (item && item.fileChange) {
            filePath = item.fileChange.path;
        } else if (item && item.resourceUri) {
            const workspaceRoot = gitProvider.getWorkspaceRoot();
            filePath = workspaceRoot ? path.relative(workspaceRoot, item.resourceUri.fsPath) : item.resourceUri.fsPath;
        } else {
            vscode.window.showErrorMessage('No file selected for discarding changes');
            return;
        }

        await changesProvider.discardChanges(filePath);
    });

    const showFileDiffCommand = vscode.commands.registerCommand('intellijGit.showFileDiff', async (fileChange: GitFileChange) => {
        await diffProvider.showFileDiff(fileChange);
    });

    // File History Commands
    const showFileHistoryCommand = vscode.commands.registerCommand('intellijGit.showFileHistory', async (uri: vscode.Uri) => {
        if (uri && uri.fsPath) {
            await fileHistoryProvider.setCurrentFile(uri.fsPath);
            vscode.commands.executeCommand('intellijGit.fileHistory.focus');
        } else {
            vscode.window.showErrorMessage('No file selected for history');
        }
    });

    const showBlameCommand = vscode.commands.registerCommand('intellijGit.showBlame', async (uri: vscode.Uri) => {
        if (!uri && vscode.window.activeTextEditor) {
            uri = vscode.window.activeTextEditor.document.uri;
        }

        if (uri && uri.fsPath) {
            const workspaceRoot = gitProvider.getWorkspaceRoot();
            if (!workspaceRoot) return;

            const relativePath = path.relative(workspaceRoot, uri.fsPath);
            const blameData = await gitProvider.getBlame(relativePath);
            
            // Show blame in a new editor
            const panel = vscode.window.createWebviewPanel(
                'gitBlame',
                `Blame: ${path.basename(uri.fsPath)}`,
                vscode.ViewColumn.Beside,
                { enableScripts: true }
            );

            panel.webview.html = getBlameHtml(blameData, relativePath);
        }
    });

    const showFileAtCommitCommand = vscode.commands.registerCommand('intellijGit.showFileAtCommit', async (filePath: string, commitHash: string) => {
        await fileHistoryProvider.showFileAtCommit(filePath, commitHash);
    });

    // Commit Management Commands
    const commitCommand = vscode.commands.registerCommand('intellijGit.commit', async () => {
        const message = await vscode.window.showInputBox({
            prompt: 'Enter commit message',
            placeHolder: 'Commit message',
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Commit message cannot be empty';
                }
                return null;
            }
        });

        if (message) {
            try {
                await gitProvider.commit(message.trim());
                vscode.window.showInformationMessage('Changes committed successfully');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to commit: ${error}`);
            }
        }
    });

    const amendCommitCommand = vscode.commands.registerCommand('intellijGit.amendCommit', async () => {
        const result = await vscode.window.showWarningMessage(
            'This will amend the last commit. Are you sure?',
            { modal: true },
            'Amend Commit'
        );

        if (result === 'Amend Commit') {
            const message = await vscode.window.showInputBox({
                prompt: 'Enter new commit message (leave empty to keep current)',
                placeHolder: 'New commit message'
            });

            try {
                await gitProvider.commit(message || '', true);
                vscode.window.showInformationMessage('Commit amended successfully');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to amend commit: ${error}`);
            }
        }
    });

    const rewordCommitCommand = vscode.commands.registerCommand('intellijGit.rewordCommit', async (commit: GitCommit) => {
        const newMessage = await vscode.window.showInputBox({
            prompt: 'Enter new commit message',
            value: commit.message,
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Commit message cannot be empty';
                }
                return null;
            }
        });

        if (newMessage && newMessage !== commit.message) {
            try {
                // This would require interactive rebase for commits other than the last one
                vscode.window.showInformationMessage('Reword functionality not yet implemented for historical commits');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to reword commit: ${error}`);
            }
        }
    });

    // Advanced Git Operations
    const cherryPickCommand = vscode.commands.registerCommand('intellijGit.cherryPick', async (commit: GitCommit) => {
        const result = await vscode.window.showInformationMessage(
            `Cherry-pick commit ${commit.shortHash}: "${commit.message}"?`,
            'Cherry Pick',
            'Cancel'
        );

        if (result === 'Cherry Pick') {
            try {
                await gitProvider.cherryPick(commit.hash);
                vscode.window.showInformationMessage(`Cherry-picked commit ${commit.shortHash}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to cherry-pick: ${error}`);
            }
        }
    });

    const squashCommitsCommand = vscode.commands.registerCommand('intellijGit.squashCommits', async () => {
        vscode.window.showInformationMessage('Squash commits functionality not yet implemented');
    });

    const interactiveRebaseCommand = vscode.commands.registerCommand('intellijGit.interactiveRebase', async () => {
        vscode.window.showInformationMessage('Interactive rebase functionality not yet implemented');
    });

    // Register all commands
    context.subscriptions.push(
        showGitLogCommand,
        showGitGraphCommand,
        refreshGitLogCommand,
        filterByAuthorCommand,
        filterByMessageCommand,
        clearFiltersCommand,
        showCommitDetailsCommand,
        showChangesCommand,
        stageFileCommand,
        unstageFileCommand,
        discardChangesCommand,
        showFileDiffCommand,
        showFileHistoryCommand,
        showBlameCommand,
        showFileAtCommitCommand,
        commitCommand,
        amendCommitCommand,
        rewordCommitCommand,
        cherryPickCommand,
        squashCommitsCommand,
        interactiveRebaseCommand
    );
}

function getCommitDetailsHtml(commit: GitCommit): string {
    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Commit Details</title>
        <style>
            body { font-family: var(--vscode-font-family); padding: 20px; }
            .commit-header { border-bottom: 1px solid var(--vscode-editorGroup-border); padding-bottom: 10px; }
            .commit-meta { color: var(--vscode-descriptionForeground); margin-top: 10px; }
            .commit-body { margin-top: 20px; white-space: pre-wrap; }
            .hash { font-family: monospace; background: var(--vscode-textCodeBlock-background); padding: 2px 4px; }
        </style>
    </head>
    <body>
        <div class="commit-header">
            <h1>${commit.message}</h1>
            <div class="commit-meta">
                <div><strong>Hash:</strong> <span class="hash">${commit.hash}</span></div>
                <div><strong>Author:</strong> ${commit.author} &lt;${commit.email}&gt;</div>
                <div><strong>Date:</strong> ${commit.date.toLocaleString()}</div>
            </div>
        </div>
        ${commit.body ? `<div class="commit-body">${commit.body}</div>` : ''}
    </body>
    </html>`;
}

function getBlameHtml(blameData: any[], filePath: string): string {
    const lines = blameData.map((blame, index) => `
        <tr>
            <td class="line-number">${blame.lineNumber}</td>
            <td class="commit-hash">${blame.hash.substring(0, 8)}</td>
            <td class="author">${blame.author}</td>
            <td class="date">${new Date(blame.date).toLocaleDateString()}</td>
            <td class="content">${blame.content}</td>
        </tr>
    `).join('');

    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Git Blame</title>
        <style>
            body { font-family: monospace; margin: 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 2px 8px; text-align: left; border-bottom: 1px solid var(--vscode-editorGroup-border); }
            .line-number { width: 50px; background: var(--vscode-editorLineNumber-background); }
            .commit-hash { width: 80px; font-family: monospace; }
            .author { width: 150px; }
            .date { width: 100px; }
            .content { white-space: pre; }
        </style>
    </head>
    <body>
        <h2>Blame: ${filePath}</h2>
        <table>
            <thead>
                <tr>
                    <th>Line</th>
                    <th>Commit</th>
                    <th>Author</th>
                    <th>Date</th>
                    <th>Content</th>
                </tr>
            </thead>
            <tbody>
                ${lines}
            </tbody>
        </table>
    </body>
    </html>`;
}
