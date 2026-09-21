import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import MessageThread from "./MessageThread";
import { useMessages } from "../hooks/useMessages";
import { api } from "../utils/api";
import { useChatSocket } from "../hooks/useChatSocket";

interface ChatHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: number;
  receiverId?: number;
}

type LocalAIMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};
type Doctor = {
  id: number;
  user_id?: number;
  user?: { id: number; first_name: string; last_name: string; email?: string };
  first_name?: string;
  last_name?: string;
  email?: string;
};

type PatientLite = {
  id: number;
  user_id?: number;
  user?: { id: number; first_name?: string; last_name?: string; email?: string };
  first_name?: string;
  last_name?: string;
  email?: string;
};

export default function ChatHubModal({
  isOpen,
  onClose,
  roomId,
  receiverId,
}: ChatHubModalProps) {
  const [mode, setMode] = useState<"ai" | "messages">("ai");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorUserId, setSelectedDoctorUserId] = useState<
    number | null
  >(receiverId || null);
  const [sidebarLabel, setSidebarLabel] = useState<string>("Doctors");
  const { messages, loading, error, reset, fetchConversation, sendMessage, pushIncoming } =
    useMessages();
  const [draft, setDraft] = useState("");
  const [aiMessages, setAiMessages] = useState<LocalAIMessage[]>([]);
  const [aiTyping, setAiTyping] = useState(false);
  const aiScrollRef = useRef<HTMLDivElement | null>(null);
  const { events } = useChatSocket();
  const [recentContacts, setRecentContacts] = useState<number[]>([]);

  // Load recipients list when modal opens in messages mode
  useEffect(() => {
    if (isOpen && mode === "messages") {
      const loadList = async () => {
        try {
          const API_BASE_URL =
            (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } })
              .env?.VITE_API_BASE_URL || "http://localhost:8080";
          const token = localStorage.getItem("access_token");

          // Try patients endpoint first (works only for doctors). If it fails, fall back to public doctors.
          let loaded = false;
          if (token) {
            try {
              const pres = await fetch(`${API_BASE_URL}/api/doctor/patients`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (pres.ok) {
                const pj = await pres.json();
                const pdata: PatientLite[] = Array.isArray(pj?.data) ? pj.data : [];
                const mapped: Doctor[] = pdata.map((p: PatientLite) => ({
                  id: p.id,
                  user_id: p.user_id || p.user?.id || p.id,
                  user: p.user
                    ? {
                        id: p.user.id,
                        first_name: p.user.first_name || "",
                        last_name: p.user.last_name || "",
                        email: p.user.email,
                      }
                    : p.user_id
                    ? {
                        id: p.user_id,
                        first_name: p.first_name || "",
                        last_name: p.last_name || "",
                        email: p.email,
                      }
                    : undefined,
                  first_name: p.first_name,
                  last_name: p.last_name,
                  email: p.email,
                }));
                setDoctors(mapped);
                setSidebarLabel("Patients");
                if (mapped.length > 0 && !selectedDoctorUserId) {
                  const me = Number(localStorage.getItem("user_id"));
                  const firstOther = mapped.find((x) => (x.user_id || x.user?.id) !== me);
                  const uid = firstOther ? (firstOther.user_id || firstOther.user?.id || null) : null;
                  if (uid) setSelectedDoctorUserId(uid);
                }
                loaded = true;
              }
            } catch {
              // ignore and fall back to doctors
            }
          }

          if (!loaded) {
            const dres = await fetch(`${API_BASE_URL}/api/doctors`);
            if (!dres.ok) throw new Error("Failed to load doctors");
            const dj = await dres.json();
            const ddata = Array.isArray(dj?.data) ? dj.data : [];
            setDoctors(ddata);
            setSidebarLabel("Doctors");
            if (ddata.length > 0 && !selectedDoctorUserId) {
              const me = Number(localStorage.getItem("user_id"));
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const firstOther = ddata.find((x: any) => (x.user_id || x.user?.id) !== me);
              const uid = firstOther ? (firstOther.user_id || firstOther.user?.id || null) : null;
              if (uid) setSelectedDoctorUserId(uid);
            }
          }
        } catch (e) {
          console.error(e);
        }
      };
      loadList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode]);

  // WS: collect recent contacts (other user ids) from events involving me
  useEffect(() => {
    if (!isOpen || mode !== "messages" || events.length === 0) return;
    const me = Number(localStorage.getItem("user_id"));
    const seen = new Set(recentContacts);
    let changed = false;
    for (const evt of events) {
      if (evt.sender_id === me || evt.receiver_id === me) {
        const other = evt.sender_id === me ? evt.receiver_id : evt.sender_id;
        if (!seen.has(other)) {
          seen.add(other);
          changed = true;
        }
      }
    }
    if (changed) setRecentContacts(Array.from(seen));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, isOpen, mode]);

  // If no selection yet, auto-select the most recent contact from WS
  useEffect(() => {
    if (!isOpen || mode !== "messages" || selectedDoctorUserId) return;
    if (recentContacts.length > 0) setSelectedDoctorUserId(recentContacts[recentContacts.length - 1]);
  }, [recentContacts, isOpen, mode, selectedDoctorUserId]);

  useEffect(() => {
    if (isOpen && mode === "messages" && selectedDoctorUserId) {
      reset();
      fetchConversation(selectedDoctorUserId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, selectedDoctorUserId]);

  // Merge incoming WS events for the selected conversation
  useEffect(() => {
    if (!isOpen || mode !== "messages" || !selectedDoctorUserId || events.length === 0) return;
    const me = Number(localStorage.getItem("user_id"));
    const last = events[events.length - 1];
    if (
      (last.sender_id === me && last.receiver_id === selectedDoctorUserId) ||
      (last.sender_id === selectedDoctorUserId && last.receiver_id === me)
    ) {
      pushIncoming(last);
    }
  }, [events, isOpen, mode, selectedDoctorUserId, pushIncoming]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 w-[22rem] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)] rounded-2xl shadow-2xl border border-gray-200 bg-white flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <h3 className="text-sm font-semibold">Health Assistant</h3>
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-white/20 rounded-md overflow-hidden">
            <button
              className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                mode === "ai" ? "bg-white/30 text-white" : "text-white/70 hover:text-white"
              }`}
              onClick={() => setMode("ai")}
            >
              AI
            </button>
            <button
              className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                mode === "messages" ? "bg-white/30 text-white" : "text-white/70 hover:text-white"
              }`}
              onClick={() => setMode("messages")}
            >
              Messages
            </button>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-0">

          {mode === "ai" ? (
            <div className="flex flex-col h-[22rem] min-h-0">
              <div
                ref={aiScrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {aiMessages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>👋 Hello! I'm your homecare health assistant.</p>
                    <p className="text-sm mt-2">
                      Ask me about general health questions, homecare tips, or
                      wellness advice.
                    </p>
                  </div>
                ) : (
                  aiMessages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex ${
                        m.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          m.role === "user"
                            ? "bg-emerald-600 text-white"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <p className="text-sm">{m.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            m.role === "user"
                              ? "text-emerald-100"
                              : "text-gray-500"
                          }`}
                        >
                          {m.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {aiTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg inline-flex items-center gap-2">
                      <span className="text-sm">Thinking</span>
                      <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.1s]"></span>
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-[22rem] min-h-0">
              {/* Contact selector */}
              <div className="px-3 py-2 border-b border-gray-100">
                <select
                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700"
                  value={selectedDoctorUserId || ""}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val) setSelectedDoctorUserId(val);
                  }}
                >
                  <option value="" disabled>
                    Select {sidebarLabel === "Patients" ? "a patient" : "a doctor"}...
                  </option>
                  {doctors.length === 0
                    ? recentContacts.map((uid) => (
                        <option key={`recent-${uid}`} value={uid}>
                          User #{uid}
                        </option>
                      ))
                    : doctors.map((d) => {
                        const userId = d.user_id || d.user?.id || 0;
                        const displayName =
                          `${d.user?.first_name || d.first_name || ""} ${
                            d.user?.last_name || d.last_name || ""
                          }`.trim() || "Doctor";
                        return (
                          <option key={d.id} value={userId}>
                            {displayName}
                          </option>
                        );
                      })}
                </select>
              </div>

              {/* Message Thread */}
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <MessageThread
                  messages={messages}
                  currentUserId={
                    Number(localStorage.getItem("user_id")) || null
                  }
                  loading={loading}
                  error={error || null}
                />
              </div>
            </div>
          )}

          <div className="px-3 py-2 border-t border-gray-100 flex gap-2 items-center">
            <input
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs"
              value={draft}
              placeholder={
                mode === "ai"
                  ? "Ask about health, homecare, or wellness..."
                  : "Type a message..."
              }
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && !e.shiftKey && draft.trim()) {
                  if (mode === "ai") {
                    const userMsg: LocalAIMessage = {
                      role: "user",
                      content: draft.trim(),
                      timestamp: new Date(),
                    };
                    setAiMessages((prev) => [...prev, userMsg]);
                    setDraft("");
                    setAiTyping(true);
                    // auto-scroll to bottom
                    setTimeout(
                      () =>
                        aiScrollRef.current?.scrollTo({
                          top: aiScrollRef.current.scrollHeight,
                          behavior: "smooth",
                        }),
                      0
                    );
                    try {
                      const res = await api.aiChat(
                        roomId || 0,
                        userMsg.content
                      );
                      const aiMsg: LocalAIMessage = {
                        role: "assistant",
                        content: res.reply,
                        timestamp: new Date(),
                      };
                      setAiMessages((prev) => [...prev, aiMsg]);
                      setTimeout(
                        () =>
                          aiScrollRef.current?.scrollTo({
                            top: aiScrollRef.current.scrollHeight,
                            behavior: "smooth",
                          }),
                        0
                      );
                    } catch {
                      setAiMessages((prev) => [
                        ...prev,
                        {
                          role: "assistant",
                          content: "Sorry, something went wrong.",
                          timestamp: new Date(),
                        },
                      ]);
                      setTimeout(
                        () =>
                          aiScrollRef.current?.scrollTo({
                            top: aiScrollRef.current.scrollHeight,
                            behavior: "smooth",
                          }),
                        0
                      );
                    } finally {
                      setAiTyping(false);
                    }
                  } else {
                    if (selectedDoctorUserId) {
                      await sendMessage(
                        selectedDoctorUserId,
                        null,
                        draft.trim()
                      );
                      setDraft("");
                    }
                  }
                }
              }}
            />
            <button
              className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium disabled:opacity-50"
              disabled={!draft.trim() || (mode === "ai" && aiTyping)}
              onClick={async () => {
                if (!draft.trim()) return;
                if (mode === "ai") {
                  const userMsg: LocalAIMessage = {
                    role: "user",
                    content: draft.trim(),
                    timestamp: new Date(),
                  };
                  setAiMessages((prev) => [...prev, userMsg]);
                  setDraft("");
                  setAiTyping(true);
                  setTimeout(
                    () =>
                      aiScrollRef.current?.scrollTo({
                        top: aiScrollRef.current.scrollHeight,
                        behavior: "smooth",
                      }),
                    0
                  );
                  try {
                    const res = await api.aiChat(roomId || 0, userMsg.content);
                    const aiMsg: LocalAIMessage = {
                      role: "assistant",
                      content: res.reply,
                      timestamp: new Date(),
                    };
                    setAiMessages((prev) => [...prev, aiMsg]);
                    setTimeout(
                      () =>
                        aiScrollRef.current?.scrollTo({
                          top: aiScrollRef.current.scrollHeight,
                          behavior: "smooth",
                        }),
                      0
                    );
                  } catch {
                    setAiMessages((prev) => [
                      ...prev,
                      {
                        role: "assistant",
                        content: "Sorry, something went wrong.",
                        timestamp: new Date(),
                      },
                    ]);
                    setTimeout(
                      () =>
                        aiScrollRef.current?.scrollTo({
                          top: aiScrollRef.current.scrollHeight,
                          behavior: "smooth",
                        }),
                      0
                    );
                  } finally {
                    setAiTyping(false);
                  }
                } else {
                  if (selectedDoctorUserId) {
                    await sendMessage(selectedDoctorUserId, null, draft.trim());
                    setDraft("");
                  }
                }
              }}
            >
              Send
            </button>
          </div>
      </div>
    </div>
  );
}
