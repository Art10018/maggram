// frontend/src/pages/Chats.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../store/auth.jsx";

const API_ORIGIN = "";

// === UI constants (монолитный акцент) ===
const ACCENT_BG = "rgba(170, 120, 255, 0.26)"; // выбранный чат + мои сообщения
const ACCENT_TEXT = "rgba(255,255,255,0.92)";
const NEUTRAL_BG = "rgba(255,255,255,0.06)";

function useIsMobile(breakpoint = 820) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [breakpoint]);

  return isMobile;
}

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

function shortFileName(name = "") {
  const s = String(name || "");
  const dot = s.lastIndexOf(".");
  const ext = dot > 0 && dot < s.length - 1 ? s.slice(dot) : "";
  const base = dot > 0 ? s.slice(0, dot) : s;
  const trimmed = base.length > 8 ? base.slice(0, 8) + "…" : base;
  return trimmed + ext;
}

function DownloadIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M8 10l4 4 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5 20h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
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
  const isMobile = useIsMobile(820);

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
      const peerName = c.peer?.displayName?.toLowerCase() || c.peer?.username?.toLowerCase() || "";
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

  // load messages when selected changes + polling messages
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

  const selectedChat = useMemo(() => chats.find((c) => c.id === selectedId) || null, [chats, selectedId]);

  const peer = useMemo(() => {
    if (!selectedChat) return null;
    return selectedChat.peer || selectedChat.participants?.find((p) => p.id !== me?.id) || null;
  }, [selectedChat, me?.id]);

  const peerTitle = peer?.displayName || peer?.username || "Chat";
  const peerAvatar = peer?.avatarUrl || "";

  async function onPickChat(chatId) {
    if (!chatId) return;
    navigate(`/chats/${chatId}`);
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

      // ✅ Без дублей
      setMessages((prev) => {
        const arr = Array.isArray(prev) ? prev : [];
        if (created?.id && arr.some((x) => x?.id === created.id)) return arr;
        return [...arr, created];
      });

      setText("");
      setFiles([]);

      fetchChats({ silent: true });

      setTimeout(() => {
        if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight;
      }, 0);
    } catch (e2) {
      alert(e2?.response?.data?.error || e2?.response?.data?.message || e2.message);
    } finally {
      setSending(false);
    }
  }

  const goBackMobile = () => navigate("/chats");
  const goPeerProfile = () => {
    if (peer?.id) navigate(`/profile/${peer.id}`);
    else navigate("/profile");
  };

  const leftWidth = 330;

  // ======= panes (ВАЖНО: убрали отдельные “плавающие” карточки) =======

  const ChatsListPane = (
    <div
      style={{
        width: isMobile ? "100%" : leftWidth,
        minWidth: isMobile ? 0 : leftWidth,
        maxWidth: isMobile ? "none" : leftWidth,

        // было “плавающее”: border/bg/radius — убрали
        border: 0,
        borderRadius: 0,
        background: "transparent",

        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        height: "100%",
        overflow: "hidden",
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
            fontSize: 16, // ✅ iOS no zoom
          }}
        />
      </div>

      {/* list */}
      <div
        ref={listRef}
        className="chatListScroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          padding: 12,
          paddingTop: 2,
          minWidth: 0,
        }}
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
              const p = c.peer || c.participants?.find((x) => x.id !== me?.id) || null;
              const title = p?.displayName || p?.username || "Chat";
              const avatarUrl = p?.avatarUrl || "";
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
                    background: active ? ACCENT_BG : NEUTRAL_BG, // ✅ монолит
                    padding: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    overflow: "hidden",
                    minWidth: 0,
                  }}
                >
                  <Avatar username={p?.username || title} avatarUrl={avatarUrl} size={44} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                      <div
                        style={{
                          fontWeight: 900,
                          color: "rgba(255,255,255,0.92)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          minWidth: 0,
                        }}
                      >
                        {title}
                      </div>

                      <div style={{ color: "rgba(255,255,255,0.55)", fontWeight: 800, fontSize: 12 }}>{time}</div>
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
                        minWidth: 0,
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
  );

  const ChatPane = (
    <div
      style={{
        flex: 1,
        minWidth: 0,

        // было “плавающее”: border/bg/radius — убрали
        border: 0,
        borderRadius: 0,
        background: "transparent",

        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        height: "100%",
      }}
    >
      {/* header */}
      <div
        style={{
          padding: 14,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          minHeight: 62,
        }}
      >
        {/* DESKTOP header */}
        {!isMobile ? (
          selectedChat ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
                <div style={{ fontWeight: 900, color: "rgba(255,255,255,0.92)" }}>{peerTitle}</div>
                <div style={{ color: "rgba(255,255,255,0.60)", fontWeight: 700, fontSize: 12 }}>был(а) недавно</div>
              </div>

              {/* ✅ аватар прижат вправо */}
              <div style={{ flex: 1 }} />
              <button
                onClick={goPeerProfile}
                title="Profile"
                aria-label="Profile"
                style={{ all: "unset", cursor: "pointer", display: "grid", placeItems: "center" }}
              >
                <Avatar username={peer?.username || peerTitle} avatarUrl={peerAvatar} size={40} />
              </button>
            </div>
          ) : (
            <div style={{ fontWeight: 900, color: "rgba(255,255,255,0.75)" }}>Chat</div>
          )
        ) : selectedChat ? (
          // MOBILE header: стрелка, центр, аватар справа
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "40px 1fr 40px",
              alignItems: "center",
              gap: 12,
              minWidth: 0,
              paddingTop: "env(safe-area-inset-top)",
            }}
          >
            <button
              onClick={goBackMobile}
              aria-label="Back"
              title="Back"
              style={{
                all: "unset",
                cursor: "pointer",
                width: 40,
                height: 40,
                display: "grid",
                placeItems: "center",
                color: "rgba(255,255,255,0.92)",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18 9 12l6-6"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div style={{ textAlign: "center", minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 950,
                  color: "rgba(255,255,255,0.92)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {peerTitle}
              </div>
              <div style={{ color: "rgba(255,255,255,0.60)", fontWeight: 750, fontSize: 12 }}>был(а) недавно</div>
            </div>

            <button
              onClick={goPeerProfile}
              aria-label="Open profile"
              title="Profile"
              style={{
                all: "unset",
                cursor: "pointer",
                width: 40,
                height: 40,
                display: "grid",
                placeItems: "center",
                justifySelf: "end",
              }}
            >
              <Avatar username={peer?.username || peerTitle} avatarUrl={peerAvatar} size={40} />
            </button>
          </div>
        ) : (
          <div style={{ fontWeight: 900, color: "rgba(255,255,255,0.75)", textAlign: "center" }}>Chat</div>
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
          overflowX: "hidden",
          padding: 18,
          paddingRight: 12,
          minWidth: 0,
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
          <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
            {messages.map((m) => {
              const mine = m.senderId === me?.id;
              const time = fmtTime(m.createdAt);

              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    justifyContent: mine ? "flex-end" : "flex-start",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      maxWidth: "min(520px, 78%)",
                      borderRadius: 14,
                      padding: "10px 12px",
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: mine ? ACCENT_BG : NEUTRAL_BG, // ✅ монолит
                      color: ACCENT_TEXT,
                      boxShadow: "0 10px 26px rgba(0,0,0,0.35)",
                      overflow: "hidden",
                      minWidth: 0,
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {m.text ? (
                      <div style={{ whiteSpace: "pre-wrap", fontWeight: 700, lineHeight: 1.35 }}>{m.text}</div>
                    ) : null}

                    {/* ✅ Вложения ТОЛЬКО ОДИН РАЗ */}
                    {Array.isArray(m.attachments) && m.attachments.length > 0 ? (
                      <div style={{ marginTop: m.text ? 8 : 0, display: "grid", gap: 8 }}>
                        {m.attachments.map((a) => {
                          const fullName = a.fileName || a.originalName || "file";
                          const showName = shortFileName(fullName);

                          const size = typeof a.size === "number" ? a.size : 0;
                          const sizeKb = size ? `${Math.max(1, Math.round(size / 1024))} KB` : "";

                          const href = `/api/chats/attachments/${a.id}/download`;

                          return (
                            <a
                              key={a.id}
                              href={href}
                              title={fullName}
                              style={{
                                textDecoration: "none",
                                color: "rgba(255,255,255,0.92)",
                                border: "1px solid rgba(255,255,255,0.10)",
                                background: "rgba(0,0,0,0.22)",
                                borderRadius: 12,
                                padding: "8px 10px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 10,
                                minWidth: 0,
                                overflow: "hidden",
                              }}
                            >
                              <div style={{ minWidth: 0, overflow: "hidden" }}>
                                <div
                                  style={{
                                    fontWeight: 900,
                                    fontSize: 13,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {showName}
                                </div>
                                <div style={{ opacity: 0.7, fontWeight: 700, fontSize: 11 }}>{sizeKb}</div>
                              </div>

                              <span
                                style={{
                                  flex: "0 0 auto",
                                  width: 34,
                                  height: 34,
                                  borderRadius: 12,
                                  border: "1px solid rgba(255,255,255,0.10)",
                                  background: "rgba(255,255,255,0.07)",
                                  display: "grid",
                                  placeItems: "center",
                                  color: "rgba(170, 120, 255, 0.95)",
                                }}
                                aria-label="Download"
                              >
                                <DownloadIcon size={18} />
                              </span>
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
          paddingBottom: `calc(14px + env(safe-area-inset-bottom))`,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          gap: 10,
          alignItems: "center",
          overflowX: "hidden",
          minWidth: 0,
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
            fontSize: 16, // ✅ iOS no zoom
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
            background: ACCENT_BG, // ✅ монолит
            color: "rgba(255,255,255,0.92)",
            fontWeight: 900,
            cursor: !selectedId || sending ? "not-allowed" : "pointer",
            opacity: !selectedId || sending ? 0.6 : 1,
            flex: "0 0 auto",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );

  // === layout root ===
  return (
    <div
      style={{
        height: "100%",
        minHeight: 0,

        // ключ: делаем страницу чатов “полноэкранной” внутри AppShell,
        // чтобы скроллились только list/messages
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          gap: isMobile ? 0 : 14,
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        {/* Важно: на мобилке показываем либо список, либо чат */}
        {isMobile ? (selectedId ? ChatPane : ChatsListPane) : (
          <>
            {ChatsListPane}
            {/* аккуратный разделитель вместо второй “карточки” */}
            <div style={{ width: 1, background: "rgba(255,255,255,0.08)" }} />
            {ChatPane}
          </>
        )}
      </div>
    </div>
  );
}
