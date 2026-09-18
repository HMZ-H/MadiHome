/// <reference types="vite/client" />
import { useEffect, useRef, useState, useCallback } from "react";

export interface IncomingEvent {
  type?: string;
  id: number;
  sender_id: number;
  receiver_id: number;
  room_id: number;
  content: string;
  timestamp: string;
}

export interface TypingEvent {
  sender_id: number;
  receiver_id: number;
}

interface UseChatSocketOptions {
  roomId?: number;
}

export function useChatSocket({ roomId }: UseChatSocketOptions = {}) {
  const token = localStorage.getItem("access_token");
  const userId = (() => {
    try {
      const u = localStorage.getItem("user");
      if (u) return JSON.parse(u)?.id ?? null;
    } catch { /* ignore */ }
    return null;
  })();

  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<IncomingEvent[]>([]);
  const [typingFrom, setTypingFrom] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<number>(0);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const baseUrl =
    (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8080";

  const wsUrl = baseUrl
    .replace("http", "ws")
    .concat(
      `/api/ws?token=${token || ""}${roomId ? `&room_id=${roomId}` : ""}`
    );

  useEffect(() => {
    if (!token) return;

    let active = true;
    const connect = () => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!active) return;
        setConnected(true);
        retryRef.current = 0;
      };

      ws.onclose = () => {
        if (!active) return;
        setConnected(false);
        const timeout = Math.min(1000 * 2 ** retryRef.current, 30000);
        retryRef.current++;
        setTimeout(connect, timeout);
      };

      ws.onerror = () => {
        try { ws.close(); } catch { /* ignore */ }
      };

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);

          if (data.type === "typing") {
            setTypingFrom(data.sender_id);
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            typingTimerRef.current = setTimeout(() => setTypingFrom(null), 3000);
            return;
          }

          const evt: IncomingEvent = data;
          if (evt && typeof evt.content === "string" && typeof evt.sender_id === "number") {
            setEvents((prev) => {
              if (evt.id && prev.some((e) => e.id === evt.id)) return prev;
              return [...prev, evt];
            });
          }
        } catch {
          // ignore non-JSON frames
        }
      };
    };

    connect();

    return () => {
      active = false;
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      wsRef.current?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, roomId]);

  const send = useCallback(
    (payload: { receiver_id: number; room_id?: number; content: string }) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      wsRef.current.send(JSON.stringify(payload));
    },
    []
  );

  const sendTyping = useCallback(
    (receiverId: number) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      wsRef.current.send(JSON.stringify({ type: "typing", receiver_id: receiverId }));
    },
    []
  );

  return { connected, events, send, sendTyping, typingFrom, userId };
}
