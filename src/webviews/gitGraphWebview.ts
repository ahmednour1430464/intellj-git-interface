import * as vscode from 'vscode';
import { GitProvider } from '../gitProvider';
import { GitCommit, GitCommitGraph } from '../models/gitModels';
import * as path from 'path';

export class GitGraphWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'intellijGit.gitGraph';

    private _view?: vscode.WebviewView;
    private commits: GitCommit[] = [];
    private graph: GitCommitGraph | null = null;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private gitProvider: GitProvider
    ) {
        this.gitProvider.onDidChangeGitState(() => this.refresh());
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(
            message => {
                switch (message.type) {
                    case 'commitSelected':
                        this.handleCommitSelection(message.commitHash);
                        break;
                    case 'showCommitDetails':
                        this.showCommitDetails(message.commitHash);
                        break;
                    case 'cherryPick':
                        this.cherryPickCommit(message.commitHash);
                        break;
                    case 'ready':
                        this.loadAndDisplayGraph();
                        break;
                }
            },
            undefined,
            []
        );

        // Initial load
        this.loadAndDisplayGraph();
    }

    public async refresh() {
        await this.loadAndDisplayGraph();
    }

    private async loadAndDisplayGraph() {
        if (!this._view || !this.gitProvider.isGitRepository()) {
            return;
        }

        try {
            const config = vscode.workspace.getConfiguration('intellijGit');
            const maxCommits = config.get<number>('maxCommitsToShow', 100);
            
            this.commits = await this.gitProvider.getCommits(maxCommits);
            this.graph = new GitCommitGraph(this.commits);

            // Send graph data to webview
            this._view.webview.postMessage({
                type: 'updateGraph',
                nodes: this.graph.getNodes(),
                edges: this.graph.getEdges(),
                commits: this.commits
            });
        } catch (error) {
            console.error('Error loading git graph:', error);
            this._view.webview.postMessage({
                type: 'error',
                message: `Failed to load git graph: ${error}`
            });
        }
    }

    private async handleCommitSelection(commitHash: string) {
        const commit = this.commits.find(c => c.hash === commitHash);
        if (commit) {
            // Show commit details in a new panel or update existing one
            vscode.commands.executeCommand('intellijGit.showCommitDetails', commit);
        }
    }

    private async showCommitDetails(commitHash: string) {
        const commit = this.commits.find(c => c.hash === commitHash);
        if (commit) {
            const panel = vscode.window.createWebviewPanel(
                'commitDetails',
                `Commit ${commit.shortHash}`,
                vscode.ViewColumn.Beside,
                {
                    enableScripts: true,
                    localResourceRoots: [this._extensionUri]
                }
            );

            panel.webview.html = this._getCommitDetailsHtml(panel.webview, commit);
        }
    }

    private async cherryPickCommit(commitHash: string) {
        try {
            await this.gitProvider.cherryPick(commitHash);
            vscode.window.showInformationMessage(`Cherry-picked commit ${commitHash.substring(0, 8)}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to cherry-pick commit: ${error}`);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'git-graph.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'git-graph.css'));
        const d3Uri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'node_modules', 'd3', 'dist', 'd3.min.js'));

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${styleUri}" rel="stylesheet">
            <title>Git Graph</title>
        </head>
        <body>
            <div id="toolbar">
                <button id="refreshBtn">Refresh</button>
                <button id="filterBtn">Filter</button>
                <input type="text" id="searchInput" placeholder="Search commits...">
            </div>
            <div id="graph-container">
                <svg id="git-graph"></svg>
            </div>
            <div id="commit-details" class="hidden">
                <div id="commit-info"></div>
                <div id="commit-actions">
                    <button id="cherryPickBtn">Cherry Pick</button>
                    <button id="showDetailsBtn">Show Details</button>
                    <button id="closeDetailsBtn">Close</button>
                </div>
            </div>
            <script src="${d3Uri}"></script>
            <script src="${scriptUri}"></script>
        </body>
        </html>`;
    }

    private _getCommitDetailsHtml(webview: vscode.Webview, commit: GitCommit): string {
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'commit-details.css'));
        
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${styleUri}" rel="stylesheet">
            <title>Commit Details</title>
        </head>
        <body>
            <div class="commit-header">
                <h1>${commit.message}</h1>
                <div class="commit-meta">
                    <span class="hash">${commit.hash}</span>
                    <span class="author">${commit.author} &lt;${commit.email}&gt;</span>
                    <span class="date">${commit.date.toLocaleString()}</span>
                </div>
            </div>
            
            ${commit.body ? `
            <div class="commit-body">
                <h2>Description</h2>
                <pre>${commit.body}</pre>
            </div>
            ` : ''}
            
            <div class="commit-actions">
                <button onclick="cherryPick('${commit.hash}')">Cherry Pick</button>
                <button onclick="showDiff('${commit.hash}')">Show Changes</button>
                <button onclick="copyHash('${commit.hash}')">Copy Hash</button>
            </div>
            
            <div class="commit-files">
                <h2>Changed Files</h2>
                <div id="file-list">Loading...</div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                
                function cherryPick(hash) {
                    vscode.postMessage({ type: 'cherryPick', commitHash: hash });
                }
                
                function showDiff(hash) {
                    vscode.postMessage({ type: 'showDiff', commitHash: hash });
                }
                
                function copyHash(hash) {
                    navigator.clipboard.writeText(hash);
                    vscode.postMessage({ type: 'info', message: 'Hash copied to clipboard' });
                }
                
                // Load file changes
                vscode.postMessage({ type: 'getCommitFiles', commitHash: '${commit.hash}' });
            </script>
        </body>
        </html>`;
    }
}
