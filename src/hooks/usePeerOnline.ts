'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { DataConnection, Peer } from 'peerjs';
import { ConnectionStatus, OnlineRole, PeerMessage, Player, RoomJoinError, TimeControl } from '@/types/game';
import { sanitizeNickname } from '@/lib/nickname';

interface UsePeerOnlineOptions {
  myNickname?: string;
  myPlayerId?: string;
  onRemoteMove?: (boardIdx: number, cellIdx: number, player: Player, timeX?: number, timeO?: number) => void;
  onInitSync?: (msg: Extract<PeerMessage, { type: 'INIT' }>) => void;
  onTimeSync?: (timeX: number, timeO: number) => void;
  onRematchRequested?: (fromPlayer: Player) => void;
  onRematchAccepted?: (timeControl: TimeControl, nextSide?: Player) => void;
  onSideChanged?: (newSide: Player) => void;
  onRemoteResign?: (player: Player) => void;
  onDrawOffered?: (fromPlayer: Player) => void;
  onDrawAccepted?: () => void;
  onDrawDeclined?: () => void;
  onConnected?: () => void;
  onOpponentDisconnected?: () => void;
  onOpponentForfeit?: () => void;
  onOpponentReconnected?: () => void;
  isGameActive?: boolean;
}

export function usePeerOnline(options?: UsePeerOnlineOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [joinError, setJoinError] = useState<RoomJoinError>(null);
  const [role, setRole] = useState<OnlineRole>(null);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [rematchRequestedByOpponent, setRematchRequestedByOpponent] = useState(false);
  const [myRematchSent, setMyRematchSent] = useState(false);
  const [drawOfferedByOpponent, setDrawOfferedByOpponent] = useState(false);
  const [myDrawOffered, setMyDrawOffered] = useState(false);
  const [drawDeclinedNotice, setDrawDeclinedNotice] = useState(false);
  const [rematchSwappedNotice, setRematchSwappedNotice] = useState(false);
  const [opponentNickname, setOpponentNickname] = useState<string | null>(null);
  const [opponentPlayerId, setOpponentPlayerId] = useState<string | null>(null);
  const [matchCount, setMatchCount] = useState<number>(1);

  // Disconnect grace state
  const [disconnectGraceSeconds, setDisconnectGraceSeconds] = useState<number | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const connectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const disconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Clear disconnect grace timer
  const clearDisconnectGrace = useCallback(() => {
    if (disconnectTimerRef.current) {
      clearInterval(disconnectTimerRef.current);
      disconnectTimerRef.current = null;
    }
    setDisconnectGraceSeconds(null);
  }, []);

  // Cleanup connection and peer
  const cleanup = useCallback(() => {
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    clearDisconnectGrace();

    if (connRef.current) {
      try {
        connRef.current.close();
      } catch {}
      connRef.current = null;
    }
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch {}
      peerRef.current = null;
    }
    setStatus('idle');
    setJoinError(null);
    setRole(null);
    setMyPlayer(null);
    setRoomId(null);
    setRematchRequestedByOpponent(false);
    setMyRematchSent(false);
    setDrawOfferedByOpponent(false);
    setMyDrawOffered(false);
    setDrawDeclinedNotice(false);
    setOpponentNickname(null);
    setOpponentPlayerId(null);
    setMatchCount(1);
  }, [clearDisconnectGrace]);

  // Start 30s disconnect grace period
  const startDisconnectGrace = useCallback(() => {
    clearDisconnectGrace();
    setDisconnectGraceSeconds(30);
    optionsRef.current?.onOpponentDisconnected?.();

    let remaining = 30;
    disconnectTimerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearDisconnectGrace();
        optionsRef.current?.onOpponentForfeit?.();
      } else {
        setDisconnectGraceSeconds(remaining);
      }
    }, 1000);
  }, [clearDisconnectGrace]);

  // Send message over WebRTC DataChannel
  const sendMessage = useCallback((msg: PeerMessage) => {
    if (connRef.current && connRef.current.open) {
      try {
        connRef.current.send(msg);
      } catch (err) {
        console.error('Failed to send peer message:', err);
      }
    }
  }, []);

  // Setup connection handlers
  const attachConnectionHandlers = useCallback(
    (conn: DataConnection) => {
      connRef.current = conn;

      conn.on('open', () => {
        if (connectTimeoutRef.current) {
          clearTimeout(connectTimeoutRef.current);
          connectTimeoutRef.current = null;
        }
        clearDisconnectGrace();
        setStatus('connected');

        // Exchange nickname and player ID on open
        if (optionsRef.current?.myNickname) {
          try {
            conn.send({
              type: 'NICKNAME',
              nickname: sanitizeNickname(optionsRef.current.myNickname),
              playerId: optionsRef.current?.myPlayerId,
            });
          } catch {}
        }

        optionsRef.current?.onOpponentReconnected?.();
        optionsRef.current?.onConnected?.();
      });

      conn.on('data', (raw: unknown) => {
        const msg = raw as PeerMessage;
        if (!msg || !msg.type) return;

        switch (msg.type) {
          case 'INIT':
            if (msg.hostPlayer) {
              setMyPlayer(msg.hostPlayer === 'X' ? 'O' : 'X');
            }
            if (msg.hostNickname) {
              setOpponentNickname(sanitizeNickname(msg.hostNickname));
            }
            if (msg.hostPlayerId) {
              setOpponentPlayerId(msg.hostPlayerId);
            }
            if (msg.matchNumber) {
              setMatchCount(msg.matchNumber);
            }
            if (optionsRef.current?.myNickname) {
              try {
                conn.send({
                  type: 'NICKNAME',
                  nickname: sanitizeNickname(optionsRef.current.myNickname),
                  playerId: optionsRef.current?.myPlayerId,
                });
              } catch {}
            }
            optionsRef.current?.onInitSync?.(msg);
            break;
          case 'NICKNAME':
            if (msg.nickname) {
              setOpponentNickname(sanitizeNickname(msg.nickname));
            }
            if (msg.playerId) {
              setOpponentPlayerId(msg.playerId);
            }
            break;
          case 'MOVE':
            optionsRef.current?.onRemoteMove?.(
              msg.boardIdx,
              msg.cellIdx,
              msg.player,
              msg.timeX,
              msg.timeO
            );
            break;
          case 'TIME_SYNC':
            optionsRef.current?.onTimeSync?.(msg.timeX, msg.timeO);
            break;
          case 'REMATCH_REQUEST':
            setRematchRequestedByOpponent(true);
            optionsRef.current?.onRematchRequested?.(msg.fromPlayer);
            break;
          case 'REMATCH_ACCEPT':
            setRematchRequestedByOpponent(false);
            setMyRematchSent(false);
            setRematchSwappedNotice(true);
            setTimeout(() => setRematchSwappedNotice(false), 4000);
            setMatchCount((prev) => prev + 1);
            setMyPlayer((current) => {
              const nextSide: Player = msg.swappedSide
                ? (msg.swappedSide === 'X' ? 'O' : 'X')
                : (current === 'X' ? 'O' : 'X');
              optionsRef.current?.onRematchAccepted?.(msg.timeControl, nextSide);
              return nextSide;
            });
            break;
          case 'SIDE_CHANGE':
            if (role === 'guest' && msg.hostPlayer) {
              const guestSide: Player = msg.hostPlayer === 'X' ? 'O' : 'X';
              setMyPlayer(guestSide);
              optionsRef.current?.onSideChanged?.(guestSide);
            }
            break;
          case 'RESIGN':
            optionsRef.current?.onRemoteResign?.(msg.player);
            break;
          case 'DRAW_OFFER':
            setDrawOfferedByOpponent(true);
            optionsRef.current?.onDrawOffered?.(msg.fromPlayer);
            break;
          case 'DRAW_ACCEPT':
            setMyDrawOffered(false);
            setDrawOfferedByOpponent(false);
            optionsRef.current?.onDrawAccepted?.();
            break;
          case 'DRAW_DECLINE':
            setMyDrawOffered(false);
            setDrawDeclinedNotice(true);
            setTimeout(() => setDrawDeclinedNotice(false), 3000);
            optionsRef.current?.onDrawDeclined?.();
            break;
          case 'DISCONNECT':
            setStatus('disconnected');
            if (optionsRef.current?.isGameActive) {
              startDisconnectGrace();
            }
            break;
        }
      });

      conn.on('close', () => {
        setStatus('disconnected');
        connRef.current = null;
        if (optionsRef.current?.isGameActive) {
          startDisconnectGrace();
        }
      });

      conn.on('error', (err) => {
        console.error('Peer connection error:', err);
        setStatus('disconnected');
        if (optionsRef.current?.isGameActive) {
          startDisconnectGrace();
        }
      });
    },
    [clearDisconnectGrace, startDisconnectGrace]
  );

  // Create room as Host (Player X by default)
  const createRoom = useCallback(async (assignedPlayer?: Player): Promise<string> => {
    cleanup();
    setStatus('creating');
    setRole('host');
    setMyPlayer(assignedPlayer || 'X');

    // Generate short 6-char clean alphanumeric room code
    const newRoomId = Math.random().toString(36).substring(2, 8).toLowerCase();
    setRoomId(newRoomId);

    const { Peer } = await import('peerjs');
    const peerId = `sttt-${newRoomId}`;

    const peer = new Peer(peerId, { debug: 1 });
    peerRef.current = peer;

    peer.on('open', () => {
      setStatus('waiting');
    });

    peer.on('connection', (incomingConn) => {
      if (connRef.current && connRef.current.open) {
        incomingConn.close();
        return;
      }
      attachConnectionHandlers(incomingConn);
    });

    peer.on('error', (err) => {
      console.error('Host peer error:', err);
      if (err.type === 'unavailable-id') {
        createRoom();
      } else {
        setJoinError('connection_failed');
        setStatus('error');
      }
    });

    return newRoomId;
  }, [cleanup, attachConnectionHandlers]);

  // Join room as Guest (Player O by default)
  const joinRoom = useCallback(
    async (targetRoomId: string, assignedRole: OnlineRole = 'guest', assignedPlayer?: Player) => {
      cleanup();
      let cleanId = targetRoomId.trim().toLowerCase();
      if (cleanId.includes('room=')) {
        cleanId = cleanId.split('room=')[1].split('&')[0];
      }
      cleanId = cleanId.replace(/^sttt-/, '').replace(/[^a-z0-9]/g, '');
      if (!cleanId) return;

      setStatus('connecting');
      setJoinError(null);
      setRole(assignedRole);
      setMyPlayer(assignedPlayer || (assignedRole === 'host' ? 'X' : 'O'));
      setRoomId(cleanId);

      if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = setTimeout(() => {
        setStatus((curr) => {
          if (curr === 'connecting') {
            setJoinError('timeout');
            return 'error';
          }
          return curr;
        });
      }, 12000);

      const { Peer } = await import('peerjs');
      const peer = new Peer();
      peerRef.current = peer;

      peer.on('open', () => {
        const targetPeerId = `sttt-${cleanId}`;
        const conn = peer.connect(targetPeerId, { reliable: true });
        attachConnectionHandlers(conn);
      });

      peer.on('error', (err: any) => {
        console.error('Guest peer error:', err);
        if (connectTimeoutRef.current) {
          clearTimeout(connectTimeoutRef.current);
          connectTimeoutRef.current = null;
        }
        const isNotFound =
          err?.type === 'peer-unavailable' ||
          (typeof err?.message === 'string' &&
            (err.message.toLowerCase().includes('could not connect to peer') ||
              err.message.toLowerCase().includes('peer-unavailable')));
        setJoinError(isNotFound ? 'not_found' : 'connection_failed');
        setStatus('error');
      });
    },
    [cleanup, attachConnectionHandlers]
  );

  // Request rematch
  const requestRematch = useCallback(() => {
    setMyRematchSent(true);
    sendMessage({
      type: 'REMATCH_REQUEST',
      fromPlayer: myPlayer || (role === 'host' ? 'X' : 'O'),
    });
  }, [myPlayer, role, sendMessage]);

  // Accept rematch with side swap by default
  const acceptRematch = useCallback(
    (currentTc: TimeControl) => {
      setRematchRequestedByOpponent(false);
      setMyRematchSent(false);
      setRematchSwappedNotice(true);
      setTimeout(() => setRematchSwappedNotice(false), 4000);
      setMatchCount((prev) => prev + 1);

      // Swap sides by default on rematch
      const nextSide: Player = myPlayer === 'X' ? 'O' : 'X';
      setMyPlayer(nextSide);

      sendMessage({
        type: 'REMATCH_ACCEPT',
        timeControl: currentTc,
        swappedSide: nextSide,
      });
      optionsRef.current?.onRematchAccepted?.(currentTc, nextSide);
    },
    [myPlayer, sendMessage]
  );

  // Creator side selection update (syncs to joiner)
  const setHostSide = useCallback(
    (side: Player) => {
      setMyPlayer(side);
      sendMessage({
        type: 'SIDE_CHANGE',
        hostPlayer: side,
      });
    },
    [sendMessage]
  );

  // Resign from game
  const resignOnline = useCallback(() => {
    const p: Player = myPlayer || (role === 'host' ? 'X' : 'O');
    sendMessage({ type: 'RESIGN', player: p });
  }, [myPlayer, role, sendMessage]);

  // Offer draw to opponent
  const offerDrawOnline = useCallback(() => {
    const p: Player = myPlayer || (role === 'host' ? 'X' : 'O');
    setMyDrawOffered(true);
    sendMessage({ type: 'DRAW_OFFER', fromPlayer: p });
  }, [myPlayer, role, sendMessage]);

  // Accept draw offered by opponent
  const acceptDrawOnline = useCallback(() => {
    setDrawOfferedByOpponent(false);
    sendMessage({ type: 'DRAW_ACCEPT' });
  }, [sendMessage]);

  // Decline draw offered by opponent
  const declineDrawOnline = useCallback(() => {
    setDrawOfferedByOpponent(false);
    sendMessage({ type: 'DRAW_DECLINE' });
  }, [sendMessage]);

  // Leave room and notify peer
  const leaveRoom = useCallback(() => {
    sendMessage({ type: 'DISCONNECT' });
    cleanup();
  }, [sendMessage, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Send updated nickname to opponent
  const sendNickname = useCallback(
    (name: string) => {
      sendMessage({
        type: 'NICKNAME',
        nickname: sanitizeNickname(name),
        playerId: optionsRef.current?.myPlayerId,
      });
    },
    [sendMessage]
  );

  return {
    status,
    joinError,
    role,
    myPlayer,
    opponentPlayer: (myPlayer ? (myPlayer === 'X' ? 'O' : 'X') : null) as Player | null,
    roomId,
    opponentNickname,
    opponentPlayerId,
    currentMatchId: roomId ? `${roomId}_m${matchCount}` : null,
    rematchRequestedByOpponent,
    myRematchSent,
    drawOfferedByOpponent,
    myDrawOffered,
    drawDeclinedNotice,
    rematchSwappedNotice,
    disconnectGraceSeconds,
    createRoom,
    joinRoom,
    leaveRoom,
    setHostSide,
    sendMessage,
    sendNickname,
    requestRematch,
    acceptRematch,
    resignOnline,
    offerDrawOnline,
    acceptDrawOnline,
    declineDrawOnline,
  };
}
