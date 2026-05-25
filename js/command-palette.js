/**
 * OWL Analysis System v4.0
 * Command Palette (Cmd/Ctrl + K)
 */

document.addEventListener('DOMContentLoaded', () => {
    initCommandPalette();
});

function initCommandPalette() {
    const palette = document.getElementById('commandPalette');
    const input = document.getElementById('commandInput');
    const results = document.getElementById('commandResults');
    
    if (!palette || !input || !results) {
        console.error('Command palette elements not found');
        return;
    }

    // Keyboard shortcuts: Cmd/Ctrl+K and '/' when not typing in a form field.
    document.addEventListener('keydown', (e) => {
        const isTyping = e.target.matches('input, textarea, select, [contenteditable="true"]');
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            toggleCommandPalette();
        } else if (!isTyping && e.key === '/') {
            e.preventDefault();
            openCommandPalette();
        }
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && palette.classList.contains('active')) {
            closeCommandPalette();
        }
    });

    // Close on background click
    palette.addEventListener('click', (e) => {
        if (e.target === palette) {
            closeCommandPalette();
        }
    });

    // Search on input
    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        searchCommands(query, results);
    });

    // Handle arrow keys and enter
    input.addEventListener('keydown', (e) => {
        const selected = results.querySelector('.command-result.selected');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = selected ? selected.nextElementSibling : results.firstElementChild;
            if (next) {
                if (selected) selected.classList.remove('selected');
                next.classList.add('selected');
                next.scrollIntoView({ block: 'nearest' });
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = selected ? selected.previousElementSibling : results.lastElementChild;
            if (prev) {
                if (selected) selected.classList.remove('selected');
                prev.classList.add('selected');
                prev.scrollIntoView({ block: 'nearest' });
            }
        } else if (e.key === 'Enter' && selected) {
            e.preventDefault();
            selected.click();
        }
    });
}

function openCommandPalette() {
    const palette = document.getElementById('commandPalette');
    const input = document.getElementById('commandInput');
    palette.classList.add('active');
    input.focus();
    input.value = '';
    searchCommands('', document.getElementById('commandResults'));
}

function toggleCommandPalette() {
    const palette = document.getElementById('commandPalette');
    if (palette.classList.contains('active')) {
        closeCommandPalette();
    } else {
        openCommandPalette();
    }
}

function closeCommandPalette() {
    const palette = document.getElementById('commandPalette');
    palette.classList.remove('active');
}

async function searchCommands(query, resultsContainer) {
    resultsContainer.innerHTML = '';
    
    // Get persons data from global state or fetch it
    let persons = window.state?.persons || [];
    
    if (persons.length === 0) {
        try {
            const response = await fetch('data/persons-database.json');
            const data = await response.json();
            persons = data.persons || [];
        } catch (error) {
            console.error('Error loading persons data:', error);
            return;
        }
    }

    const searchableItems = [
        ...persons.map(person => ({
            type: 'Person',
            title: person.name,
            description: `${person.role} • ${formatNumber(person.document_count)} documents`,
            text: `${person.name} ${person.role} ${(person.key_evidence || []).map(e => e.quote || '').join(' ')}`,
            action: () => openDossier(person.id)
        })),
        ...buildStaticSearchItems()
    ];

    const filtered = searchableItems.filter(item => {
        if (!query) return true;
        return item.text.toLowerCase().includes(query) ||
               item.title.toLowerCase().includes(query) ||
               item.description.toLowerCase().includes(query);
    }).slice(0, 14);

    if (filtered.length === 0) {
        resultsContainer.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No results found</div>';
        return;
    }

    filtered.forEach((item, index) => {
        const result = document.createElement('div');
        result.className = 'command-result';
        if (index === 0) result.classList.add('selected');
        
        result.innerHTML = `
            <div class="command-result-title"><span class="command-result-type">${commandEscape(item.type)}</span> ${commandEscape(item.title)}</div>
            <div class="command-result-description">${commandEscape(item.description)}</div>
        `;
        
        result.addEventListener('click', () => {
            closeCommandPalette();
            item.action();
        });
        
        resultsContainer.appendChild(result);
    });
}

function buildStaticSearchItems() {
    const sections = [
        ['Section', 'Official source dashboard', 'DOJ, FBI, Congress, redactions, confidence labels', '#source-dashboard'],
        ['Section', 'Analysis finding', 'Verdict, statutes, charges, legal analysis', '#verdict'],
        ['Section', 'Persons of interest', 'People, filters, dossiers, document counts', '#persons'],
        ['Section', 'Network graph', 'Relationship visualization with inference caution', '#network'],
        ['Section', 'Evidence vault', 'Flight, payment, testimony, physical evidence', '#evidence'],
        ['Section', 'Media briefing', 'YouTube transcripts, AP, CNN, ABC, release videos', '#media-briefing'],
        ['Section', 'Release timeline', 'DOJ library, House Oversight, FBI FOIA, AP updates', '#release-timeline']
    ];

    const officialSources = (window.state?.sourceIndex?.official_sources || []).map(source => ({
        type: 'Official Source',
        title: source.title,
        description: `${source.agency} • ${source.source_type}`,
        text: `${source.title} ${source.agency} ${source.source_type} ${source.summary}`,
        action: () => window.open(source.url, '_blank', 'noopener')
    }));

    const videos = (window.state?.videoIndex?.videos || []).map(video => ({
        type: 'Video',
        title: video.title,
        description: video.why_it_matters,
        text: `${video.title} ${video.why_it_matters}`,
        action: () => window.open(video.url, '_blank', 'noopener')
    }));

    return [
        ...sections.map(([type, title, description, hash]) => ({
            type,
            title,
            description,
            text: `${title} ${description}`,
            action: () => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
        })),
        ...officialSources,
        ...videos
    ];
}

function formatNumber(num) {
    if (num == null || isNaN(num)) return '0';
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1') + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
}

function commandEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Make functions globally available
window.openCommandPalette = openCommandPalette;
window.toggleCommandPalette = toggleCommandPalette;
window.closeCommandPalette = closeCommandPalette;
