// ============================================================
// engine.js - Input handling, Camera, Audio, Save/Load
// ============================================================
import { VIRTUAL_W, VIRTUAL_H, MAP_W, MAP_H, TILE_SIZE, getDefaultSave } from './data.js';

// --- Input Manager ---
export class Input {
    constructor() {
        this.keys = {};
        this.prevKeys = {};
        this.mouse = { x: 0, y: 0, down: false, clicked: false };

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            e.preventDefault();
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        window.addEventListener('mousedown', () => { this.mouse.down = true; this.mouse.clicked = true; });
        window.addEventListener('mouseup', () => { this.mouse.down = false; });
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    }

    isDown(code) { return !!this.keys[code]; }
    justPressed(code) { return !!this.keys[code] && !this.prevKeys[code]; }

    endFrame() {
        this.prevKeys = { ...this.keys };
        this.mouse.clicked = false;
    }
}

// --- Camera ---
export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.shakeAmount = 0;
        this.shakeTimer = 0;
    }

    follow(tx, ty, dt) {
        this.targetX = tx - VIRTUAL_W / 2;
        this.targetY = ty - VIRTUAL_H / 2;

        // Smooth lerp
        const speed = 0.08;
        this.x += (this.targetX - this.x) * speed;
        this.y += (this.targetY - this.y) * speed;

        // Clamp to map bounds
        this.x = Math.max(0, Math.min(this.x, MAP_W * TILE_SIZE - VIRTUAL_W));
        this.y = Math.max(0, Math.min(this.y, MAP_H * TILE_SIZE - VIRTUAL_H));

        // Screen shake
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
            this.x += (Math.random() - 0.5) * this.shakeAmount;
            this.y += (Math.random() - 0.5) * this.shakeAmount;
        }
    }

    shake(amount, duration) {
        this.shakeAmount = amount;
        this.shakeTimer = duration;
    }
}

// --- Audio Manager (Web Audio API - procedural retro sounds) ---
export class Audio {
    constructor() {
        this.ctx = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.musicVolume = 0.3;
        this.sfxVolume = 0.5;
        this.musicPlaying = false;
        this.currentOsc = null;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = this.musicVolume;
        this.musicGain.connect(this.ctx.destination);
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = this.sfxVolume;
        this.sfxGain.connect(this.ctx.destination);
    }

    playTone(freq, duration, type = 'square', dest = null) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(dest || this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // SFX
    sfxCast() {
        this.playTone(440, 0.1, 'sine');
        setTimeout(() => this.playTone(330, 0.15, 'sine'), 100);
        setTimeout(() => this.playTone(220, 0.2, 'sine'), 200);
    }
    sfxBite() {
        this.playTone(880, 0.08, 'square');
        setTimeout(() => this.playTone(1100, 0.08, 'square'), 80);
    }
    sfxCatch() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((n, i) => setTimeout(() => this.playTone(n, 0.15, 'square'), i * 100));
    }
    sfxFail() {
        this.playTone(300, 0.2, 'sawtooth');
        setTimeout(() => this.playTone(200, 0.3, 'sawtooth'), 150);
    }
    sfxSelect() {
        this.playTone(660, 0.06, 'square');
    }
    sfxBuy() {
        this.playTone(523, 0.1, 'sine');
        setTimeout(() => this.playTone(784, 0.15, 'sine'), 100);
    }
    sfxOpen() {
        this.playTone(400, 0.1, 'triangle');
        setTimeout(() => this.playTone(600, 0.12, 'triangle'), 100);
    }
    sfxChest() {
        const notes = [392, 494, 587, 784, 988];
        notes.forEach((n, i) => setTimeout(() => this.playTone(n, 0.2, 'sine'), i * 120));
    }
    sfxDialogue() {
        const freq = 200 + Math.random() * 200;
        this.playTone(freq, 0.04, 'square');
    }

    // Ambient ocean music loop (simple procedural melody)
    startMusic() {
        if (!this.ctx || this.musicPlaying) return;
        this.musicPlaying = true;
        this._playMusicLoop();
    }

    _playMusicLoop() {
        if (!this.musicPlaying) return;
        // Pentatonic ocean melody
        const scale = [262, 294, 330, 392, 440, 523, 587, 659];
        const pattern = [0, 2, 4, 2, 5, 4, 3, 1];
        let time = 0;
        pattern.forEach((noteIdx) => {
            setTimeout(() => {
                if (!this.musicPlaying) return;
                this.playTone(scale[noteIdx], 0.5, 'sine', this.musicGain);
                // Harmony
                this.playTone(scale[noteIdx] / 2, 0.6, 'triangle', this.musicGain);
            }, time);
            time += 600;
        });
        setTimeout(() => this._playMusicLoop(), time);
    }

    stopMusic() {
        this.musicPlaying = false;
    }
}

// --- Save Manager ---
const SAVE_KEY = 'tinyTides_save';

export function saveGame(state) {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));
        return true;
    } catch (e) {
        console.error('Save failed:', e);
        return false;
    }
}

export function loadGame() {
    try {
        const data = localStorage.getItem(SAVE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            // Merge with defaults in case of schema changes
            return { ...getDefaultSave(), ...parsed };
        }
    } catch (e) {
        console.error('Load failed:', e);
    }
    return null;
}

export function hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
}

export function deleteSave() {
    localStorage.removeItem(SAVE_KEY);
}
