// ============================================================
// player.js - Player boat entity, movement, rendering
// ============================================================
import { TILE_SIZE, BOATS, VIRTUAL_W, VIRTUAL_H } from './data.js';
import { isSolid } from './world.js';

export class Player {
    constructor(save) {
        this.x = save.playerX;  // tile coords (float)
        this.y = save.playerY;
        this.vx = 0;
        this.vy = 0;
        this.dir = 0;  // 0=down, 1=left, 2=up, 3=right
        this.boatId = save.boat;
        this.bobTimer = 0;
        this.wakeParticles = [];
    }

    getSpeed() {
        const boat = BOATS.find(b => b.id === this.boatId);
        return (boat ? boat.speed : 1.0) * 2.5;
    }

    update(dt, input, map) {
        const speed = this.getSpeed();
        const accel = speed * 0.005;
        const friction = 0.88;

        // Input
        let ax = 0, ay = 0;
        if (input.isDown('ArrowLeft') || input.isDown('KeyA')) { ax = -1; this.dir = 1; }
        if (input.isDown('ArrowRight') || input.isDown('KeyD')) { ax = 1; this.dir = 3; }
        if (input.isDown('ArrowUp') || input.isDown('KeyW')) { ay = -1; this.dir = 2; }
        if (input.isDown('ArrowDown') || input.isDown('KeyS')) { ay = 1; this.dir = 0; }

        // Normalize diagonal
        if (ax !== 0 && ay !== 0) {
            ax *= 0.707;
            ay *= 0.707;
        }

        this.vx += ax * accel * dt;
        this.vy += ay * accel * dt;
        this.vx *= friction;
        this.vy *= friction;

        // Collision - horizontal
        const nextX = this.x + this.vx;
        const tileX = Math.floor(nextX);
        const tileY = Math.floor(this.y);
        if (!isSolid(map, tileX, tileY) && !isSolid(map, tileX, Math.floor(this.y + 0.5))) {
            this.x = nextX;
        } else {
            this.vx = 0;
        }

        // Collision - vertical
        const nextY = this.y + this.vy;
        const tileX2 = Math.floor(this.x);
        const tileY2 = Math.floor(nextY);
        if (!isSolid(map, tileX2, tileY2) && !isSolid(map, Math.floor(this.x + 0.5), tileY2)) {
            this.y = nextY;
        } else {
            this.vy = 0;
        }

        // Bobbing
        this.bobTimer += dt * 0.003;

        // Wake particles
        if (Math.abs(this.vx) > 0.01 || Math.abs(this.vy) > 0.01) {
            if (Math.random() < 0.3) {
                this.wakeParticles.push({
                    x: this.x * TILE_SIZE + 8,
                    y: this.y * TILE_SIZE + 14,
                    life: 1.0,
                    vx: -this.vx * 3 + (Math.random() - 0.5) * 0.5,
                    vy: -this.vy * 3 + (Math.random() - 0.5) * 0.5,
                });
            }
        }
        // Update particles
        for (let i = this.wakeParticles.length - 1; i >= 0; i--) {
            const p = this.wakeParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= dt * 0.003;
            if (p.life <= 0) this.wakeParticles.splice(i, 1);
        }
    }

    draw(ctx, cam) {
        const px = Math.floor(this.x * TILE_SIZE - cam.x);
        const py = Math.floor(this.y * TILE_SIZE - cam.y);
        const bob = Math.sin(this.bobTimer) * 1.5;

        // Wake particles
        for (const p of this.wakeParticles) {
            ctx.fillStyle = `rgba(200, 230, 255, ${p.life * 0.4})`;
            ctx.fillRect(Math.floor(p.x - cam.x), Math.floor(p.y - cam.y), 2, 2);
        }

        // Shadow on water
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(px + 2, py + 14, 12, 4);

        const bx = px;
        const by = py + bob;

        // Boat hull
        ctx.fillStyle = '#8b6914';
        ctx.fillRect(bx + 2, by + 6, 12, 8);
        ctx.fillStyle = '#a07820';
        ctx.fillRect(bx + 3, by + 7, 10, 6);

        // Boat trim
        ctx.fillStyle = '#6b4a14';
        ctx.fillRect(bx + 2, by + 6, 12, 1);
        ctx.fillRect(bx + 2, by + 13, 12, 1);

        // Player character on boat
        // Body
        ctx.fillStyle = '#3498db';
        ctx.fillRect(bx + 5, by + 2, 6, 5);
        // Head
        ctx.fillStyle = '#f5cfa0';
        ctx.fillRect(bx + 6, by - 2, 4, 4);
        // Hair
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(bx + 6, by - 3, 4, 2);
        // Eyes
        ctx.fillStyle = '#1a1a1a';
        if (this.dir === 0) {
            ctx.fillRect(bx + 7, by, 1, 1);
            ctx.fillRect(bx + 9, by, 1, 1);
        } else if (this.dir === 2) {
            // facing up - no eyes visible
        } else if (this.dir === 1) {
            ctx.fillRect(bx + 6, by, 1, 1);
        } else {
            ctx.fillRect(bx + 9, by, 1, 1);
        }

        // Fishing rod (if not currently fishing)
        ctx.fillStyle = '#5c3a1e';
        if (this.dir === 3) {
            ctx.fillRect(bx + 12, by - 2, 1, 6);
            ctx.fillRect(bx + 12, by - 2, 4, 1);
            // Line
            ctx.fillStyle = '#aaa';
            ctx.fillRect(bx + 15, by - 2, 1, 3);
        } else if (this.dir === 1) {
            ctx.fillRect(bx + 3, by - 2, 1, 6);
            ctx.fillRect(bx, by - 2, 4, 1);
            ctx.fillStyle = '#aaa';
            ctx.fillRect(bx, by - 2, 1, 3);
        } else {
            ctx.fillRect(bx + 12, by - 3, 1, 6);
            ctx.fillRect(bx + 12, by - 3, 5, 1);
            ctx.fillStyle = '#aaa';
            ctx.fillRect(bx + 16, by - 3, 1, 4);
        }
    }

    getTileX() { return Math.floor(this.x); }
    getTileY() { return Math.floor(this.y); }
    getPixelX() { return this.x * TILE_SIZE + 8; }
    getPixelY() { return this.y * TILE_SIZE + 8; }
}
