import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../store/auth.jsx";

const API_ORIGIN = "";

// стабильный цвет по username
function hashColor(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 65% 55%)`;
}

function buildSrc(u) {
  if (!u || typeof u !== "string") return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) return `${API_ORIGIN}${u}`;
  return `${API_ORIGIN}/${u}`;
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
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.06)",
          flex: "0 0 auto",
          display: "block",
        }}
        onError={(e) => {
          e.currentTarget.removeAttribute("src");
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

function Tabs({ tab, setTab }) {
  const baseBtn = {
    padding: "8px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.7)",
    cursor: "pointer",
    fontWeight: 800,
    whiteSpace: "nowrap",
  };

  const activeBtn = {
    background: "rgba(255,255,255,0.12)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.16)",
  };

  return (
    <div className="feedTabs" style={{ display: "flex", gap: 10, marginBottom: 14 }}>
      <button onClick={() => setTab("forYou")} style={{ ...baseBtn, ...(tab === "forYou" ? activeBtn : {}) }}>
        Для вас
      </button>
      <button onClick={() => setTab("popular")} style={{ ...baseBtn, ...(tab === "popular" ? activeBtn : {}) }}>
        Популярное
      </button>
      <button onClick={() => setTab("following")} style={{ ...baseBtn, ...(tab === "following" ? activeBtn : {}) }}>
        Подписки
      </button>
    </div>
  );
}

function HeartIcon({ filled, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12.1 21.35 10 19.45C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8 10.95l-1.9 1.9Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CommentIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 14a4 4 0 0 1-4 4H8l-5 3V6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatButton({ active = false, onClick, children, title }) {
  return (
    <button className={`statBtn ${active ? "active" : ""}`} onClick={onClick} title={title}>
      {children}
    </button>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = d.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat("ru-RU", { numeric: "auto" });

  const sec = Math.round(diffMs / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  const mon = Math.round(day / 30);
  const yr = Math.round(day / 365);

  if (Math.abs(sec) < 60) return rtf.format(sec, "second");
  if (Math.abs(min) < 60) return rtf.format(min, "minute");
  if (Math.abs(hr) < 24) return rtf.format(hr, "hour");
  if (Math.abs(day) < 30) return rtf.format(day, "day");
  if (Math.abs(mon) < 12) return rtf.format(mon, "month");
  return rtf.format(yr, "year");
}

function extractImages(post) {
  const raw = post?.images || post?.media || post?.attachments || post?.photos || [];
  if (typeof raw === "string") return [raw].map(buildSrc).filter(Boolean);
  if (Array.isArray(raw) && raw.length && typeof raw[0] === "string") return raw.map(buildSrc).filter(Boolean);
  if (Array.isArray(raw) && raw.length && typeof raw[0] === "object") {
    return raw.map((x) => x?.url || x?.path || x?.src).map(buildSrc).filter(Boolean);
  }
  return [];
}

function PhotoGrid({ images }) {
  const list = images.slice(0, 8);
  const extra = Math.max(0, images.length - list.length);
  const n = list.length;
  if (n === 0) return null;

  return (
    <div className={`pg pg-n${Math.min(n, 4)}`}>
      {list.map((src, idx) => {
        const showMore = idx === 7 && extra > 0;
        return (
          <div key={src + idx} className={`pgCell pgCell-${n}-${idx}`}>
            <img
              src={src}
              alt=""
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                objectFit: "cover",
                background: "rgba(255,255,255,0.04)",
              }}
              onError={(e) => {
                e.currentTarget.style.opacity = "0";
              }}
            />
            {showMore && <div className="pgMore">+{extra}</div>}
          </div>
        );
      })}
    </div>
  );
}

export default function Feed() {
  const { user: me } = useAuth();
  const [tab, setTab] = useState("forYou");
  const [posts, setPosts] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [openComments, setOpenComments] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentText, setCommentText] = useState({});
  const [commentLoading, setCommentLoading] = useState({});
  const [commentErr, setCommentErr] = useState({});
  const [expanded, setExpanded] = useState({});
  const [postMenuOpen, setPostMenuOpen] = useState({});
  const [commentMenuOpen, setCommentMenuOpen] = useState({});
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingPostText, setEditingPostText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  const loadPosts = useCallback(async (mode) => {
    setLoading(true);
    setErr("");
    try {
      const res = await http.get(`/feed?mode=${encodeURIComponent(mode)}`);
      const data = res.data ?? [];
      setPosts(Array.isArray(data) ? data : []);
      setOpenComments({});
      setCommentsByPost({});
      setCommentErr({});
      setCommentLoading({});
      setCommentText({});
    } catch (e) {
      setErr(e?.response?.data?.error || e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts(tab);
  }, [tab, loadPosts]);

  const toggleLikeApi = useCallback((postId) => http.post(`/likes/${postId}`), []);
  const getCommentsApi = useCallback((postId) => http.get(`/comments/${postId}`), []);
  const createCommentApi = useCallback((postId, payload) => http.post(`/comments/${postId}`, payload), []);
  const updatePostApi = useCallback((postId, payload) => http.patch(`/posts/${postId}`, payload), []);
  const deletePostApi = useCallback((postId) => http.delete(`/posts/${postId}`), []);
  const updateCommentApi = useCallback((id, payload) => http.patch(`/comments/item/${id}`, payload), []);
  const deleteCommentApi = useCallback((id) => http.delete(`/comments/item/${id}`), []);

  const onToggleLike = useCallback(async (postId) => {
    try {
      const res = await toggleLikeApi(postId);
      const liked =
        typeof res.data?.likedByMe === "boolean"
          ? res.data.likedByMe
          : typeof res.data?.liked === "boolean"
          ? res.data.liked
          : res.data?.status === "liked"
          ? true
          : res.data?.status === "unliked"
          ? false
          : null;

      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const currentLiked = !!p.likedByMe;
          const nextLiked = liked === null ? !currentLiked : liked;

          const currentLikes = p._count?.likes ?? 0;
          const nextLikes = nextLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);

          return { ...p, likedByMe: nextLiked, _count: { ...(p._count || {}), likes: nextLikes } };
        })
      );
    } catch (e) {
      alert(e?.response?.data?.error || e?.response?.data?.message || e.message);
    }
  }, [toggleLikeApi]);

  const onToggleComments = useCallback(async (postId) => {
    const isOpen = !!openComments[postId];
    if (isOpen) {
      setOpenComments((m) => ({ ...m, [postId]: false }));
      return;
    }

    setOpenComments((m) => ({ ...m, [postId]: true }));
    if (commentsByPost[postId]) return;

    setCommentLoading((m) => ({ ...m, [postId]: true }));
    setCommentErr((m) => ({ ...m, [postId]: "" }));

    try {
      const res = await getCommentsApi(postId);
      const list = Array.isArray(res.data) ? res.data : [];
      setCommentsByPost((m) => ({ ...m, [postId]: list }));
    } catch (e) {
      setCommentErr((m) => ({ ...m, [postId]: e?.response?.data?.error || e?.response?.data?.message || e.message }));
    } finally {
      setCommentLoading((m) => ({ ...m, [postId]: false }));
    }
  }, [openComments, commentsByPost, getCommentsApi]);

  const onSendComment = useCallback(async (postId) => {
    const text = (commentText[postId] || "").trim();
    if (!text) return;

    setCommentLoading((m) => ({ ...m, [postId]: true }));
    setCommentErr((m) => ({ ...m, [postId]: "" }));

    try {
      const res = await createCommentApi(postId, { text });
      const c = res.data;

      setCommentsByPost((m) => ({ ...m, [postId]: [c, ...(m[postId] || [])] }));
      setCommentText((m) => ({ ...m, [postId]: "" }));

      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const cur = p._count?.comments ?? 0;
          return { ...p, _count: { ...(p._count || {}), comments: cur + 1 } };
        })
      );
    } catch (e) {
      setCommentErr((m) => ({ ...m, [postId]: e?.response?.data?.error || e?.response?.data?.message || e.message }));
    } finally {
      setCommentLoading((m) => ({ ...m, [postId]: false }));
    }
  }, [commentText, createCommentApi]);

  const onDeletePost = useCallback(async (postId) => {
    if (!window.confirm("Удалить пост?")) return;
    try {
      await deletePostApi(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setOpenComments((m) => {
        const next = { ...m };
        delete next[postId];
        return next;
      });
      setCommentsByPost((m) => {
        const next = { ...m };
        delete next[postId];
        return next;
      });
    } catch (e) {
      alert(e?.response?.data?.error || e?.response?.data?.message || e.message);
    }
  }, [deletePostApi]);

  const onSavePostEdit = useCallback(async (postId) => {
    const text = editingPostText.trim();
    if (!text) return;
    try {
      const res = await updatePostApi(postId, { code: text });
      const updated = res.data;
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, code: updated.code } : p)));
      setEditingPostId(null);
      setEditingPostText("");
    } catch (e) {
      alert(e?.response?.data?.error || e?.response?.data?.message || e.message);
    }
  }, [editingPostText, updatePostApi]);

  const onDeleteComment = useCallback(async (postId, commentId) => {
    if (!window.confirm("Удалить комментарий?")) return;
    try {
      await deleteCommentApi(commentId);
      setCommentsByPost((m) => ({ ...m, [postId]: (m[postId] || []).filter((c) => c.id !== commentId) }));
      setPosts((prev) => prev.map((p) => {
        if (p.id !== postId) return p;
        const cur = p._count?.comments ?? 0;
        return { ...p, _count: { ...(p._count || {}), comments: Math.max(0, cur - 1) } };
      }));
    } catch (e) {
      alert(e?.response?.data?.error || e?.response?.data?.message || e.message);
    }
  }, [deleteCommentApi]);

  const onSaveCommentEdit = useCallback(async (postId, commentId) => {
    const text = editingCommentText.trim();
    if (!text) return;
    try {
      const res = await updateCommentApi(commentId, { text });
      const updated = res.data;
      setCommentsByPost((m) => ({
        ...m,
        [postId]: (m[postId] || []).map((c) => (c.id === commentId ? { ...c, text: updated.text } : c)),
      }));
      setEditingCommentId(null);
      setEditingCommentText("");
    } catch (e) {
      alert(e?.response?.data?.error || e?.response?.data?.message || e.message);
    }
  }, [editingCommentText, updateCommentApi]);

  if (loading) return <div style={{ padding: 16, color: "rgba(255,255,255,0.8)" }}>Loading...</div>;
  if (err) return <div style={{ padding: 16, color: "crimson" }}>{err}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, padding: 18 }}>
      <Tabs tab={tab} setTab={setTab} />

      <div style={{ marginBottom: 6 }}>
      </div>

      <div className="feed-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 8 }}>
        <div className="feedWidth" style={{ width: "min(760px, 100%)" }}>
          {posts.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.7)" }}>No posts</div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {posts.map((p) => {
                const likesCount = p._count?.likes ?? 0;
                const commentsCount = p._count?.comments ?? 0;
                const isOpen = !!openComments[p.id];
                const commLoading = !!commentLoading[p.id];
                const commErr = commentErr[p.id] || "";
                const commList = commentsByPost[p.id] || [];

                const imgs = extractImages(p);

                const fullText = (p.code ?? "").toString();
                const isLong = fullText.length > 220;
                const isExpanded = !!expanded[p.id];
                const shownText = isExpanded || !isLong ? fullText : fullText.slice(0, 220).trimEnd() + "…";
                const when = timeAgo(p.createdAt);
                const isMyPost = (p.author?.id || p.authorId) === me?.id;

                return (
                  <div
                    key={p.id}
                    style={{
                      borderRadius: 16,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(0,0,0,0.25)",
                      padding: 14,
                    }}
                  >
                    <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <Avatar username={p.author?.username} avatarUrl={p.author?.avatarUrl} size={44} />

                      <div style={{ display: "grid", gap: 2 }}>
                        <Link
                          to={`/profile/${p.author?.id || p.authorId || ""}`}
                          style={{
                            fontWeight: 900,
                            color: "rgba(255,255,255,0.92)",
                            textDecoration: "none",
                            width: "fit-content",
                          }}
                        >
                          {p.author?.displayName || p.author?.username || "unknown"}
                        </Link>

                        {p.language && (
                          <div style={{ color: "rgba(255,255,255,0.72)", fontWeight: 700 }}>
                            Lang: {p.language}
                          </div>
                        )}
                      </div>
                      </div>

                      {isMyPost ? (
                        <div style={{ position: "relative" }}>
                          <button
                            onClick={() => setPostMenuOpen((m) => ({ ...m, [p.id]: !m[p.id] }))}
                            style={{ border: 0, background: "transparent", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: 20 }}
                            title="Меню"
                          >
                            ⋯
                          </button>
                          {postMenuOpen[p.id] ? (
                            <div style={{ position: "absolute", right: 0, top: 26, zIndex: 5, minWidth: 150, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(20,20,24,0.95)", display: "grid" }}>
                              <button onClick={() => { setEditingPostId(p.id); setEditingPostText(p.code || ""); setPostMenuOpen((m) => ({ ...m, [p.id]: false })); }} style={{ all: "unset", cursor: "pointer", padding: "10px 12px", color: "white", fontWeight: 700 }}>Редактировать</button>
                              <button onClick={() => { setPostMenuOpen((m) => ({ ...m, [p.id]: false })); onDeletePost(p.id); }} style={{ all: "unset", cursor: "pointer", padding: "10px 12px", color: "#ff8f8f", fontWeight: 700 }}>Удалить</button>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    {imgs.length > 0 ? (
                      <div style={{ marginTop: 12 }}>
                        <PhotoGrid images={imgs} />
                      </div>
                    ) : null}

                    {editingPostId === p.id ? (
                      <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                        <textarea value={editingPostText} onChange={(e) => setEditingPostText(e.target.value)} rows={5} style={{ width: "100%", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.25)", color: "white", padding: 10 }} />
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => onSavePostEdit(p.id)} style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.08)", color: "white", padding: "8px 12px", cursor: "pointer" }}>Сохранить</button>
                          <button onClick={() => { setEditingPostId(null); setEditingPostText(""); }} style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.8)", padding: "8px 12px", cursor: "pointer" }}>Отмена</button>
                        </div>
                      </div>
                    ) : fullText ? (
                      <div style={{ marginTop: 10 }}>
                        <pre
                          style={{
                            whiteSpace: "pre-wrap",
                            margin: 0,
                            color: "rgba(255,255,255,0.86)",
                            lineHeight: 1.35,
                            fontFamily: "inherit",
                          }}
                        >
                          {shownText}
                        </pre>

                        {isLong ? (
                          <button
                            onClick={() => setExpanded((m) => ({ ...m, [p.id]: !m[p.id] }))}
                            style={{
                              marginTop: 8,
                              padding: 0,
                              border: 0,
                              background: "transparent",
                              color: "rgba(170, 120, 255, 0.95)",
                              fontWeight: 900,
                              cursor: "pointer",
                            }}
                          >
                            {isExpanded ? "Свернуть" : "Показать ещё"}
                          </button>
                        ) : null}
                      </div>
                    ) : null}

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                      <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                        <StatButton active={!!p.likedByMe} onClick={() => onToggleLike(p.id)} title="Like">
                          <HeartIcon filled={!!p.likedByMe} />
                          <span className="statCount">{likesCount}</span>
                        </StatButton>

                        <StatButton active={isOpen} onClick={() => onToggleComments(p.id)} title="Comments">
                          <CommentIcon />
                          <span className="statCount">{commentsCount}</span>
                        </StatButton>
                      </div>

                      <div style={{ color: "rgba(255,255,255,0.55)", fontWeight: 700, fontSize: 13 }}>{when}</div>
                    </div>

                    {isOpen && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        {commLoading && <div style={{ color: "rgba(255,255,255,0.7)" }}>Loading comments...</div>}
                        {commErr && <div style={{ color: "crimson" }}>{commErr}</div>}

                        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                          <input
                            value={commentText[p.id] || ""}
                            onChange={(e) => setCommentText((m) => ({ ...m, [p.id]: e.target.value }))}
                            placeholder="Write a comment..."
                            style={{
                              flex: 1,
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid rgba(255,255,255,0.10)",
                              background: "rgba(0,0,0,0.25)",
                              color: "rgba(255,255,255,0.9)",
                              outline: "none",
                            }}
                          />
                          <button
                            onClick={() => onSendComment(p.id)}
                            disabled={commLoading}
                            style={{
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid rgba(255,255,255,0.10)",
                              background: "rgba(255,255,255,0.08)",
                              color: "rgba(255,255,255,0.9)",
                              cursor: "pointer",
                            }}
                          >
                            Send
                          </button>
                        </div>

                        {commList.length === 0 && !commLoading ? (
                          <div style={{ color: "rgba(255,255,255,0.7)" }}>No comments</div>
                        ) : (
                          <div style={{ display: "grid", gap: 10 }}>
                            {commList.map((c) => {
                              const isMyComment = c.author?.id === me?.id;
                              return (
                              <div key={c.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                <Avatar username={c.author?.username} avatarUrl={c.author?.avatarUrl} size={34} />
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                                  <div style={{ fontWeight: 800, color: "rgba(255,255,255,0.92)" }}>
                                    {c.author?.username ?? "unknown"}
                                  </div>
                                    {isMyComment ? (
                                      <div style={{ position: "relative" }}>
                                        <button onClick={() => setCommentMenuOpen((m) => ({ ...m, [c.id]: !m[c.id] }))} style={{ border: 0, background: "transparent", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: 18 }}>⋯</button>
                                        {commentMenuOpen[c.id] ? (
                                          <div style={{ position: "absolute", right: 0, top: 22, zIndex: 5, minWidth: 140, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(20,20,24,0.95)", display: "grid" }}>
                                            <button onClick={() => { setEditingCommentId(c.id); setEditingCommentText(c.text || ""); setCommentMenuOpen((m) => ({ ...m, [c.id]: false })); }} style={{ all: "unset", cursor: "pointer", padding: "10px 12px", color: "white", fontWeight: 700 }}>Редактировать</button>
                                            <button onClick={() => { setCommentMenuOpen((m) => ({ ...m, [c.id]: false })); onDeleteComment(p.id, c.id); }} style={{ all: "unset", cursor: "pointer", padding: "10px 12px", color: "#ff8f8f", fontWeight: 700 }}>Удалить</button>
                                          </div>
                                        ) : null}
                                      </div>
                                    ) : null}
                                  </div>
                                  {editingCommentId === c.id ? (
                                    <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
                                      <textarea value={editingCommentText} onChange={(e) => setEditingCommentText(e.target.value)} rows={3} style={{ width: "100%", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.25)", color: "white", padding: 8 }} />
                                      <div style={{ display: "flex", gap: 8 }}>
                                        <button onClick={() => onSaveCommentEdit(p.id, c.id)} style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.08)", color: "white", padding: "6px 10px", cursor: "pointer" }}>Сохранить</button>
                                        <button onClick={() => { setEditingCommentId(null); setEditingCommentText(""); }} style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.8)", padding: "6px 10px", cursor: "pointer" }}>Отмена</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ whiteSpace: "pre-wrap", color: "rgba(255,255,255,0.86)" }}>{c.text}</div>
                                  )}
                                </div>
                              </div>
                            )})}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .feed-scroll::-webkit-scrollbar { width: 10px; }
        .feed-scroll::-webkit-scrollbar-track { background: transparent; }
        .feed-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 999px; }
        .feed-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }

        .statBtn{
          all: unset;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(255,255,255,0.55);
          font-weight: 700;
          user-select: none;
          line-height: 1;
          padding: 4px 0;
          transition: color 120ms ease, transform 120ms ease, opacity 120ms ease;
        }
        .statBtn:hover{ color: rgba(255,255,255,0.85); transform: translateY(-1px); }
        .statBtn:active{ transform: translateY(0px); opacity: 0.9; }
        .statBtn.active{ color: rgba(170, 120, 255, 0.95); }
        .statCount{ font-size: 14px; }

        .pg{
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          display: grid;
          gap: 2px;
        }
        .pgCell{ position: relative; overflow: hidden; background: rgba(0,0,0,0.25); }
        .pgMore{
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.45);
          display: grid; place-items: center;
          color: white; font-weight: 900; font-size: 22px;
        }
        .pg-n1{ grid-template-columns: 1fr; grid-template-rows: 1fr; }
        .pg-n2{ grid-template-columns: 1fr 1fr; grid-template-rows: 1fr; }
        .pg-n3{ grid-template-columns: 1.6fr 1fr; grid-template-rows: 1fr 1fr; }
        .pgCell-3-0{ grid-column: 1; grid-row: 1 / span 2; }
        .pgCell-3-1{ grid-column: 2; grid-row: 1; }
        .pgCell-3-2{ grid-column: 2; grid-row: 2; }
        .pg-n4{ grid-template-columns: 1.6fr 1fr; grid-template-rows: 1fr 1fr 1fr; }
        .pgCell-4-0, .pgCell-5-0, .pgCell-6-0, .pgCell-7-0, .pgCell-8-0 { grid-column: 1; grid-row: 1 / span 3; }
        .pgCell-4-1, .pgCell-5-1, .pgCell-6-1, .pgCell-7-1, .pgCell-8-1 { grid-column: 2; grid-row: 1; }
        .pgCell-4-2, .pgCell-5-2, .pgCell-6-2, .pgCell-7-2, .pgCell-8-2 { grid-column: 2; grid-row: 2; }
        .pgCell-4-3, .pgCell-5-3, .pgCell-6-3, .pgCell-7-3, .pgCell-8-3 { grid-column: 2; grid-row: 3; }
        .pgCell-5-4, .pgCell-6-4, .pgCell-7-4, .pgCell-8-4,
        .pgCell-6-5, .pgCell-7-5, .pgCell-8-5,
        .pgCell-7-6, .pgCell-8-6,
        .pgCell-8-7 { display:none; }

        /* ====== мобилка ====== */
        @media (max-width: 860px){
          .feedTabs { justify-content: center; gap: 8px; }
          .feedTabs button { padding: 8px 12px; font-size: 13px; }
          .feedWidth { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
