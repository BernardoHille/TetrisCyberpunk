import { useState, useEffect, useRef } from 'react';

const ROWS = 20;
const COLS = 10;

const TETROMINOS = {
  I: {
    rotations: [
      [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
      ],
    ],
  },
  J: {
    rotations: [
      [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 1, 1],
        [0, 1, 0],
        [0, 1, 0],
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [0, 0, 1],
      ],
      [
        [0, 1, 0],
        [0, 1, 0],
        [1, 1, 0],
      ],
    ],
  },
  L: {
    rotations: [
      [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 1],
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [1, 0, 0],
      ],
      [
        [1, 1, 0],
        [0, 1, 0],
        [0, 1, 0],
      ],
    ],
  },
  O: {
    rotations: [
      [
        [1, 1],
        [1, 1],
      ],
    ],
  },
  S: {
    rotations: [
      [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
      ],
      [
        [0, 1, 0],
        [0, 1, 1],
        [0, 0, 1],
      ],
    ],
  },
  T: {
    rotations: [
      [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 1, 0],
        [0, 1, 1],
        [0, 1, 0],
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [0, 1, 0],
      ],
      [
        [0, 1, 0],
        [1, 1, 0],
        [0, 1, 0],
      ],
    ],
  },
  Z: {
    rotations: [
      [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 0, 1],
        [0, 1, 1],
        [0, 1, 0],
      ],
    ],
  },
};

const shapes = Object.keys(TETROMINOS);

const speeds = {
  easy: 1000,
  medium: 500,
  hard: 250,
};

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function randomPiece() {
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  return {
    shape,
    rotation: 0,
    x: Math.floor(COLS / 2) - 1,
    y: 0,
  };
}

export default function Home() {
  const [board, setBoard] = useState(createBoard());
  const [piece, setPiece] = useState(randomPiece());
  const [nextPiece, setNextPiece] = useState(randomPiece());
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState('easy');

  const touchStart = useRef(null);

  useEffect(() => {
    function handleKey(e) {
      if (!playing) return;
      if (e.key === 'ArrowLeft') move(-1, 0);
      else if (e.key === 'ArrowRight') move(1, 0);
      else if (e.key === 'ArrowDown') drop();
      else if (e.key === 'ArrowUp') rotate();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [playing, piece]);

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      drop();
    }, speeds[difficulty]);
    return () => clearInterval(interval);
  }, [playing, piece, difficulty]);

  function collide(brd, p) {
    const matrix = TETROMINOS[p.shape].rotations[p.rotation];
    for (let y = 0; y < matrix.length; y++) {
      for (let x = 0; x < matrix[y].length; x++) {
        if (matrix[y][x]) {
          const newY = p.y + y;
          const newX = p.x + x;
          if (
            newX < 0 ||
            newX >= COLS ||
            newY >= ROWS ||
            brd[newY] && brd[newY][newX]
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function merge(brd, p) {
    const matrix = TETROMINOS[p.shape].rotations[p.rotation];
    const newBoard = brd.map((row) => row.slice());
    matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          newBoard[p.y + y][p.x + x] = 1;
        }
      });
    });
    return newBoard;
  }

  function clearLines(brd) {
    let cleared = 0;
    const newBoard = brd.filter((row) => {
      if (row.every((cell) => cell !== 0)) {
        cleared++;
        return false;
      }
      return true;
    });
    while (newBoard.length < ROWS) {
      newBoard.unshift(Array(COLS).fill(0));
    }
    if (cleared > 0) {
      setScore((s) => s + cleared * 100);
    }
    return newBoard;
  }

  function move(dx, dy) {
    const newPiece = { ...piece, x: piece.x + dx, y: piece.y + dy };
    if (!collide(board, newPiece)) {
      setPiece(newPiece);
      return true;
    }
    return false;
  }

  function rotate() {
    const newRotation = (piece.rotation + 1) % TETROMINOS[piece.shape].rotations.length;
    const newPiece = { ...piece, rotation: newRotation };
    if (!collide(board, newPiece)) setPiece(newPiece);
  }

  function drop() {
    if (!move(0, 1)) {
      const merged = merge(board, piece);
      const cleared = clearLines(merged);
      const next = nextPiece;
      next.x = Math.floor(COLS / 2) - 1;
      next.y = 0;
      if (collide(cleared, next)) {
        setPlaying(false);
      }
      setBoard(cleared);
      setPiece(next);
      setNextPiece(randomPiece());
    }
  }

  function start() {
    setBoard(createBoard());
    setPiece(randomPiece());
    setNextPiece(randomPiece());
    setScore(0);
    setPlaying(true);
  }

  function handleTouchStart(e) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function handleTouchEnd(e) {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absX > absY) {
      if (dx > 30) move(1, 0);
      else if (dx < -30) move(-1, 0);
    } else {
      if (dy > 30) drop();
      else if (absY < 10) rotate();
    }
    touchStart.current = null;
  }

  return (
    <div style={{ textAlign: 'center', position: 'relative' }}>
      <div className="scanlines" />
      <h1>Neon Blocks</h1>
      {!playing && (
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="difficulty">Difficulty: </label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <div>
            <button onClick={start}>Start</button>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            position: 'relative',
            width: 'min(90vw,300px)',
            height: 'calc(min(90vw,300px) * 2)',
            background: '#111',
            border: '2px solid #BC13FE',
            boxShadow: '0 0 10px #BC13FE',
            display: 'grid',
            gridTemplateRows: `repeat(${ROWS}, 1fr)`,
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            touchAction: 'none',
          }}
        >
          {board.map((row, y) =>
            row.map((cell, x) => {
              const isPiece = (function () {
                const matrix = TETROMINOS[piece.shape].rotations[piece.rotation];
                const px = x - piece.x;
                const py = y - piece.y;
                return matrix[py] && matrix[py][px];
              })();
              const filled = cell || isPiece;
              return (
                <div
                  key={`${x}-${y}`}
                  style={{
                    border: filled ? '1px solid #BC13FE' : '1px solid transparent',
                    boxShadow: filled ? '0 0 6px #BC13FE' : 'none',
                    background: filled ? '#2F4F4F' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                />
              );
            })
          )}
        </div>
        <div style={{ minWidth: '100px' }}>
          <h3>Score: {score}</h3>
          <h4>Next:</h4>
          <div
            style={{
              width: '80px',
              height: '80px',
              background: '#111',
              border: '2px solid #BC13FE',
              boxShadow: '0 0 10px #BC13FE',
              display: 'grid',
              gridTemplateRows: 'repeat(4, 1fr)',
              gridTemplateColumns: 'repeat(4, 1fr)',
              margin: '0 auto',
            }}
          >
            {Array.from({ length: 4 }, (_, y) =>
              Array.from({ length: 4 }, (_, x) => {
                const matrix = TETROMINOS[nextPiece.shape].rotations[0];
                const filled = matrix[y] && matrix[y][x];
                return (
                  <div
                    key={`${x}-${y}`}
                    style={{
                      border: filled ? '1px solid #BC13FE' : '1px solid transparent',
                      boxShadow: filled ? '0 0 6px #BC13FE' : 'none',
                      background: filled ? '#2F4F4F' : 'transparent',
                    }}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
      {!playing && score > 0 && <h2>Game Over</h2>}
    </div>
  );
}
