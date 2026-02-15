/**
 * Dossier Mode - Full-screen person dossier overlay
 * Tony Stark classified file aesthetic
 */

class DossierViewer {
    constructor() {
        this.currentPerson = null;
        this.createDossierOverlay();
        this.bindEvents();
    }

    createDossierOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'dossier-overlay';
        overlay.className = 'dossier-overlay';
        overlay.innerHTML = `
            <div class="dossier-container">
                <button class="dossier-close" aria-label="Close dossier">×</button>
                <div class="dossier-header">
                    <div class="classified-stamp">TOP SECRET</div>
                    <div class="scan-lines"></div>
                </div>
                <div class="dossier-content">
                    <div class="dossier-photo-section">
                        <div class="dossier-photo-frame">
                            <div class="dossier-photo"></div>
                        </div>
                        <div class="dossier-meta"></div>
                    </div>
                    <div class="dossier-tabs">
                        <button class="dossier-tab active" data-tab="overview">Overview</button>
                        <button class="dossier-tab" data-tab="documents">Documents</button>
                        <button class="dossier-tab" data-tab="connections">Connections</button>
                        <button class="dossier-tab" data-tab="timeline">Timeline</button>
                    </div>
                    <div class="dossier-panels">
                        <div class="dossier-panel active" data-panel="overview"></div>
                        <div class="dossier-panel" data-panel="documents"></div>
                        <div class="dossier-panel" data-panel="connections"></div>
                        <div class="dossier-panel" data-panel="timeline"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        this.overlay = overlay;
    }

    bindEvents() {
        // Close button
        this.overlay.querySelector('.dossier-close').addEventListener('click', () => this.close());
        
        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
                this.close();
            }
        });

        // Click outside
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });

        // Tab switching
        this.overlay.querySelectorAll('.dossier-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Listen for person card clicks
        document.addEventListener('click', (e) => {
            const personCard = e.target.closest('.person-card');
            if (personCard && personCard.dataset.personId) {
                const person = state.persons.find(p => p.id === personCard.dataset.personId);
                if (person) {
                    this.open(person);
                }
            }
        });
    }

    open(person) {
        this.currentPerson = person;
        this.renderDossier();
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    switchTab(tabName) {
        // Update active tab
        this.overlay.querySelectorAll('.dossier-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update active panel
        this.overlay.querySelectorAll('.dossier-panel').forEach(panel => {
            panel.classList.toggle('active', panel.dataset.panel === tabName);
        });
    }

    renderDossier() {
        const person = this.currentPerson;
        
        // Photo
        const photoEl = this.overlay.querySelector('.dossier-photo');
        const roleColor = this.getRoleColor(person.role);
        if (person.photo) {
            photoEl.innerHTML = `<img class="dossier-photo-img" src="${person.photo}" alt="${person.name}" onerror="this.parentElement.innerHTML='<div class=\\'silhouette\\' style=\\'--role-color: ${roleColor}\\'><svg viewBox=\\'0 0 24 24\\' fill=\\'currentColor\\'><path d=\\'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z\\'/></svg></div>'">`;
        } else {
            photoEl.innerHTML = `
                <div class="silhouette" style="--role-color: ${roleColor}">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                </div>
            `;
        }

        // Meta info
        const metaEl = this.overlay.querySelector('.dossier-meta');
        metaEl.innerHTML = `
            <h2>${person.name}</h2>
            <div class="dossier-role">${person.role}</div>
            <div class="dossier-status status-${person.status.toLowerCase()}">${person.status}</div>
            ${person.verdict ? `<div class="dossier-verdict">${person.verdict}</div>` : ''}
        `;

        // Render panels
        this.renderOverviewPanel(person);
        this.renderDocumentsPanel(person);
        this.renderConnectionsPanel(person);
        this.renderTimelinePanel(person);
    }

    renderOverviewPanel(person) {
        const panel = this.overlay.querySelector('[data-panel="overview"]');
        
        let html = `<div class="dossier-section">`;
        
        // Bio/Description
        if (person.description) {
            html += `<p class="dossier-bio">${person.description}</p>`;
        }

        // Charges
        if (person.charges && person.charges.length > 0) {
            html += `
                <h3>Charges</h3>
                <ul class="dossier-list">
                    ${person.charges.map(charge => `<li>${charge}</li>`).join('')}
                </ul>
            `;
        }

        // Key Evidence
        if (person.key_evidence && person.key_evidence.length > 0) {
            html += `<h3>Key Evidence</h3>`;
            person.key_evidence.forEach(evidence => {
                html += `
                    <div class="evidence-quote">
                        <blockquote>"${evidence.quote}"</blockquote>
                        <footer>— ${evidence.source} (${evidence.document_id})</footer>
                    </div>
                `;
            });
        }

        // Stats
        html += `
            <div class="dossier-stats">
                <div class="dossier-stat">
                    <div class="stat-value">${person.document_count?.toLocaleString() || 0}</div>
                    <div class="stat-label">Document References</div>
                </div>
            </div>
        `;

        html += `</div>`;
        panel.innerHTML = html;
    }

    renderDocumentsPanel(person) {
        const panel = this.overlay.querySelector('[data-panel="documents"]');
        
        let html = '<div class="dossier-section">';
        
        if (person.key_documents && person.key_documents.length > 0) {
            html += `
                <div class="dossier-documents">
                    ${person.key_documents.map(doc => `
                        <div class="dossier-doc-card">
                            <div class="doc-id">${doc.id}</div>
                            <div class="doc-title">${doc.title}</div>
                            <div class="doc-type">${doc.type}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            html += '<p class="text-muted">No key documents available.</p>';
        }
        
        html += '</div>';
        panel.innerHTML = html;
    }

    renderConnectionsPanel(person) {
        const panel = this.overlay.querySelector('[data-panel="connections"]');
        
        let html = '<div class="dossier-section">';
        
        // Find connections from network data
        if (state.networkData && state.networkData.links) {
            const connections = state.networkData.links
                .filter(link => link.source.id === person.id || link.target.id === person.id)
                .map(link => {
                    const connectedPerson = link.source.id === person.id ? link.target : link.source;
                    return {
                        person: connectedPerson,
                        type: link.type || 'associate'
                    };
                });

            if (connections.length > 0) {
                html += `
                    <div class="dossier-connections">
                        ${connections.map(conn => `
                            <div class="connection-card" data-person-id="${conn.person.id}">
                                <div class="connection-name">${conn.person.name}</div>
                                <div class="connection-type">${conn.type}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                html += '<p class="text-muted">No direct connections mapped.</p>';
            }
        } else {
            html += '<p class="text-muted">Connection data loading...</p>';
        }
        
        html += '</div>';
        panel.innerHTML = html;

        // Make connection cards clickable
        panel.querySelectorAll('.connection-card').forEach(card => {
            card.addEventListener('click', () => {
                const personId = card.dataset.personId;
                const connectedPerson = state.persons.find(p => p.id === personId);
                if (connectedPerson) {
                    this.open(connectedPerson);
                }
            });
        });
    }

    renderTimelinePanel(person) {
        const panel = this.overlay.querySelector('[data-panel="timeline"]');
        
        let html = '<div class="dossier-section">';
        
        if (person.timeline) {
            html += `<div class="dossier-timeline">`;
            
            const timelineEvents = Object.entries(person.timeline)
                .filter(([key, value]) => value)
                .map(([key, value]) => ({
                    label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    date: value
                }))
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            timelineEvents.forEach(event => {
                html += `
                    <div class="timeline-entry">
                        <div class="timeline-date">${new Date(event.date).toLocaleDateString()}</div>
                        <div class="timeline-label">${event.label}</div>
                    </div>
                `;
            });
            
            html += `</div>`;
        } else {
            html += '<p class="text-muted">No timeline data available.</p>';
        }
        
        html += '</div>';
        panel.innerHTML = html;
    }

    getRoleColor(role) {
        const roleMap = {
            'Principal': '#ef4444',
            'Staff': '#f59e0b',
            'Defense': '#3b82f6',
            'Prosecutor': '#10b981',
            'Associates': '#06b6d4',
            'Financial': '#8b5cf6',
            'Victims': '#f97316'
        };

        for (const [key, color] of Object.entries(roleMap)) {
            if (role.toLowerCase().includes(key.toLowerCase())) {
                return color;
            }
        }

        return '#64748b';
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.dossierViewer = new DossierViewer();
    });
} else {
    window.dossierViewer = new DossierViewer();
}
