// Git Graph Webview JavaScript
(function() {
    const vscode = acquireVsCodeApi();
    
    let currentGraph = null;
    let selectedCommit = null;
    let searchTerm = '';
    
    // Initialize the webview
    document.addEventListener('DOMContentLoaded', function() {
        setupEventListeners();
        vscode.postMessage({ type: 'ready' });
    });
    
    function setupEventListeners() {
        // Toolbar buttons
        document.getElementById('refreshBtn').addEventListener('click', () => {
            vscode.postMessage({ type: 'refresh' });
        });
        
        document.getElementById('filterBtn').addEventListener('click', () => {
            showFilterDialog();
        });
        
        // Search input
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value.toLowerCase();
            filterGraph();
        });
        
        // Commit details panel
        document.getElementById('cherryPickBtn').addEventListener('click', () => {
            if (selectedCommit) {
                vscode.postMessage({ 
                    type: 'cherryPick', 
                    commitHash: selectedCommit.hash 
                });
            }
        });
        
        document.getElementById('showDetailsBtn').addEventListener('click', () => {
            if (selectedCommit) {
                vscode.postMessage({ 
                    type: 'showCommitDetails', 
                    commitHash: selectedCommit.hash 
                });
            }
        });
        
        document.getElementById('closeDetailsBtn').addEventListener('click', () => {
            hideCommitDetails();
        });
    }
    
    // Handle messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;
        
        switch (message.type) {
            case 'updateGraph':
                updateGraph(message.nodes, message.edges, message.commits);
                break;
            case 'error':
                showError(message.message);
                break;
            case 'loading':
                showLoading();
                break;
        }
    });
    
    function updateGraph(nodes, edges, commits) {
        currentGraph = { nodes, edges, commits };
        renderGraph();
    }
    
    function renderGraph() {
        if (!currentGraph) return;
        
        const container = document.getElementById('graph-container');
        const svg = document.getElementById('git-graph');
        
        // Clear existing content
        svg.innerHTML = '';
        
        // Calculate dimensions
        const containerRect = container.getBoundingClientRect();
        const width = Math.max(containerRect.width, 800);
        const height = Math.max(currentGraph.nodes.length * 50, 400);
        
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        
        // Create scales
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(currentGraph.nodes, d => d.x) || 1])
            .range([50, width - 200]);
            
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(currentGraph.nodes, d => d.y) || 1])
            .range([30, height - 30]);
        
        // Render edges first (so they appear behind nodes)
        renderEdges(svg, xScale, yScale);
        
        // Render nodes
        renderNodes(svg, xScale, yScale);
        
        // Apply search filter if active
        if (searchTerm) {
            filterGraph();
        }
    }
    
    function renderEdges(svg, xScale, yScale) {
        const edgeGroup = d3.select(svg).append('g').attr('class', 'edges');
        
        currentGraph.edges.forEach(edge => {
            const fromNode = currentGraph.nodes.find(n => n.commit.hash === edge.from);
            const toNode = currentGraph.nodes.find(n => n.commit.hash === edge.to);
            
            if (fromNode && toNode) {
                const line = edgeGroup.append('line')
                    .attr('class', 'commit-edge')
                    .attr('x1', xScale(fromNode.x))
                    .attr('y1', yScale(fromNode.y))
                    .attr('x2', xScale(toNode.x))
                    .attr('y2', yScale(toNode.y))
                    .attr('stroke', edge.color || '#666')
                    .attr('data-from', edge.from)
                    .attr('data-to', edge.to);
            }
        });
    }
    
    function renderNodes(svg, xScale, yScale) {
        const nodeGroup = d3.select(svg).append('g').attr('class', 'nodes');
        
        currentGraph.nodes.forEach(node => {
            const commit = node.commit;
            const x = xScale(node.x);
            const y = yScale(node.y);
            
            // Create node group
            const nodeElement = nodeGroup.append('g')
                .attr('class', 'commit-node')
                .attr('data-hash', commit.hash)
                .attr('transform', `translate(${x}, ${y})`)
                .style('cursor', 'pointer');
            
            // Commit circle
            nodeElement.append('circle')
                .attr('r', 6)
                .attr('fill', node.color || '#007acc')
                .attr('stroke', '#fff')
                .attr('stroke-width', 2);
            
            // Commit message
            nodeElement.append('text')
                .attr('class', 'commit-label commit-message')
                .attr('x', 15)
                .attr('y', 0)
                .attr('dy', '0.35em')
                .text(truncateText(commit.message, 50));
            
            // Author and date
            nodeElement.append('text')
                .attr('class', 'commit-label commit-author')
                .attr('x', 15)
                .attr('y', 12)
                .text(`${commit.author} • ${formatDate(commit.date)}`);
            
            // Hash
            nodeElement.append('text')
                .attr('class', 'commit-label commit-hash')
                .attr('x', 15)
                .attr('y', -12)
                .style('font-family', 'monospace')
                .style('font-size', '10px')
                .text(commit.shortHash);
            
            // Click handler
            nodeElement.on('click', () => {
                selectCommit(commit, nodeElement);
            });
            
            // Hover effects
            nodeElement.on('mouseenter', function() {
                d3.select(this).select('circle')
                    .transition()
                    .duration(200)
                    .attr('r', 8);
            });
            
            nodeElement.on('mouseleave', function() {
                if (!d3.select(this).classed('selected')) {
                    d3.select(this).select('circle')
                        .transition()
                        .duration(200)
                        .attr('r', 6);
                }
            });
        });
    }
    
    function selectCommit(commit, nodeElement) {
        // Remove previous selection
        d3.selectAll('.commit-node').classed('selected', false);
        d3.selectAll('.commit-node circle').attr('r', 6);
        
        // Select current node
        d3.select(nodeElement.node()).classed('selected', true);
        d3.select(nodeElement.node()).select('circle').attr('r', 8);
        
        selectedCommit = commit;
        showCommitDetails(commit);
        
        // Notify extension
        vscode.postMessage({ 
            type: 'commitSelected', 
            commitHash: commit.hash 
        });
    }
    
    function showCommitDetails(commit) {
        const detailsPanel = document.getElementById('commit-details');
        const infoDiv = document.getElementById('commit-info');
        
        infoDiv.innerHTML = `
            <h3>${escapeHtml(commit.message)}</h3>
            <p><strong>Hash:</strong> <span class="hash">${commit.hash}</span></p>
            <p><strong>Author:</strong> ${escapeHtml(commit.author)} &lt;${escapeHtml(commit.email)}&gt;</p>
            <p><strong>Date:</strong> ${formatDate(commit.date)}</p>
            ${commit.body ? `<p><strong>Description:</strong><br>${escapeHtml(commit.body)}</p>` : ''}
        `;
        
        detailsPanel.classList.remove('hidden');
    }
    
    function hideCommitDetails() {
        document.getElementById('commit-details').classList.add('hidden');
        selectedCommit = null;
        
        // Remove selection
        d3.selectAll('.commit-node').classed('selected', false);
        d3.selectAll('.commit-node circle').attr('r', 6);
    }
    
    function filterGraph() {
        if (!currentGraph || !searchTerm) {
            // Show all nodes and edges
            d3.selectAll('.commit-node').style('opacity', 1);
            d3.selectAll('.commit-edge').style('opacity', 0.8);
            return;
        }
        
        // Filter nodes based on search term
        d3.selectAll('.commit-node').style('opacity', function() {
            const hash = this.getAttribute('data-hash');
            const commit = currentGraph.commits.find(c => c.hash === hash);
            
            if (!commit) return 0.3;
            
            const searchableText = [
                commit.message,
                commit.author,
                commit.email,
                commit.hash,
                commit.shortHash
            ].join(' ').toLowerCase();
            
            return searchableText.includes(searchTerm) ? 1 : 0.3;
        });
        
        // Filter edges based on visible nodes
        d3.selectAll('.commit-edge').style('opacity', function() {
            const fromHash = this.getAttribute('data-from');
            const toHash = this.getAttribute('data-to');
            
            const fromVisible = d3.select(`[data-hash="${fromHash}"]`).style('opacity') === '1';
            const toVisible = d3.select(`[data-hash="${toHash}"]`).style('opacity') === '1';
            
            return (fromVisible && toVisible) ? 0.8 : 0.2;
        });
    }
    
    function showFilterDialog() {
        // Simple filter dialog - in a real implementation, this would be more sophisticated
        const filters = prompt('Enter filter criteria (author:name, message:text, date:YYYY-MM-DD)');
        if (filters) {
            // Parse and apply filters
            vscode.postMessage({ 
                type: 'applyFilters', 
                filters: filters 
            });
        }
    }
    
    function showLoading() {
        const container = document.getElementById('graph-container');
        container.innerHTML = '<div class="loading">Loading git graph...</div>';
    }
    
    function showError(message) {
        const container = document.getElementById('graph-container');
        container.innerHTML = `<div class="error">Error: ${escapeHtml(message)}</div>`;
    }
    
    // Utility functions
    function truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }
    
    function formatDate(date) {
        const d = new Date(date);
        const now = new Date();
        const diffMs = now - d;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return d.toLocaleDateString();
        }
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (currentGraph) {
            renderGraph();
        }
    });
})();
