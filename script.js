const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;
context.scale(BLOCK_SIZE, BLOCK_SIZE);

const colors = ['#0ff', '#f0f', '#ff0', '#0f0', '#f00', '#00f', '#fa0'];

function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

function createPiece(type) {
  switch (type) {
    case 'T':
      return [
        [0, 1, 0],
        [1, 1, 1],
      ];
    case 'O':
      return [
        [2, 2],
        [2, 2],
      ];
    case 'L':
      return [
        [0, 0, 3],
        [3, 3, 3],
      ];
    case 'J':
      return [
        [4, 0, 0],
        [4, 4, 4],
      ];
    case 'I':
      return [
        [5, 5, 5, 5],
      ];
    case 'S':
      return [
        [0, 6, 6],
        [6, 6, 0],
      ];
    case 'Z':
      return [
        [7, 7, 0],
        [0, 7, 7],
      ];
  }
}

function collide(arena, player) {
  const [m, o] = [player.matrix, player.pos];
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) {
    matrix.forEach(row => row.reverse());
  } else {
    matrix.reverse();
  }
}

function playerReset() {
  const pieces = 'TJLOSZI';
  player.matrix = createPiece(pieces[(pieces.length * Math.random()) | 0]);
  player.pos.y = 0;
  player.pos.x = ((arena[0].length / 2) | 0) - ((player.matrix[0].length / 2) | 0);
  if (collide(arena, player)) {
    gameOver();
  }
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    arenaSweep();
    playerReset();
  }
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) {
    player.pos.x -= dir;
  }
}

function playerRotate(dir) {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

function arenaSweep() {
  let rowCount = 0;
  outer: for (let y = arena.length - 1; y >= 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) {
        continue outer;
      }
    }
    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    ++y;
    rowCount++;
  }
  if (rowCount > 0) {
    player.score += rowCount * 100;
    updateScore();
  }
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        context.fillStyle = '#222';
        context.fillRect(x + offset.x, y + offset.y, 1, 1);
        context.strokeStyle = colors[value - 1];
        context.lineWidth = 0.08;
        context.shadowBlur = 8;
        context.shadowColor = colors[value - 1];
        context.strokeRect(x + offset.x + 0.05, y + offset.y + 0.05, 0.9, 0.9);
        context.shadowBlur = 0;
      }
    });
  });
}

function draw() {
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawMatrix(arena, { x: 0, y: 0 });
  if (player.matrix) {
    drawMatrix(player.matrix, player.pos);
  }
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let running = false;
let animationId;

function update(time = 0) {
  if (!running) return;
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    playerDrop();
  }
  draw();
  animationId = requestAnimationFrame(update);
}

const arena = createMatrix(COLS, ROWS);
const player = {
  pos: { x: 0, y: 0 },
  matrix: null,
  score: 0,
};

const scoreElem = document.getElementById('score');
const startOverlay = document.getElementById('start');
const gameOverOverlay = document.getElementById('gameover');
const finalScoreElem = document.getElementById('finalScore');

function updateScore() {
  scoreElem.innerText = player.score;
}

function startGame(speed) {
  dropInterval = speed;
  arena.forEach(row => row.fill(0));
  player.score = 0;
  updateScore();
  startOverlay.classList.remove('active');
  gameOverOverlay.classList.remove('active');
  playerReset();
  running = true;
  cancelAnimationFrame(animationId);
  update();
}

function gameOver() {
  running = false;
  cancelAnimationFrame(animationId);
  finalScoreElem.innerText = player.score;
  gameOverOverlay.classList.add('active');
}

startOverlay.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', () => startGame(parseInt(btn.dataset.speed, 10)));
});

document.getElementById('restart').addEventListener('click', () => {
  startOverlay.classList.add('active');
  gameOverOverlay.classList.remove('active');
});

document.addEventListener('keydown', event => {
  if (!running) return;
  if (event.key === 'ArrowLeft') {
    playerMove(-1);
  } else if (event.key === 'ArrowRight') {
    playerMove(1);
  } else if (event.key === 'ArrowDown') {
    playerDrop();
  } else if (event.key === 'ArrowUp' || event.key === ' ') {
    playerRotate(1);
  }
});

let touchStartX = null;
let touchStartY = null;

canvas.addEventListener('touchstart', e => {
  const t = e.touches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
});

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', e => {
  if (!running) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 30) playerMove(1);
    else if (dx < -30) playerMove(-1);
  } else {
    if (dy > 30) playerDrop();
    else playerRotate(1);
  }
});
