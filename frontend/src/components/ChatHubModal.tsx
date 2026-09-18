import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-0">
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Health Assistant</h3>
            <div className="inline-flex bg-gray-100 rounded-md overflow-hidden border">
              <button
                className={`px-3 py-1 text-sm ${
                  mode === "ai" ? "bg-white text-emerald-700" : "text-gray-600"
                }`}
                onClick={() => setMode("ai")}
              >
                AI
              </button>
              <button
                className={`px-3 py-1 text-sm ${
                  mode === "messages"
                    ? "bg-white text-emerald-700"
                    : "text-gray-600"
                }`}
                onClick={() => setMode("messages")}
              >
                Messages
              </button>
            </div>
          </div>

          {mode === "ai" ? (
            <div className="flex flex-col w-[28rem] max-w-full h-[28rem]">
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
            <div className="flex gap-3 w-[48rem] max-w-full h-[28rem]">
              {/* List Sidebar */}
              <div className="w-48 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-2 border-b border-gray-200 bg-white">
                  <div className="text-xs font-medium text-gray-700">
                    {doctors.length === 0 && recentContacts.length > 0 ? "Recent" : sidebarLabel}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {doctors.length === 0 ? (
                    recentContacts.length === 0 ? (
                      <div className="p-3 text-xs text-gray-500">
                        {sidebarLabel === "Patients" ? "No patients found" : "No doctors found"}
                      </div>
                    ) : (
                      recentContacts.map((uid) => (
                        <button
                          key={`recent-${uid}`}
                          className={`w-full text-left px-3 py-2 border-b border-gray-100 hover:bg-white transition-colors ${
                            selectedDoctorUserId === uid
                              ? "bg-emerald-50 border-l-2 border-l-emerald-600"
                              : ""
                          }`}
                          onClick={() => {
                            const me = Number(localStorage.getItem("user_id"));
                            if (uid && uid !== me) setSelectedDoctorUserId(uid);
                          }}
                        >
                          <div className="text-xs font-medium text-gray-800 truncate">
                            {`User #${uid}`}
                          </div>
                          <div className="text-[10px] text-gray-500 truncate">
                            Recent contact
                          </div>
                        </button>
                      ))
                    )
                  ) : (
                    doctors.map((d) => {
                      const userId = d.user_id || d.user?.id || 0;
                      const displayName =
                        `${d.user?.first_name || d.first_name || ""} ${
                          d.user?.last_name || d.last_name || ""
                        }`.trim() || "Doctor";
                      return (
                        <button
                          key={d.id}
                          className={`w-full text-left px-3 py-2 border-b border-gray-100 hover:bg-white transition-colors ${
                            selectedDoctorUserId === userId
                              ? "bg-emerald-50 border-l-2 border-l-emerald-600"
                              : ""
                          }`}
                          onClick={() => {
                            const me = Number(localStorage.getItem("user_id"));
                            if (userId && userId !== me) setSelectedDoctorUserId(userId);
                          }}
                        >
                          <div className="text-xs font-medium text-gray-800 truncate">
                            {displayName}
                          </div>
                          <div className="text-[10px] text-gray-500 truncate">
                            {d.user?.email || d.email || ""}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Message Thread */}
              <div className="flex-1 flex flex-col min-w-0">
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

          <div className="pt-3 border-t flex gap-2 items-center">
            <input
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
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
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50"
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
            <div className="text-xs text-gray-500 ml-2">
              {mode === "ai" ? "AI" : "Messages"}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
