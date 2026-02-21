import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import http from "../api/http";

const API_ORIGIN = "";

function buildSrc(u) {
  if (!u || typeof u !== "string") return "";
  if (u.startsWith("http")) return u;
  if (u.startsWith("/")) return `${API_ORIGIN}${u}`;
  return `${API_ORIGIN}/${u}`;
}

function hashColor(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360} 65% 55%)`;
}

function UserAvatar({ user, size = 44 }) {
  const letter = (user?.username?.[0] || "?").toUpperCase();
  const bg = useMemo(() => hashColor(user?.username || ""), [user?.username]);
  const src = user?.avatarUrl ? buildSrc(user.avatarUrl) : "";

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
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.06)",
          flex: "0 0 auto",
          display: "block",
        }}
        onError={(e) => e.currentTarget.removeAttribute("src")}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        fontWeight: 800,
        color: "white",
        background: bg,
        border: "1px solid rgba(255,255,255,0.08)",
        userSelect: "none",
        flex: "0 0 auto",
      }}
    >
      {letter}
    </div>
  );
}

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ users: [], posts: [] });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults({ users: [], posts: [] });
      return;
    }
    let cancelled = false;
    setLoading(true);
    http
      .get("/search", { params: { q: debouncedQuery } })
      .then((res) => {
        if (!cancelled) setResults({ users: res.data?.users ?? [], posts: res.data?.posts ?? [] });
      })
      .catch(() => {
        if (!cancelled) setResults({ users: [], posts: [] });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const onChatWithUser = useCallback(
    async (userId) => {
      try {
        const res = await http.post(`/chats/direct/${userId}`);
        const chatId = res.data?.id;
        if (chatId) navigate(`/chats/${chatId}`);
      } catch (e) {
        alert(e?.response?.data?.error || e?.response?.data?.message || e.message || "Ошибка");
      }
    },
    [navigate]
  );

  const { users, posts } = results;
  const hasUsers = users.length > 0;
  const hasPosts = posts.length > 0;
  const empty = !loading && debouncedQuery.length >= 2 && !hasUsers && !hasPosts;

  return (
    <div style={{ padding: 18, maxWidth: 640, margin: "0 auto" }}>
      <h2 style={{ marginTop: 0, marginBottom: 14, color: "rgba(255,255,255,0.9)", fontWeight: 800 }}>
        Поиск
      </h2>

      <input
        type="search"
        placeholder="Люди, посты..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
        style={{
          width: "100%",
          maxWidth: 400,
          padding: "12px 16px",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.06)",
          color: "white",
          fontSize: 16,
          outline: "none",
        }}
      />

      {loading && (
        <div style={{ marginTop: 18, color: "rgba(255,255,255,0.7)" }}>Поиск...</div>
      )}

      {empty && (
        <div style={{ marginTop: 18, color: "rgba(255,255,255,0.6)" }}>
          Ничего не найдено по запросу «{debouncedQuery}»
        </div>
      )}

      {!loading && (hasUsers || hasPosts) && (
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 24 }}>
          {hasUsers && (
            <section>
              <h3 style={{ margin: "0 0 12px", color: "rgba(255,255,255,0.85)", fontWeight: 800, fontSize: 15 }}>
                Люди
              </h3>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {users.map((u) => (
                  <li
                    key={u.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 12px",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <Link
                      to={`/profile/${u.id}`}
                      style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, textDecoration: "none", color: "inherit", minWidth: 0 }}
                    >
                      <UserAvatar user={u} size={44} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, color: "rgba(255,255,255,0.95)" }}>
                          {u.displayName || u.username}
                        </div>
                        {u.displayName && (
                          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 14 }}>@{u.username}</div>
                        )}
                        {(u._count?.posts != null || u._count?.followers != null) && (
                          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }}>
                            {[u._count.posts != null && `${u._count.posts} постов`, u._count.followers != null && `${u._count.followers} подписчиков`].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => onChatWithUser(u.id)}
                      style={{
                        flex: "0 0 auto",
                        padding: "8px 14px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: "rgba(170, 100, 255, 0.25)",
                        color: "rgba(255,255,255,0.95)",
                        fontWeight: 800,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Написать
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hasPosts && (
            <section>
              <h3 style={{ margin: "0 0 12px", color: "rgba(255,255,255,0.85)", fontWeight: 800, fontSize: 15 }}>
                Посты
              </h3>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {posts.map((p) => {
                  const codePreview = (p.code || "").slice(0, 120);
                  const hasMore = (p.code || "").length > 120;
                  return (
                    <li
                      key={p.id}
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(0,0,0,0.2)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <UserAvatar user={p.author} size={36} />
                        <Link
                          to={`/profile/${p.author?.id || p.authorId}`}
                          style={{
                            fontWeight: 800,
                            color: "rgba(255,255,255,0.92)",
                            textDecoration: "none",
                          }}
                        >
                          {p.author?.displayName || p.author?.username || "?"}
                        </Link>
                        {p.language && (
                          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{p.language}</span>
                        )}
                      </div>
                      <pre
                        style={{
                          margin: 0,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          color: "rgba(255,255,255,0.8)",
                          fontSize: 14,
                          lineHeight: 1.4,
                          fontFamily: "inherit",
                        }}
                      >
                        {codePreview}{hasMore ? "…" : ""}
                      </pre>
                      <div style={{ marginTop: 10, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                        <Link
                          to={`/profile/${p.author?.id || p.authorId}`}
                          style={{
                            color: "rgba(170, 120, 255, 0.9)",
                            fontWeight: 700,
                            fontSize: 14,
                            textDecoration: "none",
                          }}
                        >
                          Профиль автора
                        </Link>
                        {(p._count?.likes != null || p._count?.comments != null) && (
                          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                            ♥ {p._count?.likes ?? 0}  ·  💬 {p._count?.comments ?? 0}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}

      {debouncedQuery.length > 0 && debouncedQuery.length < 2 && !loading && (
        <div style={{ marginTop: 18, color: "rgba(255,255,255,0.5)" }}>
          Введите минимум 2 символа
        </div>
      )}
    </div>
  );
}
