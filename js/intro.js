/**
 * OWL Analysis System
 * Premium intro animation controller
 */

(function () {
    const INTRO_SESSION_KEY = 'owl-intro-seen-v2';
    const INTRO_SKIP_KEY = 'owl-skip-intro-v2';

    document.addEventListener('DOMContentLoaded', () => {
        const overlay = document.getElementById('introOverlay');
        if (!overlay) return;

        const forceIntro = new URLSearchParams(window.location.search).has('intro');
        const permanentlySkipped = !forceIntro && localStorage.getItem(INTRO_SKIP_KEY) === 'true';
        const seenThisSession = !forceIntro && sessionStorage.getItem(INTRO_SESSION_KEY) === 'true';

        if (permanentlySkipped || seenThisSession || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            hideIntro(true);
            return;
        }

        initIntro();
    });

    function initIntro() {
        const overlay = document.getElementById('introOverlay');
        const terminalOutput = document.getElementById('terminalOutput');
        const progressBar = document.getElementById('introProgress');
        const accessText = document.getElementById('accessGranted');
        const skipButton = document.getElementById('skipIntro');

        if (!overlay || !terminalOutput || !progressBar || !accessText || !skipButton) return;

        document.body.classList.add('intro-active');
        overlay.classList.add('is-running');
        sessionStorage.setItem(INTRO_SESSION_KEY, 'true');

        overlay.querySelectorAll('video').forEach(video => {
            video.loop = false;
            video.muted = true;
            video.playsInline = true;
            video.addEventListener('ended', () => video.classList.add('has-ended'), { once: true });
            const attempt = video.play();
            if (attempt && typeof attempt.catch === 'function') {
                attempt.catch(() => video.classList.add('video-fallback'));
            }
        });

        const messages = [
            'Mounting DOJ / FBI / court source index',
            'Applying confidence labels',
            'Separating media context from primary records',
            'Preparing dossiers, graph, timeline, and evidence vault',
            'Workspace ready'
        ];

        let messageIndex = 0;
        const lineDelay = 560;
        const interval = window.setInterval(() => {
            if (messageIndex < messages.length) {
                const line = document.createElement('div');
                line.className = 'intro-line';
                line.innerHTML = `<span>0${messageIndex + 1}</span>${messages[messageIndex]}`;
                terminalOutput.appendChild(line);
                requestAnimationFrame(() => line.classList.add('visible'));

                messageIndex += 1;
                progressBar.style.width = `${(messageIndex / messages.length) * 100}%`;
                return;
            }

            window.clearInterval(interval);
            accessText.classList.add('show');
            window.setTimeout(() => hideIntro(false), 1150);
        }, lineDelay);

        skipButton.addEventListener('click', () => {
            localStorage.setItem(INTRO_SKIP_KEY, 'true');
            window.clearInterval(interval);
            hideIntro(false);
        }, { once: true });
    }

    function hideIntro(immediate) {
        const overlay = document.getElementById('introOverlay');
        document.body.classList.remove('intro-active');
        if (!overlay) return;

        if (immediate) {
            overlay.style.display = 'none';
            return;
        }

        overlay.classList.add('hidden');
        window.setTimeout(() => {
            overlay.style.display = 'none';
        }, 650);
    }
})();
