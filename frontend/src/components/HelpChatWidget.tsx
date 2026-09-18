import { useState } from 'react';
import ChatHubModal from './ChatHubModal';

export default function HelpChatWidget() {
  const [modalOpen, setModalOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setModalOpen(true)}
          className="relative h-14 w-14 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 transition"
          aria-label="Open health assistant"
        >
          {/* Chat icon */}
          <svg className="h-7 w-7 m-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8-1.23 0-2.4-.2-3.47-.57L3 20l1.63-3.26C4.23 15.64 4 14.85 4 14c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </div>

      <ChatHubModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        roomId={1} 
      />
    </>
  );
}


