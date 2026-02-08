/**
 * OWL Analysis System - Interactive Explorer
 * DOJ Epstein Files Analysis Application
 * Version 2.0
 */

// ===========================================
// State Management
// ===========================================
const state = {
    persons: [],
    statistics: {},
    filteredPersons: [],
    searchQuery: '',
    activeFilters: {
        status: 'all',
        role: 'all',
        sortBy: 'documents'
    },
    theme: localStorage.getItem('owl-theme') || 'dark',
    networkData: null,
    selectedNode: null
};

// ===========================================
// Constants
// ===========================================
const NETWORK_COLORS = {
    1: "#ef4444", // Principal - red
    2: "#f59e0b", // Staff - amber
    3: "#64748b", // Pilots - gray
    4: "#10b981", // Prosecutor - green
    5: "#3b82f6", // Defense - blue
    6: "#8b5cf6", // Financial - purple
    7: "#06b6d4", // Associates - cyan
    8: "#ec4899", // International - pink
    9: "#f97316"  // Victims - orange
};

const GROUP_LABELS = {
    1: "Principal",
    2: "Staff",
    3: "Pilots",
    4: "Prosecutor",
    5: "Defense",
    6: "Financial",
    7: "Associates",
    8: "International",
    9: "Victims"
};

// ===========================================
// Utility Functions
// ===========================================

/**
 * Debounce function for search input
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Fuzzy search scoring - returns a score indicating match quality
 */
function fuzzyMatch(text, query) {
    if (!query) return 1;

    text = text.toLowerCase();
    query = query.toLowerCase();

    // Exact match
    if (text.includes(query)) return 1;

    // Check for individual word matches
    const queryWords = query.split(/\s+/);
    const textWords = text.split(/\s+/);

    let matchCount = 0;
    for (const qWord of queryWords) {
        for (const tWord of textWords) {
            if (tWord.includes(qWord) || qWord.includes(tWord)) {
                matchCount++;
                break;
            }
        }
    }

    if (matchCount > 0) {
        return matchCount / queryWords.length;
    }

    // Character-by-character fuzzy matching
    let queryIndex = 0;
    for (let i = 0; i < text.length && queryIndex < query.length; i++) {
        if (text[i] === query[queryIndex]) {
            queryIndex++;
        }
    }

    return queryIndex === query.length ? 0.5 : 0;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Highlight matching text
 */
function highlightText(text, query) {
    if (!query || !text) return escapeHtml(text);

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    // Simple case: exact match (case-insensitive)
    const index = lowerText.indexOf(lowerQuery);
    if (index >= 0) {
        return escapeHtml(text.substring(0, index)) +
            '<span class="highlight">' + escapeHtml(text.substring(index, index + query.length)) + '</span>' +
            escapeHtml(text.substring(index + query.length));
    }

    // If no exact phrase match, we could try word matching, but for now exact phrase or safe return
    return escapeHtml(text);
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Get status badge class
 */
function getStatusClass(status) {
    const statusMap = {
        'Deceased': 'deceased',
        'Incarcerated': 'convicted',
        'Living': 'associate'
    };
    return statusMap[status] || 'associate';
}

/**
 * Get tag HTML for a person's tags
 */
function getTagsHTML(tags) {
    if (!tags || !Array.isArray(tags)) return '';

    const tagClassMap = {
        'principal': 'principal',
        'convicted': 'convicted',
        'co-conspirator': 'convicted',
        'deceased': 'deceased',
        'staff': 'staff',
        'npa_immunity': 'npa-immunity',
        'defense_team': 'defense',
        'npa_negotiator': 'defense',
        'prosecutor': 'prosecutor',
        'npa_signatory': 'prosecutor',
        'witness': 'witness',
        'associate': 'associate',
        'mentioned': 'associate',
        'financial': 'financial'
    };

    return tags.map(tag => {
        const className = tagClassMap[tag] || 'associate';
        const displayName = tag.replace(/_/g, ' ').toUpperCase();
        return `<span class="tag ${escapeHtml(className)}">${escapeHtml(displayName)}</span>`;
    }).join('');
}

// ===========================================
// Data Loading
// ===========================================

/**
 * Load all data from JSON files
 */
async function loadData() {
    showLoading();

    try {
        const [personsResponse, statsResponse] = await Promise.all([
            fetch('data/persons-database.json'),
            fetch('data/statistics.json')
        ]);

        if (!personsResponse.ok || !statsResponse.ok) {
            throw new Error('Failed to load data files');
        }

        const personsData = await personsResponse.json();
        const statsData = await statsResponse.json();

        state.persons = personsData.persons || [];
        state.statistics = statsData;
        state.filteredPersons = [...state.persons];

        // Initialize network data
        initializeNetworkData();

        // Render everything
        renderStats();
        renderPersonsGrid();
        renderNetwork();

        hideLoading();

    } catch (error) {
        console.error('Error loading data:', error);
        hideLoading();
        showError('Failed to load data. Please refresh the page.');
    }
}

/**
 * Initialize network visualization data
 */
function initializeNetworkData() {
    state.networkData = {
        nodes: [
            { id: "epstein", name: "Jeffrey Epstein", group: 1, radius: 40, docs: 3500000 },
            { id: "maxwell", name: "Ghislaine Maxwell", group: 1, radius: 35, docs: 850000 },
            { id: "kellen", name: "Sarah Kellen", group: 2, radius: 20, docs: 12000 },
            { id: "groff", name: "Lesley Groff", group: 2, radius: 18, docs: 8500 },
            { id: "marcinkova", name: "Nadia Marcinkova", group: 2, radius: 18, docs: 6200 },
            { id: "pilots", name: "Pilots", group: 3, radius: 22, docs: 45000 },
            { id: "acosta", name: "Alexander Acosta", group: 4, radius: 25, docs: 28000 },
            { id: "dershowitz", name: "Alan Dershowitz", group: 5, radius: 22, docs: 15000 },
            { id: "lefkowitz", name: "Jay Lefkowitz", group: 5, radius: 20, docs: 18500 },
            { id: "starr", name: "Ken Starr", group: 5, radius: 20, docs: 12000 },
            { id: "wexner", name: "Les Wexner", group: 6, radius: 22, docs: 4500 },
            { id: "andrew", name: "Prince Andrew", group: 7, radius: 25, docs: 32000 },
            { id: "clinton", name: "Bill Clinton", group: 7, radius: 23, docs: 28000 },
            { id: "trump", name: "Donald Trump", group: 7, radius: 24, docs: 41000 },
            { id: "brunel", name: "Jean-Luc Brunel", group: 8, radius: 20, docs: 9800 },
            { id: "victims", name: "100+ Victims", group: 9, radius: 30, docs: 520000 }
        ],
        links: [
            { source: "epstein", target: "maxwell", value: 10, type: "co-conspirator" },
            { source: "epstein", target: "kellen", value: 5, type: "staff" },
            { source: "epstein", target: "groff", value: 4, type: "staff" },
            { source: "epstein", target: "marcinkova", value: 4, type: "staff" },
            { source: "epstein", target: "pilots", value: 5, type: "staff" },
            { source: "epstein", target: "wexner", value: 6, type: "financial" },
            { source: "epstein", target: "victims", value: 10, type: "victim" },
            { source: "maxwell", target: "victims", value: 8, type: "victim" },
            { source: "maxwell", target: "kellen", value: 3, type: "coordination" },
            { source: "acosta", target: "epstein", value: 4, type: "legal" },
            { source: "dershowitz", target: "epstein", value: 3, type: "defense" },
            { source: "lefkowitz", target: "epstein", value: 4, type: "defense" },
            { source: "starr", target: "epstein", value: 3, type: "defense" },
            { source: "andrew", target: "epstein", value: 3, type: "associate" },
            { source: "andrew", target: "maxwell", value: 2, type: "associate" },
            { source: "clinton", target: "epstein", value: 2, type: "associate" },
            { source: "trump", target: "epstein", value: 2, type: "associate" },
            { source: "brunel", target: "epstein", value: 3, type: "recruitment" },
            { source: "brunel", target: "maxwell", value: 2, type: "recruitment" },
            { source: "kellen", target: "victims", value: 4, type: "scheduling" }
        ]
    };
}

// ===========================================
// UI Rendering
// ===========================================

/**
 * Show loading state
 */
function showLoading() {
    const loader = document.getElementById('loadingOverlay');
    if (loader) loader.classList.add('active');
}

/**
 * Hide loading state
 */
function hideLoading() {
    const loader = document.getElementById('loadingOverlay');
    if (loader) loader.classList.remove('active');
}

/**
 * Show error message
 */
function showError(message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.textContent = message;
    errorEl.style.cssText = `
        position: fixed;
        top: 1rem;
        right: 1rem;
        background: var(--accent-red);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        z-index: 1001;
    `;
    document.body.appendChild(errorEl);
    setTimeout(() => errorEl.remove(), 5000);
}

/**
 * Render statistics cards
 */
function renderStats() {
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid || !state.statistics.document_corpus) return;

    const stats = state.statistics;
    const statsHTML = `
        <div class="stat-card">
            <div class="stat-value">${formatNumber(stats.document_corpus.total_documents)}</div>
            <div class="stat-label">Documents Analyzed</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${formatNumber(stats.document_corpus.total_images_extracted)}</div>
            <div class="stat-label">Images Extracted</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.evidence_statistics.victim_references.identified_victims}</div>
            <div class="stat-label">Identified Victims</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${formatNumber(stats.evidence_statistics.maxwell_references.total_mentions)}</div>
            <div class="stat-label">Maxwell References</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.evidence_statistics.flight_records.identified_aircraft}</div>
            <div class="stat-label">Aircraft Identified</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.evidence_statistics.phone_records.max_contacts_single_victim}+</div>
            <div class="stat-label">Max Calls to Victim</div>
        </div>
    `;
    statsGrid.innerHTML = statsHTML;
}

/**
 * Render persons grid
 */
function renderPersonsGrid() {
    const grid = document.getElementById('personsGrid');
    if (!grid) return;

    // Apply filters and sorting
    applyFiltersAndSort();

    // Update result count
    updateResultsCount();

    if (state.filteredPersons.length === 0) {
        grid.innerHTML = `
            <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                <p style="font-size: 1.25rem; margin-bottom: 0.5rem;">No persons found</p>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = state.filteredPersons.map(person => createPersonCard(person)).join('');

    // Add click handlers for document items
    grid.querySelectorAll('.doc-item').forEach(item => {
        item.addEventListener('click', () => {
            const docId = item.dataset.docId;
            const docDesc = item.dataset.docDesc;
            openModal(docId, docDesc);
        });
    });
}

/**
 * Create HTML for a person card
 */
/**
 * Create HTML for a person card
 */
function createPersonCard(person) {
    const isSpan2 = ['dershowitz', 'andrew', 'clinton', 'trump', 'wexner', 'kellen', 'brunel', 'lefkowitz', 'starr', 'pilots', 'richardson'].includes(person.id);
    const docPageLink = getDocPageLink(person.id);

    const headerGradients = {
        'dershowitz': '#1a1a3a',
        'andrew': '#2a1a2a',
        'clinton': '#1a1a2e',
        'trump': '#2a1a1a',
        'wexner': '#1a2a1a',
        'kellen': '#2a2a1a',
        'brunel': '#3a1a2a',
        'lefkowitz': '#1a2a3a',
        'starr': '#2a1a1a',
        'pilots': '#1a3a3a',
        'richardson': '#2a2a2a'
    };

    const gradient = headerGradients[person.id] || '';
    const headerStyle = gradient ? `style="background: linear-gradient(135deg, ${gradient} 0%, var(--bg-card) 100%);"` : '';

    // Highlight logic
    const getName = () => highlightText(person.name, state.searchQuery);
    const getRole = () => highlightText(person.role, state.searchQuery);

    // Build evidence quotes
    let quotesHTML = '';
    if (person.key_evidence && person.key_evidence.length > 0) {
        quotesHTML = person.key_evidence.map(evidence => `
            <div class="quote-block">
                "${highlightText(evidence.quote, state.searchQuery)}"
                <div class="quote-source">- ${escapeHtml(evidence.source)}${evidence.document_id ? ` (${escapeHtml(evidence.document_id)})` : ''}</div>
            </div>
        `).join('');
    }

    // Build key documents list
    let docsHTML = '';
    if (person.key_documents && person.key_documents.length > 0) {
        docsHTML = person.key_documents.slice(0, 6).map(doc => `
            <div class="doc-item" data-doc-id="${escapeHtml(doc.id)}" data-doc-desc="${escapeHtml(doc.title)}" tabindex="0" role="button" aria-label="View document ${escapeHtml(doc.id)}">
                ${highlightText(doc.id, state.searchQuery)} - ${highlightText(doc.title, state.searchQuery)}
            </div>
        `).join('');
    }

    // Build description
    let descHTML = '';
    if (person.role_in_enterprise) {
        descHTML = `<p style="color: var(--text-secondary); font-size: 0.875rem; margin: 1rem 0;">
            <strong>${getRole()}:</strong> ${person.role_in_enterprise.map(r => highlightText(r, state.searchQuery)).join(', ')}
        </p>`;
    } else if (person.key_actions) {
        descHTML = `<p style="color: var(--text-secondary); font-size: 0.875rem; margin: 1rem 0;">
            ${person.key_actions.map(a => highlightText(a, state.searchQuery)).join(' ')}
        </p>`;
    } else if (person.notes) {
        descHTML = `<p style="color: var(--text-secondary); font-size: 0.875rem; margin: 1rem 0;">
            ${highlightText(person.notes, state.searchQuery)}
        </p>`;
    }

    // Build stats
    const stats = [];
    if (person.document_count) {
        stats.push({ value: formatNumber(person.document_count), label: 'Documents' });
    }
    if (person.charges && person.charges.length > 0) {
        stats.push({ value: person.charges.length, label: 'Charges' });
    }
    if (person.sentence) {
        stats.push({ value: person.sentence, label: 'Sentence' });
    }

    const statsHTML = stats.map(stat => `
        <div class="person-stat">
            <div class="person-stat-value">${escapeHtml(stat.value.toString())}</div>
            <div class="person-stat-label">${escapeHtml(stat.label)}</div>
        </div>
    `).join('');

    return `
        <article class="person-card ${isSpan2 ? 'span-2' : ''}" data-name="${escapeHtml(person.id)}" data-status="${escapeHtml(person.status)}" data-role="${escapeHtml(person.role)}" aria-label="${escapeHtml(person.name)}">
            <div class="person-header" ${headerStyle}>
                <h3 class="person-name">
                    ${docPageLink ? `<a href="${docPageLink}">${getName()}</a>` : getName()}
                </h3>
                <p class="person-role">${getRole()}</p>
            </div>
            <div class="person-body">
                <div class="person-tags">
                    ${getTagsHTML(person.tags)}
                    ${person.status === 'Deceased' ? '<span class="tag deceased">DECEASED</span>' : ''}
                    ${person.sentence ? `<span class="tag convicted">${escapeHtml(person.sentence)}</span>` : ''}
                </div>
                ${statsHTML ? `<div class="person-stats">${statsHTML}</div>` : ''}
                ${quotesHTML}
                ${descHTML}
                ${docsHTML ? `
                    <div class="doc-refs">
                        <div class="doc-refs-header">
                            <span class="doc-refs-title">Key Documents${person.document_count ? ` (${person.document_count} total)` : ''}</span>
                        </div>
                        <div class="doc-list" role="list" aria-label="Document references">
                            ${docsHTML}
                        </div>
                    </div>
                ` : ''}
            </div>
        </article>
    `;
}

/**
 * Get documentation page link for a person
 */
function getDocPageLink(personId) {
    const pageMap = {
        'andrew': 'docs/prince-andrew.html',
        'clinton': 'docs/clinton.html',
        'trump': 'docs/trump.html',
        'dershowitz': 'docs/dershowitz.html',
        'wexner': 'docs/wexner.html',
        'kellen': 'docs/sarah-kellen.html',
        'brunel': 'docs/brunel.html',
        'lefkowitz': 'docs/defense-attorneys.html#lefkowitz',
        'starr': 'docs/defense-attorneys.html#starr',
        'rodgers': 'docs/pilots.html',
        'visoski': 'docs/pilots.html',
        'richardson': 'docs/richardson.html'
    };
    return pageMap[personId] || null;
}

/**
 * Update search results count
 */
function updateResultsCount() {
    const countEl = document.getElementById('resultsCount');
    if (countEl) {
        const total = state.persons.length;
        const shown = state.filteredPersons.length;
        countEl.textContent = state.searchQuery || state.activeFilters.status !== 'all' || state.activeFilters.role !== 'all'
            ? `Showing ${shown} of ${total} persons`
            : `${total} persons of interest`;
    }
}

// ===========================================
// Search and Filter Functions
// ===========================================

/**
 * Handle search input
 */
function handleSearch(query) {
    state.searchQuery = query.trim();
    renderPersonsGrid();
}

/**
 * Handle filter change
 */
function handleFilterChange(filterType, value) {
    state.activeFilters[filterType] = value;
    renderPersonsGrid();
}

/**
 * Apply filters and sorting to persons
 */
function applyFiltersAndSort() {
    let filtered = [...state.persons];

    // Apply search
    if (state.searchQuery) {
        filtered = filtered.filter(person => {
            const searchableText = [
                person.name,
                person.role,
                person.notes || '',
                person.context || '',
                (person.tags || []).join(' '),
                (person.key_evidence || []).map(e => e.quote).join(' '),
                (person.key_documents || []).map(d => d.id + ' ' + d.title).join(' ')
            ].join(' ');

            return fuzzyMatch(searchableText, state.searchQuery) > 0;
        });
    }

    // Apply status filter
    if (state.activeFilters.status !== 'all') {
        filtered = filtered.filter(person => person.status === state.activeFilters.status);
    }

    // Apply role filter
    if (state.activeFilters.role !== 'all') {
        const roleMap = {
            'defendants': ['Principal Defendant', 'Co-Conspirator'],
            'staff': ['Assistant/Scheduler', 'Assistant', 'Associate', 'Chief Pilot', 'Pilot'],
            'defense': ['Defense Attorney'],
            'prosecutors': ['U.S. Attorney', 'Acting U.S. Attorney'],
            'associates': ['Former U.S. President', 'Former Governor of New Mexico', 'Billionaire / L Brands Founder', 'Modeling Agent']
        };

        const roles = roleMap[state.activeFilters.role] || [];
        filtered = filtered.filter(person => roles.some(r => person.role.includes(r)));
    }

    // Apply sorting
    filtered.sort((a, b) => {
        switch (state.activeFilters.sortBy) {
            case 'documents':
                return (b.document_count || 0) - (a.document_count || 0);
            case 'name':
                return a.name.localeCompare(b.name);
            case 'status':
                const statusOrder = { 'Deceased': 0, 'Incarcerated': 1, 'Living': 2 };
                return (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3);
            default:
                return 0;
        }
    });

    state.filteredPersons = filtered;
}

// ===========================================
// Network Visualization
// ===========================================

/**
 * Render the D3.js network visualization
 */
function renderNetwork() {
    const svg = d3.select("#network-svg");
    if (svg.empty() || !state.networkData) return;

    // Clear previous content
    svg.selectAll("*").remove();

    const container = document.querySelector('.network-container');
    const width = container ? container.clientWidth - 48 : 800;
    const height = 500;

    // Create simulation
    const simulation = d3.forceSimulation(state.networkData.nodes)
        .force("link", d3.forceLink(state.networkData.links).id(d => d.id).distance(120))
        .force("charge", d3.forceManyBody().strength(-500))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(d => d.radius + 15));

    // Create arrow marker for directed edges
    svg.append("defs").selectAll("marker")
        .data(["arrow"])
        .enter().append("marker")
        .attr("id", d => d)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 25)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("fill", "var(--border)")
        .attr("d", "M0,-5L10,0L0,5");

    // Create links
    const link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(state.networkData.links)
        .enter().append("line")
        .attr("class", "link")
        .attr("stroke-width", d => Math.sqrt(d.value))
        .attr("data-source", d => d.source.id || d.source)
        .attr("data-target", d => d.target.id || d.target);

    // Create node groups
    const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(state.networkData.nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("role", "button")
        .attr("tabindex", "0")
        .attr("aria-label", d => `${d.name}: ${d.docs} documents`)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    // Add circles
    node.append("circle")
        .attr("r", d => d.radius)
        .attr("fill", d => NETWORK_COLORS[d.group]);

    // Add labels
    node.append("text")
        .text(d => d.name)
        .attr("x", 0)
        .attr("y", d => d.radius + 15)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", "var(--text-primary)");

    // Add click handlers
    node.on("click", (event, d) => {
        handleNodeClick(d);
    });

    // Add keyboard handlers
    node.on("keydown", (event, d) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleNodeClick(d);
        }
    });

    // Add hover handlers for tooltip
    node.on("mouseenter", (event, d) => {
        showNodeTooltip(event, d);
        highlightConnections(d);
    }).on("mouseleave", () => {
        hideNodeTooltip();
        clearHighlights();
    });

    // Update positions on tick
    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Store simulation for later reference
    state.simulation = simulation;

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
}

/**
 * Handle node click in network
 */
/**
 * Handle node click in network
 */
function handleNodeClick(nodeData) {
    // Find the person in our data
    const person = state.persons.find(p => p.id === nodeData.id);

    if (person) {
        openModal(person.name, `
            <h4>Role</h4>
            <p>${escapeHtml(person.role)}</p>
            ${person.status ? `<h4>Status</h4><p>${escapeHtml(person.status)}</p>` : ''}
            <h4>Document References</h4>
            <p>${formatNumber(nodeData.docs)} documents</p>
            ${person.notes ? `<h4>Notes</h4><p>${escapeHtml(person.notes)}</p>` : ''}
            ${person.key_evidence ? `
                <h4>Key Evidence</h4>
                <ul>${person.key_evidence.map(e => `<li>"${escapeHtml(e.quote)}" - ${escapeHtml(e.source)}</li>`).join('')}</ul>
            ` : ''}
        `);
    } else {
        openModal(nodeData.name, `
            <h4>Network Node</h4>
            <p>Group: ${escapeHtml(GROUP_LABELS[nodeData.group])}</p>
            <p>Documents: ${formatNumber(nodeData.docs)}</p>
        `);
    }
}

/**
 * Show tooltip for network node
 */
function showNodeTooltip(event, d) {
    let tooltip = document.querySelector('.node-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'node-tooltip';
        document.querySelector('.network-container').appendChild(tooltip);
    }

    tooltip.innerHTML = `
        <h4>${d.name}</h4>
        <p><strong>Group:</strong> ${GROUP_LABELS[d.group]}</p>
        <p><strong>Documents:</strong> ${formatNumber(d.docs)}</p>
        <p style="font-size: 0.7rem; margin-top: 0.5rem;">Click for details</p>
    `;

    const rect = document.querySelector('.network-container').getBoundingClientRect();
    tooltip.style.left = `${event.clientX - rect.left + 10}px`;
    tooltip.style.top = `${event.clientY - rect.top - 10}px`;
    tooltip.style.display = 'block';
}

/**
 * Hide network node tooltip
 */
function hideNodeTooltip() {
    const tooltip = document.querySelector('.node-tooltip');
    if (tooltip) tooltip.style.display = 'none';
}

/**
 * Highlight connections for a node
 */
function highlightConnections(d) {
    d3.selectAll('.link')
        .classed('highlighted', link =>
            (link.source.id || link.source) === d.id ||
            (link.target.id || link.target) === d.id
        );
}

/**
 * Clear all highlights
 */
function clearHighlights() {
    d3.selectAll('.link').classed('highlighted', false);
}

/**
 * Reset network zoom/position
 */
function resetNetwork() {
    if (state.simulation) {
        state.simulation.alpha(0.3).restart();
    }
}

// ===========================================
// Modal Functions
// ===========================================

/**
 * Open modal with content
 */
function openModal(title, content) {
    const modal = document.getElementById('docModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    if (modal && modalTitle && modalBody) {
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        modal.classList.add('active');

        // Focus management for accessibility
        modal.querySelector('.modal-close').focus();

        // Trap focus inside modal
        document.addEventListener('keydown', trapFocus);
    }
}

/**
 * Close modal
 */
function closeModal() {
    const modal = document.getElementById('docModal');
    if (modal) {
        modal.classList.remove('active');
        document.removeEventListener('keydown', trapFocus);
    }
}

/**
 * Trap focus inside modal
 */
function trapFocus(e) {
    if (e.key === 'Escape') {
        closeModal();
        return;
    }

    if (e.key !== 'Tab') return;

    const modal = document.querySelector('.modal.active .modal-content');
    if (!modal) return;

    const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
    }
}

// ===========================================
// Theme Management
// ===========================================

/**
 * Initialize theme
 */
function initTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeToggle();
}

/**
 * Toggle theme
 */
function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('owl-theme', state.theme);
    updateThemeToggle();

    // Re-render network with new theme colors
    if (state.networkData) {
        setTimeout(renderNetwork, 100);
    }
}

/**
 * Update theme toggle button icon
 */
function updateThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        toggle.innerHTML = state.theme === 'dark' ? '' : '';
        toggle.setAttribute('aria-label', `Switch to ${state.theme === 'dark' ? 'light' : 'dark'} mode`);
    }
}

// ===========================================
// Navigation
// ===========================================

/**
 * Setup smooth scrolling navigation
 */
function setupNavigation() {
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                updateActiveNav(link);
            }
        });
    });

    // Update active nav on scroll
    window.addEventListener('scroll', debounce(updateNavOnScroll, 100));
}

/**
 * Update active navigation link
 */
function updateActiveNav(activeLink) {
    document.querySelectorAll('.nav-links a').forEach(l => {
        l.classList.remove('active');
        l.removeAttribute('aria-current');
    });
    activeLink.classList.add('active');
    activeLink.setAttribute('aria-current', 'page');
}

/**
 * Update navigation on scroll
 */
function updateNavOnScroll() {
    const sections = document.querySelectorAll('section[id]');
    const scrollPos = window.scrollY + 100;

    sections.forEach(section => {
        if (section.offsetTop <= scrollPos && section.offsetTop + section.offsetHeight > scrollPos) {
            const link = document.querySelector(`.nav-links a[href="#${section.id}"]`);
            if (link) updateActiveNav(link);
        }
    });
}

// ===========================================
// Event Listeners Setup
// ===========================================

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            handleSearch(e.target.value);
        }, 200));
    }

    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            handleFilterChange('status', e.target.value);
        });
    }

    // Role filter
    const roleFilter = document.getElementById('roleFilter');
    if (roleFilter) {
        roleFilter.addEventListener('change', (e) => {
            handleFilterChange('role', e.target.value);
        });
    }

    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            handleFilterChange('sortBy', e.target.value);
        });
    }

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Modal close button
    const modalClose = document.querySelector('.modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    // Modal backdrop click
    const modal = document.getElementById('docModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Network reset button
    const resetBtn = document.getElementById('resetNetwork');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetNetwork);
    }

    // Window resize handler for network
    window.addEventListener('resize', debounce(() => {
        if (state.networkData) renderNetwork();
    }, 250));

    // Back to Top Button
    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Scroll Animations (Intersection Observer)
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe sections and cards
    document.querySelectorAll('section, .stat-card, .person-card, .network-container, .timeline').forEach(el => {
        el.classList.add('reveal-on-scroll');
        observer.observe(el);
    });
}

// ===========================================
// Intro Sequence
// ===========================================

/**
 * Initialize Cinematic Intro
 */
function initIntroSequence() {
    const overlay = document.getElementById('intro-overlay');
    if (!overlay) return;

    // Check if seen in this session
    if (sessionStorage.getItem('introSeen')) {
        overlay.style.display = 'none';
        return;
    }

    const terminal = document.getElementById('terminal-output');
    const progressBar = document.getElementById('intro-progress');
    const accessText = document.getElementById('access-granted');

    const lines = [
        "Initializing secure connection...",
        "Bypassing firewalls...",
        "Accessing DOJ Epstein Library...",
        "Decrypting corpus (3.5 million pages)...",
        "Processing 180,000 images...",
        "Indexing 2,000+ videos...",
        "Analyzing metadata...",
        "Verifying clearance..."
    ];

    let lineIndex = 0;
    let charIndex = 0;

    function typeLine() {
        if (lineIndex >= lines.length) {
            finishIntro();
            return;
        }

        const currentLine = lines[lineIndex];

        if (charIndex < currentLine.length) {
            terminal.textContent += currentLine.charAt(charIndex);
            charIndex++;
            setTimeout(typeLine, Math.random() * 30 + 10);
        } else {
            terminal.textContent += '\n';
            lineIndex++;
            charIndex = 0;
            // Update progress bar
            const progress = (lineIndex / lines.length) * 100;
            if (progressBar) progressBar.style.width = `${progress}%`;

            setTimeout(typeLine, 200);
        }

        // Auto scroll terminal
        terminal.scrollTop = terminal.scrollHeight;
    }

    function finishIntro() {
        if (progressBar) progressBar.style.width = '100%';

        setTimeout(() => {
            if (accessText) accessText.classList.add('visible');

            setTimeout(() => {
                overlay.classList.add('hidden');
                sessionStorage.setItem('introSeen', 'true');

                // Allow scrolling again (if we locked it)
                document.body.style.overflow = '';

                // Remove from DOM after transition
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 1000);
            }, 1000);
        }, 500);
    }

    // Start
    document.body.style.overflow = 'hidden';
    setTimeout(typeLine, 500);
}

// ===========================================
// Initialization
// ===========================================

/**
 * Initialize the application
 */
async function init() {
    console.log('OWL Analysis System v2.0 initializing...');

    // Intro Sequence
    initIntroSequence();

    // Initialize theme
    initTheme();

    // Setup navigation
    setupNavigation();

    // Setup event listeners
    setupEventListeners();

    // Load data
    await loadData();

    console.log('OWL Analysis System initialized successfully');
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export functions for global access
window.OWL = {
    openModal,
    closeModal,
    toggleTheme,
    resetNetwork
};
