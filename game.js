const ROWS = 6;
const COLS = 7;

const state = {
  board: [],
  currentPlayer: 1,
  gameOver: false,
  scores: [0, 0, 0], // [_, player1, player2]
  draws: 0,
};

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const score1El = document.getElementById('score1');
const score2El = document.getElementById('score2');
const scoreDrawsEl = document.getElementById('scoreDraws');
const modalEl = document.getElementById('modal');
const modalMessageEl = document.getElementById('modalMessage');
const colIndicatorsEl = document.getElementById('columnIndicators');

function initBoard() {
  state.board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  state.currentPlayer = 1;
  state.gameOver = false;

  boardEl.innerHTML = '';
  colIndicatorsEl.innerHTML = '';

  // Column indicator arrows
  for (let c = 0; c < COLS; c++) {
    const ind = document.createElement('div');
    ind.className = `col-indicator player${state.currentPlayer}`;
    ind.dataset.col = c;
    ind.textContent = '▼';
    ind.addEventListener('click', () => dropPiece(c));
    ind.addEventListener('mouseenter', () => highlightColumn(c, true));
    ind.addEventListener('mouseleave', () => highlightColumn(c, false));
    colIndicatorsEl.appendChild(ind);
  }

  // Cells (row 0 = top visually, but logically row 5 = bottom)
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.addEventListener('click', () => dropPiece(c));
      cell.addEventListener('mouseenter', () => highlightColumn(c, true));
      cell.addEventListener('mouseleave', () => highlightColumn(c, false));
      boardEl.appendChild(cell);
    }
  }

  updateStatus();
  updateIndicators();
}

function getCell(row, col) {
  return boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}

function highlightColumn(col, on) {
  if (state.gameOver) return;
  const indicator = colIndicatorsEl.querySelector(`[data-col="${col}"]`);
  if (indicator) indicator.classList.toggle('visible', on);
}

function dropPiece(col) {
  if (state.gameOver) return;

  // Find the lowest empty row in this column
  let targetRow = -1;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (state.board[r][col] === 0) {
      targetRow = r;
      break;
    }
  }

  if (targetRow === -1) return; // Column full

  state.board[targetRow][col] = state.currentPlayer;
  const cell = getCell(targetRow, col);
  cell.classList.add(`player${state.currentPlayer}`);

  const winner = checkWinner(targetRow, col);
  if (winner) {
    highlightWinningCells(winner.cells);
    state.scores[state.currentPlayer]++;
    updateScores();
    state.gameOver = true;
    showModal(`Player ${state.currentPlayer} wins!`);
    statusEl.textContent = `Player ${state.currentPlayer} wins!`;
    statusEl.className = `status player${state.currentPlayer}-turn`;
    hideAllIndicators();
    return;
  }

  if (isBoardFull()) {
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
}

function updateStatus() {
  statusEl.textContent = `Player ${state.currentPlayer}'s turn`;
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

function isBoardFull() {
  return state.board[0].every(cell => cell !== 0);
}

function checkWinner(row, col) {
  const player = state.board[row][col];
  const directions = [
    [0, 1],   // horizontal
    [1, 0],   // vertical
    [1, 1],   // diagonal down-right
    [1, -1],  // diagonal down-left
  ];

  for (const [dr, dc] of directions) {
    const cells = [[row, col]];

    for (let i = 1; i < 4; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS || state.board[r][c] !== player) break;
      cells.push([r, c]);
    }

    for (let i = 1; i < 4; i++) {
      const r = row - dr * i;
      const c = col - dc * i;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS || state.board[r][c] !== player) break;
      cells.push([r, c]);
    }

    if (cells.length >= 4) {
      return { player, cells };
    }
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

// Button handlers
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

// Start game
initBoard();
