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

    // Keyboard shortcut (Cmd/Ctrl + K)
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            toggleCommandPalette();
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

function toggleCommandPalette() {
    const palette = document.getElementById('commandPalette');
    const input = document.getElementById('commandInput');
    
    if (palette.classList.contains('active')) {
        closeCommandPalette();
    } else {
        palette.classList.add('active');
        input.focus();
        input.value = '';
        searchCommands('', document.getElementById('commandResults'));
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

    // Filter persons by query
    const filtered = persons.filter(person => {
        if (!query) return true; // Show all if no query
        
        const name = person.name.toLowerCase();
        const role = person.role.toLowerCase();
        const evidence = person.key_evidence?.map(e => e.quote.toLowerCase()).join(' ') || '';
        
        return name.includes(query) || role.includes(query) || evidence.includes(query);
    }).slice(0, 10); // Limit to 10 results

    if (filtered.length === 0) {
        resultsContainer.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No results found</div>';
        return;
    }

    filtered.forEach((person, index) => {
        const result = document.createElement('div');
        result.className = 'command-result';
        if (index === 0) result.classList.add('selected');
        
        result.innerHTML = `
            <div class="command-result-title">${person.name}</div>
            <div class="command-result-description">${person.role} • ${formatNumber(person.document_count)} documents</div>
        `;
        
        result.addEventListener('click', () => {
            closeCommandPalette();
            openDossier(person.id);
        });
        
        resultsContainer.appendChild(result);
    });
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
}

// Make functions globally available
window.toggleCommandPalette = toggleCommandPalette;
window.closeCommandPalette = closeCommandPalette;
