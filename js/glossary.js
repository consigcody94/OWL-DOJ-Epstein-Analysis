/**
 * OWL Analysis System v4.0
 * Legal Glossary Panel (G key)
 */

const GLOSSARY_TERMS = {
    'NPA': 'Non-Prosecution Agreement - An agreement between a prosecutor and defendant where charges are dropped in exchange for cooperation or other conditions.',
    'CVRA': 'Crime Victims\' Rights Act - Federal law granting victims rights to be informed and heard in criminal proceedings.',
    'SDNY': 'Southern District of New York - Federal judicial district covering Manhattan, the Bronx, and several counties.',
    'SDFL': 'Southern District of Florida - Federal judicial district covering the southern portion of Florida, including Palm Beach.',
    'Sex Trafficking': 'The recruitment, harboring, transportation, provision, obtaining, or soliciting of a person for a commercial sex act, in which the act is induced by force, fraud, or coercion, or the person is under 18.',
    'Conspiracy': 'An agreement between two or more people to commit an illegal act, along with an intent to achieve the agreement\'s goal.',
    'Grand Jury': 'A legal body empowered to investigate criminal conduct and determine whether charges should be brought.',
    'Immunity': 'Protection from prosecution granted to a witness in exchange for testimony.',
    'Subpoena': 'A written order compelling someone to testify or produce evidence.',
    'Indictment': 'A formal written accusation charging a person with a crime.',
    'Plea Deal': 'An agreement where a defendant pleads guilty in exchange for a reduced charge or sentence.',
    'Statute of Limitations': 'A law that sets the maximum time after an event within which legal proceedings may be initiated.',
    'Victim-Witness': 'A person who has witnessed or been victimized by a crime and may provide testimony.',
    'Flight Logs': 'Records documenting passengers, routes, and dates of aircraft flights.',
    'Shell Company': 'A company without active business operations or significant assets, often used to conceal ownership.',
    'Co-Conspirator': 'A person who participates in a conspiracy with one or more other people.',
    'Enticement': 'Persuading, inducing, enticing, or coercing someone to engage in prohibited conduct.',
    'Interstate Commerce': 'Trade, traffic, or transportation between states, which triggers federal jurisdiction.',
    'Trafficking Venture': 'A commercial enterprise involved in sex trafficking.',
    'Coercion': 'The practice of persuading someone to do something by using force or threats.',
    'Beyond Reasonable Doubt': 'The legal standard of proof in criminal trials - the prosecution must prove guilt to such a degree that no reasonable person would question it.',
    'Prima Facie': 'Evidence sufficient to establish a fact unless disproved.',
    'Acquittal': 'A judgment that a person is not guilty of the crime charged.',
    'Conviction': 'A formal declaration that someone is guilty of a criminal offense.',
    'Sentencing': 'The judicial determination of a punishment to be imposed on a convicted criminal.',
    'Incarceration': 'The state of being confined in prison.'
};

document.addEventListener('DOMContentLoaded', () => {
    initGlossary();
});

function initGlossary() {
    const panel = document.getElementById('glossaryPanel');
    const closeBtn = document.getElementById('glossaryClose');
    const content = document.getElementById('glossaryContent');
    
    if (!panel || !closeBtn || !content) {
        console.error('Glossary elements not found');
        return;
    }

    // Populate glossary content
    populateGlossary(content);

    // G key to toggle
    document.addEventListener('keydown', (e) => {
        if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.target.matches('input, textarea')) {
            toggleGlossary();
        }
    });

    // ESC to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && panel.classList.contains('active')) {
            closeGlossary();
        }
    });

    // Close button
    closeBtn.addEventListener('click', closeGlossary);
}

function populateGlossary(container) {
    // Sort terms alphabetically
    const sortedTerms = Object.entries(GLOSSARY_TERMS).sort((a, b) => a[0].localeCompare(b[0]));
    
    let html = '';
    sortedTerms.forEach(([term, definition]) => {
        html += `
            <div class="glossary-entry">
                <div class="glossary-term">${term}</div>
                <div class="glossary-definition">${definition}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function toggleGlossary() {
    const panel = document.getElementById('glossaryPanel');
    panel.classList.toggle('active');
}

function closeGlossary() {
    const panel = document.getElementById('glossaryPanel');
    panel.classList.remove('active');
}

// Make functions globally available
window.toggleGlossary = toggleGlossary;
window.closeGlossary = closeGlossary;
