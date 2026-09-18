import { useEffect, useMemo, useRef, useState } from "react";
import MessageThread from "../components/MessageThread";
import MessageComposer from "../components/MessageComposer";
import { useMessages, type Message } from "../hooks/useMessages";
import { useChatSocket } from "../hooks/useChatSocket";
import Navbar from "../components/Navbar";

type Patient = {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  photo?: string;
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

export default function DoctorMessages() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
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
    const loadPatients = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/doctor/patients`, {
          headers: authHeaders(),
        });
        if (!res.ok) return;
        const json = await res.json();
        const data: Patient[] = Array.isArray(json?.data) ? json.data : [];
        setPatients(data);
      } catch (e) {
        console.error("Failed to load patients:", e);
      }
    };
    loadPatients();
  }, []);

  useEffect(() => {
    if (!selectedPatientId) return;
    if (currentUserId && selectedPatientId === currentUserId) return;
    if (fetchedForRef.current === selectedPatientId) return;
    fetchedForRef.current = selectedPatientId;
    reset();
    fetchConversation(selectedPatientId);
  }, [selectedPatientId, reset, currentUserId, fetchConversation]);

  useEffect(() => {
    if (events.length === 0) return;
    const last = events[events.length - 1];
    const me = currentUserId;

    if (last.sender_id === me || last.receiver_id === me) {
      const otherId = last.sender_id === me ? last.receiver_id : last.sender_id;

      if (selectedPatientId && otherId === selectedPatientId) {
        pushIncoming(last as Message);
      }

      if (!selectedPatientId) {
        setSelectedPatientId(otherId);
        pushIncoming(last as Message);
      }
    }
  }, [events, currentUserId, selectedPatientId, pushIncoming]);

  const handleSelectPatient = (p: Patient) => {
    if (p.id === currentUserId) return;
    if (p.id !== selectedPatientId) {
      fetchedForRef.current = null;
    }
    setSelectedPatientId(p.id);
  };

  const onSend = async (text: string) => {
    if (!selectedPatientId) return;
    send({ receiver_id: selectedPatientId, content: text });
  };

  const patientName = (p: Patient) => {
    return `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Patient";
  };

  const filteredPatients = patients.filter((p) =>
    patientName(p).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

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
          {/* Patient list sidebar */}
          <aside className="col-span-12 md:col-span-4 bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredPatients.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 text-center">
                  {patients.length === 0
                    ? "No patients yet. Patients will appear here after they book a service."
                    : "No matching patients"}
                </div>
              ) : (
                filteredPatients.map((p) => {
                  const isSelected = selectedPatientId === p.id;
                  return (
                    <button
                      key={p.id}
                      className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        isSelected ? "bg-emerald-50 border-l-2 border-l-emerald-600" : ""
                      }`}
                      onClick={() => handleSelectPatient(p)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-sm shrink-0">
                          {patientName(p).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">
                            {patientName(p)}
                          </div>
                          {p.email && (
                            <div className="text-xs text-gray-500 truncate">
                              {p.email}
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
            {!selectedPatientId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-lg font-medium">Select a patient to start chatting</p>
                <p className="text-sm mt-1">Choose from the list on the left</p>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3 bg-white">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-sm">
                    {selectedPatient ? patientName(selectedPatient).charAt(0).toUpperCase() : "P"}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      {selectedPatient ? patientName(selectedPatient) : "Patient"}
                    </div>
                  </div>
                </div>

                <MessageThread
                  messages={messages as Message[]}
                  currentUserId={currentUserId}
                  loading={loading}
                  error={error}
                />
                {typingFrom === selectedPatientId && (
                  <div className="px-4 py-1 text-xs text-gray-500 italic">
                    {selectedPatient ? patientName(selectedPatient) : "Patient"} is typing...
                  </div>
                )}
                <MessageComposer
                  onSend={onSend}
                  onTyping={() => selectedPatientId && sendTyping(selectedPatientId)}
                  disabled={!selectedPatientId}
                />
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
