/**
 * OWL Analysis System v4.0
 * HUD & Scroll Effects
 * NO PARTICLE CANVAS (removed for performance)
 */

// ===========================================
// SCROLL EFFECTS
// ===========================================
document.addEventListener('DOMContentLoaded', () => {
    initScrollEffects();
    initCounterAnimations();
});

function initScrollEffects() {
    // Keep all sections visible by default. The previous scroll reveal hid every
    // section with inline opacity:0 before the observer fired, which created
    // blank gaps and made the page look broken on some browsers/screenshots.
    document.querySelectorAll('section').forEach(section => {
        section.style.opacity = '1';
        section.style.transform = 'none';
        section.style.transition = 'none';
    });
}

// ===========================================
// COUNTER ANIMATIONS
// ===========================================
function initCounterAnimations() {
    const counters = document.querySelectorAll('[data-target]');
    
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                animateCounter(entry.target, target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

function animateCounter(element, target) {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = formatNumber(Math.floor(current));
    }, duration / steps);
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1') + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
}

// ===========================================
// SMOOTH SCROLLING
// ===========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
