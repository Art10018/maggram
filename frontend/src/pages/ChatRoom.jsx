import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../store/auth.jsx";

const API_ORIGIN = "";

function buildSrc(u) {
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) return `${API_ORIGIN}${u}`;
  return `${API_ORIGIN}/${u}`;
}

function fmtTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function prettySize(bytes = 0) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

export default function ChatRoom() {
  const { id } = useParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [messages, setMessages] = useState([]);
  const [peer, setPeer] = useState(null);

  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);

  const listRef = useRef(null);

  const myId = user?.id || "";

  const scrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await http.get(`/chats/${id}/messages?limit=60`);
        if (cancelled) return;

        const items = res.data?.items || [];
        setMessages(Array.isArray(items) ? items : []);

        // пробуем вычислить "peer" из сообщений (самое простое)
        const first = items.find((m) => m?.sender?.id && m.sender.id !== myId);
        setPeer(first?.sender || null);
      } catch (e) {
        if (!cancelled) setErr(e?.response?.data?.error || e?.response?.data?.message || e.message || "Server error");
      } finally {
        if (!cancelled) setLoading(false);
        setTimeout(scrollToBottom, 0);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, myId]);

  const title = useMemo(() => {
    const name = peer?.displayName || peer?.username;
    return name || "Chat";
  }, [peer]);

  const onPickFiles = (e) => {
    const arr = Array.from(e.target.files || []);
    setFiles(arr);
  };

  const onSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && files.length === 0) return;

    try {
      const fd = new FormData();
      fd.append("text", trimmed);
      for (const f of files) fd.append("files", f);

      const res = await http.post(`/chats/${id}/messages`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const msg = res.data;
      setMessages((prev) => [...prev, msg]);
      setText("");
      setFiles([]);
      setTimeout(scrollToBottom, 0);
    } catch (e) {
      alert(e?.response?.data?.error || e?.response?.data?.message || e.message);
    }
  };

  const downloadUrl = (attachmentId) => `${API_ORIGIN}/api/chats/attachments/${attachmentId}/download`;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* header */}
      <div
        style={{
          padding: 14,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          minHeight: 64,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 999,
            background: "rgba(170,70,255,0.25)",
            border: "1px solid rgba(255,255,255,0.10)",
            display: "grid",
            placeItems: "center",
            color: "rgba(255,255,255,0.92)",
            fontWeight: 950,
          }}
        >
          {(title?.[0] || "C").toUpperCase()}
        </div>

        <div style={{ display: "grid", gap: 2 }}>
          <div style={{ fontWeight: 950, color: "rgba(255,255,255,0.92)" }}>{title}</div>
          <div style={{ color: "rgba(255,255,255,0.55)", fontWeight: 800, fontSize: 12 }}>был(а) недавно</div>
        </div>
      </div>

      {/* messages */}
      <div
        ref={listRef}
        className="msgScroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <style>{`
          .msgScroll::-webkit-scrollbar { width: 10px; }
          .msgScroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.04); border-radius: 999px; }
          .msgScroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.16); border-radius: 999px; }
          .msgScroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.26); }
        `}</style>

        {loading ? (
          <div style={{ color: "rgba(255,255,255,0.7)", fontWeight: 800 }}>Loading...</div>
        ) : err ? (
          <div style={{ color: "crimson", fontWeight: 900 }}>Server error</div>
        ) : messages.length === 0 ? (
          <div style={{ color: "rgba(255,255,255,0.65)", fontWeight: 800 }}>Сообщений нет</div>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === myId || m?.sender?.id === myId;
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
                    maxWidth: "min(520px, 72%)",
                    borderRadius: 14,
                    padding: "10px 12px",
                    background: mine
                      ? "linear-gradient(180deg, rgba(170,70,255,0.35), rgba(170,70,255,0.18))"
                      : "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    color: "rgba(255,255,255,0.92)",
                    display: "grid",
                    gap: 8,
                  }}
                >
                  {m.text ? (
                    <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontWeight: 700 }}>
                      {m.text}
                    </div>
                  ) : null}

                  {Array.isArray(m.attachments) && m.attachments.length > 0 ? (
                    <div style={{ display: "grid", gap: 8 }}>
                      {m.attachments.map((a) => {
                        const name = a.fileName || a.originalName || "file";
                        const mime = a.mime || a.mimeType || "";
                        const size = a.size || 0;
                        const isImage = mime.startsWith("image/");

                        return (
                          <div
                            key={a.id}
                            style={{
                              borderRadius: 12,
                              border: "1px solid rgba(255,255,255,0.10)",
                              background: "rgba(0,0,0,0.18)",
                              overflow: "hidden",
                            }}
                          >
                            {isImage ? (
                              <img
                                src={buildSrc(a.url)}
                                alt=""
                                style={{ width: "100%", display: "block", maxHeight: 260, objectFit: "cover" }}
                                onError={(e) => (e.currentTarget.style.display = "none")}
                              />
                            ) : null}

                            <div style={{ padding: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontWeight: 900,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    maxWidth: 360,
                                  }}
                                  title={name}
                                >
                                  {name}
                                </div>
                                <div style={{ color: "rgba(255,255,255,0.60)", fontWeight: 800, fontSize: 12 }}>
                                  {prettySize(size)} {mime ? `• ${mime}` : ""}
                                </div>
                              </div>

                              <a
                                href={downloadUrl(a.id)}
                                style={{
                                  textDecoration: "none",
                                  padding: "8px 10px",
                                  borderRadius: 12,
                                  border: "1px solid rgba(255,255,255,0.10)",
                                  background: "rgba(255,255,255,0.07)",
                                  color: "rgba(255,255,255,0.92)",
                                  fontWeight: 900,
                                  flex: "0 0 auto",
                                }}
                              >
                                Скачать
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  <div style={{ display: "flex", justifyContent: "flex-end", color: "rgba(255,255,255,0.55)", fontWeight: 900, fontSize: 12 }}>
                    {time}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* input */}
      <div
        style={{
          padding: 12,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <label
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.06)",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            userSelect: "none",
          }}
          title="Attach"
        >
          📎
          <input multiple type="file" style={{ display: "none" }} onChange={onPickFiles} />
        </label>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Сообщение..."
          style={{
            flex: 1,
            height: 42,
            padding: "0 14px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(0,0,0,0.25)",
            color: "rgba(255,255,255,0.92)",
            outline: "none",
            fontWeight: 800,
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />

        <button
          onClick={onSend}
          style={{
            height: 42,
            padding: "0 16px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(170,70,255,0.18)",
            color: "rgba(255,255,255,0.92)",
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>

      {files.length > 0 ? (
        <div style={{ padding: "0 14px 12px", color: "rgba(255,255,255,0.65)", fontWeight: 800, fontSize: 12 }}>
          Прикреплено: {files.map((f) => f.name).join(", ")}
        </div>
      ) : null}
    </div>
  );
}
