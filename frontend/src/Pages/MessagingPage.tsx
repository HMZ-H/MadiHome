import { useEffect, useState, useRef } from "react";
import { useChatSocket } from "../hooks/useChatSocket";
import { useMessages } from "../hooks/useMessages";

type Contact = {
  id: number;
  user_id?: number;
  user?: { id: number; first_name?: string; last_name?: string; email?: string };
  first_name?: string;
  last_name?: string;
  email?: string;
};

export default function MessagingPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { connected, events, send } = useChatSocket();
  const { messages, loading, error, reset, fetchConversation, pushIncoming } = useMessages();

  const currentUserId = Number(localStorage.getItem("user_id"));
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const token = localStorage.getItem("access_token");

  // Load contacts based on role
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "http://localhost:8080";
        
        if (role === "doctor" && token) {
          // Doctors see their patients
          const res = await fetch(`${API_BASE_URL}/api/doctor/patients`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const json = await res.json();
            const data = Array.isArray(json?.data) ? json.data : [];
            setContacts(data);
            return;
          }
        }
        
        // Users see doctors (public endpoint)
        const res = await fetch(`${API_BASE_URL}/api/doctors`);
        if (res.ok) {
          const json = await res.json();
          const data = Array.isArray(json?.data) ? json.data : [];
          setContacts(data);
        }
      } catch (e) {
        console.error("Failed to load contacts:", e);
      }
    };
    loadContacts();
  }, [role, token]);

  // Fetch conversation when user is selected
  useEffect(() => {
    if (selectedUserId && selectedUserId !== currentUserId) {
      reset();
      fetchConversation(selectedUserId);
    }
  }, [selectedUserId, currentUserId, reset, fetchConversation]);

  // Merge incoming WS events
  useEffect(() => {
    if (events.length === 0 || !selectedUserId) return;
    const last = events[events.length - 1];
    if (
      (last.sender_id === currentUserId && last.receiver_id === selectedUserId) ||
      (last.sender_id === selectedUserId && last.receiver_id === currentUserId)
    ) {
      pushIncoming(last);
    }
  }, [events, selectedUserId, currentUserId, pushIncoming]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!messageText.trim() || !selectedUserId) return;
    send({ receiver_id: selectedUserId, content: messageText.trim() });
    setMessageText("");
  };

  const getDisplayName = (contact: Contact) => {
    const first = contact.user?.first_name || contact.first_name || "";
    const last = contact.user?.last_name || contact.last_name || "";
    return `${first} ${last}`.trim() || `User #${contact.user_id || contact.id}`;
  };

  const getUserId = (contact: Contact) => {
    return contact.user_id || contact.user?.id || contact.id;
  };

  const filteredContacts = contacts.filter((c) => {
    const name = getDisplayName(c).toLowerCase();
    const email = (c.user?.email || c.email || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  const selectedContact = contacts.find((c) => getUserId(c) === selectedUserId);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Conversations List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold text-gray-900">Messaging</h1>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-400"}`} />
              <span className="text-xs text-gray-500">{connected ? "Online" : "Offline"}</span>
            </div>
          </div>
          {/* Search */}
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              {searchQuery ? "No matches found" : role === "doctor" ? "No patients found" : "No doctors found"}
            </div>
          ) : (
            filteredContacts.map((contact) => {
              const uid = getUserId(contact);
              const isSelected = uid === selectedUserId;
              return (
                <button
                  key={contact.id}
                  onClick={() => setSelectedUserId(uid)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                    isSelected ? "bg-emerald-50 border-l-4 border-l-emerald-600" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {getDisplayName(contact).charAt(0).toUpperCase()}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-medium text-gray-900 truncate">
                      {getDisplayName(contact)}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {contact.user?.email || contact.email || ""}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUserId ? (
          <>
            {/* Chat Header */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold">
                  {selectedContact ? getDisplayName(selectedContact).charAt(0).toUpperCase() : "?"}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {selectedContact ? getDisplayName(selectedContact) : `User #${selectedUserId}`}
                  </div>
                  <div className="text-xs text-gray-500">
                    {selectedContact?.user?.email || selectedContact?.email || ""}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {loading && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">Loading messages...</div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-red-500">{error}</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-gray-400 text-lg mb-2">No messages yet</div>
                    <div className="text-gray-500 text-sm">Start the conversation!</div>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === currentUserId;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-md ${isMe ? "order-2" : "order-1"}`}>
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isMe
                              ? "bg-emerald-600 text-white rounded-br-sm"
                              : "bg-white text-gray-900 rounded-bl-sm shadow-sm"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                        <div className={`text-xs text-gray-500 mt-1 px-2 ${isMe ? "text-right" : "text-left"}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-end gap-3">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Write a message..."
                  rows={1}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  style={{ minHeight: "44px", maxHeight: "120px" }}
                />
                <button
                  onClick={handleSend}
                  disabled={!messageText.trim()}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-full font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Messages</h3>
              <p className="text-gray-500">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
