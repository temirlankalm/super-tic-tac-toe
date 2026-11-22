export type Player = 'X' | 'O';

export type CellState = Player | null;

export type BoardWinner = Player | 'TIE' | null;

export type WinReason = 'normal' | 'timeout';

export type TimeControl = 'off' | 60 | 120 | 180 | 300;

export interface Move {
  boardIdx: number;
  cellIdx: number;
  player: Player;
}

export type AiDifficulty = 'easy' | 'medium' | 'hard';

export interface GameState {
  // 9 local boards, each with 9 cells (0..8)
  cells: CellState[][];
  // Winner of each local board (0..8)
  boardWinners: BoardWinner[];
  // Winning line of each local board (if won)
  boardWinningLines: (number[] | null)[];
  // Current active player ('X' or 'O')
  currentPlayer: Player;
  // Which board the current player must play in (null = free play anywhere)
  activeBoard: number | null;
  // Last move played (for visual breadcrumbs)
  lastMove: Move | null;
  // Overall game winner ('X', 'O', 'TIE', or null if in progress)
  winner: BoardWinner;
  // Reason for victory ('normal' 3-in-a-row or 'timeout' flag fall)
  winReason?: WinReason;
  // Winning line on global board (e.g. [0, 1, 2])
  globalWinningLine: number[] | null;
  // Game history for undo
  history: {
    cells: CellState[][];
    boardWinners: BoardWinner[];
    boardWinningLines: (number[] | null)[];
    currentPlayer: Player;
    activeBoard: number | null;
    lastMove: Move | null;
  }[];
  // Settings
  gameMode: 'pvp' | 'ai';
  difficulty: AiDifficulty;
  humanPlayer: Player;
  isAiThinking: boolean;
}
