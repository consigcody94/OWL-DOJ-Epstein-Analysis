/**
 * Command Palette - Global search overlay (Cmd+K / Ctrl+K)
 * Tony Stark JARVIS-style interface
 */

class CommandPalette {
    constructor() {
        this.isOpen = false;
        this.selectedIndex = 0;
        this.results = [];
        this.searchIndex = [];
        this.createPalette();
        this.bindEvents();
        this.buildSearchIndex();
    }

    createPalette() {
        const palette = document.createElement('div');
        palette.id = 'command-palette';
        palette.className = 'command-palette';
        palette.innerHTML = `
            <div class="command-palette-backdrop"></div>
            <div class="command-palette-container">
                <div class="command-search">
                    <span class="command-icon">⌘</span>
                    <input 
                        type="text" 
                        class="command-input" 
                        placeholder="Search persons, documents, statutes, evidence..."
                        autocomplete="off"
                        spellcheck="false"
                    >
                    <span class="command-hint">ESC to close</span>
                </div>
                <div class="command-results"></div>
                <div class="command-footer">
                    <div class="command-shortcuts">
                        <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
                        <span><kbd>↵</kbd> Select</span>
                        <span><kbd>ESC</kbd> Close</span>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(palette);
        this.palette = palette;
        this.input = palette.querySelector('.command-input');
        this.resultsContainer = palette.querySelector('.command-results');
    }

    bindEvents() {
        // Keyboard shortcut: Cmd+K / Ctrl+K
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this.toggle();
            }

            // Also support just "/" like GitHub
            if (e.key === '/' && !this.isOpen && document.activeElement.tagName !== 'INPUT') {
                e.preventDefault();
                this.open();
            }

            if (!this.isOpen) return;

            // Escape to close
            if (e.key === 'Escape') {
                e.preventDefault();
                this.close();
            }

            // Arrow navigation
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.selectNext();
            }

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.selectPrevious();
            }

            // Enter to select
            if (e.key === 'Enter') {
                e.preventDefault();
                this.selectCurrent();
            }
        });

        // Search input
        this.input.addEventListener('input', (e) => {
            this.search(e.target.value);
        });

        // Click backdrop to close
        this.palette.querySelector('.command-palette-backdrop').addEventListener('click', () => {
            this.close();
        });
    }

    buildSearchIndex() {
        this.searchIndex = [];

        // Index persons
        if (state.persons) {
            state.persons.forEach(person => {
                this.searchIndex.push({
                    type: 'person',
                    icon: '👤',
                    title: person.name,
                    subtitle: person.role,
                    data: person,
                    searchText: `${person.name} ${person.role} ${person.tags?.join(' ') || ''}`.toLowerCase()
                });
            });
        }

        // Index statutes (common references)
        const statutes = [
            { ref: '18 U.S.C. § 1591', name: 'Sex Trafficking of Children' },
            { ref: '18 U.S.C. § 2423', name: 'Transportation of Minors' },
            { ref: '18 U.S.C. § 371', name: 'Conspiracy' },
            { ref: '18 U.S.C. § 2422', name: 'Enticement of Minor' },
            { ref: '18 U.S.C. § 1594', name: 'General Provisions (Trafficking)' },
            { ref: '18 U.S.C. § 2421', name: 'Transportation for Prostitution' }
        ];

        statutes.forEach(statute => {
            this.searchIndex.push({
                type: 'statute',
                icon: '⚖️',
                title: statute.ref,
                subtitle: statute.name,
                data: statute,
                searchText: `${statute.ref} ${statute.name}`.toLowerCase()
            });
        });

        // Index document types
        const documentTypes = [
            { name: 'Flight Records', count: 333 },
            { name: 'Phone Records', count: 'Various' },
            { name: 'Grand Jury Testimony', count: 'Multiple' },
            { name: 'Financial Records', count: 'Multiple' },
            { name: 'Physical Evidence', count: 'Various' }
        ];

        documentTypes.forEach(doc => {
            this.searchIndex.push({
                type: 'evidence',
                icon: '📁',
                title: doc.name,
                subtitle: `${doc.count} documents`,
                data: doc,
                searchText: doc.name.toLowerCase()
            });
        });
    }

    search(query) {
        this.selectedIndex = 0;

        if (!query.trim()) {
            this.results = [];
            this.renderResults();
            return;
        }

        const lowerQuery = query.toLowerCase();
        
        // Fuzzy search with scoring
        const scored = this.searchIndex.map(item => {
            let score = 0;
            
            // Exact match
            if (item.searchText.includes(lowerQuery)) {
                score = 100;
                if (item.searchText.startsWith(lowerQuery)) {
                    score = 150;
                }
            } else {
                // Word match
                const queryWords = lowerQuery.split(/\s+/);
                const textWords = item.searchText.split(/\s+/);
                
                queryWords.forEach(qWord => {
                    textWords.forEach(tWord => {
                        if (tWord.includes(qWord)) score += 10;
                        if (tWord.startsWith(qWord)) score += 20;
                    });
                });
            }

            return { ...item, score };
        });

        // Filter and sort by score
        this.results = scored
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        this.renderResults();
    }

    renderResults() {
        if (this.results.length === 0) {
            this.resultsContainer.innerHTML = `
                <div class="command-empty">
                    <div class="empty-icon">🔍</div>
                    <p>No results found</p>
                </div>
            `;
            return;
        }

        const html = this.results.map((result, index) => `
            <div class="command-result ${index === this.selectedIndex ? 'selected' : ''}" data-index="${index}">
                <span class="result-icon">${result.icon}</span>
                <div class="result-content">
                    <div class="result-title">${this.highlightMatch(result.title, this.input.value)}</div>
                    <div class="result-subtitle">${result.subtitle}</div>
                </div>
                <div class="result-type">${result.type}</div>
            </div>
        `).join('');

        this.resultsContainer.innerHTML = html;

        // Add click handlers
        this.resultsContainer.querySelectorAll('.command-result').forEach(el => {
            el.addEventListener('click', () => {
                this.selectedIndex = parseInt(el.dataset.index);
                this.selectCurrent();
            });
        });
    }

    highlightMatch(text, query) {
        if (!query) return text;
        
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    selectNext() {
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.results.length - 1);
        this.renderResults();
        this.scrollToSelected();
    }

    selectPrevious() {
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        this.renderResults();
        this.scrollToSelected();
    }

    scrollToSelected() {
        const selected = this.resultsContainer.querySelector('.command-result.selected');
        if (selected) {
            selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }

    selectCurrent() {
        if (this.results.length === 0) return;

        const result = this.results[this.selectedIndex];
        
        if (result.type === 'person') {
            this.close();
            // Open dossier
            if (window.dossierViewer) {
                window.dossierViewer.open(result.data);
            } else {
                // Fallback: scroll to person card
                const personCard = document.querySelector(`[data-person-id="${result.data.id}"]`);
                if (personCard) {
                    personCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    personCard.classList.add('highlight');
                    setTimeout(() => personCard.classList.remove('highlight'), 2000);
                }
            }
        } else if (result.type === 'statute') {
            this.close();
            // Open statute tooltip or link
            const url = `https://www.law.cornell.edu/uscode/text/18/${result.data.ref.match(/§ (\d+)/)[1]}`;
            window.open(url, '_blank');
        } else if (result.type === 'evidence') {
            this.close();
            // Scroll to evidence section
            const evidenceSection = document.getElementById('evidence');
            if (evidenceSection) {
                evidenceSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.isOpen = true;
        this.palette.classList.add('active');
        this.input.value = '';
        this.results = [];
        this.renderResults();
        this.input.focus();
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.isOpen = false;
        this.palette.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.commandPalette = new CommandPalette();
    });
} else {
    window.commandPalette = new CommandPalette();
}
