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
  onConnected?: () => void;
}

export function usePeerOnline(options?: UsePeerOnlineOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [role, setRole] = useState<OnlineRole>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [rematchRequestedByOpponent, setRematchRequestedByOpponent] = useState(false);
  const [myRematchSent, setMyRematchSent] = useState(false);

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Cleanup connection and peer
  const cleanup = useCallback(() => {
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
    setRoomId(null);
    setRematchRequestedByOpponent(false);
    setMyRematchSent(false);
  }, []);

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
  const attachConnectionHandlers = useCallback((conn: DataConnection) => {
    connRef.current = conn;

    conn.on('open', () => {
      setStatus('connected');
      optionsRef.current?.onConnected?.();
    });

    conn.on('data', (raw: unknown) => {
      const msg = raw as PeerMessage;
      if (!msg || !msg.type) return;

      switch (msg.type) {
        case 'INIT':
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
        case 'DISCONNECT':
          setStatus('disconnected');
          break;
      }
    });

    conn.on('close', () => {
      setStatus('disconnected');
      connRef.current = null;
    });

    conn.on('error', (err) => {
      console.error('Peer connection error:', err);
      setStatus('disconnected');
    });
  }, []);

  // Create room as Host (Player X)
  const createRoom = useCallback(async (): Promise<string> => {
    cleanup();
    setStatus('creating');
    setRole('host');

    // Generate short 6-char clean alphanumeric room code
    const newRoomId = Math.random().toString(36).substring(2, 8).toLowerCase();
    setRoomId(newRoomId);

    const { Peer } = await import('peerjs');
    const peerId = `sttt-${newRoomId}`;

    const peer = new Peer(peerId, {
      debug: 1,
    });
    peerRef.current = peer;

    peer.on('open', () => {
      setStatus('waiting');
    });

    peer.on('connection', (incomingConn) => {
      // If already connected to another player, close extra incoming
      if (connRef.current && connRef.current.open) {
        incomingConn.close();
        return;
      }
      attachConnectionHandlers(incomingConn);
    });

    peer.on('error', (err) => {
      console.error('Host peer error:', err);
      if (err.type === 'unavailable-id') {
        // Retry with another ID if collision
        createRoom();
      } else {
        setStatus('error');
      }
    });

    return newRoomId;
  }, [cleanup, attachConnectionHandlers]);

  // Join room as Guest (Player O)
  const joinRoom = useCallback(
    async (targetRoomId: string) => {
      cleanup();
      let cleanId = targetRoomId.trim().toLowerCase();
      if (cleanId.includes('room=')) {
        cleanId = cleanId.split('room=')[1].split('&')[0];
      }
      cleanId = cleanId.replace(/^sttt-/, '').replace(/[^a-z0-9]/g, '');
      if (!cleanId) return;

      setStatus('connecting');
      setRole('guest');
      setRoomId(cleanId);

      const { Peer } = await import('peerjs');
      const peer = new Peer(); // Guest gets random ID
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

  // Request rematch
  const requestRematch = useCallback(() => {
    setMyRematchSent(true);
    sendMessage({
      type: 'REMATCH_REQUEST',
      fromPlayer: role === 'host' ? 'X' : 'O',
    });
  }, [role, sendMessage]);

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
    roomId,
    rematchRequestedByOpponent,
    myRematchSent,
    createRoom,
    joinRoom,
    leaveRoom,
    sendMessage,
    requestRematch,
    acceptRematch,
  };
}
