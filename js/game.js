// ============================================================
// game.js - Core game state machine, orchestrates all systems
// ============================================================
import { generateMap, NPCS, QUESTS, FISH, CHESTS, T, TILE_SIZE, VIRTUAL_W, VIRTUAL_H,
         MAP_W, MAP_H, getDefaultSave, AREA_FISH } from './data.js';
import { Input, Camera, Audio as GameAudio, saveGame, loadGame, hasSave } from './engine.js';
import { drawMap, drawFishingSpots, drawNPC, drawNPCNameTag, drawInteractPrompt,
         drawMinimap, getRegionAt, getAreaFish, canFishHere, isSolid } from './world.js';
import { Player } from './player.js';
import { FishingMinigame } from './fishing.js';
import { DialogueUI, ShopUI, InventoryUI, QuestLogUI, Notifications,
         drawAreaLabel, drawSaveIndicator } from './ui.js';

// Game states
const STATE = {
    EXPLORING: 'exploring',
    FISHING: 'fishing',
    DIALOGUE: 'dialogue',
    SHOP: 'shop',
    INVENTORY: 'inventory',
    QUEST_LOG: 'questLog',
    PAUSED: 'paused',
};

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.input = new Input();
        this.camera = new Camera();
        this.audio = new GameAudio();

        // Virtual canvas for pixel-perfect rendering
        this.vCanvas = document.createElement('canvas');
        this.vCanvas.width = VIRTUAL_W;
        this.vCanvas.height = VIRTUAL_H;
        this.vCtx = this.vCanvas.getContext('2d');
        this.vCtx.imageSmoothingEnabled = false;

        // Map
        this.map = generateMap();

        // Save state
        this.save = getDefaultSave();

        // Player
        this.player = new Player(this.save);

        // Systems
        this.fishing = new FishingMinigame();
        this.dialogue = new DialogueUI();
        this.shop = new ShopUI();
        this.inventory = new InventoryUI();
        this.questLog = new QuestLogUI();
        this.notifications = new Notifications();

        // Game state
        this.state = STATE.EXPLORING;
        this.nearNPC = null;
        this.nearChest = null;
        this.currentRegion = 'coral_cove';
        this.lastRegion = 'coral_cove';
        this.saveTimer = 0;
        this.autoSaveTimer = 0;
        this.isRunning = false;
        this.lastTime = 0;
        this.pauseMenu = false;

        // Resize handler
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.imageSmoothingEnabled = false;
    }

    startNewGame(mode) {
        this.save = getDefaultSave();
        this.save.mode = mode;
        this.player = new Player(this.save);
        this.state = STATE.EXPLORING;

        if (mode === 'story') {
            // Start with tutorial dialogue
            this.save.activeQuest = 'first_catch';
            this.save.questProgress['first_catch'] = {};
        }

        this.audio.init();
        this.audio.startMusic();
        this.isRunning = true;
        this.canvas.classList.add('active');
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    continueGame() {
        const loaded = loadGame();
        if (loaded) {
            this.save = loaded;
            this.player = new Player(this.save);
        }
        this.audio.init();
        this.audio.startMusic();
        this.isRunning = true;
        this.canvas.classList.add('active');
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    loop(timestamp) {
        if (!this.isRunning) return;

        const dt = Math.min(timestamp - this.lastTime, 50); // cap at 50ms
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();
        this.input.endFrame();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        const time = Date.now() / 1000;
        this.save.playtime += dt;
        this.notifications.update(dt);

        // Auto-save every 30 seconds
        this.autoSaveTimer += dt;
        if (this.autoSaveTimer > 30000) {
            this._saveCurrentState();
            this.autoSaveTimer = 0;
        }

        if (this.saveTimer > 0) this.saveTimer -= dt;

        // Pause
        if (this.input.justPressed('KeyP') && this.state === STATE.EXPLORING) {
            this.pauseMenu = !this.pauseMenu;
            this.audio.sfxOpen();
        }
        if (this.pauseMenu) {
            if (this.input.justPressed('Escape')) {
                this.pauseMenu = false;
                this.audio.sfxOpen();
            }
            if (this.input.justPressed('Digit1')) {
                this._saveCurrentState();
                this.notifications.add('Game saved!', '#2ecc71');
            }
            return;
        }

        switch (this.state) {
            case STATE.EXPLORING:
                this._updateExploring(dt, time);
                break;
            case STATE.FISHING:
                this._updateFishing(dt, time);
                break;
            case STATE.DIALOGUE:
                this.dialogue.update(dt, this.input, this.audio);
                if (!this.dialogue.active) this.state = STATE.EXPLORING;
                break;
            case STATE.SHOP:
                this.shop.update(dt, this.input, this.save, this.audio);
                if (!this.shop.active) {
                    this.state = STATE.EXPLORING;
                    this.player.boatId = this.save.boat; // apply boat change
                }
                break;
            case STATE.INVENTORY:
                this.inventory.update(dt, this.input, this.save, this.audio);
                if (!this.inventory.active) this.state = STATE.EXPLORING;
                break;
            case STATE.QUEST_LOG:
                this.questLog.update(dt, this.input, this.audio);
                if (!this.questLog.active) this.state = STATE.EXPLORING;
                break;
        }
    }

    _updateExploring(dt, time) {
        // Player movement
        this.player.update(dt, this.input, this.map);

        // Camera follow
        this.camera.follow(this.player.getPixelX(), this.player.getPixelY(), dt);

        // Region detection
        const px = this.player.getTileX();
        const py = this.player.getTileY();
        this.currentRegion = getRegionAt(px, py);
        if (this.currentRegion !== this.lastRegion) {
            this.notifications.add(`Entering ${this._regionDisplayName(this.currentRegion)}`, '#5dade2');
            this.lastRegion = this.currentRegion;
        }

        // NPC proximity
        this.nearNPC = null;
        for (const npc of NPCS) {
            const dx = px - npc.x;
            const dy = py - npc.y;
            if (Math.abs(dx) <= 2 && Math.abs(dy) <= 2) {
                this.nearNPC = npc;
                break;
            }
        }

        // Chest proximity
        this.nearChest = null;
        for (let i = 0; i < CHESTS.length; i++) {
            const chest = CHESTS[i];
            if (!this.save.chestsFound.includes(i)) {
                if (Math.abs(px - chest.x) <= 1 && Math.abs(py - chest.y) <= 1) {
                    this.nearChest = { ...chest, index: i };
                    break;
                }
            }
        }

        // Interact with NPC
        if (this.input.justPressed('KeyE') && this.nearNPC) {
            this._interactNPC(this.nearNPC);
        }

        // Interact with chest
        if (this.input.justPressed('KeyE') && this.nearChest && !this.nearNPC) {
            this._openChest(this.nearChest);
        }

        // Start fishing
        if (this.input.justPressed('Space') && canFishHere(this.map, px, py)) {
            this._startFishing();
        }

        // Open inventory
        if (this.input.justPressed('KeyI')) {
            this.inventory.open();
            this.state = STATE.INVENTORY;
            this.audio.sfxOpen();
        }

        // Open quest log
        if (this.input.justPressed('KeyQ')) {
            this.questLog.open();
            this.state = STATE.QUEST_LOG;
            this.audio.sfxOpen();
        }

        // Quick save
        if (this.input.justPressed('F5')) {
            this._saveCurrentState();
            this.notifications.add('Game saved!', '#2ecc71');
        }
    }

    _interactNPC(npc) {
        this.audio.sfxOpen();

        if (npc.isShop) {
            this.shop.open();
            this.state = STATE.SHOP;
            return;
        }

        // Determine dialogue based on quest state
        let lines = npc.dialogue.default;
        const quest = npc.quest ? QUESTS.find(q => q.id === npc.quest) : null;

        if (quest) {
            const questState = this._getQuestStateForNPC(npc, quest);

            if (questState === 'available') {
                // Can give quest
                lines = npc.dialogue.default;
                this.dialogue.start(npc.name, lines, () => {
                    if (this.save.mode === 'story' || true) {
                        this.save.activeQuest = quest.id;
                        if (!this.save.questProgress[quest.id]) {
                            this.save.questProgress[quest.id] = {};
                        }
                        this.notifications.add(`Quest started: ${quest.name}`, '#ffd700');
                    }
                });
                this.state = STATE.DIALOGUE;
                return;
            } else if (questState === 'active') {
                lines = npc.dialogue.quest_active || npc.dialogue.default;
            } else if (questState === 'ready') {
                lines = npc.dialogue.quest_complete || npc.dialogue.default;
                this.dialogue.start(npc.name, lines, () => {
                    this._completeQuest(quest);
                });
                this.state = STATE.DIALOGUE;
                return;
            }
        }

        this.dialogue.start(npc.name, lines);
        this.state = STATE.DIALOGUE;
    }

    _getQuestStateForNPC(npc, quest) {
        // Already completed
        if (this.save.questsCompleted.includes(quest.id)) return 'completed';

        // Check prereq
        if (quest.prereq && !this.save.questsCompleted.includes(quest.prereq)) return 'locked';

        // Active quest - check if all objectives met
        if (this.save.activeQuest === quest.id) {
            const progress = this.save.questProgress[quest.id] || {};
            const allMet = quest.objectives.every(obj => (progress[obj.fish] || 0) >= obj.count);
            return allMet ? 'ready' : 'active';
        }

        // Available to accept
        if (!quest.prereq || this.save.questsCompleted.includes(quest.prereq)) {
            return 'available';
        }

        return 'locked';
    }

    _completeQuest(quest) {
        this.save.questsCompleted.push(quest.id);
        this.save.currency += quest.reward.gold;
        this.save.activeQuest = null;

        // Remove quest fish from inventory
        for (const obj of quest.objectives) {
            const invIdx = this.save.inventory.findIndex(item => item.fishId === obj.fish);
            if (invIdx >= 0) {
                this.save.inventory[invIdx].count -= obj.count;
                if (this.save.inventory[invIdx].count <= 0) {
                    this.save.inventory.splice(invIdx, 1);
                }
            }
        }

        this.notifications.add(`Quest complete: ${quest.name}`, '#2ecc71');
        this.notifications.add(`Reward: ${quest.reward.gold}g`, '#ffd700');
        this.audio.sfxCatch();
        this.camera.shake(3, 300);

        // Auto-assign next story quest
        if (this.save.mode === 'story') {
            const nextQuest = QUESTS.find(q =>
                !this.save.questsCompleted.includes(q.id) &&
                (!q.prereq || this.save.questsCompleted.includes(q.prereq))
            );
            // Don't auto-assign, let player talk to NPC
        }

        this._saveCurrentState();
    }

    _openChest(chest) {
        this.save.chestsFound.push(chest.index);
        this.save.currency += chest.reward.gold;
        this.notifications.add(`Found treasure! +${chest.reward.gold}g`, '#ffd700');
        this.audio.sfxChest();
        this.camera.shake(4, 400);
        this._saveCurrentState();
    }

    _startFishing() {
        this.audio.sfxCast();
        const fishPoolIds = getAreaFish(this.currentRegion);
        const fishPool = fishPoolIds.map(id => FISH.find(f => f.id === id)).filter(Boolean);
        this.fishing.start(fishPool, this.save.rod, this.save.bait);
        this.state = STATE.FISHING;
    }

    _updateFishing(dt, time) {
        this.fishing.update(dt, this.input, time);

        // Exit fishing
        if (this.input.justPressed('Escape') && !this.fishing.isFinished()) {
            this.state = STATE.EXPLORING;
            return;
        }

        // Handle result
        if (this.fishing.isFinished()) {
            if (this.input.justPressed('Space')) {
                if (this.fishing.result) {
                    const fish = this.fishing.result.fish;
                    // Add to inventory
                    const existing = this.save.inventory.find(item => item.fishId === fish.id);
                    if (existing) {
                        existing.count++;
                    } else {
                        this.save.inventory.push({ fishId: fish.id, count: 1 });
                    }

                    // Update caught log
                    this.save.caughtLog[fish.id] = (this.save.caughtLog[fish.id] || 0) + 1;
                    this.save.totalFishCaught++;

                    // Quest progress
                    if (this.save.activeQuest) {
                        const quest = QUESTS.find(q => q.id === this.save.activeQuest);
                        if (quest) {
                            const progress = this.save.questProgress[quest.id] || {};
                            for (const obj of quest.objectives) {
                                if (obj.fish === fish.id) {
                                    progress[obj.fish] = (progress[obj.fish] || 0) + 1;
                                    this.save.questProgress[quest.id] = progress;

                                    const allMet = quest.objectives.every(o => (progress[o.fish] || 0) >= o.count);
                                    if (allMet) {
                                        this.notifications.add(`Return to ${quest.giver} to complete quest!`, '#2ecc71');
                                    }
                                }
                            }
                        }
                    }

                    this.notifications.add(`Caught: ${fish.name} (+${fish.value}g value)`, '#ffd700');
                    this.audio.sfxCatch();
                } else {
                    this.audio.sfxFail();
                }
                this.state = STATE.EXPLORING;
            }
        }
    }

    _saveCurrentState() {
        this.save.playerX = this.player.x;
        this.save.playerY = this.player.y;
        saveGame(this.save);
        this.saveTimer = 2000;
    }

    _regionDisplayName(region) {
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
        return names[region] || 'Open Sea';
    }

    // ---- DRAW ----
    draw() {
        const ctx = this.vCtx;
        const time = Date.now() / 1000;

        // Clear virtual canvas
        ctx.fillStyle = '#0a1520';
        ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);

        if (this.state === STATE.FISHING) {
            this.fishing.draw(ctx, time);
        } else {
            // World
            drawMap(ctx, this.map, this.camera);
            drawFishingSpots(ctx, this.map, this.camera);

            // NPCs
            for (const npc of NPCS) {
                let questState = 'none';
                if (npc.quest) {
                    const quest = QUESTS.find(q => q.id === npc.quest);
                    if (quest) questState = this._getQuestStateForNPC(npc, quest);
                }
                drawNPC(ctx, npc, this.camera, questState);
                if (this.nearNPC === npc) {
                    drawNPCNameTag(ctx, npc, this.camera);
                }
            }

            // Player
            this.player.draw(ctx, this.camera);

            // Interaction prompts
            if (this.nearNPC && this.state === STATE.EXPLORING) {
                drawInteractPrompt(ctx, this.nearNPC.x, this.nearNPC.y, this.camera,
                    this.nearNPC.isShop ? 'E: Shop' : 'E: Talk');
            }
            if (this.nearChest && !this.nearNPC && this.state === STATE.EXPLORING) {
                drawInteractPrompt(ctx, this.nearChest.x, this.nearChest.y, this.camera, 'E: Open');
            }
            if (this.state === STATE.EXPLORING && canFishHere(this.map, this.player.getTileX(), this.player.getTileY())) {
                if (!this.nearNPC && !this.nearChest) {
                    // Small fishing prompt
                    ctx.fillStyle = 'rgba(0,0,0,0.5)';
                    ctx.fillRect(VIRTUAL_W / 2 - 40, VIRTUAL_H - 25, 80, 12);
                    ctx.fillStyle = '#5dade2';
                    ctx.font = '4px "Press Start 2P"';
                    ctx.textAlign = 'center';
                    ctx.fillText('SPACE: Cast Rod', VIRTUAL_W / 2, VIRTUAL_H - 17);
                    ctx.textAlign = 'left';
                }
            }

            // Area label
            drawAreaLabel(ctx, this.currentRegion);

            // Minimap
            drawMinimap(ctx, this.map, this.player.getTileX(), this.player.getTileY());

            // UI overlays
            this.dialogue.draw(ctx);
            this.shop.draw(ctx, this.save);
            this.inventory.draw(ctx, this.save);
            this.questLog.draw(ctx, this.save);
        }

        // HUD (always visible)
        this._drawHUD(ctx);

        // Notifications
        this.notifications.draw(ctx);

        // Save indicator
        drawSaveIndicator(ctx, this.saveTimer);

        // Pause menu
        if (this.pauseMenu) this._drawPauseMenu(ctx);

        // Scale virtual canvas to real canvas
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.drawImage(this.vCanvas, 0, 0, this.canvas.width, this.canvas.height);
    }

    _drawHUD(ctx) {
        // Currency
        ctx.fillStyle = 'rgba(13, 27, 46, 0.8)';
        ctx.fillRect(6, 6, 70, 16);
        ctx.strokeStyle = '#5dade2';
        ctx.lineWidth = 1;
        ctx.strokeRect(6, 6, 70, 16);

        // Coin icon
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(11, 10, 7, 7);
        ctx.fillStyle = '#b8860b';
        ctx.fillRect(12, 11, 5, 5);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(14, 12, 1, 3);

        ctx.fillStyle = '#ffd700';
        ctx.font = '5px "Press Start 2P"';
        ctx.fillText(`${this.save.currency}`, 22, 17);

        // Controls hint (top-left area, below currency)
        if (this.state === STATE.EXPLORING) {
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(6, 24, 52, 24);
            ctx.fillStyle = '#666';
            ctx.font = '3px "Press Start 2P"';
            ctx.fillText('I: Items', 9, 32);
            ctx.fillText('Q: Quests', 9, 38);
            ctx.fillText('P: Pause', 9, 44);
        }
    }

    _drawPauseMenu(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);

        ctx.fillStyle = '#ffd700';
        ctx.font = '12px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', VIRTUAL_W / 2, VIRTUAL_H / 2 - 30);

        ctx.fillStyle = '#e0e0e0';
        ctx.font = '6px "Press Start 2P"';
        ctx.fillText('1: Save Game', VIRTUAL_W / 2, VIRTUAL_H / 2);
        ctx.fillText('ESC: Resume', VIRTUAL_W / 2, VIRTUAL_H / 2 + 16);

        ctx.fillStyle = '#888';
        ctx.font = '4px "Press Start 2P"';
        ctx.fillText(`Playtime: ${Math.floor(this.save.playtime / 60000)}min`, VIRTUAL_W / 2, VIRTUAL_H / 2 + 40);
        ctx.fillText(`Fish caught: ${this.save.totalFishCaught}`, VIRTUAL_W / 2, VIRTUAL_H / 2 + 50);
        ctx.fillText(`Quests done: ${this.save.questsCompleted.length}/${QUESTS.length}`, VIRTUAL_W / 2, VIRTUAL_H / 2 + 60);
        ctx.textAlign = 'left';
    }
}
