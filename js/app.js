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
    sourceIndex: {},
    videoIndex: {},
    filteredPersons: [],
    currentFilter: 'all',
    searchQuery: '',
    networkData: null
};

// Share state across modules (command palette, network, vault) without duplicate fetches.
window.state = state;

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
    renderSourceDashboard();
    renderVideoBriefing();
    renderReleaseTimeline();
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

        // Load current source / media indexes. These fail soft so the core explorer still runs.
        try {
            const sourceResponse = await fetch('data/source-index.json');
            state.sourceIndex = await sourceResponse.json();
        } catch (sourceError) {
            console.warn('Source index unavailable:', sourceError);
            state.sourceIndex = {};
        }

        try {
            const videoResponse = await fetch('data/video-index.json');
            state.videoIndex = await videoResponse.json();
        } catch (videoError) {
            console.warn('Video index unavailable:', videoError);
            state.videoIndex = {};
        }

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
    if (num == null || isNaN(num)) return '0';
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ===========================================
// SOURCE DASHBOARD / MEDIA BRIEFING
// ===========================================
function renderSourceDashboard() {
    const grid = document.getElementById('officialSourcesGrid');
    if (!grid) return;

    const sources = state.sourceIndex.official_sources || [];
    if (!sources.length) {
        grid.innerHTML = '<div class="loading-card">Source index unavailable.</div>';
        return;
    }

    grid.innerHTML = sources.map(source => `
        <article class="source-card">
            <div class="source-card-topline">
                <span class="source-agency">${escapeHtml(source.agency)}</span>
                <span class="confidence-pill">${escapeHtml(source.source_type)}</span>
            </div>
            <h3>${escapeHtml(source.title)}</h3>
            <p>${escapeHtml(source.summary)}</p>
            ${source.access_note ? `<p class="source-note">${escapeHtml(source.access_note)}</p>` : ''}
            <div class="source-meta">
                ${source.published ? `<span>Published: ${escapeHtml(source.published)}</span>` : ''}
                ${source.last_modified ? `<span>Modified: ${escapeHtml(source.last_modified)}</span>` : ''}
                ${source.last_checked ? `<span>Checked: ${escapeHtml(source.last_checked)}</span>` : ''}
            </div>
            <a class="source-link" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">Open source ↗</a>
        </article>
    `).join('');
}

function renderVideoBriefing() {
    const grid = document.getElementById('videoBriefingGrid');
    if (!grid) return;

    const videos = state.videoIndex.videos || [];
    if (!videos.length) {
        grid.innerHTML = '<div class="loading-card">Video briefing index unavailable.</div>';
        return;
    }

    grid.innerHTML = videos.map(video => `
        <article class="video-card">
            <div class="video-thumb" aria-hidden="true">▶</div>
            <div class="video-body">
                <span class="confidence-pill media-pill">${escapeHtml(video.source_type)}</span>
                <h3>${escapeHtml(video.title)}</h3>
                <p>${escapeHtml(video.why_it_matters)}</p>
                <div class="source-meta">
                    <span>Uploaded: ${escapeHtml(video.upload_date)}</span>
                    <span>Transcript: ${escapeHtml(video.transcript_path)}</span>
                </div>
                <a class="source-link" href="${escapeHtml(video.url)}" target="_blank" rel="noopener noreferrer">Watch / verify ↗</a>
            </div>
        </article>
    `).join('');
}

function renderReleaseTimeline() {
    const timeline = document.getElementById('releaseTimelineGrid');
    if (!timeline) return;

    const events = state.sourceIndex.release_timeline || [];
    if (!events.length) {
        timeline.innerHTML = '<div class="loading-card">Release timeline unavailable.</div>';
        return;
    }

    timeline.innerHTML = events.map(event => `
        <article class="release-event">
            <time datetime="${escapeHtml(event.date)}">${escapeHtml(event.date)}</time>
            <div>
                <h3>${escapeHtml(event.event)}</h3>
                <p>${escapeHtml(event.confidence)} · source: ${escapeHtml(event.source_id)}</p>
            </div>
        </article>
    `).join('');
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

    const safeId = escapeHtml(person.id);
    const safeName = escapeHtml(person.name);
    const safeRole = escapeHtml(person.role);
    const safePhoto = escapeHtml(person.photo || '');
    const firstEvidence = person.key_evidence?.[0]?.quote;
    const firstRevelation = person['2026_revelations']?.[0];
    const quoteHtml = firstEvidence
        ? `<blockquote class="person-quote">&ldquo;${escapeHtml(firstEvidence)}&rdquo;</blockquote>`
        : firstRevelation
            ? `<div class="person-quote">${escapeHtml(firstRevelation)}</div>`
            : '';
    const sourceLabel = getPersonSourceLabel(person);
    const cautionNote = getPersonCautionNote(person);
    const sourcePill = `<span class="badge source-confidence-badge">${escapeHtml(sourceLabel)}</span>`;
    const cautionHtml = cautionNote ? `<p class="person-source-note">${escapeHtml(cautionNote)}</p>` : '';

    if (isFeatured) {
        card.innerHTML = `
            <img class="person-photo" src="${safePhoto}" alt="${safeName}"
                 onerror="this.outerHTML='<div class=&quot;person-photo no-photo&quot;>👤</div>'">
            <div class="person-info">
                <h3 class="person-name">${safeName}</h3>
                <div class="person-role">${safeRole}</div>
                <div class="person-badges">
                    ${getStatusBadge(person.status)}
                    ${sourcePill}
                    ${person.sentence ? `<span class="badge sentence-badge">${escapeHtml(person.sentence)}</span>` : ''}
                </div>
                <div class="doc-count">
                    <div class="doc-count-label">${formatNumber(person.document_count)} Documents</div>
                    <div class="doc-count-bar">
                        <div class="doc-count-fill" style="width: ${getDocCountPercentage(person.document_count)}%"></div>
                    </div>
                </div>
                ${quoteHtml}
                ${cautionHtml}
                <a href="#" class="view-dossier" data-person-id="${safeId}">
                    View Dossier →
                </a>
            </div>
        `;
    } else {
        card.innerHTML = `
            <div class="person-header">
                <div class="person-photo-wrapper">
                    <img class="person-photo" src="${safePhoto}" alt="${safeName}"
                         onerror="this.outerHTML='<div class=&quot;person-photo no-photo&quot;>👤</div>'">
                </div>
                <div class="person-details">
                    <h3 class="person-name">${safeName}</h3>
                    <div class="person-role">${safeRole}</div>
                    <div class="person-badges">
                        ${getStatusBadge(person.status)}
                        ${sourcePill}
                    </div>
                </div>
            </div>
            <div class="doc-count">
                <div class="doc-count-label">${formatNumber(person.document_count)} Documents</div>
                <div class="doc-count-bar">
                    <div class="doc-count-fill" style="width: ${getDocCountPercentage(person.document_count)}%"></div>
                </div>
            </div>
            ${quoteHtml}
            ${cautionHtml}
            <a href="#" class="view-dossier" data-person-id="${safeId}">
                View Dossier →
            </a>
        `;
    }

    card.addEventListener('click', (e) => {
        const dossierLink = e.target.closest('.view-dossier');
        if (dossierLink) e.preventDefault();
        openDossier(person.id);
    });

    return card;
}

function getPersonSourceLabel(person) {
    const role = (person.role || '').toLowerCase();
    const status = (person.status || '').toLowerCase();
    if (person.id === 'epstein') return 'court / DOJ record';
    if (person.id === 'maxwell' || status.includes('incarcerated') || role.includes('convicted')) return 'court-proven conviction';
    if (role.includes('victim')) return 'privacy-protected record';
    if (role.includes('attorney') || role.includes('prosecutor') || role.includes('pilot') || role.includes('staff')) return 'documented role/context';
    return 'reported contact/context';
}

function getPersonCautionNote(person) {
    const status = (person.status || '').toLowerCase();
    const role = (person.role || '').toLowerCase();
    if (person.id === 'epstein' || person.id === 'maxwell') return '';
    if (status.includes('living') || status === '') {
        if (person.notes) return `Context note: ${person.notes} Contact, mention, or appearance in records is not proof of wrongdoing.`;
        return 'Presence in records, travel logs, correspondence, or reporting is not proof of wrongdoing. Review the dossier/source record before drawing conclusions.';
    }
    if (role.includes('defense') || role.includes('prosecutor')) {
        return 'Legal-system participant; listed for case context, not as an allegation of criminal conduct.';
    }
    return '';
}

function getRoleCategory(role) {
    if (!role) return 'associate';
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
    if (!status) return '<span class="badge badge-living">Unknown</span>';
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
    if (!count || count == null) return 0;
    if (!state.persons || state.persons.length === 0) return 0;
    const maxCount = Math.max(...state.persons.map(p => p.document_count || 0));
    if (!maxCount || maxCount === 0) return 0;
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
            return (person.name || '').toLowerCase().includes(query) ||
                   (person.role && person.role.toLowerCase().includes(query)) ||
                   (person.key_evidence && person.key_evidence.some(e => e.quote && e.quote.toLowerCase().includes(query))) ||
                   (person['2026_revelations'] && person['2026_revelations'].some(r => r && r.toLowerCase().includes(query)));
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
        { year: '1994', title: 'Enterprise Established', description: 'Maxwell involvement begins. Initial grooming and abuse activities. New York and Palm Beach operations established.', type: 'event' },
        { year: '2001–2006', title: 'Peak Activity Period', description: 'Highest volume of documented abuse. Multiple victims per month. Systematic scheduling across all properties. Flight logs show hundreds of trips.', type: 'event' },
        { year: 'Mar 2005', title: 'First Police Report', description: 'Palm Beach Police Department receives complaint from victim\'s mother. Investigation begins.', type: 'event' },
        { year: 'Oct 2005', title: 'Search Warrant Executed', description: '358 El Brillo Way searched. Massage equipment, photographs, and contact books seized.', type: 'arrest' },
        { year: 'May 2007', title: 'Grand Jury Testimony', description: 'FBI agent testifies. "Younger, the better" statement documented. 53+ count indictment drafted but never filed.', type: 'event' },
        { year: 'Sep 24, 2007', title: 'Non-Prosecution Agreement Signed', description: 'Federal charges declined in exchange for state guilty plea. Victims not notified — a violation of the Crime Victims\' Rights Act.', type: 'death' },
        { year: 'Jun 2008', title: 'State Plea Deal', description: 'Pleads to state prostitution charges. 18-month sentence with work release. Serves only 13 months.', type: 'conviction' },
        { year: 'Nov 2018', title: 'Miami Herald Investigation', description: 'Julie K. Brown\'s "Perversion of Justice" series exposes NPA terms and scope of abuse. Public outcry intensifies.', type: 'event' },
        { year: 'Feb 2019', title: 'Judge Marra Ruling', description: 'Federal judge rules government violated Crime Victims\' Rights Act in NPA process.', type: 'event' },
        { year: 'Jul 6, 2019', title: 'SDNY Arrest', description: 'Arrested at Teterboro Airport on federal sex trafficking charges. "Vast trove" of photos and CDs found in Manhattan townhouse.', type: 'arrest' },
        { year: 'Aug 10, 2019', title: 'Death in Custody', description: 'Found dead at Metropolitan Correctional Center. Official ruling: suicide. Both cameras outside cell malfunctioned. Guards falsified logs.', type: 'death' },
        { year: 'Jul 2, 2020', title: 'Maxwell Arrested', description: 'Ghislaine Maxwell arrested in Bradford, New Hampshire after months in hiding.', type: 'arrest' },
        { year: 'Dec 29, 2021', title: 'Maxwell Convicted', description: 'Guilty on 5 of 6 federal counts including sex trafficking of a minor. Sentenced to 20 years.', type: 'conviction' },
        { year: 'Nov 19, 2025', title: 'Transparency Act Signed', description: 'Epstein Files Transparency Act becomes law, mandating release of all DOJ documents within 90 days.', type: 'event' },
        { year: 'Dec–Jan 2026', title: 'DOJ Document Releases', description: '5 waves of releases: Dec 19, 20, 22, 23, and final release Jan 30. Total: 3.5 million pages, 180,000 images, 2,000+ videos.', type: 'event' },
        { year: 'Feb 2026', title: '6 Names Unredacted', description: 'Congressional pressure forces unredaction of 6 previously hidden names. FBI labels Wexner "co-conspirator." Bin Sulayem resigns from DP World.', type: 'arrest' },
        { year: 'Feb 18, 2026', title: 'Wexner Deposition', description: 'Leslie Wexner deposed. FBI labeled him co-conspirator at least 4 times. Gave Epstein power of attorney and $77M NYC townhouse.', type: 'arrest' }
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


    // Accordion cards
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const card = header.closest('.accordion-card');
            const isActive = card.classList.contains('active');
            
            // Close all other accordions in the same section
            const section = card.closest('.secret-societies-grid, .coded-terms-grid');
            if (section) {
                section.querySelectorAll('.accordion-card.active').forEach(activeCard => {
                    if (activeCard !== card) {
                        activeCard.classList.remove('active');
                        const icon = activeCard.querySelector('.accordion-icon');
                        if (icon) icon.textContent = '+';
                    }
                });
            }
            
            // Toggle current accordion
            card.classList.toggle('active');
            const icon = header.querySelector('.accordion-icon');
            if (icon) {
                icon.textContent = isActive ? '+' : '−';
            }
        });
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
        photo.alt = person.name || 'Person dossier photo';
        photo.classList.remove('no-photo');
        photo.onerror = () => {
            photo.outerHTML = '<div id="dossierPhoto" class="dossier-photo no-photo">👤</div>';
        };
    } else {
        photo.outerHTML = '<div id="dossierPhoto" class="dossier-photo no-photo">👤</div>';
    }

    // Set name and role
    name.textContent = person.name || '';
    role.textContent = person.role || '';

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

    // Document count and source posture
    html += `
        <div>
            <h3 style="color: var(--cyan); margin-bottom: 0.5rem;">Document References</h3>
            <p style="font-size: 2rem; font-weight: 700;">${formatNumber(person.document_count)}</p>
            <p class="dossier-source-note"><strong>Source posture:</strong> ${escapeHtml(getPersonSourceLabel(person))}. ${escapeHtml(getPersonCautionNote(person) || 'Primary allegations are tied to court/DOJ records where available; inferences remain labelled.')}</p>
        </div>
    `;

    // Charges (if any)
    if (person.charges && person.charges.length > 0) {
        html += `
            <div>
                <h3 style="color: var(--cyan); margin-bottom: 0.5rem;">Charges</h3>
                <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.5rem;">
                    ${person.charges.map(charge => `<li style="padding-left: 1rem; border-left: 2px solid var(--red);">${escapeHtml(charge)}</li>`).join('')}
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
                        <p style="font-style: italic; margin-bottom: 0.5rem;">&ldquo;${escapeHtml(evidence.quote)}&rdquo;</p>
                        <cite style="font-size: 0.875rem; color: var(--text-secondary);">${escapeHtml(evidence.source)}</cite>
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
                            ${escapeHtml(rev)}
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
// SUB-ACCORDION TOGGLE
// ===========================================
function toggleSubAccordion(header) {
    const body = header.nextElementSibling;
    const icon = header.querySelector('.sub-accordion-icon');
    const isOpen = body.classList.contains('active');
    
    if (isOpen) {
        body.classList.remove('active');
        icon.textContent = '▼';
    } else {
        body.classList.add('active');
        icon.textContent = '▲';
    }
}

// ===========================================
// GLOBAL FUNCTIONS (for inline event handlers)
// ===========================================
window.openDossier = openDossier;
window.closeDossier = closeDossier;
window.openCommandPalette = openCommandPalette;
window.closeCommandPalette = closeCommandPalette;
window.toggleGlossary = toggleGlossary;
window.toggleSubAccordion = toggleSubAccordion;
