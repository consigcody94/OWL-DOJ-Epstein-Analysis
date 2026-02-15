/**
 * Statute Library & Glossary
 * Tooltips for legal references and terminology
 */

class GlossarySystem {
    constructor() {
        this.statutes = {
            '18 U.S.C. § 1591': {
                title: 'Sex Trafficking of Children',
                description: 'Prohibits recruiting, enticing, harboring, transporting, providing, obtaining, advertising, maintaining, patronizing, or soliciting a person under 18 for commercial sex.',
                url: 'https://www.law.cornell.edu/uscode/text/18/1591'
            },
            '18 U.S.C. § 2423': {
                title: 'Transportation of Minors',
                description: 'Makes it illegal to transport a minor across state lines or internationally for illegal sexual activity.',
                url: 'https://www.law.cornell.edu/uscode/text/18/2423'
            },
            '18 U.S.C. § 371': {
                title: 'Conspiracy',
                description: 'Prohibits conspiring to commit any offense against or defraud the United States.',
                url: 'https://www.law.cornell.edu/uscode/text/18/371'
            },
            '18 U.S.C. § 2422': {
                title: 'Enticement of Minor',
                description: 'Prohibits using mail, interstate commerce, or foreign commerce to persuade, induce, entice, or coerce a minor to engage in illegal sexual activity.',
                url: 'https://www.law.cornell.edu/uscode/text/18/2422'
            },
            '18 U.S.C. § 1594': {
                title: 'General Provisions (Trafficking)',
                description: 'Provides for restitution, forfeiture, and other general provisions related to trafficking offenses.',
                url: 'https://www.law.cornell.edu/uscode/text/18/1594'
            },
            '18 U.S.C. § 2421': {
                title: 'Transportation for Prostitution',
                description: 'Prohibits knowingly transporting individuals in interstate or foreign commerce for prostitution or illegal sexual activity.',
                url: 'https://www.law.cornell.edu/uscode/text/18/2421'
            }
        };

        this.glossary = {
            'NPA': 'Non-Prosecution Agreement - Agreement not to prosecute in exchange for conditions',
            'CVRA': 'Crime Victims\' Rights Act - Federal law protecting rights of crime victims',
            'SDFL': 'Southern District of Florida - Federal district court',
            'SDNY': 'Southern District of New York - Federal district court',
            'USAO': 'United States Attorney\'s Office',
            'FBI': 'Federal Bureau of Investigation',
            'DOJ': 'Department of Justice',
            'EFTA': 'Epstein Files Transparency Act - 2025 law requiring full DOJ disclosure',
            'MCC': 'Metropolitan Correctional Center - Federal detention facility in Manhattan'
        };

        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupTooltips();
                this.createGlossaryPanel();
            });
        } else {
            this.setupTooltips();
            this.createGlossaryPanel();
        }
    }

    setupTooltips() {
        // Wait a bit for content to load
        setTimeout(() => {
            this.highlightStatutes();
            this.highlightTerms();
        }, 1000);
    }

    highlightStatutes() {
        const statutePattern = /18\s+U\.S\.C\.\s+§\s+\d+/g;
        
        // Find all text nodes
        this.walkTextNodes(document.body, (node) => {
            const text = node.textContent;
            const matches = text.match(statutePattern);
            
            if (matches) {
                const span = document.createElement('span');
                let html = text;
                
                matches.forEach(match => {
                    const normalized = match.replace(/\s+/g, ' ');
                    const statute = this.statutes[normalized];
                    
                    if (statute) {
                        html = html.replace(match, 
                            `<span class="statute-ref" data-statute="${normalized}">${match}</span>`
                        );
                    }
                });
                
                if (html !== text) {
                    span.innerHTML = html;
                    node.parentNode.replaceChild(span, node);
                }
            }
        });

        // Add hover events
        document.querySelectorAll('.statute-ref').forEach(el => {
            el.addEventListener('mouseenter', (e) => this.showStatuteTooltip(e));
            el.addEventListener('mouseleave', () => this.hideTooltip());
            el.style.cursor = 'help';
            el.style.borderBottom = '1px dotted var(--accent-cyan)';
            el.style.color = 'var(--accent-cyan)';
        });
    }

    highlightTerms() {
        const termPattern = new RegExp(`\\b(${Object.keys(this.glossary).join('|')})\\b`, 'g');
        
        this.walkTextNodes(document.body, (node) => {
            // Skip if already processed
            if (node.parentElement.classList.contains('glossary-term')) return;
            
            const text = node.textContent;
            const matches = text.match(termPattern);
            
            if (matches) {
                const span = document.createElement('span');
                let html = text;
                
                matches.forEach(match => {
                    if (this.glossary[match]) {
                        html = html.replace(new RegExp(`\\b${match}\\b`, 'g'), 
                            `<span class="glossary-term" data-term="${match}">${match}</span>`
                        );
                    }
                });
                
                if (html !== text) {
                    span.innerHTML = html;
                    node.parentNode.replaceChild(span, node);
                }
            }
        });

        // Add hover events
        document.querySelectorAll('.glossary-term').forEach(el => {
            el.addEventListener('mouseenter', (e) => this.showTermTooltip(e));
            el.addEventListener('mouseleave', () => this.hideTooltip());
            el.style.cursor = 'help';
            el.style.borderBottom = '1px dotted var(--accent-amber)';
        });
    }

    walkTextNodes(node, callback) {
        // Skip script, style, and already-processed nodes
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent.trim() && 
                !node.parentElement.closest('script, style, .statute-ref, .glossary-term')) {
                callback(node);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE && 
                   !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.tagName)) {
            for (let child of Array.from(node.childNodes)) {
                this.walkTextNodes(child, callback);
            }
        }
    }

    showStatuteTooltip(event) {
        const statuteRef = event.target.dataset.statute;
        const statute = this.statutes[statuteRef];
        
        if (!statute) return;

        const tooltip = this.createTooltip();
        tooltip.innerHTML = `
            <div class="tooltip-header">${statuteRef}</div>
            <div class="tooltip-title">${statute.title}</div>
            <div class="tooltip-description">${statute.description}</div>
            <a href="${statute.url}" target="_blank" class="tooltip-link">
                View on Cornell Law →
            </a>
        `;

        this.positionTooltip(tooltip, event.target);
    }

    showTermTooltip(event) {
        const term = event.target.dataset.term;
        const definition = this.glossary[term];
        
        if (!definition) return;

        const tooltip = this.createTooltip();
        tooltip.innerHTML = `
            <div class="tooltip-header">${term}</div>
            <div class="tooltip-description">${definition}</div>
        `;

        this.positionTooltip(tooltip, event.target);
    }

    createTooltip() {
        let tooltip = document.getElementById('glossary-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'glossary-tooltip';
            tooltip.className = 'glossary-tooltip';
            document.body.appendChild(tooltip);
        }
        tooltip.style.display = 'block';
        tooltip.style.opacity = '0';
        setTimeout(() => tooltip.style.opacity = '1', 10);
        return tooltip;
    }

    positionTooltip(tooltip, target) {
        const rect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let top = rect.bottom + window.scrollY + 8;
        let left = rect.left + window.scrollX + (rect.width / 2) - (tooltipRect.width / 2);
        
        // Keep on screen
        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }
        
        // If too close to bottom, show above
        if (rect.bottom + tooltipRect.height + 20 > window.innerHeight) {
            top = rect.top + window.scrollY - tooltipRect.height - 8;
        }
        
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
    }

    hideTooltip() {
        const tooltip = document.getElementById('glossary-tooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
            setTimeout(() => tooltip.style.display = 'none', 200);
        }
    }

    createGlossaryPanel() {
        const panel = document.createElement('div');
        panel.id = 'glossary-panel';
        panel.className = 'glossary-panel';
        panel.innerHTML = `
            <div class="glossary-panel-header">
                <h3>Legal Glossary</h3>
                <button class="glossary-close">×</button>
            </div>
            <div class="glossary-panel-content">
                <h4>Statutes</h4>
                ${Object.entries(this.statutes).map(([ref, statute]) => `
                    <div class="glossary-entry">
                        <div class="glossary-entry-term">${ref}</div>
                        <div class="glossary-entry-def">${statute.title}</div>
                        <a href="${statute.url}" target="_blank" class="glossary-link">Learn more →</a>
                    </div>
                `).join('')}
                
                <h4>Terms</h4>
                ${Object.entries(this.glossary).map(([term, def]) => `
                    <div class="glossary-entry">
                        <div class="glossary-entry-term">${term}</div>
                        <div class="glossary-entry-def">${def}</div>
                    </div>
                `).join('')}
            </div>
        `;
        document.body.appendChild(panel);

        // Toggle button in nav
        const nav = document.querySelector('.nav-links');
        if (nav) {
            const glossaryBtn = document.createElement('button');
            glossaryBtn.className = 'glossary-toggle-btn';
            glossaryBtn.textContent = '📖 Glossary';
            glossaryBtn.addEventListener('click', () => this.togglePanel());
            nav.appendChild(glossaryBtn);
        }

        // Close button
        panel.querySelector('.glossary-close').addEventListener('click', () => {
            this.togglePanel();
        });

        // Keyboard shortcut: G
        document.addEventListener('keydown', (e) => {
            if (e.key === 'g' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
                this.togglePanel();
            }
        });
    }

    togglePanel() {
        const panel = document.getElementById('glossary-panel');
        panel.classList.toggle('active');
    }
}

// Initialize
window.glossarySystem = new GlossarySystem();
