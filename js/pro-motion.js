/* OWL professional motion polish: safe enhancement, no hidden content dependency. */
(function () {
  const motionSelectors = [
    '.hero-copy', '.hero-video-card', '.hero-command-card', '.hero-stat',
    '.source-radar', '.osint-manifesto', '.source-status-grid > *',
    '.capability-strip > *', '.capability-card', '.investigation-cta-panel',
    '.source-card', '.video-card', '.release-event', '.charge-card',
    '.person-card', '.evidence-card', '.timeline-card', '.coded-term-card',
    '.accordion-card', '.scandal-card'
  ];

  function ready() {
    const nodes = Array.from(document.querySelectorAll(motionSelectors.join(',')));
    nodes.forEach((node, index) => {
      node.classList.add('pro-motion', 'motion-soft-glow');
      node.style.setProperty('--motion-index', String(Math.min(index % 12, 11)));
    });

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
      nodes.forEach((node) => io.observe(node));
    } else {
      nodes.forEach((node) => node.classList.add('is-visible'));
    }

    let raf = 0;
    window.addEventListener('pointermove', (event) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const x = Math.round((event.clientX / window.innerWidth) * 100);
        const y = Math.round((event.clientY / window.innerHeight) * 100);
        document.body.style.setProperty('--spot-x', `${x}%`);
        document.body.style.setProperty('--spot-y', `${y}%`);
      });
    }, { passive: true });

    document.addEventListener('pointermove', (event) => {
      const card = event.target.closest('.motion-soft-glow');
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--card-x', `${event.clientX - rect.left}px`);
      card.style.setProperty('--card-y', `${event.clientY - rect.top}px`);
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready, { once: true });
  } else {
    ready();
  }
})();
