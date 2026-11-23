'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { DataConnection, Peer } from 'peerjs';
import { ConnectionStatus, OnlineRole, PeerMessage, Player, TimeControl } from '@/types/game';

interface UsePeerOnlineOptions {
  onRemoteMove?: (boardIdx: number, cellIdx: number, player: Player, timeX?: number, timeO?: number) => void;
  onInitSync?: (msg: Extract<PeerMessage, { type: 'INIT' }>) => void;
  onTimeSync?: (timeX: number, timeO: number) => void;
  onRematchRequested?: (fromPlayer: Player) => void;
  onRematchAccepted?: (timeControl: TimeControl) => void;
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
  const [role, setRole] = useState<OnlineRole>(null);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [rematchRequestedByOpponent, setRematchRequestedByOpponent] = useState(false);
  const [myRematchSent, setMyRematchSent] = useState(false);
  const [drawOfferedByOpponent, setDrawOfferedByOpponent] = useState(false);
  const [myDrawOffered, setMyDrawOffered] = useState(false);
  const [drawDeclinedNotice, setDrawDeclinedNotice] = useState(false);

  // Quick match & disconnect states
  const [isSearching, setIsSearching] = useState(false);
  const [searchElapsed, setSearchElapsed] = useState(0);
  const [searchTimeoutReached, setSearchTimeoutReached] = useState(false);
  const [disconnectGraceSeconds, setDisconnectGraceSeconds] = useState<number | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const connectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchPollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchSecondsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const disconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const localPlayerIdRef = useRef<string | null>(null);

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
    if (searchPollTimerRef.current) {
      clearInterval(searchPollTimerRef.current);
      searchPollTimerRef.current = null;
    }
    if (searchSecondsTimerRef.current) {
      clearInterval(searchSecondsTimerRef.current);
      searchSecondsTimerRef.current = null;
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
    setRole(null);
    setMyPlayer(null);
    setRoomId(null);
    setRematchRequestedByOpponent(false);
    setMyRematchSent(false);
    setDrawOfferedByOpponent(false);
    setMyDrawOffered(false);
    setDrawDeclinedNotice(false);
    setIsSearching(false);
    setSearchElapsed(0);
    setSearchTimeoutReached(false);
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
        setIsSearching(false);
        if (searchPollTimerRef.current) {
          clearInterval(searchPollTimerRef.current);
          searchPollTimerRef.current = null;
        }
        if (searchSecondsTimerRef.current) {
          clearInterval(searchSecondsTimerRef.current);
          searchSecondsTimerRef.current = null;
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
            optionsRef.current?.onInitSync?.(msg);
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
            optionsRef.current?.onRematchAccepted?.(msg.timeControl);
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
      setRole(assignedRole);
      setMyPlayer(assignedPlayer || (assignedRole === 'host' ? 'X' : 'O'));
      setRoomId(cleanId);

      if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = setTimeout(() => {
        setStatus((curr) => (curr === 'connecting' ? 'error' : curr));
      }, 12000);

      const { Peer } = await import('peerjs');
      const peer = new Peer();
      peerRef.current = peer;

      peer.on('open', () => {
        const targetPeerId = `sttt-${cleanId}`;
        const conn = peer.connect(targetPeerId, { reliable: true });
        attachConnectionHandlers(conn);
      });

      peer.on('error', (err) => {
        console.error('Guest peer error:', err);
        setStatus('error');
      });
    },
    [cleanup, attachConnectionHandlers]
  );

  // Quick match search & lobby pairing
  const startQuickMatch = useCallback(async () => {
    cleanup();
    setIsSearching(true);
    setStatus('searching');
    setSearchElapsed(0);
    setSearchTimeoutReached(false);

    const playerId = 'p_' + Math.random().toString(36).substring(2, 9);
    localPlayerIdRef.current = playerId;

    const tempRoomId = Math.random().toString(36).substring(2, 8).toLowerCase();
    setRoomId(tempRoomId);

    const { Peer } = await import('peerjs');
    const peerId = `sttt-${tempRoomId}`;
    const peer = new Peer(peerId, { debug: 1 });
    peerRef.current = peer;
    setRole('host');

    peer.on('connection', (incomingConn) => {
      if (connRef.current && connRef.current.open) {
        incomingConn.close();
        return;
      }
      setIsSearching(false);
      if (searchPollTimerRef.current) {
        clearInterval(searchPollTimerRef.current);
        searchPollTimerRef.current = null;
      }
      if (searchSecondsTimerRef.current) {
        clearInterval(searchSecondsTimerRef.current);
        searchSecondsTimerRef.current = null;
      }
      attachConnectionHandlers(incomingConn);
    });

    peer.on('error', (err) => {
      console.warn('Quick match peer status notice:', err);
    });

    let elapsed = 0;
    searchSecondsTimerRef.current = setInterval(() => {
      elapsed += 1;
      setSearchElapsed(elapsed);
      if (elapsed >= 18) {
        setSearchTimeoutReached(true);
      }
    }, 1000);

    try {
      const res = await fetch('/api/matchmake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          playerId,
          roomId: tempRoomId,
        }),
      });
      const data = await res.json();

      if (data.status === 'matched') {
        if (data.myPlayer) {
          setMyPlayer(data.myPlayer);
        }
        if (data.role) {
          setRole(data.role);
        }
        if (data.role === 'guest') {
          if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
          }
          await joinRoom(data.roomId, 'guest', data.myPlayer);
        }
        setIsSearching(false);
        if (searchPollTimerRef.current) {
          clearInterval(searchPollTimerRef.current);
          searchPollTimerRef.current = null;
        }
        if (searchSecondsTimerRef.current) {
          clearInterval(searchSecondsTimerRef.current);
          searchSecondsTimerRef.current = null;
        }
        return;
      }
    } catch (err) {
      console.error('Matchmaking join error:', err);
    }

    // Polling interval if waiting
    searchPollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/matchmake', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'poll', playerId }),
        });
        const data = await res.json();
        if (data.status === 'matched') {
          if (data.myPlayer) {
            setMyPlayer(data.myPlayer);
          }
          if (data.role) {
            setRole(data.role);
          }
          if (searchPollTimerRef.current) {
            clearInterval(searchPollTimerRef.current);
            searchPollTimerRef.current = null;
          }
          if (searchSecondsTimerRef.current) {
            clearInterval(searchSecondsTimerRef.current);
            searchSecondsTimerRef.current = null;
          }
          setIsSearching(false);

          if (data.role === 'guest') {
            if (peerRef.current) {
              peerRef.current.destroy();
              peerRef.current = null;
            }
            await joinRoom(data.roomId, 'guest', data.myPlayer);
          }
        }
      } catch (err) {
        console.error('Matchmaking poll error:', err);
      }
    }, 1200);
  }, [cleanup, attachConnectionHandlers, joinRoom]);

  // Cancel quick match search
  const cancelQuickMatch = useCallback(async () => {
    if (searchPollTimerRef.current) {
      clearInterval(searchPollTimerRef.current);
      searchPollTimerRef.current = null;
    }
    if (searchSecondsTimerRef.current) {
      clearInterval(searchSecondsTimerRef.current);
      searchSecondsTimerRef.current = null;
    }
    const pid = localPlayerIdRef.current;
    if (pid) {
      try {
        fetch('/api/matchmake', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'leave', playerId: pid }),
        }).catch(() => {});
      } catch {}
    }
    cleanup();
  }, [cleanup]);

  // Request rematch
  const requestRematch = useCallback(() => {
    setMyRematchSent(true);
    sendMessage({
      type: 'REMATCH_REQUEST',
      fromPlayer: myPlayer || (role === 'host' ? 'X' : 'O'),
    });
  }, [myPlayer, role, sendMessage]);

  // Accept rematch
  const acceptRematch = useCallback(
    (currentTc: TimeControl) => {
      setRematchRequestedByOpponent(false);
      setMyRematchSent(false);
      sendMessage({
        type: 'REMATCH_ACCEPT',
        timeControl: currentTc,
      });
      optionsRef.current?.onRematchAccepted?.(currentTc);
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

  return {
    status,
    role,
    myPlayer,
    roomId,
    rematchRequestedByOpponent,
    myRematchSent,
    drawOfferedByOpponent,
    myDrawOffered,
    drawDeclinedNotice,
    isSearching,
    searchElapsed,
    searchTimeoutReached,
    disconnectGraceSeconds,
    createRoom,
    joinRoom,
    leaveRoom,
    startQuickMatch,
    cancelQuickMatch,
    sendMessage,
    requestRematch,
    acceptRematch,
    resignOnline,
    offerDrawOnline,
    acceptDrawOnline,
    declineDrawOnline,
  };
}
