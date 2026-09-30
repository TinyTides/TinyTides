// ============================================================
// main.js - Entry point: loading screen, menu, bootstraps Game
// ============================================================
import { Game } from './game.js';
import { hasSave, deleteSave } from './engine.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const game = new Game(canvas);

    // Screens
    const loadingScreen = document.getElementById('loading-screen');
    const mainMenu = document.getElementById('main-menu');
    const gameUI = document.getElementById('game-ui');

    // Buttons
    const btnStory = document.getElementById('btn-story');
    const btnFreeRoam = document.getElementById('btn-free-roam');
    const btnContinue = document.getElementById('btn-continue');
    const btnOptions = document.getElementById('btn-options');
    const btnShop = document.getElementById('btn-shop');
    const btnInventory = document.getElementById('btn-inventory');

    // Show/hide continue button
    if (btnContinue) {
        btnContinue.style.display = hasSave() ? 'block' : 'none';
    }

    // Loading animation
    let progress = 0;
    const progressBar = document.getElementById('progress-bar');
    const loadingText = document.querySelector('.loading-text');

    const loadingPhases = [
        'Generating ocean...',
        'Spawning fish...',
        'Placing NPCs...',
        'Charting maps...',
        'Tuning instruments...',
        'Raising tides...',
        'Ready!',
    ];

    const loadingInterval = setInterval(() => {
        progress += 2 + Math.random() * 8;
        if (progress > 100) progress = 100;
        progressBar.style.width = `${progress}%`;

        const phaseIdx = Math.min(loadingPhases.length - 1, Math.floor((progress / 100) * loadingPhases.length));
        if (loadingText) loadingText.textContent = loadingPhases[phaseIdx];

        if (progress === 100) {
            clearInterval(loadingInterval);
            setTimeout(() => {
                loadingScreen.classList.remove('active');
                mainMenu.classList.add('active');

                // Re-check continue button
                if (btnContinue) {
                    btnContinue.style.display = hasSave() ? 'block' : 'none';
                }
            }, 600);
        }
    }, 120);

    // --- Menu Actions ---
    const launchGame = (mode) => {
        mainMenu.classList.remove('active');
        gameUI.classList.add('active');
        canvas.classList.add('active');
        game.startNewGame(mode);
    };

    btnStory.addEventListener('click', () => launchGame('story'));
    btnFreeRoam.addEventListener('click', () => launchGame('freeRoam'));

    if (btnContinue) {
        btnContinue.addEventListener('click', () => {
            mainMenu.classList.remove('active');
            gameUI.classList.add('active');
            canvas.classList.add('active');
            game.continueGame();
        });
    }

    if (btnOptions) {
        btnOptions.addEventListener('click', () => {
            // Simple options: clear save
            if (confirm('Delete save data?')) {
                deleteSave();
                if (btnContinue) btnContinue.style.display = 'none';
                alert('Save data cleared.');
            }
        });
    }

    // HUD Buttons
    if (btnShop) {
        btnShop.addEventListener('click', () => {
            // Only open shop if near merchant
            if (game.nearNPC && game.nearNPC.isShop) {
                game.shop.open();
                game.state = 'shop';
            }
        });
    }

    if (btnInventory) {
        btnInventory.addEventListener('click', () => {
            if (game.state === 'exploring') {
                game.inventory.open();
                game.state = 'inventory';
                game.audio.sfxOpen();
            }
        });
    }
});
