// frontend/src/pages/UserProfile.jsx

import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

import http from "../api/http";
import { getFollowStatusApi, toggleFollowApi } from "../api/follows";
import { useAuth } from "../store/auth.jsx";

const API_ORIGIN = "";

function hashColor(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 65% 55%)`;
}

function formatJoinDate(iso) {
  try {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

function Avatar({ username, avatarUrl, size = 44 }) {
  const letter = (username?.[0] || "?").toUpperCase();
  const bg = useMemo(() => hashColor(username || ""), [username]);
  const src = avatarUrl ? `${API_ORIGIN}${avatarUrl}` : "";

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
          background: "rgba(255,255,255,0.06)",
          display: "block",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.12)",
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
        userSelect: "none",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.12)",
      }}
    >
      {letter}
    </div>
  );
}

/* Icons */
function HeartIcon({ filled, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ display: "block" }}>
      <path
        d="M12 21s-7-4.35-9.33-8.2C.6 9.3 2.6 6.2 6.2 6.2c2.1 0 3.55 1 4.3 2.3.75-1.3 2.2-2.3 4.3-2.3 3.6 0 5.6 3.1 3.53 6.6C19 16.65 12 21 12 21Z"
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ display: "block" }}>
      <path
        d="M20 12a7.5 7.5 0 0 1-7.5 7.5H9l-4.2 3.15c-.53.4-1.3.02-1.3-.64V12A7.5 7.5 0 0 1 11 4.5h1A7.5 7.5 0 0 1 20 12Z"
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

export default function UserProfile() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  const [followStatus, setFollowStatus] = useState("none");
  const [followLoading, setFollowLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // comments state per post
  const [openComments, setOpenComments] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentText, setCommentText] = useState({});
  const [commentLoading, setCommentLoading] = useState({});
  const [commentErr, setCommentErr] = useState({});

  const isMe = useMemo(() => me?.id && id === me.id, [me?.id, id]);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const uRes = await http.get(`/users/${id}`);
      setUser(uRes.data);

      const pRes = await http.get(`/users/${id}/posts`);
      setPosts(Array.isArray(pRes.data) ? pRes.data : []);

      if (!isMe) {
        try {
          const sRes = await getFollowStatusApi(id);
          setFollowStatus(sRes.data?.status ?? "none");
        } catch {
          setFollowStatus("none");
        }
      }
    } catch (e) {
      setErr(e?.response?.data?.error || e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onToggleFollow = async () => {
    if (isMe) return;
    setFollowLoading(true);
    try {
      const res = await toggleFollowApi(id);
      const next =
        res.data?.status ||
        (typeof res.data?.following === "boolean" ? (res.data.following ? "following" : "none") : null) ||
        (followStatus === "following" ? "none" : "following");
      setFollowStatus(next);
      await load();
    } catch (e) {
      alert(e?.response?.data?.error || e?.response?.data?.message || e.message);
    } finally {
      setFollowLoading(false);
    }
  };

  const toggleLikeApi = (postId) => http.post(`/likes/${postId}`);
  const getCommentsApi = (postId) => http.get(`/comments/${postId}`);
  const createCommentApi = (postId, payload) => http.post(`/comments/${postId}`, payload);

  const onToggleLike = async (postId) => {
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

          return {
            ...p,
            likedByMe: nextLiked,
            _count: { ...(p._count || {}), likes: nextLikes },
          };
        })
      );
    } catch (e) {
      alert(e?.response?.data?.error || e?.response?.data?.message || e.message);
    }
  };

  const onToggleComments = async (postId) => {
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
      setCommentErr((m) => ({
        ...m,
        [postId]: e?.response?.data?.error || e?.response?.data?.message || e.message,
      }));
    } finally {
      setCommentLoading((m) => ({ ...m, [postId]: false }));
    }
  };

  const onSendComment = async (postId) => {
    const text = (commentText[postId] || "").trim();
    if (!text) return;

    setCommentLoading((m) => ({ ...m, [postId]: true }));
    setCommentErr((m) => ({ ...m, [postId]: "" }));

    try {
      const res = await createCommentApi(postId, { text });
      const c = res.data;

      setCommentsByPost((m) => ({
        ...m,
        [postId]: [c, ...(m[postId] || [])],
      }));
      setCommentText((m) => ({ ...m, [postId]: "" }));

      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const cur = p._count?.comments ?? 0;
          return { ...p, _count: { ...(p._count || {}), comments: cur + 1 } };
        })
      );
    } catch (e) {
      setCommentErr((m) => ({
        ...m,
        [postId]: e?.response?.data?.error || e?.response?.data?.message || e.message,
      }));
    } finally {
      setCommentLoading((m) => ({ ...m, [postId]: false }));
    }
  };

  if (loading) return <div style={{ padding: 16, color: "rgba(255,255,255,0.8)" }}>Loading...</div>;
  if (err) return <div style={{ padding: 16, color: "crimson" }}>{err}</div>;
  if (!user) return <div style={{ padding: 16, color: "rgba(255,255,255,0.8)" }}>User not found</div>;

  const counts = user?._count || {};
  const joinDate = formatJoinDate(user.createdAt);

  return (
    <div style={{ padding: 18, color: "rgba(255,255,255,0.92)" }}>
      {/* Profile card */}
      <div
        style={{
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(0,0,0,0.22)",
          padding: 16,
        }}
      >
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <Avatar username={user.username} avatarUrl={user.avatarUrl} size={76} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.15 }}>
              {user.displayName || user.username}
            </div>

            <div style={{ marginTop: 4, color: "rgba(255,255,255,0.62)", fontWeight: 700 }}>
              @{user.username}
              {joinDate ? <span> • {joinDate}</span> : null}
            </div>

            {user.bio ? (
              <div style={{ marginTop: 10, color: "rgba(255,255,255,0.78)", whiteSpace: "pre-wrap" }}>{user.bio}</div>
            ) : null}

            <div style={{ marginTop: 12, display: "flex", gap: 18, fontWeight: 900, color: "rgba(255,255,255,0.85)" }}>
              <span>Posts {counts.posts ?? 0}</span>
              <span>Followers {counts.followers ?? 0}</span>
              <span>Following {counts.following ?? 0}</span>
            </div>

            {!isMe ? (
              <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                <button
                  title="Chat (soon)"
                  onClick={() => alert("Chats скоро 🙂")}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.9)",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M4 5.5C4 4.12 5.12 3 6.5 3h11C18.88 3 20 4.12 20 5.5v7C20 13.88 18.88 15 17.5 15H10l-4.2 3.15c-.53.4-1.3.02-1.3-.64V5.5Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <button
                  onClick={onToggleFollow}
                  disabled={followLoading}
                  style={{
                    height: 44,
                    padding: "0 16px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: followStatus === "following" ? "rgba(255,255,255,0.08)" : "rgba(170,120,255,0.20)",
                    color: "rgba(255,255,255,0.92)",
                    cursor: "pointer",
                    fontWeight: 900,
                  }}
                >
                  {followLoading ? "..." : followStatus === "following" ? "Unfollow" : "Follow"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate("/profile")}
                style={{
                  marginTop: 14,
                  height: 44,
                  padding: "0 16px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.92)",
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                My profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Posts */}
      <div style={{ marginTop: 18, fontSize: 18, fontWeight: 900 }}>Posts</div>

      <div style={{ marginTop: 12, display: "grid", gap: 14 }}>
        {posts.length === 0 ? (
          <div style={{ color: "rgba(255,255,255,0.7)" }}>No posts</div>
        ) : (
          posts.map((p) => {
            const likesCount = p._count?.likes ?? 0;
            const commentsCount = p._count?.comments ?? 0;
            const isOpen = !!openComments[p.id];
            const commLoading = !!commentLoading[p.id];
            const commErr = commentErr[p.id] || "";
            const commList = commentsByPost[p.id] || [];

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
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <Avatar username={p.author?.username} avatarUrl={p.author?.avatarUrl} size={44} />
                  <div style={{ display: "grid", gap: 2 }}>
                    <Link
                      to={`/profile/${p.author?.id || p.authorId || ""}`}
                      style={{
                        fontWeight: 900,
                        color: "rgb(170, 120, 255)",
                        textDecoration: "none",
                        width: "fit-content",
                      }}
                    >
                      {p.author?.username ?? "unknown"}
                    </Link>
                    {p.language ? (
                      <div style={{ color: "rgba(255,255,255,0.8)" }}>
                        <b>Lang:</b> {p.language}
                      </div>
                    ) : null}
                  </div>
                </div>

                <pre style={{ whiteSpace: "pre-wrap", marginTop: 10, color: "rgba(255,255,255,0.86)" }}>{p.code ?? ""}</pre>

                <div style={{ display: "flex", gap: 18, alignItems: "center", marginTop: 10 }}>
                  <StatButton active={!!p.likedByMe} onClick={() => onToggleLike(p.id)} title="Like">
                    <HeartIcon filled={!!p.likedByMe} />
                    <span className="statCount">{likesCount}</span>
                  </StatButton>

                  <StatButton active={isOpen} onClick={() => onToggleComments(p.id)} title="Comments">
                    <CommentIcon />
                    <span className="statCount">{commentsCount}</span>
                  </StatButton>
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
                          fontWeight: 800,
                        }}
                      >
                        Send
                      </button>
                    </div>

                    {commList.length === 0 && !commLoading ? (
                      <div style={{ color: "rgba(255,255,255,0.7)" }}>No comments</div>
                    ) : (
                      <div style={{ display: "grid", gap: 10 }}>
                        {commList.map((c) => (
                          <div key={c.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                            <Avatar username={c.author?.username} avatarUrl={c.author?.avatarUrl} size={34} />
                            <div>
                              <div style={{ fontWeight: 900, color: "rgba(255,255,255,0.92)" }}>{c.author?.username ?? "unknown"}</div>
                              <div style={{ whiteSpace: "pre-wrap", color: "rgba(255,255,255,0.86)" }}>{c.text}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <style>{`
                  .statBtn{
                    all: unset;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    color: rgba(255,255,255,0.55);
                    font-weight: 800;
                    user-select: none;
                    line-height: 1;
                    padding: 4px 0;
                    transition: color 120ms ease, transform 120ms ease, opacity 120ms ease;
                  }
                  .statBtn:hover{ color: rgba(255,255,255,0.85); transform: translateY(-1px); }
                  .statBtn:active{ transform: translateY(0px); opacity: 0.9; }
                  .statBtn.active{ color: rgba(170, 120, 255, 0.95); }
                  .statCount{ font-size: 14px; }
                `}</style>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
