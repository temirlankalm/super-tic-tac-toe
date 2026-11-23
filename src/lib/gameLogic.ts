import { AiDifficulty, BoardWinner, CellState, DEFAULT_MODIFIERS, GameMode, GameModifiers, GameState, Move, Player } from '@/types/game';

export const WINNING_COMBINATIONS = [
  [0, 1, 2], // rows
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6], // columns
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8], // diagonals
  [2, 4, 6],
];

export function check3InARow(cells: (Player | 'TIE' | null)[]): {
  winner: Player | null;
  line: number[] | null;
} {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    const first = cells[a];
    if (first && first !== 'TIE' && first === cells[b] && first === cells[c]) {
      return { winner: first, line: combo };
    }
  }
  return { winner: null, line: null };
}

export function isBoardFull(cells: CellState[]): boolean {
  return cells.every((c) => c !== null);
}

export function evaluateLocalBoard(cells: CellState[]): {
  winner: BoardWinner;
  line: number[] | null;
} {
  const check = check3InARow(cells);
  if (check.winner) {
    return { winner: check.winner, line: check.line };
  }
  if (isBoardFull(cells)) {
    return { winner: 'TIE', line: null };
  }
  return { winner: null, line: null };
}

export function evaluateGlobalBoard(boardWinners: BoardWinner[]): {
  winner: BoardWinner;
  line: number[] | null;
} {
  const check = check3InARow(boardWinners);
  if (check.winner) {
    return { winner: check.winner, line: check.line };
  }

  // If every board is resolved (won or tied), game is over
  const allResolved = boardWinners.every((w) => w !== null);
  if (allResolved) {
    // Determine winner by count of local boards won
    const xWins = boardWinners.filter((w) => w === 'X').length;
    const oWins = boardWinners.filter((w) => w === 'O').length;
    if (xWins > oWins) return { winner: 'X', line: null };
    if (oWins > xWins) return { winner: 'O', line: null };
    return { winner: 'TIE', line: null };
  }

  return { winner: null, line: null };
}

export function determineNextActiveBoard(
  targetBoardIdx: number,
  boardWinners: BoardWinner[],
  allCells: CellState[][]
): number | null {
  // If the target board is already won, tied, or full -> Free play!
  if (boardWinners[targetBoardIdx] !== null || isBoardFull(allCells[targetBoardIdx])) {
    return null; // free choice on any active board
  }
  return targetBoardIdx;
}

export function isMoveValid(
  state: GameState,
  boardIdx: number,
  cellIdx: number
): boolean {
  if (state.winner !== null) return false;
  if (state.boardWinners[boardIdx] !== null) return false;
  if (state.cells[boardIdx][cellIdx] !== null) return false;
  if (state.activeBoard !== null && state.activeBoard !== boardIdx) return false;
  return true;
}

export function getValidMoves(state: GameState): { boardIdx: number; cellIdx: number }[] {
  if (state.winner !== null) return [];

  const validMoves: { boardIdx: number; cellIdx: number }[] = [];

  const allowedBoards =
    state.activeBoard !== null
      ? [state.activeBoard]
      : state.boardWinners
          .map((winner, idx) => (winner === null && !isBoardFull(state.cells[idx]) ? idx : -1))
          .filter((idx) => idx !== -1);

  for (const bIdx of allowedBoards) {
    for (let cIdx = 0; cIdx < 9; cIdx++) {
      if (state.cells[bIdx][cIdx] === null) {
        validMoves.push({ boardIdx: bIdx, cellIdx: cIdx });
      }
    }
  }

  return validMoves;
}

export function createInitialState(
  gameMode: GameMode = 'ai',
  humanPlayer: Player = 'X',
  difficulty: AiDifficulty = 'hard',
  modifiers: GameModifiers = DEFAULT_MODIFIERS
): GameState {
  return {
    cells: Array(9)
      .fill(null)
      .map(() => Array(9).fill(null)),
    boardWinners: Array(9).fill(null),
    boardWinningLines: Array(9).fill(null),
    currentPlayer: 'X',
    activeBoard: null, // First player can play anywhere
    lastMove: null,
    winner: null,
    globalWinningLine: null,
    history: [],
    gameMode,
    difficulty,
    humanPlayer,
    isAiThinking: false,
    modifiers: { ...modifiers },
    playerMoveHistory: {
      X: [],
      O: [],
    },
  };
}

export function applyMove(
  state: GameState,
  boardIdx: number,
  cellIdx: number
): GameState {
  if (!isMoveValid(state, boardIdx, cellIdx)) {
    return state;
  }

  // Deep clone cells and board winners
  const nextCells = state.cells.map((board) => [...board]);
  const nextBoardWinners = [...state.boardWinners];
  const nextBoardWinningLines = [...state.boardWinningLines];

  // Apply current move
  nextCells[boardIdx][cellIdx] = state.currentPlayer;

  // Record history
  const historyEntry = {
    cells: state.cells.map((board) => [...board]),
    boardWinners: [...state.boardWinners],
    boardWinningLines: [...state.boardWinningLines],
    currentPlayer: state.currentPlayer,
    activeBoard: state.activeBoard,
    lastMove: state.lastMove,
  };

  // Check if this local board is now won
  if (nextBoardWinners[boardIdx] === null) {
    const localEval = evaluateLocalBoard(nextCells[boardIdx]);
    if (localEval.winner !== null) {
      nextBoardWinners[boardIdx] = localEval.winner;
      nextBoardWinningLines[boardIdx] = localEval.line;
    }
  }

  // Check global game status
  const globalEval = evaluateGlobalBoard(nextBoardWinners);

  // Handle Fading Ink: keep track of last 4 moves per player
  const nextPlayerMoveHistory = state.playerMoveHistory ? {
    X: [...state.playerMoveHistory.X],
    O: [...state.playerMoveHistory.O],
  } : { X: [], O: [] };

  if (state.modifiers?.fadingInk) {
    const playerMoves = nextPlayerMoveHistory[state.currentPlayer];
    playerMoves.push({ boardIdx, cellIdx });
    // If player already made more than 4 moves, the oldest move fades away
    if (playerMoves.length > 4) {
      const expiredMove = playerMoves.shift()!;
      if (nextCells[expiredMove.boardIdx][expiredMove.cellIdx] === state.currentPlayer) {
        nextCells[expiredMove.boardIdx][expiredMove.cellIdx] = null;
      }
    }
  }

  // Determine next active board (unless game is over)
  let nextActiveBoard: number | null = null;
  if (globalEval.winner === null) {
    nextActiveBoard = determineNextActiveBoard(cellIdx, nextBoardWinners, nextCells);

    // Safeguard: If nextActiveBoard is null, but no boards are available, game is tie
    const hasAnyAvailableMoves = nextBoardWinners.some(
      (w, idx) => w === null && !isBoardFull(nextCells[idx])
    );
    if (!hasAnyAvailableMoves) {
      globalEval.winner = 'TIE';
    }
  }

  const nextPlayer: Player = state.currentPlayer === 'X' ? 'O' : 'X';
  const lastMove: Move = {
    boardIdx,
    cellIdx,
    player: state.currentPlayer,
  };

  return {
    ...state,
    cells: nextCells,
    boardWinners: nextBoardWinners,
    boardWinningLines: nextBoardWinningLines,
    currentPlayer: nextPlayer,
    activeBoard: nextActiveBoard,
    lastMove,
    winner: globalEval.winner,
    globalWinningLine: globalEval.line,
    history: [...state.history, historyEntry],
    playerMoveHistory: nextPlayerMoveHistory,
  };
}
