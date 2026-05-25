/**
 * OWL Analysis System v4.1
 * Evidence Vault - source-labelled static evidence browser
 */

let evidenceIndex = {};

document.addEventListener('DOMContentLoaded', () => {
    initVault();
});

async function initVault() {
    const tabs = document.querySelectorAll('.vault-tab');
    const grid = document.getElementById('vaultGrid');
    
    if (!tabs.length || !grid) {
        console.error('Vault elements not found');
        return;
    }

    try {
        const response = await fetch('data/evidence-index.json');
        evidenceIndex = await response.json();
    } catch (error) {
        console.error('Evidence index unavailable:', error);
        grid.innerHTML = '<div class="loading-card">Evidence index unavailable.</div>';
        return;
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadVaultCategory(tab.getAttribute('data-category'), grid);
        });
    });

    loadVaultCategory('flight', grid);
}

function loadVaultCategory(category, container) {
    const evidence = evidenceIndex.categories?.[category] || [];
    container.innerHTML = '';
    
    if (evidence.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">No evidence in this category</div>';
        return;
    }

    evidence.forEach(item => container.appendChild(createEvidenceCard(item)));
}

function evidenceEscape(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function createEvidenceCard(evidence) {
    const card = document.createElement('article');
    card.className = 'evidence-card source-evidence-card';
    card.tabIndex = 0;
    
    card.innerHTML = `
        <div class="classification-badge classification-confidential">${evidenceEscape(evidence.confidence)}</div>
        <h3 class="evidence-title">${evidenceEscape(evidence.title)}</h3>
        <div class="evidence-date">${evidenceEscape(evidence.date)}</div>
        <div class="evidence-excerpt">${evidenceEscape(evidence.excerpt)}</div>
        ${evidence.document_ids?.length ? `<div class="evidence-docids">${evidence.document_ids.map(evidenceEscape).join(' · ')}</div>` : ''}
        <div class="evidence-actions">
            ${evidence.local_path ? `<a href="${evidenceEscape(evidence.local_path)}" class="source-link">Local brief →</a>` : ''}
            ${evidence.source_url ? `<a href="${evidenceEscape(evidence.source_url)}" target="_blank" rel="noopener noreferrer" class="source-link">Official source ↗</a>` : ''}
        </div>
    `;
    
    card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            const firstLink = card.querySelector('a');
            if (firstLink) firstLink.click();
        }
    });
    
    return card;
}
