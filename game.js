// Canvas & Kontext
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Tile & Welt
const TILE_SIZE = 32;
const VISIBLE_COLS = Math.floor(canvas.width / TILE_SIZE);
const VISIBLE_ROWS = Math.floor(canvas.height / TILE_SIZE);

const WORLD_COLS = 200;
const WORLD_ROWS = 80;

// Kamera
const camera = { x: 0, y: 0 };

// Block-Typen
const BLOCK = {
  AIR: 0,
  DIRT: 1,
  STONE: 2,
  GRASS: 3,
  WOOD: 4,
  COAL_ORE: 5,
  IRON_ORE: 6,
  GOLD_ORE: 7,
  DIAMOND_ORE: 8
};

// Item-Typen (für Inventar/Crafting)
const ITEM = {
  DIRT: "DIRT",
  STONE: "STONE",
  GRASS: "GRASS",
  WOOD: "WOOD",
  COAL: "COAL",
  IRON_ORE: "IRON_ORE",
  GOLD_ORE: " GOLD_ORE",
  DIAMOND_ORE: "DIAMOND_ORE",
  PLANKS: "PLANKS",
  STICK: "STICK",
  WOOD_PICK: "WOOD_PICK",
  STONE_PICK: "STONE_PICK"
};

// Texturen
const textures = {
  [BLOCK.DIRT]: loadTexture("textures/dirt.png"),
  [BLOCK.STONE]: loadTexture("textures/stone.png"),
  [BLOCK.GRASS]: loadTexture("textures/grass.png"),
  [BLOCK.WOOD]: loadTexture("textures/wood.png"),
  [BLOCK.COAL_ORE]: loadTexture("textures/coal.png"),
  [BLOCK.IRON_ORE]: loadTexture("textures/iron.png"),
  [BLOCK.GOLD_ORE]: loadTexture("textures/gold.png"),
  [BLOCK.DIAMOND_ORE]: loadTexture("textures/diamond.png")
};

// Item-Icons (Inventar/Crafting)
const itemIcons = {
  [ITEM.DIRT]: "textures/dirt.png",
  [ITEM.STONE]: "textures/stone.png",
  [ITEM.GRASS]: "textures/grass.png",
  [ITEM.WOOD]: "textures/wood.png",
  [ITEM.COAL]: "textures/coal.png",
  [ITEM.IRON_ORE]: "textures/iron.png",
  [ITEM.GOLD_ORE]: "textures/gold.png",
  [ITEM.DIAMOND_ORE]: "textures/diamond.png",
  [ITEM.PLANKS]: "textures/planks.png",
  [ITEM.STICK]: "textures/stick.png",
  [ITEM.WOOD_PICK]: "textures/wood_pickaxe.png",
  [ITEM.STONE_PICK]: "textures/stone_pickaxe.png"
};

function loadTexture(src) {
  const img = new Image();
  img.src = src;
  return img;
}

// Welt-Array
const world = [];

// einfache Welt mit Hügeln + Erzen
function generateWorld() {
  let groundLevel = 30;

  for (let x = 0; x < WORLD_COLS; x++) {
    const change = Math.floor(Math.random() * 3) - 1;
    groundLevel += change;
    if (groundLevel < 15) groundLevel = 15;
    if (groundLevel > 45) groundLevel = 45;

    for (let y = 0; y < WORLD_ROWS; y++) {
      if (!world[y]) world[y] = [];

      if (y < groundLevel) {
        world[y][x] = BLOCK.AIR;
      } else if (y === groundLevel) {
        world[y][x] = BLOCK.GRASS;
      } else if (y < groundLevel + 3) {
        world[y][x] = BLOCK.DIRT;
      } else {
        // Tiefenabhängige Erze
        const depth = y;
        let block = BLOCK.STONE;

        if (depth > 35 && depth < 60 && Math.random() < 0.08) {
          block = BLOCK.COAL_ORE;
        }
        if (depth > 40 && depth < 70 && Math.random() < 0.04) {
          block = BLOCK.IRON_ORE;
        }
        if (depth > 50 && depth < 75 && Math.random() < 0.02) {
          block = BLOCK.GOLD_ORE;
        }
        if (depth > 60 && Math.random() < 0.01) {
          block = BLOCK.DIAMOND_ORE;
        }

        world[y][x] = block;
      }
    }

    // Bäume
    if (Math.random() < 0.06) {
      const trunkHeight = 3 + Math.floor(Math.random() * 2);
      for (let t = 0; t < trunkHeight; t++) {
        const ty = groundLevel - 1 - t;
        if (ty >= 0) world[ty][x] = BLOCK.WOOD;
      }
    }
  }
}

// Spieler
const player = {
  x: 5,
  y: 10,
  vx: 0,
  vy: 0,
  width: 0.6,
  height: 0.9,
  onGround: false
};

// Steuerung
const keys = {};
window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;

  if (e.key === "1") selectHotbar(0);
  if (e.key === "2") selectHotbar(1);
  if (e.key === "3") selectHotbar(2);
  if (e.key === "4") selectHotbar(3);
  if (e.key === "5") selectHotbar(4);
  if (e.key === "6") selectHotbar(5);

  if (e.key.toLowerCase() === "i") {
    togglePanels();
  }
});

window.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

// Hotbar: Blöcke / Items
const hotbarBlocks = [
  BLOCK.DIRT,
  BLOCK.STONE,
  BLOCK.GRASS,
  BLOCK.WOOD,
  BLOCK.COAL_ORE,
  BLOCK.IRON_ORE
];

let selectedHotbarIndex = 0;

function selectHotbar(index) {
  selectedHotbarIndex = index;
  document.querySelectorAll("#hotbar .slot").forEach((el, i) => {
    el.classList.toggle("selected", i === index);
  });
}

// Inventar (einfaches Array)
const inventorySize = 18;
const inventory = new Array(inventorySize).fill(null);

// Crafting 3x3
const craftingSize = 9;
const craftingGrid = new Array(craftingSize).fill(null);

// Crafting-Rezepte
// Wir machen einfache Rezepte:
// 1x WOOD -> 4x PLANKS
// 2x PLANKS vertikal -> 4x STICK
// Holzspitzhacke:
//  [PLANKS, PLANKS, PLANKS,
//   null,   STICK,  null,
//   null,   STICK,  null]

const recipes = [
  {
    pattern: [
      ITEM.WOOD, null, null,
      null, null, null,
      null, null, null
    ],
    result: { item: ITEM.PLANKS, count: 4 }
  },
  {
    pattern: [
      ITEM.PLANKS, null, null,
      ITEM.PLANKS, null, null,
      null, null, null
    ],
    result: { item: ITEM.STICK, count: 4 }
  },
  {
    pattern: [
      ITEM.PLANKS, ITEM.PLANKS, ITEM.PLANKS,
      null, ITEM.STICK, null,
      null, ITEM.STICK, null
    ],
    result: { item: ITEM.WOOD_PICK, count: 1 }
  }
];

// Panels Anzeigen/Verstecken
const panels = document.getElementById("panels");
let panelsVisible = true;
function togglePanels() {
  panelsVisible = !panelsVisible;
  panels.style.display = panelsVisible ? "flex" : "none";
}

// Inventar & Crafting Slots im DOM bauen
const inventoryGridEl = document.getElementById("inventory-grid");
const craftingGridEl = document.getElementById("crafting-grid");
const craftingResultEl = document.getElementById("crafting-result");
const craftButton = document.getElementById("craft-button");

function createGridSlots() {
  // Inventar
  inventoryGridEl.innerHTML = "";
  for (let i = 0; i < inventorySize; i++) {
    const slot = document.createElement("div");
    slot.className = "inv-slot";
    slot.dataset.index = i;
    slot.addEventListener("click", () => selectInventorySlot(i));
    inventoryGridEl.appendChild(slot);
  }

  // Crafting
  craftingGridEl.innerHTML = "";
  for (let i = 0; i < craftingSize; i++) {
    const slot = document.createElement("div");
    slot.className = "craft-slot";
    slot.dataset.index = i;
    slot.addEventListener("click", () => selectCraftingSlot(i));
    craftingGridEl.appendChild(slot);
  }

  updateInventoryUI();
  updateCraftingUI();
}

function iconForItem(itemId) {
  return itemIcons[itemId] || null;
}

// Inventar UI updaten
function updateInventoryUI() {
  const slots = inventoryGridEl.querySelectorAll(".inv-slot");
  slots.forEach((slot, i) => {
    slot.innerHTML = "";
    const stack = inventory[i];
    if (stack && stack.count > 0) {
      const imgSrc = iconForItem(stack.item);
      if (imgSrc) {
        const img = document.createElement("img");
        img.src = imgSrc;
        slot.appendChild(img);
      }
      if (stack.count > 1) {
        const countEl = document.createElement("span");
        countEl.className = "item-count";
        countEl.textContent = stack.count;
        slot.appendChild(countEl);
      }
    }
  });
}

// Crafting UI
function updateCraftingUI() {
  const slots = craftingGridEl.querySelectorAll(".craft-slot");
  slots.forEach((slot, i) => {
    slot.innerHTML = "";
    const stack = craftingGrid[i];
    if (stack && stack.count > 0) {
      const imgSrc = iconForItem(stack.item);
      if (imgSrc) {
        const img = document.createElement("img");
        img.src = imgSrc;
        slot.appendChild(img);
      }
      if (stack.count > 1) {
        const countEl = document.createElement("span");
        countEl.className = "item-count";
        countEl.textContent = stack.count;
        slot.appendChild(countEl);
      }
    }
  });

  const match = findMatchingRecipe();
  craftingResultEl.innerHTML = "";
  if (match) {
    const imgSrc = iconForItem(match.result.item);
    if (imgSrc) {
      const img = document.createElement("img");
      img.src = imgSrc;
      craftingResultEl.appendChild(img);
    }
    craftButton.disabled = false;
  } else {
    craftButton.disabled = true;
  }
}

craftButton.addEventListener("click", () => {
  const match = findMatchingRecipe();
  if (!match) return;

  // Alle Items im Crafting-Grid um 1 reduzieren
  for (let i = 0; i < craftingSize; i++) {
    const stack = craftingGrid[i];
    if (stack && stack.count > 0) {
      stack.count -= 1;
      if (stack.count <= 0) craftingGrid[i] = null;
    }
  }

  // Ergebnis ins Inventar
  addItemToInventory(match.result.item, match.result.count);

  updateCraftingUI();
  updateInventoryUI();
});

// Rezeptvergleich
function findMatchingRecipe() {
  for (const recipe of recipes) {
    let ok = true;
    for (let i = 0; i < craftingSize; i++) {
      const need = recipe.pattern[i];
      const have = craftingGrid[i]?.item || null;
      if (need !== have) {
        ok = false;
        break;
      }
    }
    if (ok) return recipe;
  }
  return null;
}

// Items ins Inventar packen
function addItemToInventory(itemId, count = 1) {
  // erst stacken
  for (let i = 0; i < inventorySize; i++) {
    const stack = inventory[i];
    if (stack && stack.item === itemId) {
      stack.count += count;
      updateInventoryUI();
      return;
    }
  }
  // dann freie Slots
  for (let i = 0; i < inventorySize; i++) {
    if (!inventory[i]) {
      inventory[i] = { item: itemId, count };
      updateInventoryUI();
      return;
    }
  }
}

// click: Inventar-Slot -> ins Crafting legen (einfach)
function selectInventorySlot(i) {
  const stack = inventory[i];
  if (!stack || stack.count <= 0) return;

  // ersten freien Crafting-Slot suchen
  for (let j = 0; j < craftingSize; j++) {
    if (!craftingGrid[j]) {
      craftingGrid[j] = { item: stack.item, count: 1 };
      stack.count -= 1;
      if (stack.count <= 0) inventory[i] = null;
      updateInventoryUI();
      updateCraftingUI();
      return;
    }
  }
}

// click: Crafting-Slot -> zurück ins Inventar
function selectCraftingSlot(i) {
  const stack = craftingGrid[i];
  if (!stack) return;

  addItemToInventory(stack.item, stack.count);
  craftingGrid[i] = null;
  updateCraftingUI();
}

// Block ist solide?
function isSolid(x, y) {
  if (x < 0 || x >= WORLD_COLS || y < 0 || y >= WORLD_ROWS) return true;
  const t = world[y][x];
  return t !== BLOCK.AIR;
}

// Welt zeichnen
function drawWorld() {
  const startCol = Math.floor(camera.x / TILE_SIZE);
  const endCol = startCol + VISIBLE_COLS + 1;
  const startRow = Math.floor(camera.y / TILE_SIZE);
  const endRow = startRow + VISIBLE_ROWS + 1;

  for (let y = startRow; y < endRow; y++) {
    for (let x = startCol; x < endCol; x++) {
      if (x < 0 || x >= WORLD_COLS || y < 0 || y >= WORLD_ROWS) continue;
      const type = world[y][x];
      if (type === BLOCK.AIR) continue;

      const tex = textures[type];
      const screenX = x * TILE_SIZE - camera.x;
      const screenY = y * TILE_SIZE - camera.y;

      if (tex && tex.complete) {
        ctx.drawImage(tex, screenX, screenY, TILE_SIZE, TILE_SIZE);
      } else {
        ctx.fillStyle = "#555";
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      }
    }
  }
}

// Spieler zeichnen
function drawPlayer() {
  const screenX = player.x * TILE_SIZE - camera.x;
  const screenY = player.y * TILE_SIZE - camera.y;

  ctx.fillStyle = "#ffcc00";
  ctx.fillRect(
    screenX,
    screenY,
    player.width * TILE_SIZE,
    player.height * TILE_SIZE
  );
}

// Kamera
function updateCamera() {
  const targetX = player.x * TILE_SIZE + (player.width * TILE_SIZE) / 2 - canvas.width / 2;
  const targetY = player.y * TILE_SIZE + (player.height * TILE_SIZE) / 2 - canvas.height / 2;

  const smoothing = 0.15;
  camera.x += (targetX - camera.x) * smoothing;
  camera.y += (targetY - camera.y) * smoothing;

  if (camera.x < 0) camera.x = 0;
  if (camera.y < 0) camera.y = 0;
  const maxCamX = WORLD_COLS * TILE_SIZE - canvas.width;
  const maxCamY = WORLD_ROWS * TILE_SIZE - canvas.height;
  if (camera.x > maxCamX) camera.x = maxCamX;
  if (camera.y > maxCamY) camera.y = maxCamY;
}

// Kollision
function collides(px, py) {
  const left = Math.floor(px);
  const right = Math.floor(px + player.width - 0.001);
  const top = Math.floor(py);
  const bottom = Math.floor(py + player.height - 0.001);

  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      if (isSolid(x, y)) return true;
    }
  }
  return false;
}

// Bewegung
function movePlayer(dt) {
  const speed = 6;
  const jumpStrength = -12;
  const gravity = 25;

  player.vx = 0;
  if (keys["a"]) player.vx = -speed;
  if (keys["d"]) player.vx = speed;

  if (keys["w"] && player.onGround) {
    player.vy = jumpStrength;
    player.onGround = false;
  }

  player.vy += gravity * dt;

  let newX = player.x + player.vx * dt;
  if (!collides(newX, player.y)) {
    player.x = newX;
  }

  let newY = player.y + player.vy * dt;
  if (!collides(player.x, newY)) {
    player.y = newY;
    player.onGround = false;
  } else {
    if (player.vy > 0) player.onGround = true;
    player.vy = 0;
  }
}

// Maus: Blöcke abbauen/setzen
canvas.addEventListener("mousedown", e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  const worldX = Math.floor((mx + camera.x) / TILE_SIZE);
  const worldY = Math.floor((my + camera.y) / TILE_SIZE);

  if (worldX < 0 || worldX >= WORLD_COLS || worldY < 0 || worldY >= WORLD_ROWS) return;

  if (e.button === 0) {
    // Abbauen
    const block = world[worldY][worldX];
    if (block !== BLOCK.AIR) {
      // Block -> Item
      const item = blockToItem(block);
      if (item) addItemToInventory(item, 1);
      world[worldY][worldX] = BLOCK.AIR;
    }
  } else if (e.button === 2) {
    // Setzen (Block aus Hotbar)
    if (!isPlayerInsideTile(worldX, worldY)) {
      const blockType = hotbarBlocks[selectedHotbarIndex];
      world[worldY][worldX] = blockType;
    }
  }
});

canvas.addEventListener("contextmenu", e => e.preventDefault());

function isPlayerInsideTile(tx, ty) {
  const pxLeft = player.x;
  const pxRight = player.x + player.width;
  const pyTop = player.y;
  const pyBottom = player.y + player.height;

  const tileLeft = tx;
  const tileRight = tx + 1;
  const tileTop = ty;
  const tileBottom = ty + 1;

  const overlapX = pxLeft < tileRight && pxRight > tileLeft;
  const overlapY = pyTop < tileBottom && pyBottom > tileTop;

  return overlapX && overlapY;
}

// Block -> Item beim Abbauen
function blockToItem(block) {
  switch (block) {
    case BLOCK.DIRT: return ITEM.DIRT;
    case BLOCK.STONE: return ITEM.STONE;
    case BLOCK.GRASS: return ITEM.GRASS;
    case BLOCK.WOOD: return ITEM.WOOD;
    case BLOCK.COAL_ORE: return ITEM.COAL;
    case BLOCK.IRON_ORE: return ITEM.IRON_ORE;
    case BLOCK.GOLD_ORE: return ITEM.GOLD_ORE;
    case BLOCK.DIAMOND_ORE: return ITEM.DIAMOND_ORE;
    default: return null;
  }
}

// Game Loop
let lastTime = 0;
function loop(timestamp) {
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  movePlayer(dt);
  updateCamera();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawWorld();
  drawPlayer();

  requestAnimationFrame(loop);
}

// Init
generateWorld();
createGridSlots();
selectHotbar(0);
requestAnimationFrame(loop);
