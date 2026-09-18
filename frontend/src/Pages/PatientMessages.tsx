import { useEffect, useMemo, useRef, useState } from "react";
import MessageThread from "../components/MessageThread";
import MessageComposer from "../components/MessageComposer";
import { useMessages, type Message } from "../hooks/useMessages";
import { useChatSocket } from "../hooks/useChatSocket";
import Navbar from "../components/Navbar";

type Doctor = {
  id: number;
  user_id?: number;
  user?: { id: number; first_name: string; last_name: string; email?: string; photo?: string };
  first_name?: string;
  last_name?: string;
  specialization?: string;
};

const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL || "http://localhost:8080";

export default function PatientMessages() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorUserId, setSelectedDoctorUserId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const currentUserId = useMemo(() => {
    try {
      const u = localStorage.getItem("user");
      if (u) return JSON.parse(u)?.id ?? null;
    } catch { /* ignore */ }
    return null;
  }, []);

  const {
    messages,
    loading,
    error,
    reset,
    fetchConversation,
    pushIncoming,
  } = useMessages();

  const { connected, events, send, sendTyping, typingFrom } = useChatSocket();
  const fetchedForRef = useRef<number | null>(null);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/doctors`);
        if (!res.ok) return;
        const json = await res.json();
        const data: Doctor[] = Array.isArray(json?.data) ? json.data : [];
        setDoctors(data);
      } catch (e) {
        console.error("Failed to load doctors:", e);
      }
    };
    loadDoctors();
  }, []);

  useEffect(() => {
    if (!selectedDoctorUserId) return;
    if (currentUserId && selectedDoctorUserId === currentUserId) return;
    if (fetchedForRef.current === selectedDoctorUserId) return;
    fetchedForRef.current = selectedDoctorUserId;
    reset();
    fetchConversation(selectedDoctorUserId);
  }, [selectedDoctorUserId, reset, currentUserId, fetchConversation]);

  useEffect(() => {
    if (events.length === 0 || !selectedDoctorUserId) return;
    const last = events[events.length - 1];
    if (
      last.sender_id === selectedDoctorUserId ||
      last.receiver_id === selectedDoctorUserId
    ) {
      pushIncoming(last as Message);
    }
  }, [events, selectedDoctorUserId, pushIncoming]);

  const handleSelectDoctor = (d: Doctor) => {
    const uid = d.user_id || d.user?.id || 0;
    if (!uid || uid === currentUserId) return;
    if (uid !== selectedDoctorUserId) {
      fetchedForRef.current = null;
    }
    setSelectedDoctorUserId(uid);
  };

  const onSend = async (text: string) => {
    if (!selectedDoctorUserId) return;
    send({ receiver_id: selectedDoctorUserId, content: text });
  };

  const doctorName = (d: Doctor) => {
    const fn = d.user?.first_name || d.first_name || "";
    const ln = d.user?.last_name || d.last_name || "";
    return `${fn} ${ln}`.trim() || "Doctor";
  };

  const filteredDoctors = doctors.filter((d) =>
    doctorName(d).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedDoctor = doctors.find(
    (d) => (d.user_id || d.user?.id) === selectedDoctorUserId
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-800">Messages</h1>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}
            />
            <span className="text-sm text-gray-500">
              {connected ? "Connected" : "Reconnecting..."}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-180px)]">
          {/* Doctor list sidebar */}
          <aside className="col-span-12 md:col-span-4 bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search doctors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredDoctors.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 text-center">
                  No doctors found
                </div>
              ) : (
                filteredDoctors.map((d) => {
                  const uid = d.user_id || d.user?.id || 0;
                  const isSelected = selectedDoctorUserId === uid;
                  return (
                    <button
                      key={d.id}
                      className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        isSelected ? "bg-emerald-50 border-l-2 border-l-emerald-600" : ""
                      }`}
                      onClick={() => handleSelectDoctor(d)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-medium text-sm shrink-0">
                          {doctorName(d).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">
                            Dr. {doctorName(d)}
                          </div>
                          {d.specialization && (
                            <div className="text-xs text-gray-500 truncate">
                              {d.specialization}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Chat area */}
          <section className="col-span-12 md:col-span-8 bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden">
            {!selectedDoctorUserId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-lg font-medium">Select a doctor to start chatting</p>
                <p className="text-sm mt-1">Choose from the list on the left</p>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3 bg-white">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-medium text-sm">
                    {selectedDoctor ? doctorName(selectedDoctor).charAt(0).toUpperCase() : "D"}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      Dr. {selectedDoctor ? doctorName(selectedDoctor) : "Doctor"}
                    </div>
                    {selectedDoctor?.specialization && (
                      <div className="text-xs text-gray-500">{selectedDoctor.specialization}</div>
                    )}
                  </div>
                </div>

                <MessageThread
                  messages={messages as Message[]}
                  currentUserId={currentUserId}
                  loading={loading}
                  error={error}
                />
                {typingFrom === selectedDoctorUserId && (
                  <div className="px-4 py-1 text-xs text-gray-500 italic">
                    Dr. {selectedDoctor ? doctorName(selectedDoctor) : "Doctor"} is typing...
                  </div>
                )}
                <MessageComposer
                  onSend={onSend}
                  onTyping={() => selectedDoctorUserId && sendTyping(selectedDoctorUserId)}
                  disabled={!selectedDoctorUserId}
                />
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
