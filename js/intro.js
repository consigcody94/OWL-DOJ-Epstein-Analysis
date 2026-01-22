
/**
 * Initialize Cinematic Intro
 */
function initIntroSequence() {
    const overlay = document.getElementById('intro-overlay');
    if (!overlay) return;

    // Check if seen in this session
    if (sessionStorage.getItem('introSeen')) {
        overlay.style.display = 'none';
        return;
    }

    const terminal = document.getElementById('terminal-output');
    const progressBar = document.getElementById('intro-progress');
    const accessText = document.getElementById('access-granted');

    const lines = [
        "Initializing secure connection...",
        "Bypassing firewalls...",
        "Accessing DOJ database...",
        "Decrypting corpus (14,674 documents)...",
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

    function finishIntro() {
        if (progressBar) progressBar.style.width = '100%';

        setTimeout(() => {
            if (accessText) accessText.classList.add('visible');

            setTimeout(() => {
                overlay.classList.add('hidden');
                sessionStorage.setItem('introSeen', 'true');

                // Allow scrolling again (if we locked it)
                document.body.style.overflow = '';

                // Remove from DOM after transition
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 1000);
            }, 1000);
        }, 500);
    }

    // Start
    document.body.style.overflow = 'hidden';
    setTimeout(typeLine, 500);
}
