// ============================================================
// fishing.js - Underwater fishing minigame
// ============================================================
import { FISH, VIRTUAL_W, VIRTUAL_H, RODS, BAITS } from './data.js';

const UW_W = VIRTUAL_W;
const UW_H = VIRTUAL_H;
const MAX_DEPTH = 250;

// Fish AI behaviors
function updateFishAI(fish, dt, time) {
    const spd = fish.data.speed * 0.8;
    switch (fish.data.behavior) {
        case 'straight':
            fish.x += fish.dirX * spd * dt * 0.04;
            fish.y += Math.sin(time * 2 + fish.seed) * 0.2;
            break;
        case 'hover':
            fish.x += Math.sin(time * 1.5 + fish.seed) * spd * 0.3;
            fish.y += Math.cos(time * 1.2 + fish.seed * 2) * spd * 0.2;
            break;
        case 'zigzag':
            fish.x += fish.dirX * spd * dt * 0.04;
            fish.y += Math.sin(time * 4 + fish.seed) * spd * 0.4;
            break;
        case 'inflate':
            fish.x += Math.sin(time + fish.seed) * spd * 0.4;
            fish.y += Math.cos(time * 0.8 + fish.seed) * spd * 0.2;
            break;
        case 'dash':
            if (Math.sin(time * 0.5 + fish.seed) > 0.8) {
                fish.x += fish.dirX * spd * dt * 0.12;
            } else {
                fish.x += fish.dirX * spd * dt * 0.02;
            }
            fish.y += Math.sin(time * 1.5 + fish.seed) * 0.3;
            break;
        case 'charge':
            fish.x += fish.dirX * spd * dt * 0.05;
            if (Math.sin(time * 0.3 + fish.seed) > 0.7) {
                fish.y += fish.dirY * spd * dt * 0.08;
            }
            break;
        case 'lurk':
            fish.x += Math.sin(time * 0.5 + fish.seed) * 0.3;
            fish.y += Math.sin(time * 0.3 + fish.seed * 3) * 0.15;
            break;
        case 'drift':
            fish.x += fish.dirX * spd * dt * 0.015;
            fish.y += Math.sin(time * 0.8 + fish.seed) * spd * 0.3;
            break;
        case 'erratic':
            fish.x += Math.sin(time * 5 + fish.seed) * spd * 0.5;
            fish.y += Math.cos(time * 3.7 + fish.seed * 2) * spd * 0.4;
            if (Math.random() < 0.01) { fish.dirX *= -1; }
            break;
        case 'shimmer':
            fish.x += fish.dirX * spd * dt * 0.03;
            fish.y += Math.sin(time * 2 + fish.seed) * 0.4;
            fish.shimmer = 0.5 + Math.sin(time * 6) * 0.5;
            break;
        case 'boss':
            fish.x += Math.sin(time * 0.4 + fish.seed) * spd * 0.6;
            fish.y += Math.cos(time * 0.3 + fish.seed) * spd * 0.4;
            // Occasional charge
            if (Math.sin(time * 0.15 + fish.seed) > 0.9) {
                fish.x += fish.dirX * spd * dt * 0.1;
            }
            break;
    }

    // Wrap horizontally
    if (fish.x < -40) { fish.x = UW_W + 30; fish.dirX = -1; }
    if (fish.x > UW_W + 40) { fish.x = -30; fish.dirX = 1; }
    // Keep in depth range
    fish.y = Math.max(fish.data.minDepth * 0.8, Math.min(fish.y, Math.min(fish.data.maxDepth * 0.8, UW_H - 20)));
}

// Draw a fish
function drawFish(ctx, fish, time) {
    const fx = Math.floor(fish.x);
    const fy = Math.floor(fish.y);
    const flip = fish.dirX < 0 ? -1 : 1;
    const size = 6 + fish.data.rarity * 2;

    ctx.save();
    ctx.translate(fx, fy);
    ctx.scale(flip, 1);

    // Shimmer effect for special fish
    if (fish.shimmer !== undefined) {
        ctx.globalAlpha = 0.5 + fish.shimmer * 0.5;
    }

    // Body
    ctx.fillStyle = fish.data.color;
    ctx.fillRect(-size, -size / 3, size * 2, size * 0.7);

    // Head (front)
    ctx.fillRect(size - 2, -size / 3 + 1, 3, size * 0.5);

    // Tail
    ctx.fillRect(-size - 3, -size / 3 - 1, 4, size * 0.9);

    // Eye
    ctx.fillStyle = '#fff';
    ctx.fillRect(size - 3, -size / 3 + 1, 2, 2);
    ctx.fillStyle = '#000';
    ctx.fillRect(size - 2, -size / 3 + 1, 1, 1);

    // Fin
    ctx.fillStyle = fish.data.color;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(-2, -size / 3 - 3, 4, 3);
    ctx.globalAlpha = 1.0;

    // Pufferfish inflation
    if (fish.data.behavior === 'inflate' && fish.threatened) {
        ctx.fillStyle = fish.data.color;
        ctx.fillRect(-size - 2, -size / 2 - 2, size * 2 + 4, size + 4);
        // Spikes
        ctx.fillStyle = '#bbb';
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + time * 2;
            const sx = Math.cos(angle) * (size + 4);
            const sy = Math.sin(angle) * (size / 2 + 4);
            ctx.fillRect(Math.floor(sx) - 1, Math.floor(sy) - 1, 2, 2);
        }
    }

    // Boss aura
    if (fish.data.behavior === 'boss') {
        ctx.globalAlpha = 0.15 + Math.sin(time * 3) * 0.1;
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-size - 5, -size / 2 - 5, size * 2 + 10, size + 10);
        ctx.globalAlpha = 1.0;
    }

    ctx.restore();
}

// --- Fishing State Machine ---
export class FishingMinigame {
    constructor() {
        this.state = 'idle'; // idle, casting, waiting, reeling, caught, escaped
        this.lureX = UW_W / 2;
        this.lureY = 40;
        this.lureTargetY = 40;
        this.activeFish = [];
        this.hookedFish = null;
        this.tension = 50;       // 0-100
        this.catchProgress = 0;  // 0-100
        this.timer = 0;
        this.result = null;      // { fish } or null
        this.bubbles = [];
        this.seaweedPositions = [];
        this.rodPower = 1.0;
        this.baitLure = 1.0;
        this.transitionAlpha = 1.0;
        this.fishPool = [];
        this.spawnTimer = 0;
        this.escapeTimer = 0;

        // Generate seaweed
        for (let i = 0; i < 12; i++) {
            this.seaweedPositions.push({
                x: Math.random() * UW_W,
                h: 20 + Math.random() * 40,
            });
        }
    }

    start(fishPool, rodId, baitId) {
        this.state = 'casting';
        this.lureX = UW_W / 2;
        this.lureY = 0;
        this.lureTargetY = 80;
        this.activeFish = [];
        this.hookedFish = null;
        this.tension = 50;
        this.catchProgress = 0;
        this.timer = 0;
        this.result = null;
        this.transitionAlpha = 1.0;

        const rod = RODS.find(r => r.id === rodId);
        const bait = BAITS.find(b => b.id === baitId);
        this.rodPower = rod ? rod.power : 1.0;
        this.baitLure = bait ? bait.lure : 1.0;

        // Set fish pool
        this.fishPool = fishPool;
        this.spawnTimer = 0;
        this.escapeTimer = 0;

        // Spawn initial fish
        for (let i = 0; i < 3; i++) {
            this._spawnFish();
        }
    }

    _spawnFish() {
        if (this.fishPool.length === 0) return;

        // Weighted random by rarity (lower rarity = more common)
        // Bait lure power increases chance of rare fish
        let totalWeight = 0;
        const weights = this.fishPool.map(f => {
            const w = (7 - f.rarity) + (this.baitLure - 1) * 0.5;
            totalWeight += w;
            return w;
        });

        let r = Math.random() * totalWeight;
        let chosen = this.fishPool[0];
        for (let i = 0; i < weights.length; i++) {
            r -= weights[i];
            if (r <= 0) { chosen = this.fishPool[i]; break; }
        }

        const fromRight = Math.random() > 0.5;
        this.activeFish.push({
            data: chosen,
            x: fromRight ? UW_W + 20 : -20,
            y: chosen.minDepth * 0.8 + Math.random() * (chosen.maxDepth - chosen.minDepth) * 0.6,
            dirX: fromRight ? -1 : 1,
            dirY: Math.random() > 0.5 ? 1 : -1,
            seed: Math.random() * 100,
            shimmer: undefined,
            threatened: false,
        });
    }

    update(dt, input, time) {
        this.timer += dt;

        // Transition fade
        if (this.transitionAlpha > 0) {
            this.transitionAlpha -= dt * 0.003;
            if (this.transitionAlpha < 0) this.transitionAlpha = 0;
        }

        // Bubbles
        if (Math.random() < 0.08) {
            this.bubbles.push({
                x: Math.random() * UW_W,
                y: UW_H + 5,
                speed: 0.3 + Math.random() * 0.5,
                size: 1 + Math.random() * 3,
                wobble: Math.random() * 10,
            });
        }
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const b = this.bubbles[i];
            b.y -= b.speed * dt * 0.05;
            b.x += Math.sin(time * 2 + b.wobble) * 0.3;
            if (b.y < -10) this.bubbles.splice(i, 1);
        }

        if (this.state === 'casting') {
            // Lure sinking
            this.lureY += dt * 0.08;
            if (this.lureY >= this.lureTargetY) {
                this.state = 'waiting';
            }
            return;
        }

        if (this.state === 'waiting') {
            // Control lure
            if (input.isDown('ArrowUp') || input.isDown('KeyW')) this.lureY -= dt * 0.1;
            if (input.isDown('ArrowDown') || input.isDown('KeyS')) this.lureY += dt * 0.1;
            if (input.isDown('ArrowLeft') || input.isDown('KeyA')) this.lureX -= dt * 0.12;
            if (input.isDown('ArrowRight') || input.isDown('KeyD')) this.lureX += dt * 0.12;
            this.lureY = Math.max(20, Math.min(this.lureY, UW_H - 20));
            this.lureX = Math.max(10, Math.min(this.lureX, UW_W - 10));

            // Spawn more fish periodically
            this.spawnTimer += dt;
            if (this.spawnTimer > 2000 && this.activeFish.length < 8) {
                this._spawnFish();
                this.spawnTimer = 0;
            }

            // Update fish AI
            for (const fish of this.activeFish) {
                updateFishAI(fish, dt, time);

                // Check if fish near lure (proximity + bait attractiveness)
                const dx = fish.x - this.lureX;
                const dy = fish.y - this.lureY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Pufferfish inflation
                if (fish.data.behavior === 'inflate') {
                    fish.threatened = dist < 50;
                }

                // Attraction: fish moves toward lure if close enough
                const attractRange = 40 * this.baitLure;
                if (dist < attractRange && dist > 8) {
                    fish.x -= (dx / dist) * 0.3 * this.baitLure;
                    fish.y -= (dy / dist) * 0.3 * this.baitLure;
                }

                // Bite check
                if (dist < 10) {
                    const biteChance = 0.005 * this.baitLure * (1 / fish.data.rarity);
                    if (Math.random() < biteChance) {
                        this.hookedFish = fish;
                        this.state = 'reeling';
                        this.tension = 50;
                        this.catchProgress = 0;
                        this.escapeTimer = 0;
                        break;
                    }
                }
            }
            return;
        }

        if (this.state === 'reeling') {
            const fish = this.hookedFish;
            if (!fish) { this.state = 'waiting'; return; }

            // Fish pulls on line
            const pullStrength = fish.data.strength * 0.4;
            this.tension += (Math.sin(time * fish.data.speed * 2) * pullStrength * dt * 0.01);

            // Random jerks
            if (Math.random() < 0.02 * fish.data.speed) {
                this.tension += (Math.random() - 0.4) * fish.data.strength * 3;
            }

            // Player reeling (hold space to reel in, release to let slack)
            if (input.isDown('Space')) {
                this.tension += dt * 0.03 * (1 / this.rodPower);
                this.catchProgress += dt * 0.02 * this.rodPower;
            } else {
                this.tension -= dt * 0.04;
                this.catchProgress -= dt * 0.005;
            }

            // Direction keys also help control tension
            if (input.isDown('ArrowUp') || input.isDown('KeyW')) {
                this.tension -= dt * 0.015;
            }
            if (input.isDown('ArrowDown') || input.isDown('KeyS')) {
                this.tension += dt * 0.015;
            }

            this.tension = Math.max(0, Math.min(100, this.tension));
            this.catchProgress = Math.max(0, Math.min(100, this.catchProgress));

            // Fish on the hook follows lure with resistance
            fish.x += (this.lureX - fish.x) * 0.05;
            fish.y += (this.lureY - fish.y) * 0.05;

            // Line break (too much tension)
            if (this.tension >= 100) {
                this.escapeTimer += dt;
                if (this.escapeTimer > 500) {
                    this.state = 'escaped';
                    this.hookedFish = null;
                    this.result = null;
                    return;
                }
            } else if (this.tension <= 5) {
                this.escapeTimer += dt;
                if (this.escapeTimer > 800) {
                    this.state = 'escaped';
                    this.hookedFish = null;
                    this.result = null;
                    return;
                }
            } else {
                this.escapeTimer = Math.max(0, this.escapeTimer - dt * 0.5);
            }

            // Catch!
            if (this.catchProgress >= 100) {
                this.state = 'caught';
                this.result = { fish: fish.data };
            }
            return;
        }

        // caught or escaped states just wait for acknowledgment
    }

    draw(ctx, time) {
        // Underwater gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, UW_H);
        gradient.addColorStop(0, '#1a6b8a');
        gradient.addColorStop(0.3, '#145a7a');
        gradient.addColorStop(0.6, '#0e3d5a');
        gradient.addColorStop(1, '#071a2e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, UW_W, UW_H);

        // Light rays from surface
        ctx.save();
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 5; i++) {
            const rx = 80 + i * 120 + Math.sin(time * 0.5 + i) * 30;
            ctx.beginPath();
            ctx.moveTo(rx - 10, 0);
            ctx.lineTo(rx + 10, 0);
            ctx.lineTo(rx + 40 + i * 10, UW_H);
            ctx.lineTo(rx - 40 - i * 10, UW_H);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        // Seaweed at bottom
        for (const sw of this.seaweedPositions) {
            const sway = Math.sin(time * 1.5 + sw.x * 0.1) * 5;
            ctx.fillStyle = '#1e6b3a';
            ctx.fillRect(Math.floor(sw.x + sway), UW_H - sw.h, 3, sw.h);
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(Math.floor(sw.x + sway + 1), UW_H - sw.h + 2, 2, sw.h - 2);
            // Leaves
            ctx.fillRect(Math.floor(sw.x + sway - 2), Math.floor(UW_H - sw.h * 0.6), 3, 2);
            ctx.fillRect(Math.floor(sw.x + sway + 3), Math.floor(UW_H - sw.h * 0.4), 3, 2);
        }

        // Sandy bottom
        ctx.fillStyle = '#3a2810';
        ctx.fillRect(0, UW_H - 6, UW_W, 6);
        ctx.fillStyle = '#5a4020';
        ctx.fillRect(0, UW_H - 8, UW_W, 3);
        // Pebbles
        ctx.fillStyle = '#7a6040';
        for (let i = 0; i < 20; i++) {
            ctx.fillRect(30 + i * 31, UW_H - 4, 3, 2);
        }

        // Bubbles
        ctx.fillStyle = 'rgba(180, 220, 255, 0.4)';
        for (const b of this.bubbles) {
            ctx.beginPath();
            ctx.arc(Math.floor(b.x), Math.floor(b.y), b.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Fish
        for (const fish of this.activeFish) {
            drawFish(ctx, fish, time);
        }

        // Fishing line from top
        ctx.strokeStyle = '#bbb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Math.floor(this.lureX), 0);
        ctx.lineTo(Math.floor(this.lureX), Math.floor(this.lureY));
        ctx.stroke();

        // Lure/hook
        const lx = Math.floor(this.lureX);
        const ly = Math.floor(this.lureY);
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(lx - 1, ly, 3, 4);
        ctx.fillRect(lx, ly + 4, 1, 2);
        ctx.fillRect(lx - 2, ly + 5, 2, 1);
        // Bait glow
        ctx.fillStyle = `rgba(255, 215, 0, ${0.2 + Math.sin(time * 4) * 0.1})`;
        ctx.fillRect(lx - 3, ly - 2, 7, 7);

        // --- UI Overlays ---
        if (this.state === 'reeling') {
            this._drawTensionBar(ctx);
            this._drawCatchBar(ctx);
        }

        if (this.state === 'caught') {
            this._drawResult(ctx, true);
        }
        if (this.state === 'escaped') {
            this._drawResult(ctx, false);
        }

        // Water surface shimmer at top
        ctx.fillStyle = 'rgba(100, 200, 255, 0.15)';
        ctx.fillRect(0, 0, UW_W, 8);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        for (let i = 0; i < UW_W; i += 12) {
            const wh = 2 + Math.sin(time * 3 + i * 0.2) * 2;
            ctx.fillRect(i, 0, 8, wh);
        }

        // Transition fade-in
        if (this.transitionAlpha > 0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${this.transitionAlpha})`;
            ctx.fillRect(0, 0, UW_W, UW_H);
        }

        // Depth indicator
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(8, 8, 50, 14);
        ctx.fillStyle = '#8ac4e0';
        ctx.font = '5px "Press Start 2P"';
        ctx.fillText(`${Math.floor(this.lureY * 0.5)}m`, 12, 18);

        // Controls hint
        if (this.state === 'waiting') {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(UW_W / 2 - 80, UW_H - 20, 160, 14);
            ctx.fillStyle = '#aaa';
            ctx.font = '4px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText('Arrows: Move lure  |  ESC: Leave', UW_W / 2, UW_H - 11);
            ctx.textAlign = 'left';
        } else if (this.state === 'reeling') {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(UW_W / 2 - 90, UW_H - 20, 180, 14);
            ctx.fillStyle = '#ffd700';
            ctx.font = '4px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText('SPACE: Reel in  |  Arrows: Control tension', UW_W / 2, UW_H - 11);
            ctx.textAlign = 'left';
        }
    }

    _drawTensionBar(ctx) {
        const bw = 120;
        const bh = 10;
        const bx = UW_W / 2 - bw / 2;
        const by = 15;

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = '5px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('TENSION', UW_W / 2, by - 2);
        ctx.textAlign = 'left';

        // Background
        ctx.fillStyle = '#111';
        ctx.fillRect(bx, by, bw, bh);

        // Green zone (sweet spot: 30-70)
        ctx.fillStyle = 'rgba(46, 204, 113, 0.3)';
        ctx.fillRect(bx + bw * 0.3, by, bw * 0.4, bh);

        // Danger zones
        ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
        ctx.fillRect(bx, by, bw * 0.15, bh);
        ctx.fillRect(bx + bw * 0.85, by, bw * 0.15, bh);

        // Tension indicator
        const tx = bx + (this.tension / 100) * bw;
        let color = '#2ecc71';
        if (this.tension < 20 || this.tension > 80) color = '#f39c12';
        if (this.tension < 10 || this.tension > 90) color = '#e74c3c';
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(tx) - 2, by - 1, 4, bh + 2);

        // Border
        ctx.strokeStyle = '#5dade2';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, bh);
    }

    _drawCatchBar(ctx) {
        const bw = 120;
        const bh = 8;
        const bx = UW_W / 2 - bw / 2;
        const by = 32;

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = '5px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('CATCH', UW_W / 2, by - 2);
        ctx.textAlign = 'left';

        // Background
        ctx.fillStyle = '#111';
        ctx.fillRect(bx, by, bw, bh);

        // Progress
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(bx, by, bw * (this.catchProgress / 100), bh);

        // Border
        ctx.strokeStyle = '#5dade2';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, bh);
    }

    _drawResult(ctx, success) {
        // Overlay
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, UW_W, UW_H);

        const cx = UW_W / 2;
        const cy = UW_H / 2;

        // Panel
        ctx.fillStyle = '#1a2a3a';
        ctx.fillRect(cx - 100, cy - 50, 200, 100);
        ctx.strokeStyle = '#5dade2';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - 100, cy - 50, 200, 100);

        ctx.textAlign = 'center';
        if (success && this.result) {
            ctx.fillStyle = '#ffd700';
            ctx.font = '8px "Press Start 2P"';
            ctx.fillText('CAUGHT!', cx, cy - 25);

            // Draw the caught fish
            const fakeFish = {
                data: this.result.fish,
                x: cx, y: cy,
                dirX: 1, seed: 0, shimmer: undefined, threatened: false,
            };
            drawFish(ctx, fakeFish, Date.now() / 1000);

            ctx.fillStyle = '#fff';
            ctx.font = '6px "Press Start 2P"';
            ctx.fillText(this.result.fish.name, cx, cy + 20);

            ctx.fillStyle = '#ffd700';
            ctx.font = '5px "Press Start 2P"';
            ctx.fillText(`Value: ${this.result.fish.value}g`, cx, cy + 32);
        } else {
            ctx.fillStyle = '#e74c3c';
            ctx.font = '8px "Press Start 2P"';
            ctx.fillText('GOT AWAY!', cx, cy - 10);
            ctx.fillStyle = '#aaa';
            ctx.font = '5px "Press Start 2P"';
            ctx.fillText('Better luck next time...', cx, cy + 10);
        }

        ctx.fillStyle = '#888';
        ctx.font = '4px "Press Start 2P"';
        ctx.fillText('Press SPACE to continue', cx, cy + 45);
        ctx.textAlign = 'left';
    }

    isFinished() {
        return this.state === 'caught' || this.state === 'escaped';
    }
}
