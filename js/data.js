// ============================================================
// data.js - All static game data: map, fish, items, NPCs, quests
// ============================================================

// --- Tile System ---
export const TILE_SIZE = 16;
export const MAP_W = 100;
export const MAP_H = 80;
export const VIRTUAL_W = 640;
export const VIRTUAL_H = 360;

export const T = {
    DEEP: 0, SHALLOW: 1, SAND: 2, GRASS: 3, DOCK: 4,
    WALL: 5, ROCK: 6, CORAL: 7, SEAWEED: 8, DARK: 9,
    TREE: 10, ROOF: 11, DOOR: 12, PATH: 13, BARREL: 14,
    SIGN: 15, CRATE: 16, LANTERN: 17, ANCHOR: 18, CHEST: 19
};

export const TILE_COLORS = {
    [T.DEEP]:    '#163a5c',
    [T.SHALLOW]: '#2980b9',
    [T.SAND]:    '#e8d5a3',
    [T.GRASS]:   '#4a7c3f',
    [T.DOCK]:    '#8b6914',
    [T.WALL]:    '#6b4226',
    [T.ROCK]:    '#5d6d7e',
    [T.CORAL]:   '#e74c3c',
    [T.SEAWEED]: '#1e8449',
    [T.DARK]:    '#0b1320',
    [T.TREE]:    '#2d6b2e',
    [T.ROOF]:    '#c0392b',
    [T.DOOR]:    '#4a2d0a',
    [T.PATH]:    '#c4a76c',
    [T.BARREL]:  '#7d5a1e',
    [T.SIGN]:    '#a0784a',
    [T.CRATE]:   '#9a7b4f',
    [T.LANTERN]: '#f1c40f',
    [T.ANCHOR]:  '#7f8c8d',
    [T.CHEST]:   '#d4ac0d',
};

export const TILE_SOLID = new Set([T.SAND, T.GRASS, T.WALL, T.ROCK, T.TREE, T.ROOF, T.BARREL, T.CRATE, T.LANTERN, T.ANCHOR, T.CHEST]);
export const TILE_FISHABLE = new Set([T.CORAL, T.SEAWEED, T.SHALLOW, T.DEEP, T.DARK]);

// --- Tile Detail Renderers (pixel decorations) ---
export const TILE_DETAILS = {
    [T.DEEP]: (ctx, x, y) => {
        ctx.fillStyle = '#1a4570';
        ctx.fillRect(x+3, y+4, 4, 1);
        ctx.fillRect(x+9, y+10, 5, 1);
    },
    [T.SHALLOW]: (ctx, x, y) => {
        ctx.fillStyle = '#3498db';
        ctx.fillRect(x+2, y+6, 5, 1);
        ctx.fillRect(x+10, y+12, 4, 1);
    },
    [T.GRASS]: (ctx, x, y) => {
        ctx.fillStyle = '#5a9a4f';
        ctx.fillRect(x+3, y+2, 1, 3);
        ctx.fillRect(x+8, y+7, 1, 3);
        ctx.fillRect(x+12, y+4, 1, 3);
    },
    [T.SAND]: (ctx, x, y) => {
        ctx.fillStyle = '#d4c490';
        ctx.fillRect(x+4, y+5, 2, 1);
        ctx.fillRect(x+10, y+11, 2, 1);
    },
    [T.CORAL]: (ctx, x, y) => {
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(x+3, y+8, 2, 4);
        ctx.fillRect(x+5, y+6, 2, 6);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(x+9, y+7, 2, 5);
        ctx.fillRect(x+11, y+9, 2, 3);
    },
    [T.SEAWEED]: (ctx, x, y) => {
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(x+4, y+4, 1, 8);
        ctx.fillRect(x+3, y+4, 1, 2);
        ctx.fillRect(x+10, y+6, 1, 6);
        ctx.fillRect(x+11, y+6, 1, 2);
    },
    [T.TREE]: (ctx, x, y) => {
        ctx.fillStyle = '#1e5a1f';
        ctx.fillRect(x+4, y+0, 8, 10);
        ctx.fillRect(x+2, y+2, 12, 6);
        ctx.fillStyle = '#5c3a1e';
        ctx.fillRect(x+7, y+10, 2, 6);
    },
    [T.DARK]: (ctx, x, y) => {
        ctx.fillStyle = '#0e1a2e';
        ctx.fillRect(x+5, y+7, 3, 1);
    },
    [T.ROCK]: (ctx, x, y) => {
        ctx.fillStyle = '#4a5a6b';
        ctx.fillRect(x+2, y+4, 12, 8);
        ctx.fillStyle = '#6d7e8e';
        ctx.fillRect(x+3, y+3, 10, 3);
    },
    [T.DOCK]: (ctx, x, y) => {
        ctx.fillStyle = '#a07820';
        ctx.fillRect(x, y+3, 16, 2);
        ctx.fillRect(x, y+11, 16, 2);
    },
    [T.WALL]: (ctx, x, y) => {
        ctx.fillStyle = '#7d5030';
        ctx.fillRect(x, y+7, 16, 1);
        ctx.fillRect(x+7, y, 1, 16);
    },
    [T.BARREL]: (ctx, x, y) => {
        ctx.fillStyle = '#6b4a14';
        ctx.fillRect(x+3, y+2, 10, 12);
        ctx.fillStyle = '#8b6914';
        ctx.fillRect(x+4, y+3, 8, 10);
        ctx.fillStyle = '#5a3a0a';
        ctx.fillRect(x+3, y+5, 10, 2);
        ctx.fillRect(x+3, y+9, 10, 2);
    },
    [T.CHEST]: (ctx, x, y) => {
        ctx.fillStyle = '#b8960a';
        ctx.fillRect(x+2, y+4, 12, 9);
        ctx.fillStyle = '#d4ac0d';
        ctx.fillRect(x+3, y+5, 10, 7);
        ctx.fillStyle = '#8b7400';
        ctx.fillRect(x+6, y+7, 4, 3);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x+7, y+8, 2, 1);
    },
    [T.SIGN]: (ctx, x, y) => {
        ctx.fillStyle = '#7d5a30';
        ctx.fillRect(x+7, y+8, 2, 8);
        ctx.fillStyle = '#b8944a';
        ctx.fillRect(x+3, y+2, 10, 7);
        ctx.fillStyle = '#6b4a20';
        ctx.fillRect(x+3, y+2, 10, 1);
    },
    [T.LANTERN]: (ctx, x, y) => {
        ctx.fillStyle = '#5d5d5d';
        ctx.fillRect(x+6, y+2, 4, 2);
        ctx.fillRect(x+7, y+0, 2, 2);
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(x+6, y+4, 4, 6);
        ctx.fillStyle = '#f9e76c';
        ctx.fillRect(x+7, y+5, 2, 4);
        ctx.fillStyle = '#5d5d5d';
        ctx.fillRect(x+6, y+10, 4, 2);
    },
};

// --- Map Generation ---
// Regions define zones in the world
const REGIONS = [
    // name, cx, cy, rx, ry, tileType
    { name: 'coral_cove',      cx: 50, cy: 62, rx: 14, ry: 10, tile: T.SHALLOW, island: true },
    { name: 'harbor',          cx: 50, cy: 40, rx: 12, ry: 10, tile: T.SHALLOW, island: true, isHarbor: true },
    { name: 'lighthouse',      cx: 15, cy: 25, rx: 7,  ry: 6,  tile: T.SHALLOW, island: true, isLighthouse: true },
    { name: 'sunken_reef',     cx: 78, cy: 40, rx: 12, ry: 10, tile: T.SHALLOW },
    { name: 'mystic_shallows', cx: 80, cy: 12, rx: 12, ry: 8,  tile: T.SHALLOW },
    { name: 'deep_trench',     cx: 18, cy: 60, rx: 12, ry: 10, tile: T.DARK },
    { name: 'storm_ridge',     cx: 50, cy: 10, rx: 18, ry: 8,  tile: T.DEEP },
];

function dist(x1, y1, x2, y2, rx, ry) {
    return ((x1 - x2) / rx) ** 2 + ((y1 - y2) / ry) ** 2;
}

// Deterministic pseudo-random for map gen
function seededRand(x, y) {
    let h = (x * 374761393 + y * 668265263 + 1013904223) & 0xffffffff;
    h = ((h >> 16) ^ h) * 0x45d9f3b;
    h = ((h >> 16) ^ h) * 0x45d9f3b;
    h = (h >> 16) ^ h;
    return (h & 0xffff) / 0xffff;
}

export function generateMap() {
    const map = [];
    for (let y = 0; y < MAP_H; y++) {
        const row = [];
        for (let x = 0; x < MAP_W; x++) {
            let tile = T.DEEP;
            const r = seededRand(x, y);

            // Determine region
            for (const reg of REGIONS) {
                const d = dist(x, y, reg.cx, reg.cy, reg.rx, reg.ry);
                if (d < 1.0) {
                    tile = reg.tile;
                    if (reg.island && d < 0.4) {
                        tile = T.GRASS;
                        if (d < 0.25 && r > 0.85) tile = T.TREE;
                    }
                    if (reg.island && d >= 0.4 && d < 0.55) {
                        tile = T.SAND;
                    }
                    break;
                }
            }

            // Scatter coral and seaweed in shallow/deep water
            if (tile === T.SHALLOW && r > 0.92) tile = T.CORAL;
            if (tile === T.SHALLOW && r < 0.05) tile = T.SEAWEED;
            if (tile === T.DEEP && r > 0.97) tile = T.ROCK;
            if (tile === T.DARK && r > 0.95) tile = T.SEAWEED;

            row.push(tile);
        }
        map.push(row);
    }

    // --- Place structures ---
    // Coral Cove: starting dock + signs
    placeDock(map, 48, 56, 4, 'v');
    placeSign(map, 46, 56);

    // Harbor: main town buildings, shop, dock
    placeBuilding(map, 46, 36, 5, 4); // Shop
    placeBuilding(map, 53, 36, 4, 3); // Inn
    placeDock(map, 50, 44, 6, 'v');
    placeSign(map, 44, 40);
    setTile(map, 47, 40, T.BARREL);
    setTile(map, 56, 38, T.CRATE);
    setTile(map, 44, 36, T.LANTERN);
    setTile(map, 58, 36, T.LANTERN);

    // Lighthouse: small building + lantern
    placeBuilding(map, 14, 23, 3, 3);
    setTile(map, 15, 22, T.LANTERN);
    setTile(map, 12, 27, T.ANCHOR);
    placeDock(map, 14, 28, 3, 'v');

    // Sunken reef: scattered coral, a hidden chest
    for (let i = 0; i < 15; i++) {
        const sx = 70 + Math.floor(seededRand(i, 100) * 16);
        const sy = 34 + Math.floor(seededRand(100, i) * 12);
        if (sx < MAP_W && sy < MAP_H) setTile(map, sx, sy, T.CORAL);
    }
    setTile(map, 82, 42, T.CHEST); // Hidden treasure

    // Mystic shallows: unique look
    for (let i = 0; i < 10; i++) {
        const sx = 72 + Math.floor(seededRand(i, 200) * 16);
        const sy = 6 + Math.floor(seededRand(200, i) * 12);
        if (sx < MAP_W && sy < MAP_H) setTile(map, sx, sy, T.SEAWEED);
    }
    setTile(map, 85, 10, T.CHEST); // Secret collectible

    // Deep Trench: dark and foreboding
    setTile(map, 20, 55, T.ANCHOR);
    setTile(map, 12, 63, T.CHEST); // Sunken treasure

    // Storm Ridge: rocks everywhere
    for (let i = 0; i < 20; i++) {
        const sx = 36 + Math.floor(seededRand(i, 300) * 28);
        const sy = 4 + Math.floor(seededRand(300, i) * 12);
        if (sx < MAP_W && sy < MAP_H) setTile(map, sx, sy, T.ROCK);
    }

    return map;
}

function setTile(map, x, y, tile) {
    if (y >= 0 && y < MAP_H && x >= 0 && x < MAP_W) map[y][x] = tile;
}

function placeDock(map, x, y, len, dir) {
    for (let i = 0; i < len; i++) {
        if (dir === 'v') setTile(map, x, y + i, T.DOCK);
        else setTile(map, x + i, y, T.DOCK);
    }
}

function placeBuilding(map, x, y, w, h) {
    for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
            if (dy === 0) setTile(map, x + dx, y + dy, T.ROOF);
            else if (dy === h - 1 && dx === Math.floor(w / 2)) setTile(map, x + dx, y + dy, T.DOOR);
            else setTile(map, x + dx, y + dy, T.WALL);
        }
    }
}

function placeSign(map, x, y) {
    setTile(map, x, y, T.SIGN);
}


// --- Fish Database ---
export const FISH = [
    { id: 'sardine',     name: 'Sardine',       value: 5,    rarity: 1, speed: 2.5, strength: 1,  minDepth: 0, maxDepth: 50,  behavior: 'straight', desc: 'Common and quick. Good for beginners.', color: '#8faab6' },
    { id: 'clownfish',   name: 'Clownfish',     value: 12,   rarity: 2, speed: 1.5, strength: 1.5,minDepth: 10,maxDepth: 60,  behavior: 'hover',    desc: 'Colorful and shy. Stays near coral.', color: '#f39c12' },
    { id: 'mackerel',    name: 'Mackerel',      value: 15,   rarity: 2, speed: 3.0, strength: 2,  minDepth: 20,maxDepth: 80,  behavior: 'zigzag',   desc: 'A spirited fighter with a zigzag swim.', color: '#5dade2' },
    { id: 'pufferfish',  name: 'Pufferfish',    value: 25,   rarity: 3, speed: 1.0, strength: 3,  minDepth: 30,maxDepth: 90,  behavior: 'inflate',  desc: 'Slow but inflates when threatened.', color: '#e8d5a3' },
    { id: 'tuna',        name: 'Bluefin Tuna',  value: 40,   rarity: 3, speed: 3.5, strength: 4,  minDepth: 40,maxDepth: 120, behavior: 'dash',     desc: 'Powerful and fast. A prized catch.', color: '#2c3e50' },
    { id: 'swordfish',   name: 'Swordfish',     value: 65,   rarity: 4, speed: 4.0, strength: 5,  minDepth: 60,maxDepth: 150, behavior: 'charge',   desc: 'Charges aggressively. Handle with care.', color: '#7f8c8d' },
    { id: 'anglerfish',  name: 'Anglerfish',    value: 80,   rarity: 4, speed: 1.2, strength: 6,  minDepth: 100,maxDepth:200, behavior: 'lurk',     desc: 'Lurks in the abyss. Its light deceives.', color: '#1a1a2e' },
    { id: 'jellyfish',   name: 'Moon Jellyfish', value: 30,  rarity: 3, speed: 0.8, strength: 2,  minDepth: 20,maxDepth: 100, behavior: 'drift',    desc: 'Drifts ethereally through the current.', color: '#d5a6e6' },
    { id: 'octopus',     name: 'Octopus',       value: 55,   rarity: 4, speed: 2.0, strength: 5,  minDepth: 50,maxDepth: 140, behavior: 'erratic',  desc: 'Cunning and unpredictable. Ink clouds!', color: '#8e44ad' },
    { id: 'moonfish',    name: 'Moonfish',      value: 120,  rarity: 5, speed: 2.5, strength: 4,  minDepth: 30,maxDepth: 100, behavior: 'shimmer',  desc: 'A mythical silver fish. Extremely rare.', color: '#ecf0f1' },
    { id: 'golden_koi',  name: 'Golden Koi',    value: 200,  rarity: 5, speed: 1.5, strength: 3,  minDepth: 20,maxDepth: 80,  behavior: 'hover',    desc: 'Legend says it grants wishes.', color: '#ffd700' },
    { id: 'leviathan',   name: 'Leviathan',     value: 500,  rarity: 6, speed: 3.0, strength: 10, minDepth: 150,maxDepth:250, behavior: 'boss',     desc: 'The ancient king of the deep.', color: '#1b2631' },
];

// --- Area Fish Pools (which fish appear where) ---
export const AREA_FISH = {
    coral_cove:      ['sardine', 'clownfish', 'mackerel'],
    harbor:          ['sardine', 'mackerel', 'jellyfish'],
    lighthouse:      ['mackerel', 'pufferfish', 'jellyfish'],
    sunken_reef:     ['clownfish', 'pufferfish', 'tuna', 'octopus'],
    mystic_shallows: ['moonfish', 'golden_koi', 'jellyfish', 'clownfish'],
    deep_trench:     ['anglerfish', 'swordfish', 'octopus', 'leviathan'],
    storm_ridge:     ['tuna', 'swordfish', 'mackerel'],
};

// --- Items ---
export const RODS = [
    { id: 'wooden_rod',    name: 'Wooden Rod',    cost: 0,    power: 1.0,  desc: 'Basic rod. Gets the job done.' },
    { id: 'bamboo_rod',    name: 'Bamboo Rod',    cost: 100,  power: 1.5,  desc: 'Flexible and reliable.' },
    { id: 'fiberglass_rod',name: 'Fiberglass Rod',cost: 350,  power: 2.0,  desc: 'Modern materials, superior control.' },
    { id: 'carbon_rod',    name: 'Carbon Rod',    cost: 800,  power: 3.0,  desc: 'Lightweight and incredibly strong.' },
    { id: 'master_rod',    name: 'Master Rod',    cost: 2000, power: 5.0,  desc: 'The ultimate fishing tool.' },
];

export const BOATS = [
    { id: 'raft',          name: 'Wooden Raft',   cost: 0,    speed: 1.0,  desc: 'A humble raft. Slow but steady.' },
    { id: 'rowboat',       name: 'Rowboat',       cost: 200,  speed: 1.5,  desc: 'Proper oars make all the difference.' },
    { id: 'sailboat',      name: 'Sailboat',      cost: 600,  speed: 2.0,  desc: 'Catches the wind beautifully.' },
    { id: 'motorboat',     name: 'Motorboat',     cost: 1500, speed: 3.0,  desc: 'Rumbles across the waves.' },
    { id: 'yacht',         name: 'Mini Yacht',    cost: 4000, speed: 4.0,  desc: 'Travel in style and comfort.' },
];

export const BAITS = [
    { id: 'worm',          name: 'Worm',          cost: 0,    lure: 1.0,  desc: 'A classic. Attracts common fish.' },
    { id: 'cricket',       name: 'Cricket',       cost: 10,   lure: 1.5,  desc: 'Lively movement attracts more fish.' },
    { id: 'shrimp',        name: 'Shrimp',        cost: 30,   lure: 2.0,  desc: 'Irresistible to mid-tier fish.' },
    { id: 'squid',         name: 'Squid Lure',    cost: 80,   lure: 3.0,  desc: 'Deep-water fish cannot resist.' },
    { id: 'golden_lure',   name: 'Golden Lure',   cost: 250,  lure: 5.0,  desc: 'Glows softly. Attracts the rarest fish.' },
];


// --- NPCs ---
export const NPCS = [
    {
        id: 'captain_morgan', name: 'Captain Morgan',
        x: 49, y: 58, region: 'coral_cove',
        color: '#c0392b', hatColor: '#2c3e50',
        dialogue: {
            default: [
                "Ahoy there, young sailor!",
                "These waters are teeming with fish.",
                "Take this old rod and try your luck.",
                "Find a spot with coral or seaweed and press SPACE to fish!",
            ],
            quest_active: [
                "How's the fishing coming along?",
                "Remember, bring me 3 Sardines!",
            ],
            quest_complete: [
                "Wonderful! You're a natural!",
                "Here's your reward. Head to Seabreeze Harbor for more work.",
            ],
        },
        quest: 'first_catch',
    },
    {
        id: 'chef_marina', name: 'Chef Marina',
        x: 48, y: 39, region: 'harbor',
        color: '#ecf0f1', hatColor: '#ecf0f1',
        dialogue: {
            default: [
                "Welcome to Seabreeze Harbor!",
                "I run the kitchen at the inn.",
                "I could always use fresh fish for my recipes.",
            ],
            quest_active: [
                "Still waiting on those fish!",
                "I need a Clownfish and a Mackerel for tonight's special.",
            ],
            quest_complete: [
                "These are perfect! You have a great eye.",
                "Here, take this payment. And a tip!",
            ],
        },
        quest: 'harbor_delivery',
    },
    {
        id: 'merchant_pete', name: 'Merchant Pete',
        x: 48, y: 38, region: 'harbor',
        color: '#27ae60', hatColor: '#8b6914',
        dialogue: {
            default: [
                "Looking to buy or sell? You've come to the right place!",
                "Press E to open my shop when you're near.",
            ],
        },
        isShop: true,
    },
    {
        id: 'keeper_elena', name: 'Keeper Elena',
        x: 15, y: 25, region: 'lighthouse',
        color: '#f1c40f', hatColor: '#2c3e50',
        dialogue: {
            default: [
                "This lighthouse has guided sailors for generations.",
                "The waters to the north are treacherous...",
                "But the fish there are extraordinary.",
            ],
            quest_active: [
                "The sea grows restless. Please hurry.",
                "Bring me a Pufferfish to craft a protective charm.",
            ],
            quest_complete: [
                "You braved those waters! Remarkable!",
                "Take this. It will help you in the deep trench.",
            ],
        },
        quest: 'lighthouse_charm',
    },
    {
        id: 'diver_kai', name: 'Diver Kai',
        x: 76, y: 38, region: 'sunken_reef',
        color: '#3498db', hatColor: '#1a5276',
        dialogue: {
            default: [
                "I've been exploring these sunken wrecks for years.",
                "There's a treasure chest hidden deep in the reef...",
                "But the octopus guards it fiercely.",
            ],
            quest_active: [
                "Still after that octopus?",
                "Be careful, they're cunning creatures.",
            ],
            quest_complete: [
                "You got it! Incredible!",
                "The reef's secrets are yours now. Here's your share.",
            ],
        },
        quest: 'reef_treasure',
    },
    {
        id: 'mystic_luna', name: 'Mystic Luna',
        x: 80, y: 11, region: 'mystic_shallows',
        color: '#d5a6e6', hatColor: '#6c3483',
        dialogue: {
            default: [
                "The Moonfish swims where starlight meets the sea...",
                "Only those with patience and skill may catch one.",
                "Its scales shimmer with otherworldly light.",
            ],
            quest_active: [
                "Keep trying. The Moonfish reveals itself to the worthy.",
            ],
            quest_complete: [
                "You've done it... The Moonfish chose you.",
                "The ocean's deepest secret awaits in the trench.",
            ],
        },
        quest: 'moonfish_hunt',
    },
    {
        id: 'old_salt', name: 'Old Salt',
        x: 50, y: 8, region: 'storm_ridge',
        color: '#95a5a6', hatColor: '#7f8c8d',
        dialogue: {
            default: [
                "I've sailed these storm-torn waters my whole life.",
                "There's a creature below... the Leviathan.",
                "No one has ever caught it. Maybe you will.",
            ],
            quest_active: [
                "The Leviathan stirs in the deep trench...",
                "You'll need the best gear and nerves of steel.",
            ],
            quest_complete: [
                "By the tides... You actually did it!",
                "You are the greatest angler these seas have ever known!",
            ],
        },
        quest: 'leviathan_hunt',
    },
];


// --- Quests ---
export const QUESTS = [
    {
        id: 'first_catch',
        name: 'First Catch',
        desc: 'Catch 3 Sardines for Captain Morgan.',
        giver: 'captain_morgan',
        type: 'catch',
        objectives: [{ fish: 'sardine', count: 3 }],
        reward: { gold: 50, unlocks: [] },
        prereq: null,
        storyOrder: 0,
    },
    {
        id: 'harbor_delivery',
        name: "Chef's Special",
        desc: 'Bring Chef Marina a Clownfish and a Mackerel.',
        giver: 'chef_marina',
        type: 'catch',
        objectives: [{ fish: 'clownfish', count: 1 }, { fish: 'mackerel', count: 1 }],
        reward: { gold: 120, unlocks: [] },
        prereq: 'first_catch',
        storyOrder: 1,
    },
    {
        id: 'lighthouse_charm',
        name: 'Lighthouse Charm',
        desc: 'Catch a Pufferfish for Keeper Elena.',
        giver: 'keeper_elena',
        type: 'catch',
        objectives: [{ fish: 'pufferfish', count: 1 }],
        reward: { gold: 150, unlocks: [] },
        prereq: 'harbor_delivery',
        storyOrder: 2,
    },
    {
        id: 'reef_treasure',
        name: 'Reef Treasure',
        desc: 'Catch an Octopus for Diver Kai at the Sunken Reef.',
        giver: 'diver_kai',
        type: 'catch',
        objectives: [{ fish: 'octopus', count: 1 }],
        reward: { gold: 250, unlocks: [] },
        prereq: 'lighthouse_charm',
        storyOrder: 3,
    },
    {
        id: 'tuna_tourney',
        name: 'Tuna Tournament',
        desc: 'Catch 2 Bluefin Tuna to prove your skill.',
        giver: 'chef_marina',
        type: 'catch',
        objectives: [{ fish: 'tuna', count: 2 }],
        reward: { gold: 350, unlocks: [] },
        prereq: 'reef_treasure',
        storyOrder: 4,
    },
    {
        id: 'swordfish_challenge',
        name: 'Swordfish Challenge',
        desc: 'Brave the Storm Ridge and catch a Swordfish.',
        giver: 'old_salt',
        type: 'catch',
        objectives: [{ fish: 'swordfish', count: 1 }],
        reward: { gold: 400, unlocks: [] },
        prereq: 'tuna_tourney',
        storyOrder: 5,
    },
    {
        id: 'moonfish_hunt',
        name: 'Moonfish Hunt',
        desc: 'Find and catch the legendary Moonfish in the Mystic Shallows.',
        giver: 'mystic_luna',
        type: 'catch',
        objectives: [{ fish: 'moonfish', count: 1 }],
        reward: { gold: 600, unlocks: [] },
        prereq: 'swordfish_challenge',
        storyOrder: 6,
    },
    {
        id: 'leviathan_hunt',
        name: 'The Leviathan',
        desc: 'Descend into the Deep Trench and catch the Leviathan.',
        giver: 'old_salt',
        type: 'catch',
        objectives: [{ fish: 'leviathan', count: 1 }],
        reward: { gold: 2000, unlocks: [] },
        prereq: 'moonfish_hunt',
        storyOrder: 7,
    },
];

// --- Collectible Chests ---
export const CHESTS = [
    { x: 82, y: 42, reward: { gold: 100 }, found: false, hint: 'Hidden in the Sunken Reef' },
    { x: 85, y: 10, reward: { gold: 150 }, found: false, hint: 'Glimmers in the Mystic Shallows' },
    { x: 12, y: 63, reward: { gold: 200 }, found: false, hint: 'Lost in the Deep Trench' },
];

// --- Default Save State ---
export function getDefaultSave() {
    return {
        currency: 0,
        rod: 'wooden_rod',
        boat: 'raft',
        bait: 'worm',
        playerX: 50,
        playerY: 56,
        inventory: [],       // array of { fishId, count }
        caughtLog: {},       // fishId -> total ever caught
        questsCompleted: [], // quest ids
        activeQuest: null,   // quest id
        questProgress: {},   // quest id -> { fishId: count }
        chestsFound: [],     // chest indices
        totalFishCaught: 0,
        mode: 'story',       // 'story' or 'freeRoam'
        playtime: 0,
    };
}
