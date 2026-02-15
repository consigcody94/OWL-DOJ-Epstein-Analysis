/**
 * OWL Analysis System v4.0
 * Dossier Overlay Logic
 */

// This file provides additional dossier functionality
// Main dossier open/close logic is in app.js

document.addEventListener('DOMContentLoaded', () => {
    initDossierTabs();
    initDossierClose();
});

function initDossierTabs() {
    const tabs = document.querySelectorAll('.dossier-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            switchDossierTab(tabName);
        });
    });
}

function initDossierClose() {
    const closeBtn = document.getElementById('dossierClose');
    const overlay = document.getElementById('dossierOverlay');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeDossier);
    }
    
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeDossier();
            }
        });
    }
}

function switchDossierTab(tabName) {
    // Update active tab
    document.querySelectorAll('.dossier-tab').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
    });
    
    // Show corresponding panel
    document.querySelectorAll('.dossier-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    const targetPanel = document.getElementById(`dossier${capitalize(tabName)}Panel`);
    if (targetPanel) {
        targetPanel.classList.add('active');
        
        // Load panel content if not already loaded
        if (tabName === 'documents') {
            loadDocumentsPanel();
        } else if (tabName === 'connections') {
            loadConnectionsPanel();
        } else if (tabName === 'timeline') {
            loadTimelinePanel();
        }
    }
}

function loadDocumentsPanel() {
    const panel = document.getElementById('dossierDocumentsPanel');
    if (!panel || panel.hasAttribute('data-loaded')) return;
    
    // Get current person from the dossier
    const personName = document.getElementById('dossierName').textContent;
    
    panel.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
            <p>Document references for ${personName} are embedded throughout the 3.5M page corpus.</p>
            <p style="margin-top: 1rem;">Key documents are listed in the Overview tab.</p>
        </div>
    `;
    
    panel.setAttribute('data-loaded', 'true');
}

function loadConnectionsPanel() {
    const panel = document.getElementById('dossierConnectionsPanel');
    if (!panel || panel.hasAttribute('data-loaded')) return;
    
    panel.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
            <p>View the Network Visualization section to explore connections between all persons of interest.</p>
        </div>
    `;
    
    panel.setAttribute('data-loaded', 'true');
}

function loadTimelinePanel() {
    const panel = document.getElementById('dossierTimelinePanel');
    if (!panel || panel.hasAttribute('data-loaded')) return;
    
    panel.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
            <p>Individual timelines are being developed. See the Timeline section for key events.</p>
        </div>
    `;
    
    panel.setAttribute('data-loaded', 'true');
}

function closeDossier() {
    const overlay = document.getElementById('dossierOverlay');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    
    // Reset to overview tab
    setTimeout(() => {
        switchDossierTab('overview');
    }, 300);
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
