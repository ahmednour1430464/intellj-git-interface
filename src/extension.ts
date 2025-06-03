import * as vscode from 'vscode';
import { GitProvider } from './gitProvider';
import { GitLogViewProvider } from './views/gitLogView';
import { ChangesViewProvider } from './views/changesView';
import { FileHistoryViewProvider } from './views/fileHistoryView';
import { GitGraphWebviewProvider } from './webviews/gitGraphWebview';
import { DiffViewProvider } from './views/diffView';
import { registerCommands } from './commands/commandRegistry';

export function activate(context: vscode.ExtensionContext) {
    console.log('IntelliJ Git Interface extension is now active!');

    // Initialize Git provider
    const gitProvider = new GitProvider();

    // Register view providers
    const gitLogProvider = new GitLogViewProvider(gitProvider);
    const changesProvider = new ChangesViewProvider(gitProvider);
    const fileHistoryProvider = new FileHistoryViewProvider(gitProvider);
    const gitGraphProvider = new GitGraphWebviewProvider(context.extensionUri, gitProvider);
    const diffProvider = new DiffViewProvider(gitProvider);

    // Register tree data providers
    vscode.window.registerTreeDataProvider('intellijGit.gitLog', gitLogProvider);
    vscode.window.registerTreeDataProvider('intellijGit.changes', changesProvider);
    vscode.window.registerTreeDataProvider('intellijGit.fileHistory', fileHistoryProvider);

    // Register webview providers
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('intellijGit.gitGraph', gitGraphProvider)
    );

    // Register all commands
    registerCommands(context, gitProvider, gitLogProvider, changesProvider, fileHistoryProvider, gitGraphProvider, diffProvider);

    // Set up file system watcher for git changes
    const gitWatcher = vscode.workspace.createFileSystemWatcher('**/.git/**');
    gitWatcher.onDidChange(() => refreshAllViews());
    gitWatcher.onDidCreate(() => refreshAllViews());
    gitWatcher.onDidDelete(() => refreshAllViews());
    context.subscriptions.push(gitWatcher);

    // Set up workspace folder watcher
    const workspaceWatcher = vscode.workspace.onDidChangeWorkspaceFolders(() => {
        gitProvider.refresh();
        refreshAllViews();
    });
    context.subscriptions.push(workspaceWatcher);

    // Auto-refresh configuration
    const configWatcher = vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('intellijGit')) {
            refreshAllViews();
        }
    });
    context.subscriptions.push(configWatcher);

    function refreshAllViews() {
        const config = vscode.workspace.getConfiguration('intellijGit');
        if (config.get('autoRefresh', true)) {
            gitLogProvider.refresh();
            changesProvider.refresh();
            fileHistoryProvider.refresh();
            gitGraphProvider.refresh();
        }
    }

    // Initial refresh
    refreshAllViews();
}

export function deactivate() {
    console.log('IntelliJ Git Interface extension is now deactivated!');
}
