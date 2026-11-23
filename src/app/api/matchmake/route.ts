import { NextRequest, NextResponse } from 'next/server';

interface WaitingPlayer {
  playerId: string;
  roomId: string;
  joinedAt: number;
}

interface ActiveMatch {
  matchId: string;
  roomId: string;
  hostPlayerId: string;
  guestPlayerId: string;
  hostPlayer: 'X' | 'O';
  guestPlayer: 'X' | 'O';
  createdAt: number;
}

declare global {
  var __sttt_waiting_queue: WaitingPlayer[] | undefined;
  var __sttt_active_matches: Map<string, ActiveMatch> | undefined;
}

if (!globalThis.__sttt_waiting_queue) {
  globalThis.__sttt_waiting_queue = [];
}
if (!globalThis.__sttt_active_matches) {
  globalThis.__sttt_active_matches = new Map();
}

function cleanExpired() {
  const now = Date.now();
  if (globalThis.__sttt_waiting_queue) {
    globalThis.__sttt_waiting_queue = globalThis.__sttt_waiting_queue.filter(
      (p) => now - p.joinedAt < 30000
    );
  }
  if (globalThis.__sttt_active_matches) {
    for (const [key, match] of globalThis.__sttt_active_matches.entries()) {
      if (now - match.createdAt > 180000) {
        globalThis.__sttt_active_matches.delete(key);
      }
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, playerId, roomId } = body as {
      action?: 'join' | 'poll' | 'leave';
      playerId?: string;
      roomId?: string;
    };

    if (!playerId) {
      return NextResponse.json({ error: 'playerId is required' }, { status: 400 });
    }

    cleanExpired();

    const queue = globalThis.__sttt_waiting_queue!;
    const matches = globalThis.__sttt_active_matches!;

    // 1. LEAVE QUEUE OR MATCH
    if (action === 'leave') {
      globalThis.__sttt_waiting_queue = queue.filter((p) => p.playerId !== playerId);
      matches.delete(playerId);
      return NextResponse.json({ status: 'ok' });
    }

    // 2. CHECK IF PLAYER IS ALREADY MATCHED
    const existingMatch = matches.get(playerId);
    if (existingMatch) {
      const isHost = existingMatch.hostPlayerId === playerId;
      return NextResponse.json({
        status: 'matched',
        roomId: existingMatch.roomId,
        role: isHost ? 'host' : 'guest',
        myPlayer: isHost ? existingMatch.hostPlayer : existingMatch.guestPlayer,
      });
    }

    // 3. POLL QUEUE STATUS
    if (action === 'poll') {
      const waiting = queue.find((p) => p.playerId === playerId);
      if (waiting) {
        return NextResponse.json({
          status: 'waiting',
          elapsed: Date.now() - waiting.joinedAt,
          roomId: waiting.roomId,
        });
      }
      return NextResponse.json({ status: 'not_found' });
    }

    // 4. JOIN QUEUE
    if (action === 'join') {
      // Find an existing opponent waiting in queue (not self)
      const opponentIndex = queue.findIndex((p) => p.playerId !== playerId);

      if (opponentIndex !== -1) {
        const [waitingOpponent] = queue.splice(opponentIndex, 1);

        // Randomize player roles (X or O)
        const hostIsX = Math.random() < 0.5;
        const hostPlayer: 'X' | 'O' = hostIsX ? 'X' : 'O';
        const guestPlayer: 'X' | 'O' = hostIsX ? 'O' : 'X';

        const matchId = `match_${waitingOpponent.playerId}_${playerId}`;
        const newMatch: ActiveMatch = {
          matchId,
          roomId: waitingOpponent.roomId,
          hostPlayerId: waitingOpponent.playerId,
          guestPlayerId: playerId,
          hostPlayer,
          guestPlayer,
          createdAt: Date.now(),
        };

        matches.set(waitingOpponent.playerId, newMatch);
        matches.set(playerId, newMatch);

        return NextResponse.json({
          status: 'matched',
          roomId: newMatch.roomId,
          role: 'guest',
          myPlayer: guestPlayer,
        });
      }

      // No opponent found yet -> add self as waiting host
      const assignedRoomId =
        roomId || Math.random().toString(36).substring(2, 8).toLowerCase();

      // Ensure no duplicate self-entries in queue
      globalThis.__sttt_waiting_queue = queue.filter((p) => p.playerId !== playerId);
      globalThis.__sttt_waiting_queue.push({
        playerId,
        roomId: assignedRoomId,
        joinedAt: Date.now(),
      });

      return NextResponse.json({
        status: 'waiting',
        roomId: assignedRoomId,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
