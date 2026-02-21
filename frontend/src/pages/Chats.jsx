// frontend/src/pages/Chats.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../store/auth.jsx";

function sameId(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) return false;
  return String(a) === String(b);
}

const API_ORIGIN = "";

// монолитные фоны (как у тебя сейчас)
const ACCENT_BG = "rgba(170, 120, 255, 0.22)";
const NEUTRAL_BG = "rgba(255,255,255,0.06)";

function useIsMobile(bp = 820) {
  const [m, setM] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= bp : false));
  useEffect(() => {
    const on = () => setM(window.innerWidth <= bp);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [bp]);
  return m;
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

function isImageMime(mime = "") {
  return /^image\//i.test(mime);
}

function isVideoMime(mime = "") {
  return /^video\//i.test(mime);
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

// ✅ Иконка Share / Upload (как на картинке)
function TapSendIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* стрелка вверх */}
      <path d="M12 16V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M8 8L12 4L16 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* нижний лоток */}
      <path
        d="M4 14V17C4 19 5 20 7 20H17C19 20 20 19 20 17V14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DownIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 10l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
  const [ctxMenu, setCtxMenu] = useState({ open: false, x: 0, y: 0, messageId: null });
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageText, setEditingMessageText] = useState("");

  const listRef = useRef(null);
  const msgRef = useRef(null);

  const POLL_MS = 2500;

  // ===== автоскролл / кнопка вниз =====
  const atBottomRef = useRef(true);
  const prevLenRef = useRef(0);
  const [showJump, setShowJump] = useState(false);

  // viewer для фото/гиф (увеличение на блюре)
  const [viewer, setViewer] = useState({ open: false, src: "", alt: "" });
  const openViewer = (src, alt = "") => setViewer({ open: true, src, alt });
  const closeViewer = () => setViewer({ open: false, src: "", alt: "" });

  // закрыть viewer по ESC
  useEffect(() => {
    if (!viewer.open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeViewer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [viewer.open]);

  const scrollToBottom = (smooth = false) => {
    const el = msgRef.current;
    if (!el) return;
    const top = el.scrollHeight;
    if (smooth) el.scrollTo({ top, behavior: "smooth" });
    else el.scrollTop = top;
  };

  const onMsgScroll = () => {
    const el = msgRef.current;
    if (!el) return;
    const delta = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = delta < 80;
    atBottomRef.current = atBottom;
    setShowJump(!atBottom);
  };

  const closeCtxMenu = () => setCtxMenu({ open: false, x: 0, y: 0, messageId: null });

  useEffect(() => {
    if (!ctxMenu.open) return;
    const onGlobal = () => closeCtxMenu();
    window.addEventListener("click", onGlobal);
    return () => window.removeEventListener("click", onGlobal);
  }, [ctxMenu.open]);

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
      const next = Array.isArray(items) ? items : [];

      setMessages(next);

      // автоскролл только если пользователь был внизу
      const grew = next.length > (prevLenRef.current || 0);
      prevLenRef.current = next.length;

      if (grew) {
        if (atBottomRef.current) {
          setTimeout(() => scrollToBottom(false), 0);
        } else {
          setShowJump(true);
        }
      }
    } catch (e) {
      setMsgsErr(e?.response?.data?.error || e?.response?.data?.message || e.message);
      setMessages([]);
      prevLenRef.current = 0;
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
      prevLenRef.current = 0;
      setShowJump(false);
      return;
    }

    let alive = true;

    (async () => {
      if (!alive) return;
      await fetchMessages(selectedId);
      setTimeout(() => scrollToBottom(false), 0);
      atBottomRef.current = true;
      setShowJump(false);
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
    return selectedChat.peer || selectedChat.participants?.find((p) => !sameId(p.id, me?.id)) || null;
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

      // после отправки — всегда вниз
      atBottomRef.current = true;
      setShowJump(false);
      setTimeout(() => scrollToBottom(false), 0);
    } catch (e2) {
      alert(e2?.response?.data?.error || e2?.response?.data?.message || e2.message);
    } finally {
      setSending(false);
    }
  }

  async function onDeleteMessage(messageId) {
    if (!messageId) return;
    if (!window.confirm("Удалить сообщение?")) return;
    try {
      await http.delete(`/chats/messages/${messageId}`);
      setMessages((prev) => (prev || []).filter((m) => m.id !== messageId));
      closeCtxMenu();
      fetchChats({ silent: true });
    } catch (e) {
      alert(e?.response?.data?.error || e?.response?.data?.message || e.message);
    }
  }

  async function onSaveMessageEdit(messageId) {
    const text2 = editingMessageText.trim();
    if (!messageId || !text2) return;
    try {
      const res = await http.patch(`/chats/messages/${messageId}`, { text: text2 });
      const updated = res.data;
      setMessages((prev) => (prev || []).map((m) => (m.id === messageId ? { ...m, text: updated.text } : m)));
      setEditingMessageId(null);
      setEditingMessageText("");
      closeCtxMenu();
      fetchChats({ silent: true });
    } catch (e) {
      alert(e?.response?.data?.error || e?.response?.data?.message || e.message);
    }
  }

  const goBackMobile = () => navigate("/chats");
  const goPeerProfile = () => {
    if (peer?.id) navigate(`/profile/${peer.id}`);
    else navigate("/profile");
  };

  const leftWidth = 330;

  // ======= panes (как у тебя сейчас в гите) =======
  const ChatsListPane = (
    <div style={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}>
      {/* search */}
      <div style={{ padding: 14, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
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
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: 14,
          }}
        >
        {loadingChats ? (
          <div style={{ color: "rgba(255,255,255,0.70)" }}>Loading...</div>
        ) : chatsErr ? (
          <div style={{ color: "crimson", fontWeight: 800 }}>{chatsErr}</div>
        ) : filteredChats.length === 0 ? (
          <div style={{ color: "rgba(255,255,255,0.70)", fontWeight: 800 }}>Чатов нет</div>
        ) : (
          <>
            {filteredChats.map((c) => {
              const p = c.peer || c.participants?.find((x) => !sameId(x.id, me?.id)) || null;
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
                    background: active ? ACCENT_BG : NEUTRAL_BG,
                    padding: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    overflow: "hidden",
                    minWidth: 0,

                    width: "100%",
                    boxSizing: "border-box",
                    marginBottom: 10,   // вместо grid gap
                  }}
                >
                  <Avatar username={title} avatarUrl={avatarUrl} size={44} />

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div
                        style={{
                          fontWeight: 900,
                          color: "rgba(255,255,255,0.95)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {title}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.65, fontWeight: 800, flex: "0 0 auto" }}>{time}</div>
                    </div>

                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 13,
                        opacity: 0.75,
                        fontWeight: 700,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {last || " "}
                    </div>
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );

  const ChatPane = (
    <div style={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column", position: "relative" }}>
      {/* header */}
      <div
        style={{
          padding: 14,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          minWidth: 0,
        }}
      >
        {/* DESKTOP header */}
        {!isMobile ? (
          selectedChat ? (
            <>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 900, fontSize: 18, color: "rgba(255,255,255,0.95)" }}>{peerTitle}</div>
                <div style={{ marginTop: 2, fontSize: 12, opacity: 0.7, fontWeight: 800 }}>был(а) недавно</div>
              </div>

              {/* ✅ аватар прижат вправо */}
              <button
                onClick={goPeerProfile}
                title="Профиль"
                style={{
                  all: "unset",
                  cursor: "pointer",
                  marginLeft: "auto",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Avatar username={peerTitle} avatarUrl={peerAvatar} size={44} />
              </button>
            </>
          ) : (
            <div style={{ fontWeight: 900, fontSize: 18, color: "rgba(255,255,255,0.95)" }}>Chat</div>
          )
        ) : selectedChat ? (
          // MOBILE header: стрелка, центр, аватар справа
          <>
          <button
            onClick={goBackMobile}
            aria-label="Назад"
            title="Назад"
            style={{
              all: "unset",
              cursor: "pointer",
              padding: 6,          // зона тапа
              display: "grid",
              placeItems: "center",
              color: "rgba(255,255,255,0.95)",
              flex: "0 0 auto",
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 18 9 12l6-6"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

            <button
              onClick={goPeerProfile}
              style={{
                all: "unset",
                cursor: "pointer",
                flex: 1,
                minWidth: 0,
                textAlign: "center",
              }}
              title="Профиль"
            >
              <div style={{ fontWeight: 900, fontSize: 16, color: "rgba(255,255,255,0.95)" }}>{peerTitle}</div>
              <div style={{ marginTop: 1, fontSize: 12, opacity: 0.7, fontWeight: 800 }}>был(а) недавно</div>
            </button>

            <button
              onClick={goPeerProfile}
              title="Профиль"
              style={{
                all: "unset",
                cursor: "pointer",
                width: 44,
                height: 44,
                display: "grid",
                placeItems: "center",
                flex: "0 0 auto",
              }}
            >
              <Avatar username={peerTitle} avatarUrl={peerAvatar} size={44} />
            </button>
          </>
        ) : (
          <div style={{ fontWeight: 900, fontSize: 18, color: "rgba(255,255,255,0.95)" }}>Chat</div>
        )}
      </div>

      {/* messages */}
      <div
        ref={msgRef}
        onScroll={onMsgScroll}
        className="msgScroll noX"
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
              const mine = sameId(m.senderId, me?.id);
              const time = fmtTime(m.createdAt);

              return (
                <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", minWidth: 0 }}>
                  <div
                    onContextMenu={(e) => {
                      if (!mine) return;
                      e.preventDefault();
                      setCtxMenu({ open: true, x: e.clientX, y: e.clientY, messageId: m.id });
                    }}
                    style={{
                      maxWidth: "min(520px, 78%)",
                      borderRadius: 14,
                      padding: "10px 12px",
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: mine ? ACCENT_BG : NEUTRAL_BG,
                      color: "rgba(255,255,255,0.92)",
                      boxShadow: "0 10px 26px rgba(0,0,0,0.35)",
                      overflow: "hidden",
                      minWidth: 0,
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {editingMessageId === m.id ? (
                      <div style={{ display: "grid", gap: 8 }}>
                        <textarea
                          value={editingMessageText}
                          onChange={(e) => setEditingMessageText(e.target.value)}
                          rows={3}
                          style={{ width: "100%", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.2)", color: "white", padding: 8 }}
                        />
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => onSaveMessageEdit(m.id)} style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.08)", color: "white", padding: "6px 10px", cursor: "pointer" }}>Сохранить</button>
                          <button onClick={() => { setEditingMessageId(null); setEditingMessageText(""); }} style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.8)", padding: "6px 10px", cursor: "pointer" }}>Отмена</button>
                        </div>
                      </div>
                    ) : m.text ? (
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

                          const downloadHref = `/api/chats/attachments/${a.id}/download`;
                          const mime = a.mime || a.mimeType || "";
                          const srcUrl = buildSrc(a.url || "");

                          // Фото / GIF
                          if (srcUrl && isImageMime(mime)) {
                            return (
                              <div key={a.id} style={{ display: "grid", gap: 6 }}>
                                <button
                                  type="button"
                                  onClick={() => openViewer(srcUrl, fullName)}
                                  title={fullName}
                                  style={{
                                    all: "unset",
                                    cursor: "pointer",
                                    borderRadius: 12,
                                    overflow: "hidden",
                                    border: "1px solid rgba(255,255,255,0.10)",
                                    background: "rgba(0,0,0,0.22)",
                                    maxWidth: 520,
                                  }}
                                >
                                  <img
                                    src={srcUrl}
                                    alt={fullName}
                                    loading="lazy"
                                    style={{
                                      display: "block",
                                      width: "100%",
                                      height: "auto",
                                      maxHeight: 520,
                                      objectFit: "cover",
                                    }}
                                  />
                                </button>

                                <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                                  <span
                                    style={{
                                      fontWeight: 900,
                                      fontSize: 13,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      minWidth: 0,
                                    }}
                                  >
                                    {showName}
                                  </span>
                                  <span style={{ opacity: 0.7, fontWeight: 700, fontSize: 11, flex: "0 0 auto" }}>
                                    {sizeKb}
                                  </span>
                                </div>
                              </div>
                            );
                          }

                          // Видео
                          if (srcUrl && isVideoMime(mime)) {
                            return (
                              <div key={a.id} style={{ display: "grid", gap: 6 }}>
                                <div
                                  style={{
                                    borderRadius: 12,
                                    overflow: "hidden",
                                    border: "1px solid rgba(255,255,255,0.10)",
                                    background: "rgba(0,0,0,0.22)",
                                    maxWidth: 520,
                                  }}
                                >
                                  <video
                                    src={srcUrl}
                                    controls
                                    playsInline
                                    style={{ display: "block", width: "100%", maxHeight: 520 }}
                                  />
                                </div>

                                <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                                  <span
                                    style={{
                                      fontWeight: 900,
                                      fontSize: 13,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      minWidth: 0,
                                    }}
                                  >
                                    {showName}
                                  </span>
                                  <span style={{ opacity: 0.7, fontWeight: 700, fontSize: 11, flex: "0 0 auto" }}>
                                    {sizeKb}
                                  </span>
                                </div>
                              </div>
                            );
                          }

                          // Остальные файлы — как и было
                          return (
                            <a
                              key={a.id}
                              href={downloadHref}
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

                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 12,
                        opacity: 0.65,
                        fontWeight: 800,
                        textAlign: mine ? "right" : "left",
                      }}
                    >
                      {time}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {ctxMenu.open ? (
        <div
          style={{
            position: "fixed",
            left: ctxMenu.x,
            top: ctxMenu.y,
            zIndex: 50,
            minWidth: 160,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(20,20,24,0.95)",
            display: "grid",
            boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const msg = messages.find((x) => x.id === ctxMenu.messageId);
              if (!msg) return;
              if (Array.isArray(msg.attachments) && msg.attachments.length > 0) {
                alert("Сообщения с файлами пока нельзя редактировать");
                closeCtxMenu();
                return;
              }
              setEditingMessageId(msg.id);
              setEditingMessageText(msg.text || "");
              closeCtxMenu();
            }}
            style={{ all: "unset", cursor: "pointer", padding: "10px 12px", color: "white", fontWeight: 700 }}
          >
            Редактировать
          </button>
          <button
            onClick={() => onDeleteMessage(ctxMenu.messageId)}
            style={{ all: "unset", cursor: "pointer", padding: "10px 12px", color: "#ff8f8f", fontWeight: 700 }}
          >
            Удалить
          </button>
        </div>
      ) : null}

      {/* кнопка “вниз” (появляется если ты не внизу) */}
      {selectedId && showJump ? (
        <button
          onClick={() => {
            atBottomRef.current = true;
            setShowJump(false);
            scrollToBottom(true);
          }}
          aria-label="Scroll to bottom"
          title="Вниз"
          style={{
            position: "absolute",
            right: 14,
            bottom: 14 + 56 + 10, // над композером
            width: 44,
            height: 44,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.35)",
            color: "rgba(255,255,255,0.92)",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            boxShadow: "0 14px 30px rgba(0,0,0,0.45)",
            backdropFilter: "blur(10px)",
          }}
        >
          <DownIcon size={18} />
        </button>
      ) : null}

      {/* composer */}
      <form
        onSubmit={onSend}
        className="noX"
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
          aria-label="Send"
          title="Send"
          style={{
            width: 44,
            height: 40,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(170, 120, 255, 0.25)",
            color: "rgba(255,255,255,0.92)",
            fontWeight: 900,
            cursor: !selectedId || sending ? "not-allowed" : "pointer",
            opacity: !selectedId || sending ? 0.6 : 1,
            flex: "0 0 auto",
            display: "grid",
            placeItems: "center",
          }}
        >
          <TapSendIcon size={20} />
        </button>
      </form>
    </div>
  );

  // === layout root ===
  return (
    <div style={{ height: "100%", minHeight: 0 }}>
      {/* Важно: на мобилке показываем либо список, либо чат */}
      {isMobile ? (
        selectedId ? (
          ChatPane
        ) : (
          ChatsListPane
        )
      ) : (
        <div style={{ display: "flex", gap: 14, height: "100%", minHeight: 0, overflow: "hidden" }} className="noX">
          <div
            style={{
              width: leftWidth,
              minWidth: leftWidth,
              maxWidth: leftWidth,
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.20)",
              overflow: "hidden",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {ChatsListPane}
          </div>

          <div
            style={{
              flex: 1,
              minWidth: 0,
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.20)",
              overflow: "hidden",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {ChatPane}
          </div>
        </div>
      )}

      {/* viewer для фото/гиф (увеличение на блюре) */}
      {viewer.open ? (
        <div
          onClick={closeViewer}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(14px)",
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              closeViewer();
            }}
            aria-label="Close"
            title="Close"
            style={{
              position: "fixed",
              top: "calc(14px + env(safe-area-inset-top))",
              left: 14,
              width: 44,
              height: 44,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(0,0,0,0.35)",
              color: "rgba(255,255,255,0.92)",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            ×
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "min(92vw, 980px)",
              maxHeight: "min(88vh, 900px)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <img
              src={viewer.src}
              alt={viewer.alt}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                borderRadius: 18,
                boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.20)",
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
