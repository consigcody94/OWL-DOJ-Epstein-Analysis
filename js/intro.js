
/**
 * Initialize Cinematic Intro with Skip Option
 */
function initIntroSequence() {
    const overlay = document.getElementById('intro-overlay');
    if (!overlay) return;

    // Check localStorage preference or session
    if (localStorage.getItem('skipIntro') === 'true' || sessionStorage.getItem('introSeen')) {
        overlay.style.display = 'none';
        return;
    }

    // Add skip button
    const skipBtn = document.createElement('button');
    skipBtn.className = 'intro-skip-btn';
    skipBtn.innerHTML = 'Skip Intro <span style="font-size: 0.75em;">(always)</span>';
    skipBtn.onclick = () => {
        localStorage.setItem('skipIntro', 'true');
        finishIntro(true);
    };
    overlay.querySelector('.intro-content').appendChild(skipBtn);

    const terminal = document.getElementById('terminal-output');
    const progressBar = document.getElementById('intro-progress');
    const accessText = document.getElementById('access-granted');

    const lines = [
        "Initializing secure connection...",
        "Bypassing firewalls...",
        "Accessing DOJ Epstein Library...",
        "Decrypting corpus (3.5 million pages)...",
        "Processing 180,000 images...",
        "Indexing 2,000+ videos...",
        "Analyzing metadata...",
        "Verifying clearance..."
    ];

    let lineIndex = 0;
    let charIndex = 0;

    function typeLine() {
        if (lineIndex >= lines.length) {
            finishIntro();
            return;
        }

        const currentLine = lines[lineIndex];

        if (charIndex < currentLine.length) {
            terminal.textContent += currentLine.charAt(charIndex);
            charIndex++;
            setTimeout(typeLine, Math.random() * 30 + 10);
        } else {
            terminal.textContent += '\n';
            lineIndex++;
            charIndex = 0;
            // Update progress bar
            const progress = (lineIndex / lines.length) * 100;
            if (progressBar) progressBar.style.width = `${progress}%`;

            setTimeout(typeLine, 200);
        }

        // Auto scroll terminal
        terminal.scrollTop = terminal.scrollHeight;
    }

    function finishIntro(instant = false) {
        if (progressBar) progressBar.style.width = '100%';

        const delay = instant ? 0 : 500;
        const accessDelay = instant ? 0 : 1000;
        const removeDelay = instant ? 100 : 1000;

        setTimeout(() => {
            if (accessText && !instant) accessText.classList.add('visible');

            setTimeout(() => {
                overlay.classList.add('hidden');
                sessionStorage.setItem('introSeen', 'true');

                // Allow scrolling again (if we locked it)
                document.body.style.overflow = '';

                // Remove from DOM after transition
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, removeDelay);
            }, instant ? 0 : accessDelay);
        }, delay);
    }

    // Click anywhere to skip (once)
    overlay.addEventListener('click', (e) => {
        if (e.target !== skipBtn && !skipBtn.contains(e.target)) {
            finishIntro(true);
        }
    });

    // Start
    document.body.style.overflow = 'hidden';
    setTimeout(typeLine, 500);
}
