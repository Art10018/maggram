// frontend/src/pages/Chats.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../store/auth.jsx";

const API_ORIGIN = "";

function buildSrc(u) {
  if (!u || typeof u !== "string") return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) return `${API_ORIGIN}${u}`;
  return `${API_ORIGIN}/${u}`;
}

function hashColor(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 65% 55%)`;
}

function fmtTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function Avatar({ username, avatarUrl, size = 44 }) {
  const letter = (username?.[0] || "?").toUpperCase();
  const bg = useMemo(() => hashColor(username || ""), [username]);
  const src = avatarUrl ? buildSrc(avatarUrl) : "";

  if (src) {
    return (
      <img
        src={src}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.06)",
          flex: "0 0 auto",
          display: "block",
        }}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  return (
    <div
      title={username || ""}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        fontWeight: 900,
        color: "white",
        background: bg,
        border: "1px solid rgba(255,255,255,0.10)",
        userSelect: "none",
        flex: "0 0 auto",
      }}
    >
      {letter}
    </div>
  );
}

export default function Chats() {
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const params = useParams();

  const selectedId = params.id || null;

  const [q, setQ] = useState("");
  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [chatsErr, setChatsErr] = useState("");

  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [msgsErr, setMsgsErr] = useState("");

  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);

  const listRef = useRef(null);
  const msgRef = useRef(null);

  const POLL_MS = 2500;

  const filteredChats = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return chats;
    return chats.filter((c) => {
      const peerName =
        c.peer?.displayName?.toLowerCase() ||
        c.peer?.username?.toLowerCase() ||
        "";
      const lastText = (c.lastMessage?.text || "").toLowerCase();
      return peerName.includes(s) || lastText.includes(s);
    });
  }, [q, chats]);

  async function fetchChats({ silent = false } = {}) {
    try {
      if (!silent) {
        setLoadingChats(true);
        setChatsErr("");
      }
      const res = await http.get("/chats");
      setChats(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setChatsErr(e?.response?.data?.error || e?.response?.data?.message || e.message);
    } finally {
      if (!silent) setLoadingChats(false);
    }
  }

  async function fetchMessages(chatId, { silent = false } = {}) {
    if (!chatId) return;
    try {
      if (!silent) {
        setLoadingMsgs(true);
        setMsgsErr("");
      }
      const res = await http.get(`/chats/${chatId}/messages?limit=80`);
      const items = res.data?.items || res.data || [];
      setMessages(Array.isArray(items) ? items : []);
    } catch (e) {
      setMsgsErr(e?.response?.data?.error || e?.response?.data?.message || e.message);
      setMessages([]);
    } finally {
      if (!silent) setLoadingMsgs(false);
    }
  }

  // initial + polling chats
  useEffect(() => {
    let alive = true;

    (async () => {
      if (!alive) return;
      await fetchChats();
    })();

    const t = setInterval(() => {
      if (!alive) return;
      fetchChats({ silent: true });
    }, POLL_MS);

    const onFocus = () => fetchChats({ silent: true });
    const onVis = () => {
      if (document.visibilityState === "visible") fetchChats({ silent: true });
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      alive = false;
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // load messages when selected changes + polling messages for selected chat
  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setMsgsErr("");
      setLoadingMsgs(false);
      return;
    }

    let alive = true;

    (async () => {
      if (!alive) return;
      await fetchMessages(selectedId);
      // scroll to bottom after load
      setTimeout(() => {
        if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight;
      }, 0);
    })();

    const t = setInterval(() => {
      if (!alive) return;
      fetchMessages(selectedId, { silent: true });
    }, POLL_MS);

    const onFocus = () => fetchMessages(selectedId, { silent: true });
    const onVis = () => {
      if (document.visibilityState === "visible") fetchMessages(selectedId, { silent: true });
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      alive = false;
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [selectedId]);

  const selectedChat = useMemo(() => {
    return chats.find((c) => c.id === selectedId) || null;
  }, [chats, selectedId]);

  async function onPickChat(chatId) {
    if (!chatId) return;
    navigate(`/chats/${chatId}`);
    // подстрахуем моментально
    fetchMessages(chatId, { silent: true });
  }

  async function onSend(e) {
    e?.preventDefault?.();
    if (!selectedId) return;

    const cleanText = (text || "").trim();
    if (!cleanText && (!files || files.length === 0)) return;

    try {
      setSending(true);

      const fd = new FormData();
      if (cleanText) fd.append("text", cleanText);
      for (const f of files) fd.append("files", f);

      const res = await http.post(`/chats/${selectedId}/messages`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const created = res.data;

      // optimistic add
      setMessages((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        next.push(created);
        return next;
      });

      setText("");
      setFiles([]);

      // обновим список чатов (lastMessage)
      fetchChats({ silent: true });

      // scroll to bottom
      setTimeout(() => {
        if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight;
      }, 0);
    } catch (e2) {
      alert(e2?.response?.data?.error || e2?.response?.data?.message || e2.message);
    } finally {
      setSending(false);
    }
  }

  const leftWidth = 330;

  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        height: "100%",
        minHeight: 0,
      }}
    >
      {/* LEFT: chats list */}
      <div
        style={{
          width: leftWidth,
          minWidth: leftWidth,
          maxWidth: leftWidth,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(0,0,0,0.20)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {/* search */}
        <div style={{ padding: 12, paddingBottom: 10 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.25)",
              color: "rgba(255,255,255,0.9)",
              outline: "none",
              fontWeight: 700,
            }}
          />
        </div>

        {/* list */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden", // ✅ убрали горизонтальный скролл
            padding: 12, // ✅ одинаковые отступы слева/справа как у поиска
            paddingTop: 2,
          }}
          className="chatListScroll"
        >
          <style>{`
            .chatListScroll::-webkit-scrollbar { width: 10px; }
            .chatListScroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.04); border-radius: 999px; }
            .chatListScroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.18); border-radius: 999px; }
            .chatListScroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.28); }
          `}</style>

          {loadingChats ? (
            <div style={{ color: "rgba(255,255,255,0.7)", padding: 8 }}>Loading...</div>
          ) : chatsErr ? (
            <div style={{ color: "crimson", padding: 8 }}>{chatsErr}</div>
          ) : filteredChats.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.65)", padding: 8 }}>Чатов нет</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {filteredChats.map((c) => {
                const peer = c.peer || c.participants?.find((p) => p.id !== me?.id) || null;
                const title = peer?.displayName || peer?.username || "Chat";
                const avatarUrl = peer?.avatarUrl || "";
                const last = c.lastMessage?.text || "";
                const time = fmtTime(c.lastMessage?.createdAt || c.updatedAt);
                const active = selectedId === c.id;

                return (
                  <button
                    key={c.id}
                    onClick={() => onPickChat(c.id)}
                    style={{
                      all: "unset",
                      cursor: "pointer",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: active
                        ? "linear-gradient(180deg, rgba(170, 120, 255, 0.22), rgba(0,0,0,0.18))"
                        : "rgba(255,255,255,0.06)",
                      boxShadow: active ? "0 10px 30px rgba(0,0,0,0.45)" : "none",
                      padding: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      overflow: "hidden",
                      minWidth: 0,
                    }}
                  >
                    <Avatar username={peer?.username || title} avatarUrl={avatarUrl} size={44} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 900,
                            color: "rgba(255,255,255,0.92)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {title}
                        </div>

                        <div style={{ color: "rgba(255,255,255,0.55)", fontWeight: 800, fontSize: 12 }}>
                          {time}
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 3,
                          color: "rgba(255,255,255,0.70)",
                          fontWeight: 700,
                          fontSize: 13,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {last || " "}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: chat */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(0,0,0,0.20)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {/* header */}
        <div
          style={{
            padding: 14,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            minHeight: 62,
          }}
        >
          {selectedChat ? (
            <>
              <Avatar
                username={selectedChat.peer?.username || "Chat"}
                avatarUrl={selectedChat.peer?.avatarUrl}
                size={40}
              />
              <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
                <div style={{ fontWeight: 900, color: "rgba(255,255,255,0.92)" }}>
                  {selectedChat.peer?.displayName || selectedChat.peer?.username || "Chat"}
                </div>
                <div style={{ color: "rgba(255,255,255,0.60)", fontWeight: 700, fontSize: 12 }}>
                  был(а) недавно
                </div>
              </div>
            </>
          ) : (
            <div style={{ fontWeight: 900, color: "rgba(255,255,255,0.75)" }}>Chat</div>
          )}
        </div>

        {/* messages */}
        <div
          ref={msgRef}
          className="msgScroll"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: 18,
            paddingRight: 12,
          }}
        >
          <style>{`
            .msgScroll::-webkit-scrollbar { width: 10px; }
            .msgScroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.04); border-radius: 999px; }
            .msgScroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.18); border-radius: 999px; }
            .msgScroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.28); }
          `}</style>

          {!selectedId ? (
            <div style={{ color: "rgba(255,255,255,0.70)", fontWeight: 800, textAlign: "center", marginTop: 40 }}>
              Выбери чат слева
            </div>
          ) : loadingMsgs ? (
            <div style={{ color: "rgba(255,255,255,0.70)" }}>Loading...</div>
          ) : msgsErr ? (
            <div style={{ color: "crimson", fontWeight: 800 }}>{msgsErr}</div>
          ) : messages.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.65)", fontWeight: 800 }}>Сообщений нет</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {messages.map((m) => {
                const mine = m.senderId === me?.id;
                const time = fmtTime(m.createdAt);

                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      justifyContent: mine ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "min(520px, 75%)",
                        borderRadius: 14,
                        padding: "10px 12px",
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: mine
                          ? "linear-gradient(180deg, rgba(170, 120, 255, 0.24), rgba(0,0,0,0.18))"
                          : "rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.92)",
                        boxShadow: "0 10px 26px rgba(0,0,0,0.35)",
                        overflow: "hidden",
                        wordBreak: "break-word",
                      }}
                    >
                      {m.text ? (
                        <div style={{ whiteSpace: "pre-wrap", fontWeight: 700, lineHeight: 1.35 }}>
                          {m.text}
                        </div>
                      ) : null}

                      {/* attachments UI (если есть) */}
                      {Array.isArray(m.attachments) && m.attachments.length > 0 ? (
                        <div style={{ marginTop: m.text ? 10 : 0, display: "grid", gap: 8 }}>
                          {m.attachments.map((a) => {
                            const name = a.fileName || a.originalName || "file";
                            const size = typeof a.size === "number" ? a.size : 0;
                            const sizeKb = size ? `${Math.max(1, Math.round(size / 1024))} KB` : "";

                            // download через эндпоинт
                            const href = `/api/chats/attachments/${a.id}/download`;

                            return (
                              <a
                                key={a.id}
                                href={href}
                                style={{
                                  textDecoration: "none",
                                  color: "rgba(255,255,255,0.92)",
                                  border: "1px solid rgba(255,255,255,0.10)",
                                  background: "rgba(0,0,0,0.25)",
                                  borderRadius: 12,
                                  padding: "10px 10px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 12,
                                }}
                              >
                                <div style={{ minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontWeight: 900,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {name}
                                  </div>
                                  <div style={{ opacity: 0.7, fontWeight: 700, fontSize: 12 }}>{sizeKb}</div>
                                </div>
                                <div
                                  style={{
                                    fontWeight: 900,
                                    color: "rgba(170, 120, 255, 0.95)",
                                    flex: "0 0 auto",
                                  }}
                                >
                                  Скачать
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      ) : null}

                      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.65, fontWeight: 800, textAlign: mine ? "right" : "left" }}>
                        {time}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* composer */}
        <form
          onSubmit={onSend}
          style={{
            padding: 14,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <label
            title="Attach"
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.06)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              userSelect: "none",
              flex: "0 0 auto",
            }}
          >
            📎
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              style={{ display: "none" }}
            />
          </label>

          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Сообщение..."
            disabled={!selectedId || sending}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.25)",
              color: "rgba(255,255,255,0.9)",
              outline: "none",
              fontWeight: 700,
              minWidth: 0,
            }}
          />

          <button
            type="submit"
            disabled={!selectedId || sending}
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(170, 120, 255, 0.25)",
              color: "rgba(255,255,255,0.92)",
              fontWeight: 900,
              cursor: !selectedId || sending ? "not-allowed" : "pointer",
              opacity: !selectedId || sending ? 0.6 : 1,
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
