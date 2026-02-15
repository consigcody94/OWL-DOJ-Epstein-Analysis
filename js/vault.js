/**
 * OWL Analysis System v4.0
 * Evidence Vault
 */

const EVIDENCE_DATA = {
    flight: [
        {
            classification: 'top-secret',
            title: 'Flight Logs - N908JE (Lolita Express)',
            date: '2001-2006',
            excerpt: 'Comprehensive flight manifests documenting 850+ flights with passenger lists including Clinton, Prince Andrew, and multiple unidentified minors.'
        },
        {
            classification: 'secret',
            title: 'Aircraft Registration Records',
            date: '1998-2019',
            excerpt: '6 registered aircraft including N908JE (Boeing 727), N909JE (Gulfstream), and 4 helicopters used for island transport.'
        },
        {
            classification: 'confidential',
            title: 'Pilot Testimony - Larry Visoski',
            date: '2021',
            excerpt: 'Chief pilot testimony confirming transport of minors and high-profile passengers over 25+ years.'
        },
        {
            classification: 'secret',
            title: 'Little St. James Flight Manifests',
            date: '2001-2019',
            excerpt: 'Helicopter logs showing 2,400+ flights to Little St. James island with passenger counts and timestamps.'
        }
    ],
    phone: [
        {
            classification: 'top-secret',
            title: 'Phone Records - Maxwell to Victims',
            date: '2001-2005',
            excerpt: 'Over 125 phone calls documented between Maxwell and a single victim, establishing pattern of recruitment contact.'
        },
        {
            classification: 'secret',
            title: 'Cell Tower Data - Little St. James',
            date: '2010-2019',
            excerpt: 'Cell tower records placing multiple high-profile individuals on island during documented abuse periods.'
        },
        {
            classification: 'confidential',
            title: 'Contact Lists - Epstein\'s Black Book',
            date: '2004',
            excerpt: 'Over 1,000 contacts including royalty, politicians, business leaders, and entertainment figures.'
        }
    ],
    testimony: [
        {
            classification: 'top-secret',
            title: 'Grand Jury Testimony - Victim A',
            date: '2007-05',
            excerpt: '"She told Mr. Epstein that she was in high school, and actually told him her true age, which was under 18."'
        },
        {
            classification: 'top-secret',
            title: 'FBI Agent Statement',
            date: '2007',
            excerpt: '"The younger, the better." - Direct quote from FBI testimony regarding Epstein\'s stated preferences.'
        },
        {
            classification: 'secret',
            title: 'Virginia Giuffre Deposition',
            date: '2016',
            excerpt: 'Detailed testimony of trafficking, naming multiple high-profile individuals and locations worldwide.'
        },
        {
            classification: 'secret',
            title: 'Sarah Kellen Immunity Proffer',
            date: '2007',
            excerpt: 'Assistant\'s statement describing scheduling system for "massages" and recruitment of high school students.'
        }
    ],
    financial: [
        {
            classification: 'secret',
            title: 'Southern Trust Company Records',
            date: '1990-2019',
            excerpt: 'Virgin Islands shell company handling $500M+ in wire transfers with obfuscated beneficiaries.'
        },
        {
            classification: 'confidential',
            title: 'Victim Settlement Payments',
            date: '2008-2019',
            excerpt: 'Over $5M in documented settlement payments to victims through intermediary law firms.'
        },
        {
            classification: 'top-secret',
            title: 'Wexner Financial Relationship',
            date: '1991-2007',
            excerpt: 'Power of attorney documentation showing Epstein\'s control over $500M+ Wexner estate assets.'
        },
        {
            classification: 'secret',
            title: 'Libya Asset Seizure Scheme',
            date: '2011',
            excerpt: 'Documented plans to seize $80B in frozen Libyan assets with 10-25% fee structure (2026 revelation).'
        }
    ],
    physical: [
        {
            classification: 'top-secret',
            title: 'Palm Beach Mansion Search Warrant',
            date: '2005-10',
            excerpt: 'Photographs, massage tables, victim identification evidence seized from 358 El Brillo Way.'
        },
        {
            classification: 'top-secret',
            title: 'New York Townhouse Evidence',
            date: '2019-07',
            excerpt: 'Digital storage devices, explicit photographs of minors, fake passports seized from 9 East 71st Street.'
        },
        {
            classification: 'secret',
            title: 'Safe Contents - Fake Passports',
            date: '2019',
            excerpt: 'Saudi Arabian passport with Epstein\'s photo under different name, multiple currencies, diamonds.'
        },
        {
            classification: 'confidential',
            title: 'Massage Table & Equipment',
            date: '2005',
            excerpt: 'Professional massage equipment seized from multiple properties, used as pretext for abuse.'
        }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    initVault();
});

function initVault() {
    const tabs = document.querySelectorAll('.vault-tab');
    const grid = document.getElementById('vaultGrid');
    
    if (!tabs.length || !grid) {
        console.error('Vault elements not found');
        return;
    }

    // Tab click handlers
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Load category
            const category = tab.getAttribute('data-category');
            loadVaultCategory(category, grid);
        });
    });

    // Load initial category
    loadVaultCategory('flight', grid);
}

function loadVaultCategory(category, container) {
    const evidence = EVIDENCE_DATA[category] || [];
    
    container.innerHTML = '';
    
    if (evidence.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">No evidence in this category</div>';
        return;
    }

    evidence.forEach(item => {
        const card = createEvidenceCard(item);
        container.appendChild(card);
    });
}

function createEvidenceCard(evidence) {
    const card = document.createElement('div');
    card.className = 'evidence-card';
    
    const classificationClass = `classification-${evidence.classification}`;
    const classificationLabel = evidence.classification.toUpperCase().replace('-', ' ');
    
    card.innerHTML = `
        <div class="classification-badge ${classificationClass}">${classificationLabel}</div>
        <h3 class="evidence-title">${evidence.title}</h3>
        <div class="evidence-date">${evidence.date}</div>
        <div class="evidence-excerpt">${evidence.excerpt}</div>
    `;
    
    // Expand on click
    card.addEventListener('click', () => {
        expandEvidence(evidence);
    });
    
    return card;
}

function expandEvidence(evidence) {
    // For now, just show alert - could be replaced with modal
    const message = `
${evidence.title}
Date: ${evidence.date}
Classification: ${evidence.classification.toUpperCase()}

${evidence.excerpt}
    `.trim();
    
    alert(message);
}
