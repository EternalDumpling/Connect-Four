const ROWS = 6;
const COLS = 7;

const state = {
  board: [],
  currentPlayer: 1,
  gameOver: false,
  scores: [0, 0, 0], // [_, player1, player2]
  draws: 0,
  cpuMode: false,
  difficulty: 'medium', // 'easy' | 'medium' | 'hard'
  cpuThinking: false,
};

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const score1El = document.getElementById('score1');
const score2El = document.getElementById('score2');
const scoreDrawsEl = document.getElementById('scoreDraws');
const p2LabelEl = document.getElementById('p2Label');
const modalEl = document.getElementById('modal');
const modalMessageEl = document.getElementById('modalMessage');
const colIndicatorsEl = document.getElementById('columnIndicators');
const difficultySelector = document.getElementById('difficultySelector');

// ─── Mode / Difficulty buttons ────────────────────────────────────────────────

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.cpuMode = btn.dataset.mode === 'cpu';
    difficultySelector.classList.toggle('hidden', !state.cpuMode);
    p2LabelEl.textContent = state.cpuMode ? 'CPU' : 'Player 2';
    state.scores = [0, 0, 0];
    state.draws = 0;
    updateScores();
    initBoard();
  });
});

document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.difficulty = btn.dataset.diff;
    state.scores = [0, 0, 0];
    state.draws = 0;
    updateScores();
    initBoard();
  });
});

// ─── Board init ───────────────────────────────────────────────────────────────

function initBoard() {
  state.board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  state.currentPlayer = 1;
  state.gameOver = false;
  state.cpuThinking = false;

  boardEl.innerHTML = '';
  colIndicatorsEl.innerHTML = '';

  for (let c = 0; c < COLS; c++) {
    const ind = document.createElement('div');
    ind.className = `col-indicator player${state.currentPlayer}`;
    ind.dataset.col = c;
    ind.textContent = '▼';
    ind.addEventListener('click', () => handleClick(c));
    ind.addEventListener('mouseenter', () => highlightColumn(c, true));
    ind.addEventListener('mouseleave', () => highlightColumn(c, false));
    colIndicatorsEl.appendChild(ind);
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.addEventListener('click', () => handleClick(c));
      cell.addEventListener('mouseenter', () => highlightColumn(c, true));
      cell.addEventListener('mouseleave', () => highlightColumn(c, false));
      boardEl.appendChild(cell);
    }
  }

  updateStatus();
  updateIndicators();
}

// ─── Input ────────────────────────────────────────────────────────────────────

function handleClick(col) {
  if (state.gameOver || state.cpuThinking) return;
  if (state.cpuMode && state.currentPlayer === 2) return; // block clicks during cpu turn
  dropPiece(col);
}

// ─── Core game logic ──────────────────────────────────────────────────────────

function dropPiece(col) {
  const targetRow = getDropRow(state.board, col);
  if (targetRow === -1) return;

  state.board[targetRow][col] = state.currentPlayer;
  const cell = getCell(targetRow, col);
  cell.classList.add(`player${state.currentPlayer}`);

  const winner = checkWinnerAt(state.board, targetRow, col, state.currentPlayer);
  if (winner) {
    highlightWinningCells(winner);
    state.scores[state.currentPlayer]++;
    updateScores();
    state.gameOver = true;
    const label = state.cpuMode && state.currentPlayer === 2 ? 'CPU wins!' : `Player ${state.currentPlayer} wins!`;
    showModal(label);
    statusEl.textContent = label;
    statusEl.className = `status player${state.currentPlayer}-turn`;
    hideAllIndicators();
    return;
  }

  if (isBoardFull(state.board)) {
    state.draws++;
    scoreDrawsEl.textContent = state.draws;
    state.gameOver = true;
    showModal("It's a draw!");
    statusEl.textContent = "It's a draw!";
    statusEl.className = 'status';
    hideAllIndicators();
    return;
  }

  state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
  updateStatus();
  updateIndicators();

  if (state.cpuMode && state.currentPlayer === 2) {
    scheduleCpuMove();
  }
}

function scheduleCpuMove() {
  state.cpuThinking = true;
  statusEl.textContent = 'CPU is thinking...';
  hideAllIndicators();

  // Small delay so the player's piece animation finishes first
  setTimeout(() => {
    const col = getCpuMove();
    state.cpuThinking = false;
    dropPiece(col);
  }, 350);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDropRow(board, col) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === 0) return r;
  }
  return -1;
}

function getCell(row, col) {
  return boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}

function highlightColumn(col, on) {
  if (state.gameOver || state.cpuThinking) return;
  if (state.cpuMode && state.currentPlayer === 2) return;
  const indicator = colIndicatorsEl.querySelector(`[data-col="${col}"]`);
  if (indicator) indicator.classList.toggle('visible', on);
}

function updateStatus() {
  if (state.cpuMode && state.currentPlayer === 2) {
    statusEl.textContent = 'CPU is thinking...';
  } else {
    statusEl.textContent = `Player ${state.currentPlayer}'s turn`;
  }
  statusEl.className = `status player${state.currentPlayer}-turn`;
}

function updateIndicators() {
  const indicators = colIndicatorsEl.querySelectorAll('.col-indicator');
  indicators.forEach(ind => {
    ind.className = `col-indicator player${state.currentPlayer}`;
  });
}

function hideAllIndicators() {
  colIndicatorsEl.querySelectorAll('.col-indicator').forEach(ind => {
    ind.classList.remove('visible');
  });
}

function isBoardFull(board) {
  return board[0].every(cell => cell !== 0);
}

function getValidCols(board) {
  return Array.from({ length: COLS }, (_, c) => c).filter(c => board[0][c] === 0);
}

function checkWinnerAt(board, row, col, player) {
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (const [dr, dc] of directions) {
    const cells = [[row, col]];
    for (let i = 1; i < 4; i++) {
      const r = row + dr * i, c = col + dc * i;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== player) break;
      cells.push([r, c]);
    }
    for (let i = 1; i < 4; i++) {
      const r = row - dr * i, c = col - dc * i;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== player) break;
      cells.push([r, c]);
    }
    if (cells.length >= 4) return cells;
  }
  return null;
}

function highlightWinningCells(cells) {
  for (const [r, c] of cells) {
    getCell(r, c).classList.add('winning');
  }
}

function updateScores() {
  score1El.textContent = state.scores[1];
  score2El.textContent = state.scores[2];
}

function showModal(message) {
  modalMessageEl.textContent = message;
  modalEl.classList.remove('hidden');
}

function hideModal() {
  modalEl.classList.add('hidden');
}

// ─── CPU AI ───────────────────────────────────────────────────────────────────

function getCpuMove() {
  const board = state.board.map(r => [...r]);
  if (state.difficulty === 'easy') return getEasyMove(board);
  if (state.difficulty === 'medium') return getMediumMove(board);
  return getHardMove(board);
}

function getEasyMove(board) {
  // Win if can, otherwise random
  const win = findImmediateWin(board, 2);
  if (win !== -1) return win;
  const valid = getValidCols(board);
  return valid[Math.floor(Math.random() * valid.length)];
}

function getMediumMove(board) {
  // Win, block, then random
  const win = findImmediateWin(board, 2);
  if (win !== -1) return win;
  const block = findImmediateWin(board, 1);
  if (block !== -1) return block;
  // Prefer center
  const valid = getValidCols(board);
  const center = Math.floor(COLS / 2);
  if (valid.includes(center)) return center;
  return valid[Math.floor(Math.random() * valid.length)];
}

function getHardMove(board) {
  const valid = getValidCols(board);
  let bestScore = -Infinity;
  let bestCol = valid[Math.floor(valid.length / 2)];

  for (const col of valid) {
    const row = getDropRow(board, col);
    board[row][col] = 2;
    const score = minimax(board, 7, -Infinity, Infinity, false);
    board[row][col] = 0;
    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
  }
  return bestCol;
}

function findImmediateWin(board, player) {
  for (const col of getValidCols(board)) {
    const row = getDropRow(board, col);
    board[row][col] = player;
    const win = checkWinnerAt(board, row, col, player);
    board[row][col] = 0;
    if (win) return col;
  }
  return -1;
}

function minimax(board, depth, alpha, beta, isMaximizing) {
  const valid = getValidCols(board);

  // Check terminal states before descending
  for (const col of valid) {
    const row = getDropRow(board, col);
    // Check if previous move won (we just placed, check last placed = opposite of isMaximizing)
  }

  if (depth === 0 || valid.length === 0) {
    return scoreBoard(board);
  }

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const col of valid) {
      const row = getDropRow(board, col);
      board[row][col] = 2;
      if (checkWinnerAt(board, row, col, 2)) {
        board[row][col] = 0;
        return 100000 + depth;
      }
      const score = minimax(board, depth - 1, alpha, beta, false);
      board[row][col] = 0;
      if (score > maxScore) maxScore = score;
      if (maxScore > alpha) alpha = maxScore;
      if (beta <= alpha) break;
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (const col of valid) {
      const row = getDropRow(board, col);
      board[row][col] = 1;
      if (checkWinnerAt(board, row, col, 1)) {
        board[row][col] = 0;
        return -(100000 + depth);
      }
      const score = minimax(board, depth - 1, alpha, beta, true);
      board[row][col] = 0;
      if (score < minScore) minScore = score;
      if (minScore < beta) beta = minScore;
      if (beta <= alpha) break;
    }
    return minScore;
  }
}

function scoreBoard(board) {
  let score = 0;
  const center = Math.floor(COLS / 2);

  // Prefer center column
  for (let r = 0; r < ROWS; r++) {
    if (board[r][center] === 2) score += 3;
  }

  // Horizontal windows
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += scoreWindow(board[r][c], board[r][c+1], board[r][c+2], board[r][c+3]);
    }
  }
  // Vertical windows
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      score += scoreWindow(board[r][c], board[r+1][c], board[r+2][c], board[r+3][c]);
    }
  }
  // Diagonal down-right
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += scoreWindow(board[r][c], board[r+1][c+1], board[r+2][c+2], board[r+3][c+3]);
    }
  }
  // Diagonal down-left
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 3; c < COLS; c++) {
      score += scoreWindow(board[r][c], board[r+1][c-1], board[r+2][c-2], board[r+3][c-3]);
    }
  }

  return score;
}

function scoreWindow(a, b, c, d) {
  const w = [a, b, c, d];
  const cpu = w.filter(x => x === 2).length;
  const human = w.filter(x => x === 1).length;
  const empty = w.filter(x => x === 0).length;

  if (cpu === 4) return 100;
  if (cpu === 3 && empty === 1) return 5;
  if (cpu === 2 && empty === 2) return 2;
  if (human === 3 && empty === 1) return -4;
  if (human === 4) return -100;
  return 0;
}

// ─── Button handlers ──────────────────────────────────────────────────────────

document.getElementById('resetBtn').addEventListener('click', () => {
  hideModal();
  initBoard();
});

document.getElementById('modalBtn').addEventListener('click', () => {
  hideModal();
  initBoard();
});

document.getElementById('resetScoresBtn').addEventListener('click', () => {
  state.scores = [0, 0, 0];
  state.draws = 0;
  updateScores();
  scoreDrawsEl.textContent = 0;
});

// ─── Start ────────────────────────────────────────────────────────────────────
initBoard();
