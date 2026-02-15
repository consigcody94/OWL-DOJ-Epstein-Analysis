/**
 * OWL Analysis System v4.0
 * Intro Animation
 */

document.addEventListener('DOMContentLoaded', () => {
    // Check if user has skipped intro before
    const skipIntro = localStorage.getItem('owl-skip-intro');
    
    if (skipIntro === 'true') {
        hideIntro();
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
    
    if (!overlay || !terminalOutput || !progressBar || !accessText) {
        console.error('Intro elements not found');
        return;
    }

    const messages = [
        'INITIALIZING OWL ANALYSIS SYSTEM...',
        'CONNECTING TO DOJ DATABASE...',
        'LOADING 3.5M DOCUMENTS...',
        'PROCESSING EVIDENCE FILES...',
        'DECRYPTING CLASSIFIED RECORDS...',
        'BUILDING NETWORK GRAPH...',
        'ANALYZING FLIGHT RECORDS...',
        'CROSS-REFERENCING TESTIMONY...',
        'SYSTEM READY.'
    ];

    let messageIndex = 0;
    let progress = 0;

    const interval = setInterval(() => {
        if (messageIndex < messages.length) {
            const line = document.createElement('div');
            line.textContent = '> ' + messages[messageIndex];
            line.style.opacity = '0';
            line.style.transition = 'opacity 0.3s ease';
            terminalOutput.appendChild(line);
            
            setTimeout(() => {
                line.style.opacity = '1';
            }, 10);
            
            messageIndex++;
            progress = (messageIndex / messages.length) * 100;
            progressBar.style.width = progress + '%';
        } else {
            clearInterval(interval);
            setTimeout(() => {
                accessText.classList.add('show');
                setTimeout(() => {
                    hideIntro();
                }, 800);
            }, 300);
        }
    }, 200); // Fast intro (200ms per line)

    // Skip button
    skipButton.addEventListener('click', () => {
        localStorage.setItem('owl-skip-intro', 'true');
        clearInterval(interval);
        hideIntro();
    });
}

function hideIntro() {
    const overlay = document.getElementById('introOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 500);
    }
}
