export interface GitCommit {
    hash: string;
    shortHash: string;
    message: string;
    author: string;
    email: string;
    date: Date;
    body: string;
    refs: string;
    parents: string[];
}

export interface GitBranch {
    name: string;
    current: boolean;
    remote: boolean;
    hash: string;
}

export interface GitStatus {
    current: string;
    ahead: number;
    behind: number;
    staged: string[];
    modified: string[];
    created: string[];
    deleted: string[];
    renamed: Array<{ from: string; to: string }>;
    conflicted: string[];
}

export interface GitDiff {
    file: string;
    oldFile?: string;
    newFile?: string;
    hunks: GitDiffHunk[];
    binary: boolean;
    deleted: boolean;
    created: boolean;
    renamed: boolean;
}

export interface GitDiffHunk {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: GitDiffLine[];
}

export interface GitDiffLine {
    type: 'add' | 'delete' | 'context';
    content: string;
    oldLineNumber?: number;
    newLineNumber?: number;
}

export interface GitBlame {
    lineNumber: number;
    hash: string;
    author: string;
    date: string;
    content: string;
}

export interface GitFileChange {
    path: string;
    status: 'M' | 'A' | 'D' | 'R' | 'C' | 'U' | '?';
    staged: boolean;
    oldPath?: string;
}

export interface GitGraphNode {
    commit: GitCommit;
    x: number;
    y: number;
    color: string;
    parents: string[];
    children: string[];
}

export interface GitGraphEdge {
    from: string;
    to: string;
    color: string;
    points: Array<{ x: number; y: number }>;
}

export interface GitConflict {
    file: string;
    conflicts: GitConflictSection[];
}

export interface GitConflictSection {
    startLine: number;
    endLine: number;
    currentContent: string[];
    incomingContent: string[];
    baseContent?: string[];
}

export interface GitRebaseStep {
    action: 'pick' | 'reword' | 'edit' | 'squash' | 'fixup' | 'exec' | 'break' | 'drop' | 'label' | 'reset' | 'merge';
    hash: string;
    message: string;
}

export interface GitStash {
    index: number;
    message: string;
    hash: string;
    date: Date;
}

export interface GitRemote {
    name: string;
    url: string;
    type: 'fetch' | 'push';
}

export interface GitTag {
    name: string;
    hash: string;
    message?: string;
    date: Date;
    annotated: boolean;
}

export interface GitSubmodule {
    path: string;
    url: string;
    hash: string;
    name: string;
}

export class GitCommitGraph {
    private nodes: Map<string, GitGraphNode> = new Map();
    private edges: GitGraphEdge[] = [];
    private branches: Map<string, string> = new Map(); // branch name -> color

    constructor(commits: GitCommit[]) {
        this.buildGraph(commits);
    }

    private buildGraph(commits: GitCommit[]) {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
        let colorIndex = 0;
        const branchColors = new Map<string, string>();

        // Sort commits by date (newest first)
        commits.sort((a, b) => b.date.getTime() - a.date.getTime());

        commits.forEach((commit, index) => {
            // Assign color based on branch or create new one
            let color = branchColors.get(commit.refs) || colors[colorIndex % colors.length];
            if (!branchColors.has(commit.refs)) {
                branchColors.set(commit.refs, color);
                colorIndex++;
            }

            const node: GitGraphNode = {
                commit,
                x: this.calculateXPosition(commit, index),
                y: index * 40, // 40px spacing between commits
                color,
                parents: commit.parents,
                children: []
            };

            this.nodes.set(commit.hash, node);
        });

        // Build parent-child relationships and edges
        this.nodes.forEach(node => {
            node.parents.forEach(parentHash => {
                const parentNode = this.nodes.get(parentHash);
                if (parentNode) {
                    parentNode.children.push(node.commit.hash);
                    
                    // Create edge
                    this.edges.push({
                        from: parentHash,
                        to: node.commit.hash,
                        color: node.color,
                        points: this.calculateEdgePoints(parentNode, node)
                    });
                }
            });
        });
    }

    private calculateXPosition(commit: GitCommit, index: number): number {
        // Simple algorithm: assign x position based on branch
        // In a real implementation, this would be more sophisticated
        const branchIndex = Array.from(this.branches.keys()).indexOf(commit.refs);
        return branchIndex >= 0 ? branchIndex * 20 : 0;
    }

    private calculateEdgePoints(from: GitGraphNode, to: GitGraphNode): Array<{ x: number; y: number }> {
        // Simple straight line for now
        // In a real implementation, this would handle complex branching patterns
        return [
            { x: from.x, y: from.y },
            { x: to.x, y: to.y }
        ];
    }

    public getNodes(): GitGraphNode[] {
        return Array.from(this.nodes.values());
    }

    public getEdges(): GitGraphEdge[] {
        return this.edges;
    }

    public getNode(hash: string): GitGraphNode | undefined {
        return this.nodes.get(hash);
    }
}
