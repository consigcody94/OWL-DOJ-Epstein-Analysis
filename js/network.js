/**
 * OWL Analysis System v4.0
 * Exploratory Network Visualization
 * D3.js force-directed graph with confidence-labelled inferred edges
 */

let networkSvg;
let networkSimulation;
let networkData = { nodes: [], links: [] };
let networkTransform = d3.zoomIdentity;

// Relationship type colors
const LINK_COLORS = {
    financial: '#22c55e',      // green
    social: '#06b6d4',         // cyan
    legal: '#3b82f6',          // blue
    staff: '#f59e0b',          // amber
    political: '#a855f7',      // purple
    family: '#ec4899',         // pink
    trafficking: '#ef4444'     // red
};

document.addEventListener('DOMContentLoaded', () => {
    // Wait a moment for data to load, then initialize
    setTimeout(() => {
        initNetwork();
    }, 500);
});

async function initNetwork() {
    // Load persons data if not already loaded
    let persons = window.state?.persons || [];
    
    if (persons.length === 0) {
        try {
            const response = await fetch('data/persons-database.json');
            const data = await response.json();
            persons = data.persons || [];
        } catch (error) {
            console.error('Error loading persons data for network:', error);
            return;
        }
    }

    // Build network data structure
    buildNetworkData(persons);
    
    // Create network visualization
    createNetworkVisualization();
    
    // Setup controls
    setupNetworkControls();
    
    // Animate in when scrolled into view
    observeNetworkSection();
}

function buildNetworkData(persons) {
    // Create nodes from persons
    networkData.nodes = persons.map(person => ({
        id: person.id,
        name: person.name,
        role: person.role,
        photo: person.photo,
        document_count: person.document_count,
        status: person.status,
        // Node size based on importance
        radius: getNodeRadius(person)
    }));

    // Create links (relationships)
    // Exploratory graph: links are generated from role/category metadata unless a future data/relationships.json source marks them documented.
    networkData.links = generateRelationships(persons);
}

function getNodeRadius(person) {
    // Epstein and Maxwell get largest nodes
    if (person.id === 'epstein') return 60;
    if (person.id === 'maxwell') return 60;
    
    // Scale others by document count
    if (person.document_count > 100000) return 45;
    if (person.document_count > 10000) return 35;
    return 30;
}

function generateRelationships(persons) {
    const links = [];
    
    // Central hub: Epstein connects to almost everyone
    const epstein = persons.find(p => p.id === 'epstein');
    const maxwell = persons.find(p => p.id === 'maxwell');
    
    if (!epstein || !maxwell) return links;

    // Epstein <-> Maxwell (primary trafficking relationship)
    links.push({
        source: 'epstein',
        target: 'maxwell',
        type: 'trafficking',
        strength: 'strong',
        confidence: 'documented/court context',
        basis: 'court record and conviction context',
        confirmed: true
    });

    persons.forEach(person => {
        if (person.id === 'epstein' || person.id === 'maxwell') return;
        
        const roleLower = (person.role || '').toLowerCase();
        
        // Determine relationship type based on role
        let type = 'social';
        let linkToMaxwell = false;
        
        if (roleLower.includes('staff') || roleLower.includes('assistant') || roleLower.includes('pilot')) {
            type = 'staff';
            linkToMaxwell = true; // Staff worked with both
        } else if (roleLower.includes('defense') || roleLower.includes('attorney') || roleLower.includes('prosecutor')) {
            type = 'legal';
        } else if (roleLower.includes('financial') || roleLower.includes('accountant')) {
            type = 'financial';
        } else if (roleLower.includes('politician') || roleLower.includes('minister') || roleLower.includes('president')) {
            type = 'political';
        }
        
        // Link to Epstein. These broad edges are navigational/inferential unless a
        // future relationships data file documents an exact source relationship.
        links.push({
            source: 'epstein',
            target: person.id,
            type: type,
            strength: person.document_count > 10000 ? 'strong' : 'weak',
            confidence: 'inferred',
            basis: 'role-category grouping / document-count proximity',
            confirmed: false
        });
        
        // Some also link to Maxwell
        if (linkToMaxwell || person.document_count > 50000) {
            links.push({
                source: 'maxwell',
                target: person.id,
                type: type,
                strength: 'medium',
                confidence: 'inferred',
                basis: 'role-category grouping / document-count proximity',
                confirmed: false
            });
        }
    });

    // Add some inter-connections (defense attorneys, staff, etc.)
    const staff = persons.filter(p => (p.role || '').toLowerCase().includes('staff') || (p.role || '').toLowerCase().includes('assistant'));
    if (staff.length > 1) {
        for (let i = 0; i < staff.length - 1; i++) {
            links.push({
                source: staff[i].id,
                target: staff[i + 1].id,
                type: 'staff',
                strength: 'weak',
                confidence: 'inferred',
                basis: 'role-category grouping',
                confirmed: false
            });
        }
    }

    const defense = persons.filter(p => (p.role || '').toLowerCase().includes('defense'));
    if (defense.length > 1) {
        for (let i = 0; i < defense.length - 1; i++) {
            links.push({
                source: defense[i].id,
                target: defense[i + 1].id,
                type: 'legal',
                strength: 'weak',
                confidence: 'inferred',
                basis: 'role-category grouping',
                confirmed: false
            });
        }
    }

    return links;
}

function createNetworkVisualization() {
    const container = document.getElementById('networkGraph');
    if (!container) {
        console.error('Network container not found');
        return;
    }

    // Clear any existing SVG
    d3.select('#networkGraph').selectAll('*').remove();

    // Get dimensions
    const width = container.parentElement.offsetWidth;
    const height = 600;

    // Create SVG
    networkSvg = d3.select('#networkGraph')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [0, 0, width, height]);

    // Create defs for patterns (for photo nodes)
    const defs = networkSvg.append('defs');

    // Add zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.5, 3])
        .on('zoom', (event) => {
            networkTransform = event.transform;
            g.attr('transform', event.transform);
        });

    networkSvg.call(zoom);

    // Main group for zooming/panning
    const g = networkSvg.append('g');

    // Create force simulation
    networkSimulation = d3.forceSimulation(networkData.nodes)
        .force('link', d3.forceLink(networkData.links)
            .id(d => d.id)
            .distance(d => {
                // Distance based on relationship strength
                if (d.strength === 'strong') return 120;
                if (d.strength === 'medium') return 180;
                return 240;
            })
            .strength(0.5))
        .force('charge', d3.forceManyBody()
            .strength(-800) // Strong repulsion to prevent overlap
            .distanceMax(400))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide()
            .radius(d => d.radius + 10)
            .strength(0.7));

    // Create links
    const link = g.append('g')
        .selectAll('line')
        .data(networkData.links)
        .join('line')
        .attr('class', 'network-link')
        .attr('stroke', d => LINK_COLORS[d.type] || LINK_COLORS.social)
        .attr('stroke-width', d => d.strength === 'strong' ? 3 : d.strength === 'medium' ? 2 : 1)
        .attr('stroke-opacity', d => d.confirmed ? 0.72 : 0.38)
        .attr('stroke-dasharray', d => d.confirmed ? '0' : '5,5');

    // Create node groups
    const node = g.append('g')
        .selectAll('g')
        .data(networkData.nodes)
        .join('g')
        .attr('class', 'network-node')
        .call(drag(networkSimulation));

    // Add photo patterns to defs
    networkData.nodes.forEach(person => {
        if (person.photo) {
            const pattern = defs.append('pattern')
                .attr('id', `photo-${person.id}`)
                .attr('width', 1)
                .attr('height', 1)
                .attr('patternContentUnits', 'objectBoundingBox');

            pattern.append('image')
                .attr('href', person.photo)
                .attr('width', 1)
                .attr('height', 1)
                .attr('preserveAspectRatio', 'xMidYMid slice')
                .on('error', function() {
                    // If photo fails to load, remove pattern
                    d3.select(`#photo-${person.id}`).remove();
                });
        }
    });

    // Add circles to nodes
    node.append('circle')
        .attr('r', d => d.radius)
        .attr('fill', d => {
            // If photo exists, use pattern
            if (d.photo) {
                return `url(#photo-${d.id})`;
            }
            // Otherwise, use role-based color
            return getNodeColor(d.role);
        })
        .attr('stroke', d => getNodeBorderColor(d))
        .attr('stroke-width', 3)
        .style('filter', 'drop-shadow(0 0 8px rgba(0, 0, 0, 0.5))');

    // Add text initial for non-photo nodes
    node.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-size', d => d.radius * 0.6)
        .attr('font-weight', 'bold')
        .attr('fill', 'white')
        .attr('pointer-events', 'none')
        .style('text-shadow', '0 0 4px rgba(0, 0, 0, 0.8)')
        .text(d => d.photo ? '' : d.name.charAt(0).toUpperCase())
        .style('opacity', d => d.photo ? 0 : 1);

    // Add hover labels
    node.append('text')
        .attr('class', 'node-label')
        .attr('text-anchor', 'middle')
        .attr('y', d => d.radius + 16)
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .attr('fill', 'var(--text-primary)')
        .attr('pointer-events', 'none')
        .style('opacity', 0)
        .style('text-shadow', '0 0 4px rgba(0, 0, 0, 0.8)')
        .text(d => d.name);

    // Node interactions
    node.on('mouseenter', function(event, d) {
        // Show label
        d3.select(this).select('.node-label')
            .transition()
            .duration(200)
            .style('opacity', 1);

        // Spotlight effect
        spotlightNode(d.id, node, link);
    })
    .on('mouseleave', function(event, d) {
        // Hide label
        d3.select(this).select('.node-label')
            .transition()
            .duration(200)
            .style('opacity', 0);

        // Remove spotlight
        removeSpotlight(node, link);
    })
    .on('click', function(event, d) {
        event.stopPropagation();
        // Open dossier
        if (window.openDossier) {
            window.openDossier(d.id);
        }
    });

    // Update positions on simulation tick
    networkSimulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Add legend
    addNetworkLegend(networkSvg, width);

    // Animate in
    node.style('opacity', 0)
        .transition()
        .duration(800)
        .delay((d, i) => i * 20)
        .style('opacity', 1);

    link.style('opacity', 0)
        .transition()
        .duration(800)
        .delay(400)
        .style('opacity', 0.6);
}

function getNodeColor(role) {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('principal') || roleLower.includes('defendant')) return '#ef4444';
    if (roleLower.includes('convicted')) return '#a855f7';
    if (roleLower.includes('defense')) return '#3b82f6';
    if (roleLower.includes('staff') || roleLower.includes('assistant')) return '#f59e0b';
    if (roleLower.includes('prosecutor')) return '#22c55e';
    if (roleLower.includes('political')) return '#ec4899';
    return '#06b6d4';
}

function getNodeBorderColor(person) {
    if (person.id === 'epstein' || person.id === 'maxwell') return '#ef4444';
    return '#ffffff';
}

function spotlightNode(nodeId, nodeSelection, linkSelection) {
    // Get connected node IDs
    const connectedIds = new Set([nodeId]);
    networkData.links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        
        if (sourceId === nodeId) connectedIds.add(targetId);
        if (targetId === nodeId) connectedIds.add(sourceId);
    });

    // Dim all nodes except hovered and connected
    nodeSelection.transition()
        .duration(200)
        .style('opacity', d => connectedIds.has(d.id) ? 1 : 0.15);

    // Dim all links except connected
    linkSelection.transition()
        .duration(200)
        .style('opacity', d => {
            const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
            const targetId = typeof d.target === 'object' ? d.target.id : d.target;
            return (sourceId === nodeId || targetId === nodeId) ? 1 : 0.15;
        });
}

function removeSpotlight(nodeSelection, linkSelection) {
    nodeSelection.transition()
        .duration(200)
        .style('opacity', 1);

    linkSelection.transition()
        .duration(200)
        .style('opacity', 0.6);
}

function addNetworkLegend(svg, width) {
    const legendData = [
        { type: 'trafficking', label: 'Trafficking', color: LINK_COLORS.trafficking },
        { type: 'financial', label: 'Financial', color: LINK_COLORS.financial },
        { type: 'social', label: 'Social/Personal', color: LINK_COLORS.social },
        { type: 'legal', label: 'Legal/Defense', color: LINK_COLORS.legal },
        { type: 'staff', label: 'Staff/Employee', color: LINK_COLORS.staff },
        { type: 'political', label: 'Political', color: LINK_COLORS.political }
    ];

    const legend = svg.append('g')
        .attr('class', 'network-legend')
        .attr('transform', `translate(20, 20)`);

    // Background
    legend.append('rect')
        .attr('x', -10)
        .attr('y', -10)
        .attr('width', 180)
        .attr('height', legendData.length * 25 + 25)
        .attr('fill', 'rgba(15, 17, 24, 0.9)')
        .attr('stroke', 'rgba(255, 255, 255, 0.1)')
        .attr('stroke-width', 1)
        .attr('rx', 8);

    // Title
    legend.append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .attr('fill', 'var(--cyan)')
        .text('Relationship Types');

    // Legend items
    legendData.forEach((item, i) => {
        const g = legend.append('g')
            .attr('transform', `translate(0, ${i * 25 + 20})`);

        g.append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 30)
            .attr('y2', 0)
            .attr('stroke', item.color)
            .attr('stroke-width', 2);

        g.append('text')
            .attr('x', 40)
            .attr('y', 4)
            .attr('font-size', '11px')
            .attr('fill', 'var(--text-secondary)')
            .text(item.label);
    });
}

function drag(simulation) {
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }

    return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
}

function setupNetworkControls() {
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const resetBtn = document.getElementById('resetZoom');

    if (!zoomInBtn || !zoomOutBtn || !resetBtn) {
        console.error('Network control buttons not found');
        return;
    }

    zoomInBtn.addEventListener('click', () => {
        if (!networkSvg) return;
        networkSvg.transition()
            .duration(300)
            .call(d3.zoom().scaleBy, 1.3);
    });

    zoomOutBtn.addEventListener('click', () => {
        if (!networkSvg) return;
        networkSvg.transition()
            .duration(300)
            .call(d3.zoom().scaleBy, 0.7);
    });

    resetBtn.addEventListener('click', () => {
        if (!networkSvg) return;
        networkSvg.transition()
            .duration(500)
            .call(d3.zoom().transform, d3.zoomIdentity);
    });
}

function observeNetworkSection() {
    const section = document.getElementById('network');
    if (!section) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && networkSimulation) {
                // Restart simulation when scrolled into view
                networkSimulation.alpha(1).restart();
                observer.unobserve(section);
            }
        });
    }, { threshold: 0.3 });

    observer.observe(section);
}

// Make functions globally available
window.createNetworkVisualization = createNetworkVisualization;
window.networkData = networkData;
