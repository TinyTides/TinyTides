// ============================================================
// world.js - Map rendering, NPC rendering, fishing spot detection
// ============================================================
import { T, TILE_SIZE, MAP_W, MAP_H, TILE_COLORS, TILE_DETAILS, TILE_SOLID, TILE_FISHABLE,
         VIRTUAL_W, VIRTUAL_H, NPCS, REGIONS, CHESTS, AREA_FISH } from './data.js';

// --- Tile Renderer ---
export function drawMap(ctx, map, cam) {
    const startX = Math.max(0, Math.floor(cam.x / TILE_SIZE));
    const startY = Math.max(0, Math.floor(cam.y / TILE_SIZE));
    const endX = Math.min(MAP_W, Math.ceil((cam.x + VIRTUAL_W) / TILE_SIZE) + 1);
    const endY = Math.min(MAP_H, Math.ceil((cam.y + VIRTUAL_H) / TILE_SIZE) + 1);

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const tile = map[y][x];
            const px = x * TILE_SIZE - cam.x;
            const py = y * TILE_SIZE - cam.y;

            // Base color
            ctx.fillStyle = TILE_COLORS[tile] || '#000';
            ctx.fillRect(Math.floor(px), Math.floor(py), TILE_SIZE, TILE_SIZE);

            // Detail renderer
            const detail = TILE_DETAILS[tile];
            if (detail) {
                detail(ctx, Math.floor(px), Math.floor(py));
            }
        }
    }

    // Water animation - subtle wave lines on shallow water
    const time = Date.now() / 1000;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const tile = map[y][x];
            if (tile === T.SHALLOW || tile === T.DEEP) {
                const px = x * TILE_SIZE - cam.x;
                const py = y * TILE_SIZE - cam.y;
                const waveOffset = Math.sin(time * 1.5 + x * 0.8 + y * 0.3) * 3;
                ctx.fillRect(Math.floor(px + 2 + waveOffset), Math.floor(py + 7), 6, 1);
            }
        }
    }
}

// --- Fishing spot glow effect ---
export function drawFishingSpots(ctx, map, cam) {
    const time = Date.now() / 1000;
    const pulse = 0.3 + Math.sin(time * 3) * 0.2;

    const startX = Math.max(0, Math.floor(cam.x / TILE_SIZE));
    const startY = Math.max(0, Math.floor(cam.y / TILE_SIZE));
    const endX = Math.min(MAP_W, Math.ceil((cam.x + VIRTUAL_W) / TILE_SIZE) + 1);
    const endY = Math.min(MAP_H, Math.ceil((cam.y + VIRTUAL_H) / TILE_SIZE) + 1);

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const tile = map[y][x];
            if (tile === T.CORAL || tile === T.SEAWEED) {
                const px = x * TILE_SIZE - cam.x;
                const py = y * TILE_SIZE - cam.y;
                ctx.fillStyle = `rgba(255, 215, 0, ${pulse * 0.15})`;
                ctx.fillRect(Math.floor(px) - 1, Math.floor(py) - 1, TILE_SIZE + 2, TILE_SIZE + 2);
            }
        }
    }
}

// --- NPC Rendering ---
export function drawNPC(ctx, npc, cam, questState) {
    const px = npc.x * TILE_SIZE - cam.x;
    const py = npc.y * TILE_SIZE - cam.y;

    // Skip if off-screen
    if (px < -20 || px > VIRTUAL_W + 20 || py < -20 || py > VIRTUAL_H + 20) return;

    const time = Date.now() / 1000;
    const bobble = Math.sin(time * 2 + npc.x) * 1;

    const dx = Math.floor(px);
    const dy = Math.floor(py + bobble);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(dx + 2, dy + 14, 12, 3);

    // Body
    ctx.fillStyle = npc.color;
    ctx.fillRect(dx + 4, dy + 6, 8, 8);

    // Head
    ctx.fillStyle = '#f5cfa0';
    ctx.fillRect(dx + 5, dy + 1, 6, 5);

    // Hat
    ctx.fillStyle = npc.hatColor;
    ctx.fillRect(dx + 4, dy - 1, 8, 3);
    ctx.fillRect(dx + 3, dy + 1, 10, 1);

    // Eyes
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(dx + 6, dy + 3, 1, 1);
    ctx.fillRect(dx + 9, dy + 3, 1, 1);

    // Quest indicator
    if (npc.quest) {
        let indicator = '?';
        let indicatorColor = '#aaa';
        if (questState === 'available') {
            indicator = '!';
            indicatorColor = '#ffd700';
        } else if (questState === 'active') {
            indicator = '?';
            indicatorColor = '#f39c12';
        } else if (questState === 'ready') {
            indicator = '!';
            indicatorColor = '#2ecc71';
        }

        const iy = dy - 8 + Math.sin(time * 4) * 2;
        ctx.fillStyle = indicatorColor;
        ctx.font = '8px "Press Start 2P"';
        ctx.fillText(indicator, dx + 6, iy);
    }

    // Name tag (only when player is close, handled in game.js via param)
}

export function drawNPCNameTag(ctx, npc, cam) {
    const px = npc.x * TILE_SIZE - cam.x;
    const py = npc.y * TILE_SIZE - cam.y;
    const dx = Math.floor(px);
    const dy = Math.floor(py);

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    const nameWidth = npc.name.length * 4 + 8;
    ctx.fillRect(dx + 8 - nameWidth / 2, dy - 14, nameWidth, 8);
    ctx.fillStyle = '#ffd700';
    ctx.font = '4px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(npc.name, dx + 8, dy - 8);
    ctx.textAlign = 'left';
}

// --- Interaction Prompt ---
export function drawInteractPrompt(ctx, x, y, cam, text) {
    const px = Math.floor(x * TILE_SIZE - cam.x);
    const py = Math.floor(y * TILE_SIZE - cam.y - 20);
    const time = Date.now() / 1000;
    const bob = Math.sin(time * 4) * 2;

    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    const w = text.length * 5 + 12;
    ctx.fillRect(px + 8 - w / 2, py + bob - 2, w, 10);
    ctx.fillStyle = '#fff';
    ctx.font = '5px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(text, px + 8, py + bob + 5);
    ctx.textAlign = 'left';
}

// --- Minimap ---
export function drawMinimap(ctx, map, playerX, playerY) {
    const mmSize = 80;
    const mmX = VIRTUAL_W - mmSize - 8;
    const mmY = 8;
    const scale = mmSize / Math.max(MAP_W, MAP_H);

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(mmX - 2, mmY - 2, mmSize + 4, (MAP_H * scale) + 4);

    // Border
    ctx.strokeStyle = '#5dade2';
    ctx.lineWidth = 1;
    ctx.strokeRect(mmX - 2, mmY - 2, mmSize + 4, (MAP_H * scale) + 4);

    // Tiles (sampled, not every tile)
    const step = 2;
    for (let y = 0; y < MAP_H; y += step) {
        for (let x = 0; x < MAP_W; x += step) {
            const tile = map[y][x];
            ctx.fillStyle = TILE_COLORS[tile] || '#000';
            ctx.fillRect(mmX + x * scale, mmY + y * scale, Math.ceil(step * scale), Math.ceil(step * scale));
        }
    }

    // Player dot
    ctx.fillStyle = '#ff0';
    ctx.fillRect(
        Math.floor(mmX + playerX * scale) - 1,
        Math.floor(mmY + playerY * scale) - 1,
        3, 3
    );

    // NPC dots
    ctx.fillStyle = '#f00';
    for (const npc of NPCS) {
        ctx.fillRect(
            Math.floor(mmX + npc.x * scale),
            Math.floor(mmY + npc.y * scale),
            2, 2
        );
    }
}

// --- Region Detection ---
export function getRegionAt(x, y) {
    // Check which named region a tile coordinate falls in
    for (const reg of REGIONS) {
        const d = ((x - reg.cx) / reg.rx) ** 2 + ((y - reg.cy) / reg.ry) ** 2;
        if (d < 1.0) return reg.name;
    }
    return 'open_sea';
}

export function getAreaFish(region) {
    return AREA_FISH[region] || ['sardine', 'mackerel'];
}

// --- Collision ---
export function isSolid(map, tx, ty) {
    if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) return true;
    return TILE_SOLID.has(map[ty][tx]);
}

export function canFishHere(map, px, py) {
    // Check tiles around the player position
    const tx = Math.floor(px);
    const ty = Math.floor(py);
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const cx = tx + dx;
            const cy = ty + dy;
            if (cx >= 0 && cx < MAP_W && cy >= 0 && cy < MAP_H) {
                const tile = map[cy][cx];
                if (tile === T.CORAL || tile === T.SEAWEED) return true;
            }
        }
    }
    return TILE_FISHABLE.has(map[ty]?.[tx]);
}
