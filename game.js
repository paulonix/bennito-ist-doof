const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const TILE_SIZE = 32;

// Kamera
const camera = { x: 0, y: 0 };

// Block-Typen
const AIR = 0;
const DIRT = 1;
const STONE = 2;
const GRASS = 3;
const WOOD = 4;

// Weltgröße
const WORLD_COLS = 1000;
const WORLD_ROWS = 600;

const world = [];

// Welt generieren
function generateWorld() {
  let groundLevel = 20;

  for (let x = 0; x < WORLD_COLS; x++) {
    const change = Math.floor(Math.random() * 3) - 1;
    groundLevel += change;
    if (groundLevel < 10) groundLevel = 10;
    if (groundLevel > 40) groundLevel = 40;

    for (let y = 0; y < WORLD_ROWS; y++) {
      if (!world[y]) world[y] = [];

      if (y < groundLevel) {
        world[y][x] = AIR;
      } else if (y === groundLevel) {
        world[y][x] = GRASS;
      } else if (y < groundLevel + 3) {
        world[y][x] = DIRT;
      } else {
        world[y][x] = Math.random() < 0.2 ? STONE : DIRT;
      }
    }

    // Bäume
    if (Math.random() < 0.08) {
      const trunkHeight = 3 + Math.floor(Math.random() * 2);
      for (let t = 0; t < trunkHeight; t++) {
        const ty = groundLevel - 1 - t;
        if (ty >= 0) world[ty][x] = WOOD;
      }
    }
  }
}

// Spieler
const player = {
  x: 5,
  y: 5,
  vx: 0,
  vy: 0,
  width: 0.6,
  height: 0.9,
  onGround: false
};

const keys = {};
let selectedBlockIndex = 0;
const hotbarBlocks = [DIRT, STONE, GRASS, WOOD];

window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;

  if (e.key === "1") selectHotbar(0);
  if (e.key === "2") selectHotbar(1);
  if (e.key === "3") selectHotbar(2);
  if (e.key === "4") selectHotbar(3);
});

window.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

function selectHotbar(index) {
  selectedBlockIndex = index;
  document.querySelectorAll("#hotbar .slot").forEach((el, i) => {
    el.classList.toggle("selected", i === index);
  });
}

function getBlockColor(type) {
  switch (type) {
    case DIRT: return "#7b4a1f";
    case STONE: return "#777777";
    case GRASS: return "#2ecc40";
    case WOOD: return "#8b5a2b";
    default: return null;
  }
}
const textures = {
  [DIRT]: new Image(),
  [STONE]: new Image(),
  [GRASS]: new Image(),
  [WOOD]: new Image()
};

textures[DIRT].src = "dirt.jpg";
textures[STONE].src = "stone.jpg";
textures[GRASS].src = "grass.webp";
textures[WOOD].src = "wood.jpg";





function isSolid(x, y) {
  if (x < 0 || x >= WORLD_COLS || y < 0 || y >= WORLD_ROWS) return true;
  const t = world[y][x];
  return t === DIRT || t === STONE || t === GRASS || t === WOOD;
}

function drawWorld() {
  const COLS = Math.floor(canvas.width / TILE_SIZE);
  const ROWS = Math.floor(canvas.height / TILE_SIZE);

  const startCol = Math.floor(camera.x / TILE_SIZE);
  const endCol = startCol + COLS + 1;
  const startRow = Math.floor(camera.y / TILE_SIZE);
  const endRow = startRow + ROWS + 1;

  for (let y = startRow; y < endRow; y++) {
    for (let x = startCol; x < endCol; x++) {
      if (x < 0 || x >= WORLD_COLS || y < 0 || y >= WORLD_ROWS) continue;
      const type = world[y][x];
      const color = getBlockColor(type);
      if (!color) continue;

      const screenX = x * TILE_SIZE - camera.x;
      const screenY = y * TILE_SIZE - camera.y;

      ctx.fillStyle = color;
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }
  }
}

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

function updateCamera() {
  const targetX = player.x * TILE_SIZE - canvas.width / 2;
  const targetY = player.y * TILE_SIZE - canvas.height / 2;

  camera.x += (targetX - camera.x) * 0.1;
  camera.y += (targetY - camera.y) * 0.1;

  camera.x = Math.max(0, Math.min(camera.x, WORLD_COLS * TILE_SIZE - canvas.width));
  camera.y = Math.max(0, Math.min(camera.y, WORLD_ROWS * TILE_SIZE - canvas.height));
}

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

function movePlayer(dt) {
  const speed = 6;
  const jumpStrength = -11;
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
  if (!collides(newX, player.y)) player.x = newX;

  let newY = player.y + player.vy * dt;
  if (!collides(player.x, newY)) {
    player.y = newY;
    player.onGround = false;
  } else {
    if (player.vy > 0) player.onGround = true;
    player.vy = 0;
  }
}

canvas.addEventListener("mousedown", e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  const worldX = Math.floor((mx + camera.x) / TILE_SIZE);
  const worldY = Math.floor((my + camera.y) / TILE_SIZE);

  if (worldX < 0 || worldX >= WORLD_COLS || worldY < 0 || worldY >= WORLD_ROWS) return;

  if (e.button === 0) {
    world[worldY][worldX] = AIR;
  } else if (e.button === 2) {
    const blockType = hotbarBlocks[selectedBlockIndex];
    world[worldY][worldX] = blockType;
  }
});

canvas.addEventListener("contextmenu", e => e.preventDefault());

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

generateWorld();
selectHotbar(0);
requestAnimationFrame(loop);
