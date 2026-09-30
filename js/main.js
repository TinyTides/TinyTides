class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.lastTime = 0;
        this.isRunning = false;
        
        // Game State
        this.currency = parseInt(localStorage.getItem('tinyTides_currency')) || 0;
        this.updateCurrencyUI();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.canvas.classList.add('active');
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    stop() {
        this.isRunning = false;
        this.canvas.classList.remove('active');
    }

    gameLoop(timestamp) {
        if (!this.isRunning) return;

        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(deltaTime) {
        // Update game logic here
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#2d5a7d'; // ocean blue
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw temporary elements to show canvas is working
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 100; i++) {
            this.ctx.fillRect(
                Math.random() * this.canvas.width,
                Math.random() * this.canvas.height,
                4, 4
            );
        }
    }

    updateCurrencyUI() {
        const currencyAmountDisplay = document.getElementById('currency-amount');
        if (currencyAmountDisplay) {
            currencyAmountDisplay.innerText = this.currency;
        }
        localStorage.setItem('tinyTides_currency', this.currency);
    }
}

// UI Management
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    
    // Screens
    const loadingScreen = document.getElementById('loading-screen');
    const mainMenu = document.getElementById('main-menu');
    const gameUI = document.getElementById('game-ui');
    
    // Buttons
    const btnStory = document.getElementById('btn-story');
    const btnFreeRoam = document.getElementById('btn-free-roam');
    
    // Fake Loading Process
    let progress = 0;
    const progressBar = document.getElementById('progress-bar');
    
    const loadingInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 100) progress = 100;
        progressBar.style.width = `${progress}%`;
        
        if (progress === 100) {
            clearInterval(loadingInterval);
            setTimeout(() => {
                loadingScreen.classList.remove('active');
                mainMenu.classList.add('active');
            }, 500);
        }
    }, 200);

    // Start Game logic
    const startGame = () => {
        mainMenu.classList.remove('active');
        gameUI.classList.add('active');
        game.start();
    };

    btnStory.addEventListener('click', startGame);
    btnFreeRoam.addEventListener('click', startGame);
});
