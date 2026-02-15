/**
 * Evidence Vault - Classified file cards with redaction animation
 * Tony Stark investigation room aesthetic
 */

class EvidenceVault {
    constructor() {
        this.categories = [
            {
                id: 'flight',
                name: 'Flight Records',
                icon: '✈️',
                count: 333,
                color: '#3b82f6',
                documents: [
                    {
                        title: 'Flight Logs N908JE (Boeing 727)',
                        date: '1997-2006',
                        excerpt: 'Detailed passenger manifests showing interstate transport of minors between Palm Beach, New York, New Mexico, and USVI properties.',
                        classification: 'TOP SECRET'
                    },
                    {
                        title: 'Flight Logs N909JE (Gulfstream IV)',
                        date: '2001-2005',
                        excerpt: 'Passenger lists documenting transport of victims and associates across state lines.',
                        classification: 'SECRET'
                    },
                    {
                        title: 'Aircraft Ownership Records',
                        date: '1995-2019',
                        excerpt: 'Shell company registrations: JEGE Inc., Hyperion Air Inc., Hyperion Air LLC.',
                        classification: 'CONFIDENTIAL'
                    }
                ]
            },
            {
                id: 'phone',
                name: 'Phone Records',
                icon: '📞',
                count: 'Multiple',
                color: '#f59e0b',
                documents: [
                    {
                        title: 'Message Pads - Palm Beach',
                        date: '2004-2005',
                        excerpt: 'Scheduling records showing systematic recruitment and abuse patterns. Names, ages, and contact information for victims.',
                        classification: 'TOP SECRET'
                    },
                    {
                        title: 'Contact Books',
                        date: 'Various',
                        excerpt: 'Address books seized from properties containing hundreds of contacts including minors, associates, and co-conspirators.',
                        classification: 'SECRET'
                    }
                ]
            },
            {
                id: 'testimony',
                name: 'Testimony',
                icon: '📝',
                count: 'Multiple',
                color: '#10b981',
                documents: [
                    {
                        title: 'Grand Jury Testimony (EFTA00009550)',
                        date: 'May 2007',
                        excerpt: 'FBI agent testimony: "She told us that Mr. Epstein said to her on one occasion, \'The younger, the better.\'"',
                        classification: 'TOP SECRET'
                    },
                    {
                        title: 'Victim Statements',
                        date: '2005-2019',
                        excerpt: 'Multiple victim testimonies documenting systematic abuse, recruitment patterns, and interstate transport.',
                        classification: 'TOP SECRET'
                    },
                    {
                        title: 'Staff Testimony',
                        date: '2005-2020',
                        excerpt: 'Statements from household staff, pilots, and assistants corroborating abuse patterns and operational details.',
                        classification: 'SECRET'
                    }
                ]
            },
            {
                id: 'financial',
                name: 'Financial',
                icon: '💰',
                count: 'Multiple',
                color: '#8b5cf6',
                documents: [
                    {
                        title: 'Payment Records',
                        date: '1999-2006',
                        excerpt: 'Cash payments to victims documented in financial records. Payments ranging from $200-$1,000 per incident.',
                        classification: 'SECRET'
                    },
                    {
                        title: 'Shell Company Filings',
                        date: '1995-2019',
                        excerpt: 'Corporate records for JEGE Inc., Hyperion Air, and other entities used to conceal assets and operations.',
                        classification: 'CONFIDENTIAL'
                    }
                ]
            },
            {
                id: 'physical',
                name: 'Physical Evidence',
                icon: '🔬',
                count: 'Various',
                color: '#ef4444',
                documents: [
                    {
                        title: 'Property Search - 358 El Brillo Way',
                        date: 'October 2005',
                        excerpt: 'Items seized: massage tables, photographs of young females, contact information, scheduling materials.',
                        classification: 'TOP SECRET'
                    },
                    {
                        title: 'NYC Townhouse Search',
                        date: 'July 2019',
                        excerpt: 'SDNY search warrant execution: "vast trove" of photographs including nude images of underage females.',
                        classification: 'TOP SECRET'
                    },
                    {
                        title: 'Digital Evidence',
                        date: '2019',
                        excerpt: 'Computer drives, CDs, hard drives containing photographic evidence seized from Manhattan residence.',
                        classification: 'TOP SECRET'
                    }
                ]
            }
        ];

        this.init();
    }

    init() {
        // Wait for evidence section
        const checkSection = setInterval(() => {
            const evidenceSection = document.getElementById('evidence');
            if (evidenceSection) {
                clearInterval(checkSection);
                this.createVault();
            }
        }, 100);
    }

    createVault() {
        const evidenceSection = document.getElementById('evidence');
        
        // Create vault container
        const vaultContainer = document.createElement('div');
        vaultContainer.className = 'evidence-vault';
        vaultContainer.innerHTML = `
            <div class="vault-header">
                <h3>Evidence Vault</h3>
                <p class="vault-description">Classified documentation from DOJ release. Click to expand.</p>
            </div>
            <div class="vault-categories">
                ${this.categories.map(cat => this.renderCategory(cat)).join('')}
            </div>
        `;

        // Insert after the first stats grid
        const statsGrid = evidenceSection.querySelector('.stats-grid');
        if (statsGrid) {
            statsGrid.after(vaultContainer);
        } else {
            evidenceSection.appendChild(vaultContainer);
        }

        this.bindEvents();
    }

    renderCategory(category) {
        return `
            <div class="vault-category" data-category="${category.id}">
                <div class="category-folder" style="--category-color: ${category.color}">
                    <div class="folder-tab">
                        <span class="folder-icon">${category.icon}</span>
                        <span class="folder-name">${category.name}</span>
                        <span class="folder-count">${category.count} docs</span>
                    </div>
                    <div class="folder-expand">▼</div>
                </div>
                <div class="category-documents">
                    ${category.documents.map((doc, idx) => this.renderDocument(doc, idx)).join('')}
                </div>
            </div>
        `;
    }

    renderDocument(doc, index) {
        return `
            <div class="vault-document" data-doc-index="${index}">
                <div class="doc-classification">${doc.classification}</div>
                <div class="doc-header">
                    <h4 class="doc-title">${doc.title}</h4>
                    <div class="doc-date">${doc.date}</div>
                </div>
                <div class="doc-excerpt redacted">
                    <span class="redaction-overlay"></span>
                    ${doc.excerpt}
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Category folder clicks
        document.querySelectorAll('.category-folder').forEach(folder => {
            folder.addEventListener('click', (e) => {
                const category = folder.closest('.vault-category');
                const isExpanded = category.classList.contains('expanded');
                
                // Collapse all others
                document.querySelectorAll('.vault-category').forEach(cat => {
                    cat.classList.remove('expanded');
                });

                // Toggle this one
                if (!isExpanded) {
                    category.classList.add('expanded');
                }
            });
        });

        // Document clicks - reveal with redaction animation
        document.querySelectorAll('.vault-document').forEach(doc => {
            doc.addEventListener('click', (e) => {
                const excerpt = doc.querySelector('.doc-excerpt');
                if (excerpt.classList.contains('redacted')) {
                    excerpt.classList.remove('redacted');
                    excerpt.classList.add('revealing');
                    
                    setTimeout(() => {
                        excerpt.classList.remove('revealing');
                        excerpt.classList.add('revealed');
                    }, 1000);
                }
            });
        });
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.evidenceVault = new EvidenceVault();
    });
} else {
    window.evidenceVault = new EvidenceVault();
}
