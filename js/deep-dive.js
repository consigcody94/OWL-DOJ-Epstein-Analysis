/**
 * OWL Analysis System v4.0
 * Deep Dive Sections: Coded Language, Secret Societies, Cross-Scandal Connections
 */

document.addEventListener('DOMContentLoaded', () => {
    initDeepDiveSections();
});

function initDeepDiveSections() {
    setupCodedLanguageSearch();
    setupAccordions();
    observeDeepDiveSections();
}

// ==========================================
// CODED LANGUAGE SEARCH
// ==========================================
function setupCodedLanguageSearch() {
    const searchInput = document.getElementById('codedLanguageSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        filterCodedTerms(query);
    });
}

function filterCodedTerms(query) {
    const cards = document.querySelectorAll('.coded-term-card');
    
    cards.forEach(card => {
        const term = (card.querySelector('.term-word')?.textContent || '').toLowerCase();
        const meaning = (card.querySelector('.term-meaning')?.textContent || '').toLowerCase();
        const category = card.getAttribute('data-category') || '';
        
        const matches = term.includes(query) || 
                       meaning.includes(query) || 
                       category.includes(query) ||
                       query === '';
        
        card.style.display = matches ? 'block' : 'none';
    });
}

// ==========================================
// ACCORDIONS (Secret Societies)
// ==========================================
function setupAccordions() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const accordion = header.parentElement;
            const isActive = accordion.classList.contains('active');
            
            // Close all accordions in the same section
            const section = accordion.closest('.secret-societies-grid') || accordion.closest('.cross-scandal-grid');
            if (section) {
                section.querySelectorAll('.accordion-card.active').forEach(card => {
                    if (card !== accordion) {
                        card.classList.remove('active');
                    }
                });
            }
            
            // Toggle current accordion
            accordion.classList.toggle('active');
        });
    });
}

// ==========================================
// INTERSECTION OBSERVER (Animations)
// ==========================================
function observeDeepDiveSections() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Stagger card animations
                const cards = entry.target.querySelectorAll('.coded-term-card, .accordion-card, .scandal-card');
                cards.forEach((card, index) => {
                    setTimeout(() => {
                        card.classList.add('visible');
                    }, index * 50);
                });
            }
        });
    }, { threshold: 0.1 });

    // Observe sections
    const sections = document.querySelectorAll('.coded-language-section, .secret-societies-section, .cross-scandal-section');
    sections.forEach(section => observer.observe(section));
    
    // Observe new sections (recruitment, pr-machine, cipher-diary, death-coverup)
    const newSections = document.querySelectorAll('#recruitment-pipeline, #pr-machine, #cipher-diary, #death-coverup');
    newSections.forEach(section => observer.observe(section));
}

// ==========================================
// CATEGORY FILTER (Coded Language)
// ==========================================
function filterByCategory(category) {
    const cards = document.querySelectorAll('.coded-term-card');
    
    cards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        const matches = category === 'all' || cardCategory === category;
        card.style.display = matches ? 'block' : 'none';
    });
    
    // Update active filter button
    document.querySelectorAll('.category-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-category') === category);
    });
}

// Make globally accessible
window.filterByCategory = filterByCategory;
