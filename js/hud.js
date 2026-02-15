/**
 * HUD Aesthetic Enhancements
 * Tony Stark JARVIS interface: particles, counters, scan lines, holographic effects
 */

class HUDEnhancer {
    constructor() {
        this.particleCanvas = null;
        this.particles = [];
        this.animationFrame = null;
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeHUD();
            });
        } else {
            this.initializeHUD();
        }
    }

    initializeHUD() {
        this.createParticleBackground();
        this.addScanLines();
        this.initCounterAnimations();
        this.enhanceCards();
        this.initScrollEffects();
        this.initKeyboardShortcuts();
        this.initBreadcrumbs();
        this.initDeepLinking();
    }

    // ============================================
    // PARTICLE BACKGROUND
    // ============================================
    createParticleBackground() {
        const canvas = document.createElement('canvas');
        canvas.id = 'particle-bg';
        canvas.className = 'particle-background';
        document.body.prepend(canvas);
        
        this.particleCanvas = canvas;
        this.resizeCanvas();
        
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Create particles
        this.initParticles();
        this.animateParticles();
    }

    resizeCanvas() {
        this.particleCanvas.width = window.innerWidth;
        this.particleCanvas.height = document.body.scrollHeight;
    }

    initParticles() {
        const particleCount = Math.min(50, Math.floor(window.innerWidth / 30));
        this.particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.particleCanvas.width,
                y: Math.random() * this.particleCanvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }

    animateParticles() {
        const ctx = this.particleCanvas.getContext('2d');
        
        const animate = () => {
            ctx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
            
            // Update and draw particles
            this.particles.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                
                // Wrap around edges
                if (particle.x < 0) particle.x = this.particleCanvas.width;
                if (particle.x > this.particleCanvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = this.particleCanvas.height;
                if (particle.y > this.particleCanvas.height) particle.y = 0;
                
                // Draw particle
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(59, 130, 246, ${particle.opacity})`;
                ctx.fill();
            });
            
            // Draw connections
            this.particles.forEach((p1, i) => {
                this.particles.slice(i + 1).forEach(p2 => {
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 150) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(59, 130, 246, ${0.1 * (1 - distance / 150)})`;
                        ctx.stroke();
                    }
                });
            });
            
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        animate();
    }

    // ============================================
    // SCAN LINES
    // ============================================
    addScanLines() {
        const scanLines = document.createElement('div');
        scanLines.className = 'scan-lines-overlay';
        document.body.appendChild(scanLines);
    }

    // ============================================
    // ANIMATED COUNTERS
    // ============================================
    initCounterAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                    this.animateCounter(entry.target);
                    entry.target.classList.add('counted');
                }
            });
        }, { threshold: 0.5 });

        // Observe all stat values
        setTimeout(() => {
            document.querySelectorAll('.stat-value').forEach(el => {
                observer.observe(el);
            });
        }, 1000);
    }

    animateCounter(element) {
        const text = element.textContent;
        const num = parseFloat(text.replace(/[^0-9.]/g, ''));
        
        if (isNaN(num)) return;
        
        const duration = 2000;
        const steps = 60;
        const increment = num / steps;
        const stepDuration = duration / steps;
        let current = 0;
        let step = 0;
        
        const suffix = text.replace(/[0-9.,]/g, '');
        
        const timer = setInterval(() => {
            current += increment;
            step++;
            
            if (step >= steps) {
                current = num;
                clearInterval(timer);
            }
            
            // Format number
            let formatted;
            if (num >= 1000000) {
                formatted = (current / 1000000).toFixed(1) + 'M';
            } else if (num >= 1000) {
                formatted = Math.floor(current).toLocaleString();
            } else {
                formatted = Math.floor(current).toString();
            }
            
            element.textContent = formatted + suffix;
        }, stepDuration);
    }

    // ============================================
    // HOLOGRAPHIC CARD EFFECTS
    // ============================================
    enhanceCards() {
        setTimeout(() => {
            // Add holographic borders to person cards
            document.querySelectorAll('.person-card, .stat-card, .charge-card').forEach(card => {
                card.classList.add('holo-card');
                
                // Mouse move for 3D effect
                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    
                    const rotateX = (y - centerY) / 10;
                    const rotateY = (centerX - x) / 10;
                    
                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
                });
                
                card.addEventListener('mouseleave', () => {
                    card.style.transform = '';
                });
            });
        }, 500);
    }

    // ============================================
    // SCROLL EFFECTS
    // ============================================
    initScrollEffects() {
        // Scroll spy for navigation
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-links a');
        
        const observerOptions = {
            threshold: 0.2,
            rootMargin: '-100px 0px -60% 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${entry.target.id}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, observerOptions);
        
        sections.forEach(section => observer.observe(section));
    }

    // ============================================
    // KEYBOARD SHORTCUTS
    // ============================================
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Skip if typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            // j/k for scrolling
            if (e.key === 'j') {
                e.preventDefault();
                window.scrollBy({ top: 300, behavior: 'smooth' });
            }
            
            if (e.key === 'k') {
                e.preventDefault();
                window.scrollBy({ top: -300, behavior: 'smooth' });
            }
        });
    }

    // ============================================
    // BREADCRUMBS
    // ============================================
    initBreadcrumbs() {
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'breadcrumb-nav';
        breadcrumb.innerHTML = '<span class="breadcrumb-home">🏠</span><span class="breadcrumb-path"></span>';
        
        const header = document.querySelector('.header');
        if (header) {
            header.appendChild(breadcrumb);
        }
        
        // Update breadcrumb based on scroll
        const updateBreadcrumb = () => {
            const sections = document.querySelectorAll('section[id]');
            const path = breadcrumb.querySelector('.breadcrumb-path');
            
            for (const section of sections) {
                const rect = section.getBoundingClientRect();
                if (rect.top <= 200 && rect.bottom >= 200) {
                    const title = section.querySelector('h2')?.textContent || section.id;
                    path.textContent = ` / ${title}`;
                    return;
                }
            }
            
            path.textContent = '';
        };
        
        window.addEventListener('scroll', updateBreadcrumb);
        updateBreadcrumb();
    }

    // ============================================
    // DEEP LINKING
    // ============================================
    initDeepLinking() {
        // Handle hash changes
        const handleHash = () => {
            const hash = window.location.hash;
            if (!hash) return;
            
            // Section links
            if (hash.startsWith('#')) {
                const element = document.querySelector(hash);
                if (element) {
                    setTimeout(() => {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                }
            }
        };
        
        window.addEventListener('hashchange', handleHash);
        handleHash();
        
        // Update hash on scroll
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const sections = document.querySelectorAll('section[id]');
                for (const section of sections) {
                    const rect = section.getBoundingClientRect();
                    if (rect.top <= 100 && rect.bottom >= 100) {
                        history.replaceState(null, null, `#${section.id}`);
                        break;
                    }
                }
            }, 100);
        });
    }
}

// Initialize
window.hudEnhancer = new HUDEnhancer();
