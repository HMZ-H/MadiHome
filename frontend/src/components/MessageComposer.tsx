import { useState, useRef } from 'react';

type Props = {
  onSend: (text: string) => Promise<void> | void;
  onTyping?: () => void;
  disabled?: boolean;
};

export default function MessageComposer({ onSend, onTyping, disabled }: Props) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const lastTypingRef = useRef(0);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || disabled || sending) return;
    try {
      setSending(true);
      await onSend(trimmed);
      setText('');
    } finally {
      setSending(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (onTyping) {
      const now = Date.now();
      if (now - lastTypingRef.current > 2000) {
        lastTypingRef.current = now;
        onTyping();
      }
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 p-3 flex items-end gap-2 bg-white">
      <textarea
        className="flex-1 resize-none rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        rows={2}
        placeholder="Type a message"
        value={text}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        disabled={disabled || sending}
      />
      <button
        onClick={handleSend}
        disabled={disabled || sending || !text.trim()}
        className="px-4 py-2 rounded-md bg-emerald-600 text-white disabled:opacity-50 hover:bg-emerald-700"
      >
        {sending ? 'Sending…' : 'Send'}
      </button>
    </div>
  );
}


