/**
 * OWL Analysis System v4.0
 * Main Application Logic
 */

// ===========================================
// STATE MANAGEMENT
// ===========================================
const state = {
    persons: [],
    statistics: {},
    filteredPersons: [],
    currentFilter: 'all',
    searchQuery: '',
    networkData: null
};

// ===========================================
// ROLE COLOR MAPPING
// ===========================================
const ROLE_COLORS = {
    'principal': 'var(--red)',
    'defendant': 'var(--red)',
    'convicted': 'var(--purple)',
    'co-conspirator': 'var(--purple)',
    'associate': 'var(--cyan)',
    'mentioned': 'var(--cyan)',
    'defense': 'var(--blue)',
    'staff': 'var(--amber)',
    'employee': 'var(--amber)',
    'prosecutor': 'var(--green)',
    'political': 'var(--pink)'
};

// ===========================================
// INITIALIZATION
// ===========================================
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    renderHeroStats();
    renderPersons();
    renderTimeline();
    animateEvidenceBars();
    setupEventListeners();
    initializeNetwork();
});

// ===========================================
// DATA LOADING
// ===========================================
async function loadData() {
    try {
        // Load persons database
        const personsResponse = await fetch('data/persons-database.json');
        const personsData = await personsResponse.json();
        state.persons = personsData.persons || [];
        state.filteredPersons = [...state.persons];

        // Load statistics
        const statsResponse = await fetch('data/statistics.json');
        state.statistics = await statsResponse.json();

        console.log(`Loaded ${state.persons.length} persons`);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// ===========================================
// HERO STATS RENDERING
// ===========================================
function renderHeroStats() {
    const statElements = document.querySelectorAll('.hero-stat-value');
    
    statElements.forEach(el => {
        const target = parseInt(el.getAttribute('data-target'));
        animateCounter(el, target);
    });
}

function animateCounter(element, target) {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = formatNumber(Math.floor(current));
    }, duration / steps);
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
}

// ===========================================
// EVIDENCE BARS ANIMATION
// ===========================================
function animateEvidenceBars() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bar = entry.target;
                const width = bar.getAttribute('data-width');
                bar.style.width = width + '%';
                observer.unobserve(bar);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.evidence-bar-fill').forEach(bar => {
        observer.observe(bar);
    });
}

// ===========================================
// PERSONS RENDERING
// ===========================================
function renderPersons() {
    const grid = document.getElementById('personsGrid');
    if (!grid) return;

    grid.innerHTML = '';

    // Update person count
    const countEl = document.getElementById('personCount');
    if (countEl) {
        countEl.textContent = state.filteredPersons.length;
    }

    state.filteredPersons.forEach(person => {
        const card = createPersonCard(person);
        grid.appendChild(card);
    });
}

function createPersonCard(person) {
    const isFeatured = person.id === 'epstein' || person.id === 'maxwell';
    const card = document.createElement('div');
    card.className = `person-card ${isFeatured ? 'featured' : ''}`;
    card.setAttribute('data-role', getRoleCategory(person.role));
    card.setAttribute('data-id', person.id);
    
    if (isFeatured) {
        card.innerHTML = `
            <img class="person-photo" src="${person.photo || ''}" alt="${person.name}" 
                 onerror="this.outerHTML='<div class=&quot;person-photo no-photo&quot;>👤</div>'">
            <div class="person-info">
                <h3 class="person-name">${person.name}</h3>
                <div class="person-role">${person.role}</div>
                <div class="person-badges">
                    ${getStatusBadge(person.status)}
                    ${person.sentence ? `<span class="badge" style="background: rgba(168, 85, 247, 0.2); color: var(--purple); border: 1px solid var(--purple);">${person.sentence}</span>` : ''}
                </div>
                <div class="doc-count">
                    <div class="doc-count-label">${formatNumber(person.document_count)} Documents</div>
                    <div class="doc-count-bar">
                        <div class="doc-count-fill" style="width: ${getDocCountPercentage(person.document_count)}%"></div>
                    </div>
                </div>
                ${person.key_evidence && person.key_evidence[0] ? `
                    <blockquote class="person-quote">"${person.key_evidence[0].quote}"</blockquote>
                ` : ''}
                <a href="#" class="view-dossier" onclick="openDossier('${person.id}'); return false;">
                    View Dossier →
                </a>
            </div>
        `;
    } else {
        card.innerHTML = `
            <div class="person-header">
                <div class="person-photo-wrapper">
                    <img class="person-photo" src="${person.photo || ''}" alt="${person.name}" 
                         onerror="this.outerHTML='<div class=&quot;person-photo no-photo&quot;>👤</div>'">
                </div>
                <div class="person-details">
                    <h3 class="person-name">${person.name}</h3>
                    <div class="person-role">${person.role}</div>
                    <div class="person-badges">
                        ${getStatusBadge(person.status)}
                    </div>
                </div>
            </div>
            <div class="doc-count">
                <div class="doc-count-label">${formatNumber(person.document_count)} Documents</div>
                <div class="doc-count-bar">
                    <div class="doc-count-fill" style="width: ${getDocCountPercentage(person.document_count)}%"></div>
                </div>
            </div>
            ${person.key_evidence && person.key_evidence[0] ? `
                <blockquote class="person-quote">"${person.key_evidence[0].quote}"</blockquote>
            ` : person['2026_revelations'] && person['2026_revelations'][0] ? `
                <div class="person-quote">${person['2026_revelations'][0]}</div>
            ` : ''}
            <a href="#" class="view-dossier" onclick="openDossier('${person.id}'); return false;">
                View Dossier →
            </a>
        `;
    }

    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('view-dossier')) {
            openDossier(person.id);
        }
    });

    return card;
}

function getRoleCategory(role) {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('principal') || roleLower.includes('defendant')) return 'principal';
    if (roleLower.includes('convicted') || roleLower.includes('co-conspirator')) return 'convicted';
    if (roleLower.includes('defense') || roleLower.includes('attorney')) return 'defense';
    if (roleLower.includes('staff') || roleLower.includes('employee') || roleLower.includes('assistant')) return 'staff';
    if (roleLower.includes('prosecutor')) return 'prosecutor';
    if (roleLower.includes('political') || roleLower.includes('minister') || roleLower.includes('president')) return 'political';
    return 'associate';
}

function getStatusBadge(status) {
    const statusLower = status.toLowerCase();
    if (status === 'Deceased?') {
        return '<span class="badge badge-deceased">Deceased?</span>';
    } else if (statusLower.includes('deceased')) {
        return '<span class="badge badge-deceased">Deceased</span>';
    } else if (statusLower.includes('incarcerated')) {
        return '<span class="badge badge-incarcerated">Incarcerated</span>';
    } else {
        return '<span class="badge badge-living">Living</span>';
    }
}

function getDocCountPercentage(count) {
    const maxCount = Math.max(...state.persons.map(p => p.document_count));
    return Math.min((count / maxCount) * 100, 100);
}

// ===========================================
// FILTERING & SEARCH
// ===========================================
function filterPersons(category) {
    state.currentFilter = category;
    
    if (category === 'all') {
        state.filteredPersons = [...state.persons];
    } else {
        state.filteredPersons = state.persons.filter(person => {
            const roleCategory = getRoleCategory(person.role);
            const tags = person.tags || [];
            
            return roleCategory === category || tags.includes(category);
        });
    }
    
    applySearch();
}

function applySearch() {
    // First apply category filter
    if (state.currentFilter === 'all') {
        state.filteredPersons = [...state.persons];
    } else {
        state.filteredPersons = state.persons.filter(person => {
            const roleCategory = getRoleCategory(person.role);
            const tags = person.tags || [];
            return roleCategory === state.currentFilter || tags.includes(state.currentFilter);
        });
    }

    // Then apply search query
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        state.filteredPersons = state.filteredPersons.filter(person => {
            return person.name.toLowerCase().includes(query) ||
                   (person.role && person.role.toLowerCase().includes(query)) ||
                   (person.key_evidence && person.key_evidence.some(e => e.quote && e.quote.toLowerCase().includes(query))) ||
                   (person['2026_revelations'] && person['2026_revelations'].some(r => r.toLowerCase().includes(query)));
        });
    }

    renderPersons();
}

// ===========================================
// TIMELINE RENDERING
// ===========================================
function renderTimeline() {
    const container = document.getElementById('timelineContent');
    if (!container) return;

    const events = [
        { year: '1994', title: 'Abuse Period Begins', description: 'Pattern of trafficking minors starts', type: 'event' },
        { year: '2001-2006', title: 'Peak Activity', description: 'Highest documented flight activity and abuse', type: 'event' },
        { year: '2005-03', title: 'First Police Report', description: 'Palm Beach Police receive complaint', type: 'event' },
        { year: '2006', title: 'First Arrest', description: 'Epstein arrested in Florida', type: 'arrest' },
        { year: '2007-09-24', title: 'NPA Signed', description: 'Non-Prosecution Agreement finalized', type: 'event' },
        { year: '2008-06', title: 'State Plea Deal', description: '13-month sentence, work release', type: 'conviction' },
        { year: '2019-02', title: 'Judge Marra Ruling', description: 'NPA violated Crime Victims\' Rights Act', type: 'event' },
        { year: '2019-07-06', title: 'SDNY Arrest', description: 'Arrested on federal sex trafficking charges', type: 'arrest' },
        { year: '2019-08-10', title: 'Death in Custody', description: 'Found dead in MCC New York', type: 'death' },
        { year: '2020-07-02', title: 'Maxwell Arrested', description: 'Ghislaine Maxwell arrested in New Hampshire', type: 'arrest' },
        { year: '2021-12-29', title: 'Maxwell Convicted', description: 'Guilty on 5 of 6 counts, 20 year sentence', type: 'conviction' },
        { year: '2025-11-19', title: 'Transparency Act Signed', description: 'Epstein Files Transparency Act becomes law', type: 'event' },
        { year: '2026-01-30', title: 'Final DOJ Release', description: '3.5M pages released to public', type: 'event' }
    ];

    container.innerHTML = '';

    events.forEach((event, index) => {
        const eventEl = document.createElement('div');
        eventEl.className = `timeline-event ${event.type}`;
        
        eventEl.innerHTML = `
            <div class="timeline-marker"></div>
            <div class="timeline-card">
                <div class="timeline-year">${event.year}</div>
                <div class="timeline-title">${event.title}</div>
                <div class="timeline-description">${event.description}</div>
            </div>
        `;
        
        container.appendChild(eventEl);
    });
}

// ===========================================
// EVENT LISTENERS
// ===========================================
function setupEventListeners() {
    // Filter tabs
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active state
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Apply filter
            const filter = tab.getAttribute('data-filter');
            filterPersons(filter);
        });
    });

    // Search input
    const searchInput = document.getElementById('personSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            applySearch();
        });
    }

    // Dossier close button
    const dossierClose = document.getElementById('dossierClose');
    if (dossierClose) {
        dossierClose.addEventListener('click', closeDossier);
    }

    // Close dossier on overlay click
    const dossierOverlay = document.getElementById('dossierOverlay');
    if (dossierOverlay) {
        dossierOverlay.addEventListener('click', (e) => {
            if (e.target === dossierOverlay) {
                closeDossier();
            }
        });
    }

    // Dossier tabs
    const dossierTabs = document.querySelectorAll('.dossier-tab');
    dossierTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            switchDossierTab(tabName);
        });
    });

    // ESC key to close dossier
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDossier();
            closeCommandPalette();
            closeGlossary();
        }
    });

    // Cmd/Ctrl + K for command palette
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            openCommandPalette();
        }
    });

    // G key for glossary
    document.addEventListener('keydown', (e) => {
        if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.target.matches('input, textarea')) {
            toggleGlossary();
        }
    });
}

// ===========================================
// DOSSIER FUNCTIONS
// ===========================================
function openDossier(personId) {
    const person = state.persons.find(p => p.id === personId);
    if (!person) return;

    const overlay = document.getElementById('dossierOverlay');
    const photo = document.getElementById('dossierPhoto');
    const name = document.getElementById('dossierName');
    const role = document.getElementById('dossierRole');
    const badges = document.getElementById('dossierBadges');

    // Set photo
    if (person.photo) {
        photo.src = person.photo;
        photo.classList.remove('no-photo');
        photo.onerror = () => {
            photo.outerHTML = '<div id="dossierPhoto" class="dossier-photo no-photo">👤</div>';
        };
    } else {
        photo.outerHTML = '<div id="dossierPhoto" class="dossier-photo no-photo">👤</div>';
    }

    // Set name and role
    name.textContent = person.name;
    role.textContent = person.role;

    // Set badges
    badges.innerHTML = getStatusBadge(person.status);

    // Populate overview panel
    populateDossierOverview(person);

    // Show overlay
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDossier() {
    const overlay = document.getElementById('dossierOverlay');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

function switchDossierTab(tabName) {
    // Update tab active states
    document.querySelectorAll('.dossier-tab').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
    });

    // Update panel active states
    document.querySelectorAll('.dossier-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    const panel = document.getElementById(`dossier${capitalize(tabName)}Panel`);
    if (panel) {
        panel.classList.add('active');
    }
}

function populateDossierOverview(person) {
    const panel = document.getElementById('dossierOverviewPanel');
    if (!panel) return;

    let html = '<div style="display: flex; flex-direction: column; gap: 1.5rem;">';

    // Document count
    html += `
        <div>
            <h3 style="color: var(--cyan); margin-bottom: 0.5rem;">Document References</h3>
            <p style="font-size: 2rem; font-weight: 700;">${formatNumber(person.document_count)}</p>
        </div>
    `;

    // Charges (if any)
    if (person.charges && person.charges.length > 0) {
        html += `
            <div>
                <h3 style="color: var(--cyan); margin-bottom: 0.5rem;">Charges</h3>
                <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.5rem;">
                    ${person.charges.map(charge => `<li style="padding-left: 1rem; border-left: 2px solid var(--red);">${charge}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    // Key Evidence
    if (person.key_evidence && person.key_evidence.length > 0) {
        html += `
            <div>
                <h3 style="color: var(--cyan); margin-bottom: 0.5rem;">Key Evidence</h3>
                ${person.key_evidence.map(evidence => `
                    <blockquote style="margin: 1rem 0; padding: 1rem; background: rgba(6, 182, 212, 0.1); border-left: 3px solid var(--cyan); border-radius: 8px;">
                        <p style="font-style: italic; margin-bottom: 0.5rem;">"${evidence.quote}"</p>
                        <cite style="font-size: 0.875rem; color: var(--text-secondary);">${evidence.source}</cite>
                    </blockquote>
                `).join('')}
            </div>
        `;
    }

    // 2026 Revelations
    if (person['2026_revelations'] && person['2026_revelations'].length > 0) {
        html += `
            <div>
                <h3 style="color: var(--cyan); margin-bottom: 0.5rem;">2026 Revelations</h3>
                <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.5rem;">
                    ${person['2026_revelations'].map(rev => `
                        <li style="padding: 0.75rem; background: rgba(245, 158, 11, 0.1); border-left: 3px solid var(--amber); border-radius: 8px;">
                            ${rev}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    html += '</div>';
    panel.innerHTML = html;
}

// ===========================================
// COMMAND PALETTE
// ===========================================
function openCommandPalette() {
    const palette = document.getElementById('commandPalette');
    const input = document.getElementById('commandInput');
    
    palette.classList.add('active');
    input.focus();
    input.value = '';
}

function closeCommandPalette() {
    const palette = document.getElementById('commandPalette');
    palette.classList.remove('active');
}

// ===========================================
// GLOSSARY
// ===========================================
function toggleGlossary() {
    const panel = document.getElementById('glossaryPanel');
    panel.classList.toggle('active');
}

function closeGlossary() {
    const panel = document.getElementById('glossaryPanel');
    panel.classList.remove('active');
}

// ===========================================
// NETWORK VISUALIZATION
// ===========================================
function initializeNetwork() {
    // Network is initialized by network.js
    // Make persons data available globally for network.js
    if (window.state) {
        window.state.persons = state.persons;
    }
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ===========================================
// GLOBAL FUNCTIONS (for inline event handlers)
// ===========================================
window.openDossier = openDossier;
window.closeDossier = closeDossier;
window.openCommandPalette = openCommandPalette;
window.closeCommandPalette = closeCommandPalette;
window.toggleGlossary = toggleGlossary;
