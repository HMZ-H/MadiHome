import { useCallback, useMemo, useRef, useState } from "react";

export type Message = {
  id: number;
  sender_id: number;
  receiver_id: number;
  room_id: number;
  content: string;
  timestamp: string;
  is_read: boolean;
};

type ApiListResponse<T> = {
  success?: boolean;
  data: T;
  meta?: { limit: number; offset: number; count: number };
};

const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL || "http://localhost:8080";

const authHeaders = (): HeadersInit => {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [limit] = useState(50);
  const offsetRef = useRef(0);
  const inFlightRef = useRef(false);
  const lastKeyRef = useRef<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
    setHasMore(true);
    offsetRef.current = 0;
    inFlightRef.current = false;
    lastKeyRef.current = null;
    if (controllerRef.current) {
      controllerRef.current.abort?.();
      controllerRef.current = null;
    }
  }, []);

  const fetchConversation = useCallback(
    async (otherUserId: number) => {
      if (inFlightRef.current) return;
      const key = `conv:${otherUserId}:${offsetRef.current}`;
      if (lastKeyRef.current === key) return;
      
      // Universal self-chat guard: never request a conversation with yourself
      const selfIdStr = localStorage.getItem("user_id");
      const selfId = selfIdStr ? parseInt(selfIdStr, 10) : NaN;
      if (Number.isFinite(selfId) && selfId === otherUserId) {
        setError("Cannot open a conversation with yourself");
        return;
      }
      
      inFlightRef.current = true;
      lastKeyRef.current = key;
      setLoading(true);
      setError(null);
      
      try {
        if (controllerRef.current) {
          controllerRef.current.abort?.();
        }
        controllerRef.current = new AbortController();
        const url = `${API_BASE_URL}/api/user/messages/conversation?other_user_id=${otherUserId}&limit=${limit}&offset=${offsetRef.current}`;
        const res = await fetch(url, { headers: authHeaders(), signal: controllerRef.current.signal });
        if (!res.ok) throw new Error(`Failed to load messages (${res.status})`);
        const json: ApiListResponse<Message[]> = await res.json();
        const newMessages = json.data || [];
        
        if (offsetRef.current === 0) {
          // First load - replace messages
          setMessages(newMessages);
        } else {
          // Pagination - append messages
          setMessages((prev) => [...prev, ...newMessages]);
        }
        
        setHasMore(newMessages.length === limit);
        offsetRef.current += newMessages.length;
      } catch (e: unknown) {
        if (!(e instanceof DOMException && e.name === 'AbortError')) {
          setError(e instanceof Error ? e.message : "Unknown error");
        }
      } finally {
        inFlightRef.current = false;
        setLoading(false);
        controllerRef.current = null;
      }
    },
    [limit]
  );

  const fetchRoom = useCallback(
    async (roomId: number) => {
      if (inFlightRef.current) return;
      const key = `room:${roomId}:${offsetRef.current}`;
      if (lastKeyRef.current === key) return;
      
      inFlightRef.current = true;
      lastKeyRef.current = key;
      setLoading(true);
      setError(null);
      
      try {
        if (controllerRef.current) {
          controllerRef.current.abort?.();
        }
        controllerRef.current = new AbortController();
        const url = `${API_BASE_URL}/api/user/messages/room/${roomId}?limit=${limit}&offset=${offsetRef.current}`;
        const res = await fetch(url, { headers: authHeaders(), signal: controllerRef.current.signal });
        if (!res.ok)
          throw new Error(`Failed to load room messages (${res.status})`);
        const json: ApiListResponse<Message[]> = await res.json();
        const newMessages = json.data || [];
        
        if (offsetRef.current === 0) {
          // First load - replace messages
          setMessages(newMessages);
        } else {
          // Pagination - append messages
          setMessages((prev) => [...prev, ...newMessages]);
        }
        
        setHasMore(newMessages.length === limit);
        offsetRef.current += newMessages.length;
      } catch (e: unknown) {
        if (!(e instanceof DOMException && e.name === 'AbortError')) {
          setError(e instanceof Error ? e.message : "Unknown error");
        }
      } finally {
        inFlightRef.current = false;
        setLoading(false);
        controllerRef.current = null;
      }
    },
    [limit]
  );

  const sendMessage = useCallback(
    async (receiverId: number, roomId: number | null, content: string) => {
      const body = {
        receiver_id: receiverId,
        room_id: roomId ?? 0,
        content,
      };
      const res = await fetch(`${API_BASE_URL}/api/user/messages`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Failed to send message (${res.status})`);
      const json = await res.json();
      const created: Message | undefined = json?.data;
      if (created) setMessages((prev) => [...prev, created]);
      return created;
    },
    []
  );

  const markAsRead = useCallback(async (messageId: number) => {
    const res = await fetch(
      `${API_BASE_URL}/api/user/messages/${messageId}/read`,
      {
        method: "PUT",
        headers: authHeaders(),
      }
    );
    if (!res.ok) throw new Error(`Failed to mark as read (${res.status})`);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? ({ ...m, is_read: true } as Message) : m
      )
    );
  }, []);

  const markAllReadByRoom = useCallback(async (roomId: number) => {
    const res = await fetch(
      `${API_BASE_URL}/api/user/messages/room/${roomId}/read-all`,
      {
        method: "PUT",
        headers: authHeaders(),
      }
    );
    if (!res.ok) throw new Error(`Failed to mark all as read (${res.status})`);
    setMessages((prev) =>
      prev.map((m) => (m.room_id === roomId ? { ...m, is_read: true } : m))
    );
  }, []);

  const sortedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [messages]);

  const pushIncoming = useCallback(
    (evt: {
      id?: number;
      sender_id: number;
      receiver_id: number;
      room_id: number;
      content: string;
      timestamp?: string;
      is_read?: boolean;
    }) => {
      const msg: Message = {
        id: typeof evt.id === "number" ? evt.id : Date.now(),
        sender_id: evt.sender_id,
        receiver_id: evt.receiver_id,
        room_id: evt.room_id,
        content: (evt || {}).content || "",
        timestamp: evt.timestamp || new Date().toISOString(),
        is_read: evt.is_read || false,
      };
      setMessages((prev) => {
        // Better deduplication: check by id and content+timestamp
        if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
        if (
          prev.some(
            (m) =>
              m.content === msg.content &&
              m.timestamp === msg.timestamp &&
              m.sender_id === msg.sender_id
          )
        )
          return prev;
        return [...prev, msg];
      });
    },
    []
  );

  return {
    messages: sortedMessages,
    loading,
    error,
    hasMore,
    reset,
    fetchConversation,
    fetchRoom,
    sendMessage,
    markAsRead,
    markAllReadByRoom,
    pushIncoming,
  };
}
