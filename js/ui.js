// ============================================================
// ui.js - Dialogue, Shop, Inventory, Quest Log, Notifications
// ============================================================
import { VIRTUAL_W, VIRTUAL_H, FISH, RODS, BOATS, BAITS, QUESTS, NPCS } from './data.js';

// --- Dialogue System ---
export class DialogueUI {
    constructor() {
        this.active = false;
        this.lines = [];
        this.currentLine = 0;
        this.charIndex = 0;
        this.charTimer = 0;
        this.speakerName = '';
        this.onComplete = null;
        this.textSpeed = 30; // ms per char
    }

    start(name, lines, onComplete) {
        this.active = true;
        this.speakerName = name;
        this.lines = lines;
        this.currentLine = 0;
        this.charIndex = 0;
        this.charTimer = 0;
        this.onComplete = onComplete || null;
    }

    update(dt, input, audio) {
        if (!this.active) return;

        this.charTimer += dt;
        const line = this.lines[this.currentLine] || '';

        if (this.charTimer >= this.textSpeed) {
            this.charTimer = 0;
            if (this.charIndex < line.length) {
                this.charIndex++;
                if (audio && this.charIndex % 3 === 0) audio.sfxDialogue();
            }
        }

        // Advance / skip
        if (input.justPressed('Space') || input.justPressed('Enter') || input.justPressed('KeyE')) {
            if (this.charIndex < line.length) {
                // Skip to end of line
                this.charIndex = line.length;
            } else {
                // Next line
                this.currentLine++;
                this.charIndex = 0;
                if (this.currentLine >= this.lines.length) {
                    this.active = false;
                    if (this.onComplete) this.onComplete();
                }
            }
        }
    }

    draw(ctx) {
        if (!this.active) return;

        const boxH = 70;
        const boxY = VIRTUAL_H - boxH - 10;
        const boxX = 20;
        const boxW = VIRTUAL_W - 40;

        // Panel background
        ctx.fillStyle = '#0d1b2e';
        ctx.fillRect(boxX, boxY, boxW, boxH);

        // Border
        ctx.strokeStyle = '#5dade2';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Inner border
        ctx.strokeStyle = '#2874a6';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX + 3, boxY + 3, boxW - 6, boxH - 6);

        // Speaker name
        ctx.fillStyle = '#0d1b2e';
        ctx.fillRect(boxX + 10, boxY - 8, this.speakerName.length * 6 + 12, 12);
        ctx.strokeStyle = '#5dade2';
        ctx.strokeRect(boxX + 10, boxY - 8, this.speakerName.length * 6 + 12, 12);
        ctx.fillStyle = '#ffd700';
        ctx.font = '6px "Press Start 2P"';
        ctx.fillText(this.speakerName, boxX + 16, boxY);

        // Text
        const line = this.lines[this.currentLine] || '';
        const visibleText = line.substring(0, this.charIndex);
        ctx.fillStyle = '#e0e0e0';
        ctx.font = '5px "Press Start 2P"';

        // Word wrap
        const maxLineW = boxW - 24;
        const words = visibleText.split(' ');
        let drawLine = '';
        let lineY = boxY + 18;
        for (const word of words) {
            const testLine = drawLine + word + ' ';
            if (ctx.measureText(testLine).width > maxLineW) {
                ctx.fillText(drawLine, boxX + 12, lineY);
                drawLine = word + ' ';
                lineY += 10;
            } else {
                drawLine = testLine;
            }
        }
        ctx.fillText(drawLine, boxX + 12, lineY);

        // Continue indicator
        if (this.charIndex >= line.length) {
            const blink = Math.sin(Date.now() / 200) > 0;
            if (blink) {
                ctx.fillStyle = '#5dade2';
                ctx.fillRect(boxX + boxW - 20, boxY + boxH - 14, 6, 6);
            }
        }
    }
}

// --- Shop UI ---
export class ShopUI {
    constructor() {
        this.active = false;
        this.tab = 0;      // 0=rods, 1=boats, 2=bait
        this.cursor = 0;
        this.sellMode = false;
        this.message = '';
        this.messageTimer = 0;
    }

    open() { this.active = true; this.tab = 0; this.cursor = 0; this.sellMode = false; }
    close() { this.active = false; }

    getItems() {
        if (this.tab === 0) return RODS;
        if (this.tab === 1) return BOATS;
        if (this.tab === 2) return BAITS;
        return [];
    }

    update(dt, input, save, audio) {
        if (!this.active) return;

        if (this.messageTimer > 0) this.messageTimer -= dt;

        // Tab switching
        if (input.justPressed('KeyQ') || input.justPressed('BracketLeft')) {
            this.tab = (this.tab + 2) % 3;
            this.cursor = 0;
            if (audio) audio.sfxSelect();
        }
        if (input.justPressed('KeyR') || input.justPressed('BracketRight')) {
            this.tab = (this.tab + 1) % 3;
            this.cursor = 0;
            if (audio) audio.sfxSelect();
        }

        const items = this.getItems();

        // Cursor
        if (input.justPressed('ArrowUp') || input.justPressed('KeyW')) {
            this.cursor = Math.max(0, this.cursor - 1);
            if (audio) audio.sfxSelect();
        }
        if (input.justPressed('ArrowDown') || input.justPressed('KeyS')) {
            this.cursor = Math.min(items.length - 1, this.cursor + 1);
            if (audio) audio.sfxSelect();
        }

        // Buy
        if (input.justPressed('Space') || input.justPressed('Enter')) {
            const item = items[this.cursor];
            if (item) {
                if (item.cost === 0) {
                    this.message = 'Already owned!';
                    this.messageTimer = 1500;
                } else if (save.currency >= item.cost) {
                    save.currency -= item.cost;
                    if (this.tab === 0) save.rod = item.id;
                    if (this.tab === 1) save.boat = item.id;
                    if (this.tab === 2) save.bait = item.id;
                    this.message = `Bought ${item.name}!`;
                    this.messageTimer = 1500;
                    if (audio) audio.sfxBuy();
                } else {
                    this.message = 'Not enough gold!';
                    this.messageTimer = 1500;
                    if (audio) audio.sfxFail();
                }
            }
        }

        // Close
        if (input.justPressed('Escape') || input.justPressed('KeyE')) {
            this.close();
            if (audio) audio.sfxOpen();
        }
    }

    draw(ctx, save) {
        if (!this.active) return;

        // Full overlay
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);

        const panelX = 60;
        const panelY = 30;
        const panelW = VIRTUAL_W - 120;
        const panelH = VIRTUAL_H - 60;

        // Panel
        ctx.fillStyle = '#0d1b2e';
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.strokeStyle = '#5dade2';
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, panelY, panelW, panelH);

        // Title
        ctx.fillStyle = '#ffd700';
        ctx.font = '8px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText("MERCHANT PETE'S SHOP", VIRTUAL_W / 2, panelY + 16);

        // Gold display
        ctx.fillStyle = '#ffd700';
        ctx.font = '6px "Press Start 2P"';
        ctx.fillText(`Gold: ${save.currency}`, VIRTUAL_W / 2, panelY + 30);

        // Tabs
        const tabs = ['RODS', 'BOATS', 'BAIT'];
        const tabW = panelW / 3;
        for (let i = 0; i < 3; i++) {
            const tx = panelX + i * tabW;
            ctx.fillStyle = i === this.tab ? '#1a3a5c' : '#0a1520';
            ctx.fillRect(tx, panelY + 38, tabW, 14);
            ctx.strokeStyle = '#5dade2';
            ctx.strokeRect(tx, panelY + 38, tabW, 14);
            ctx.fillStyle = i === this.tab ? '#ffd700' : '#888';
            ctx.font = '5px "Press Start 2P"';
            ctx.fillText(tabs[i], tx + tabW / 2, panelY + 48);
        }

        // Items
        const items = this.getItems();
        const listY = panelY + 58;
        ctx.textAlign = 'left';

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const iy = listY + i * 22;

            // Cursor highlight
            if (i === this.cursor) {
                ctx.fillStyle = 'rgba(93, 173, 226, 0.2)';
                ctx.fillRect(panelX + 8, iy - 4, panelW - 16, 20);
                ctx.strokeStyle = '#5dade2';
                ctx.strokeRect(panelX + 8, iy - 4, panelW - 16, 20);
            }

            // Owned indicator
            const owned = (this.tab === 0 && save.rod === item.id) ||
                          (this.tab === 1 && save.boat === item.id) ||
                          (this.tab === 2 && save.bait === item.id);

            ctx.fillStyle = owned ? '#2ecc71' : '#e0e0e0';
            ctx.font = '5px "Press Start 2P"';
            ctx.fillText(item.name, panelX + 14, iy + 4);

            ctx.fillStyle = item.cost === 0 ? '#2ecc71' : (save.currency >= item.cost ? '#ffd700' : '#e74c3c');
            ctx.fillText(item.cost === 0 ? 'FREE' : `${item.cost}g`, panelX + panelW - 60, iy + 4);

            ctx.fillStyle = '#888';
            ctx.font = '4px "Press Start 2P"';
            ctx.fillText(item.desc, panelX + 14, iy + 13);

            if (owned) {
                ctx.fillStyle = '#2ecc71';
                ctx.font = '4px "Press Start 2P"';
                ctx.fillText('[EQUIPPED]', panelX + panelW - 120, iy + 4);
            }
        }

        // Message
        if (this.messageTimer > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(VIRTUAL_W / 2 - 80, VIRTUAL_H / 2 - 10, 160, 20);
            ctx.fillStyle = '#ffd700';
            ctx.font = '6px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText(this.message, VIRTUAL_W / 2, VIRTUAL_H / 2 + 4);
        }

        // Controls
        ctx.fillStyle = '#666';
        ctx.font = '4px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('Q/R: Tabs  |  W/S: Select  |  SPACE: Buy  |  ESC: Close', VIRTUAL_W / 2, panelY + panelH - 6);
        ctx.textAlign = 'left';
    }
}

// --- Inventory UI ---
export class InventoryUI {
    constructor() {
        this.active = false;
        this.cursor = 0;
        this.sellMessage = '';
        this.sellTimer = 0;
    }

    open() { this.active = true; this.cursor = 0; }
    close() { this.active = false; }

    update(dt, input, save, audio) {
        if (!this.active) return;

        if (this.sellTimer > 0) this.sellTimer -= dt;

        if (input.justPressed('ArrowUp') || input.justPressed('KeyW')) {
            this.cursor = Math.max(0, this.cursor - 1);
            if (audio) audio.sfxSelect();
        }
        if (input.justPressed('ArrowDown') || input.justPressed('KeyS')) {
            this.cursor = Math.min(Math.max(0, save.inventory.length - 1), this.cursor + 1);
            if (audio) audio.sfxSelect();
        }

        // Sell fish
        if (input.justPressed('Space') || input.justPressed('Enter')) {
            if (save.inventory.length > 0 && this.cursor < save.inventory.length) {
                const item = save.inventory[this.cursor];
                const fishData = FISH.find(f => f.id === item.fishId);
                if (fishData) {
                    save.currency += fishData.value * item.count;
                    this.sellMessage = `Sold ${item.count}x ${fishData.name} for ${fishData.value * item.count}g!`;
                    this.sellTimer = 2000;
                    save.inventory.splice(this.cursor, 1);
                    if (this.cursor >= save.inventory.length) this.cursor = Math.max(0, save.inventory.length - 1);
                    if (audio) audio.sfxBuy();
                }
            }
        }

        if (input.justPressed('Escape') || input.justPressed('KeyI')) {
            this.close();
            if (audio) audio.sfxOpen();
        }
    }

    draw(ctx, save) {
        if (!this.active) return;

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);

        const panelX = 80;
        const panelY = 30;
        const panelW = VIRTUAL_W - 160;
        const panelH = VIRTUAL_H - 60;

        ctx.fillStyle = '#0d1b2e';
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.strokeStyle = '#5dade2';
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, panelY, panelW, panelH);

        // Title
        ctx.fillStyle = '#ffd700';
        ctx.font = '8px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('INVENTORY', VIRTUAL_W / 2, panelY + 16);

        // Equipment
        ctx.fillStyle = '#5dade2';
        ctx.font = '5px "Press Start 2P"';
        ctx.textAlign = 'left';
        const rod = RODS.find(r => r.id === save.rod);
        const boat = BOATS.find(b => b.id === save.boat);
        const bait = BAITS.find(b => b.id === save.bait);
        ctx.fillText(`Rod: ${rod ? rod.name : '?'}`, panelX + 10, panelY + 30);
        ctx.fillText(`Boat: ${boat ? boat.name : '?'}`, panelX + 10, panelY + 40);
        ctx.fillText(`Bait: ${bait ? bait.name : '?'}`, panelX + 10, panelY + 50);

        // Fish stats
        ctx.fillStyle = '#aaa';
        ctx.fillText(`Total caught: ${save.totalFishCaught}`, panelX + panelW / 2, panelY + 30);
        ctx.fillText(`Species: ${Object.keys(save.caughtLog).length}/${FISH.length}`, panelX + panelW / 2, panelY + 40);

        // Divider
        ctx.strokeStyle = '#2874a6';
        ctx.beginPath();
        ctx.moveTo(panelX + 10, panelY + 56);
        ctx.lineTo(panelX + panelW - 10, panelY + 56);
        ctx.stroke();

        // Fish list
        ctx.fillStyle = '#888';
        ctx.font = '5px "Press Start 2P"';
        ctx.fillText('FISH (SPACE to sell)', panelX + 10, panelY + 66);

        if (save.inventory.length === 0) {
            ctx.fillStyle = '#555';
            ctx.textAlign = 'center';
            ctx.fillText('No fish in inventory', VIRTUAL_W / 2, panelY + 90);
            ctx.textAlign = 'left';
        } else {
            for (let i = 0; i < save.inventory.length; i++) {
                const item = save.inventory[i];
                const fishData = FISH.find(f => f.id === item.fishId);
                const iy = panelY + 75 + i * 18;

                if (i === this.cursor) {
                    ctx.fillStyle = 'rgba(93, 173, 226, 0.2)';
                    ctx.fillRect(panelX + 6, iy - 4, panelW - 12, 16);
                    ctx.strokeStyle = '#5dade2';
                    ctx.strokeRect(panelX + 6, iy - 4, panelW - 12, 16);
                }

                if (fishData) {
                    // Fish color dot
                    ctx.fillStyle = fishData.color;
                    ctx.fillRect(panelX + 12, iy + 1, 6, 6);

                    ctx.fillStyle = '#e0e0e0';
                    ctx.font = '5px "Press Start 2P"';
                    ctx.fillText(`${fishData.name} x${item.count}`, panelX + 22, iy + 6);

                    ctx.fillStyle = '#ffd700';
                    ctx.fillText(`${fishData.value * item.count}g`, panelX + panelW - 60, iy + 6);
                }
            }
        }

        // Sell message
        if (this.sellTimer > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(VIRTUAL_W / 2 - 100, VIRTUAL_H / 2 - 10, 200, 20);
            ctx.fillStyle = '#2ecc71';
            ctx.font = '5px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText(this.sellMessage, VIRTUAL_W / 2, VIRTUAL_H / 2 + 3);
            ctx.textAlign = 'left';
        }

        // Controls
        ctx.fillStyle = '#666';
        ctx.font = '4px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('W/S: Select  |  SPACE: Sell  |  I/ESC: Close', VIRTUAL_W / 2, panelY + panelH - 6);
        ctx.textAlign = 'left';
    }
}

// --- Quest Log UI ---
export class QuestLogUI {
    constructor() {
        this.active = false;
    }

    open() { this.active = true; }
    close() { this.active = false; }

    update(dt, input, audio) {
        if (!this.active) return;
        if (input.justPressed('Escape') || input.justPressed('KeyQ')) {
            this.close();
            if (audio) audio.sfxOpen();
        }
    }

    draw(ctx, save) {
        if (!this.active) return;

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);

        const panelX = 60;
        const panelY = 30;
        const panelW = VIRTUAL_W - 120;
        const panelH = VIRTUAL_H - 60;

        ctx.fillStyle = '#0d1b2e';
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.strokeStyle = '#5dade2';
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, panelY, panelW, panelH);

        ctx.fillStyle = '#ffd700';
        ctx.font = '8px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('QUEST LOG', VIRTUAL_W / 2, panelY + 16);
        ctx.textAlign = 'left';

        // Active quest
        if (save.activeQuest) {
            const quest = QUESTS.find(q => q.id === save.activeQuest);
            if (quest) {
                ctx.fillStyle = '#ffd700';
                ctx.font = '6px "Press Start 2P"';
                ctx.fillText('Active:', panelX + 12, panelY + 36);
                ctx.fillStyle = '#fff';
                ctx.fillText(quest.name, panelX + 60, panelY + 36);

                ctx.fillStyle = '#aaa';
                ctx.font = '5px "Press Start 2P"';
                ctx.fillText(quest.desc, panelX + 12, panelY + 50);

                // Objectives
                const progress = save.questProgress[quest.id] || {};
                let oy = panelY + 65;
                for (const obj of quest.objectives) {
                    const fishData = FISH.find(f => f.id === obj.fish);
                    const current = progress[obj.fish] || 0;
                    const done = current >= obj.count;
                    ctx.fillStyle = done ? '#2ecc71' : '#e0e0e0';
                    ctx.font = '5px "Press Start 2P"';
                    ctx.fillText(
                        `${done ? '[X]' : '[ ]'} ${fishData ? fishData.name : obj.fish}: ${current}/${obj.count}`,
                        panelX + 16, oy
                    );
                    oy += 12;
                }

                // Reward
                ctx.fillStyle = '#ffd700';
                ctx.font = '5px "Press Start 2P"';
                ctx.fillText(`Reward: ${quest.reward.gold}g`, panelX + 12, oy + 8);
            }
        } else {
            ctx.fillStyle = '#555';
            ctx.font = '5px "Press Start 2P"';
            ctx.fillText('No active quest. Talk to NPCs!', panelX + 12, panelY + 40);
        }

        // Completed quests
        ctx.fillStyle = '#5dade2';
        ctx.font = '6px "Press Start 2P"';
        ctx.fillText('Completed:', panelX + 12, panelY + panelH - 60);
        
        let cy = panelY + panelH - 48;
        if (save.questsCompleted.length === 0) {
            ctx.fillStyle = '#555';
            ctx.font = '4px "Press Start 2P"';
            ctx.fillText('None yet', panelX + 12, cy);
        } else {
            for (const qid of save.questsCompleted) {
                const q = QUESTS.find(qq => qq.id === qid);
                if (q) {
                    ctx.fillStyle = '#2ecc71';
                    ctx.font = '4px "Press Start 2P"';
                    ctx.fillText(`[X] ${q.name}`, panelX + 12, cy);
                    cy += 10;
                }
            }
        }

        // Controls
        ctx.fillStyle = '#666';
        ctx.font = '4px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('Q/ESC: Close', VIRTUAL_W / 2, panelY + panelH - 6);
        ctx.textAlign = 'left';
    }
}

// --- Notification System ---
export class Notifications {
    constructor() {
        this.items = []; // { text, timer, color }
    }

    add(text, color = '#fff', duration = 3000) {
        this.items.push({ text, color, timer: duration, maxTimer: duration });
    }

    update(dt) {
        for (let i = this.items.length - 1; i >= 0; i--) {
            this.items[i].timer -= dt;
            if (this.items[i].timer <= 0) this.items.splice(i, 1);
        }
    }

    draw(ctx) {
        for (let i = 0; i < this.items.length; i++) {
            const n = this.items[i];
            const alpha = Math.min(1, n.timer / 500);
            const y = VIRTUAL_H - 40 - i * 14;

            ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.7})`;
            const w = n.text.length * 5 + 16;
            ctx.fillRect(VIRTUAL_W / 2 - w / 2, y - 5, w, 12);

            ctx.fillStyle = n.color;
            ctx.globalAlpha = alpha;
            ctx.font = '5px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText(n.text, VIRTUAL_W / 2, y + 3);
            ctx.textAlign = 'left';
            ctx.globalAlpha = 1;
        }
    }
}

// --- Area Label ---
export function drawAreaLabel(ctx, regionName) {
    const names = {
        coral_cove: 'Coral Cove',
        harbor: 'Seabreeze Harbor',
        lighthouse: 'Lighthouse Point',
        sunken_reef: 'Sunken Reef',
        mystic_shallows: 'Mystic Shallows',
        deep_trench: 'Deep Trench',
        storm_ridge: 'Storm Ridge',
        open_sea: 'Open Sea',
    };
    const name = names[regionName] || 'Open Sea';

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    const w = name.length * 5 + 16;
    ctx.fillRect(VIRTUAL_W / 2 - w / 2, 8, w, 14);
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '5px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(name, VIRTUAL_W / 2, 18);
    ctx.textAlign = 'left';
}

// --- Save Indicator ---
export function drawSaveIndicator(ctx, timer) {
    if (timer <= 0) return;
    const alpha = Math.min(1, timer / 500);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#2ecc71';
    ctx.font = '4px "Press Start 2P"';
    ctx.fillText('Saved', VIRTUAL_W - 40, VIRTUAL_H - 10);
    ctx.globalAlpha = 1;
}
