import { useEffect, useRef } from 'react';
import type { Message } from '../hooks/useMessages';

type Props = {
  messages: Message[];
  currentUserId: number | null;
  loading?: boolean;
  error?: string | null;
};

export default function MessageThread({ messages, currentUserId, loading, error }: Props) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages?.length]);

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-white">
      {loading && (
        <div className="text-center text-gray-500 py-4">Loading…</div>
      )}
      {error && (
        <div className="text-center text-red-600 py-2">{error}</div>
      )}
      <div className="space-y-3">
        {messages.map((m) => {
          const isMine = currentUserId != null && m.sender_id === currentUserId;
          return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] rounded-lg px-3 py-2 text-sm shadow-sm ${
                  isMine ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div>{m.content}</div>
                <div className={`mt-1 text-[10px] ${isMine ? 'text-emerald-100' : 'text-gray-500'}`}>
                  {new Date(m.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
}


