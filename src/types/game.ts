export type Player = 'X' | 'O';

export type CellState = Player | null;

export type BoardWinner = Player | 'TIE' | null;

export type WinReason = 'normal' | 'timeout' | 'resignation' | 'agreement';

export type TimeControl = 'off' | 60 | 120 | 180 | 300;

export type GameMode = 'ai' | 'pvp' | 'online' | 'daily';

export interface GameModifiers {
  fogOfWar: boolean;
  fadingInk: boolean;
  speedBlitz: boolean;
}

export const DEFAULT_MODIFIERS: GameModifiers = {
  fogOfWar: false,
  fadingInk: false,
  speedBlitz: false,
};

export type OnlineRole = 'host' | 'guest' | null;

export type ConnectionStatus =
  | 'idle'
  | 'searching'
  | 'creating'
  | 'waiting'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export type RoomJoinError = 'timeout' | 'not_found' | 'connection_failed' | null;

export type PeerMessage =
  | {
      type: 'INIT';
      timeControl: TimeControl;
      cells: CellState[][];
      boardWinners: BoardWinner[];
      boardWinningLines: (number[] | null)[];
      currentPlayer: Player;
      activeBoard: number | null;
      timeX: number;
      timeO: number;
      modifiers?: GameModifiers;
      hostPlayer?: Player;
      hostNickname?: string;
    }
  | {
      type: 'NICKNAME';
      nickname: string;
    }
  | {
      type: 'MOVE';
      boardIdx: number;
      cellIdx: number;
      player: Player;
      timeX?: number;
      timeO?: number;
    }
  | {
      type: 'TIME_SYNC';
      timeX: number;
      timeO: number;
    }
  | {
      type: 'REMATCH_REQUEST';
      fromPlayer: Player;
    }
  | {
      type: 'REMATCH_ACCEPT';
      timeControl: TimeControl;
    }
  | {
      type: 'RESIGN';
      player: Player;
    }
  | {
      type: 'DRAW_OFFER';
      fromPlayer: Player;
    }
  | {
      type: 'DRAW_ACCEPT';
    }
  | {
      type: 'DRAW_DECLINE';
    }
  | {
      type: 'DISCONNECT';
    };

export interface Move {
  boardIdx: number;
  cellIdx: number;
  player: Player;
}

export type AiDifficulty = 'easy' | 'medium' | 'hard' | 'qnet';

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
    playerMoveHistory?: {
      X: { boardIdx: number; cellIdx: number }[];
      O: { boardIdx: number; cellIdx: number }[];
    };
  }[];
  // Settings
  gameMode: GameMode;
  difficulty: AiDifficulty;
  humanPlayer: Player;
  isAiThinking: boolean;
  modifiers: GameModifiers;
  playerMoveHistory?: {
    X: { boardIdx: number; cellIdx: number }[];
    O: { boardIdx: number; cellIdx: number }[];
  };
}
