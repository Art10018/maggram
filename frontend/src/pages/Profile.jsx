// frontend/src/pages/Profile.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../store/auth.jsx";

const API_ORIGIN = "";

// ---------- helpers ----------
function hashColor(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 65% 55%)`;
}

function buildSrc(u) {
  if (!u) return "";
  if (typeof u !== "string") return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) return `${API_ORIGIN}${u}`;
  return `${API_ORIGIN}/${u}`;
}

function formatRuDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

// относительное время: "6 д назад", "2 ч назад"
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";

  const diffMs = d.getTime() - Date.now(); // отрицательное (в прошлом)
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

// нормализуем фотки из разных форматов
function extractImages(post) {
  const raw = post?.images || post?.media || post?.attachments || post?.photos || [];
  if (typeof raw === "string") return [buildSrc(raw)].filter(Boolean);

  if (Array.isArray(raw) && raw.length && typeof raw[0] === "string") {
    return raw.map(buildSrc).filter(Boolean);
  }

  if (Array.isArray(raw) && raw.length && typeof raw[0] === "object") {
    return raw
      .map((x) => x?.url || x?.path || x?.src)
      .map(buildSrc)
      .filter(Boolean);
  }

  return [];
}

function sameId(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) return false;
  return String(a) === String(b);
}

// ---------- UI ----------
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

// ---------- icons ----------
function Icon({ children, size = 16 }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        display: "inline-grid",
        placeItems: "center",
        flex: "0 0 auto",
      }}
    >
      {children}
    </span>
  );
}

function PostsIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 6h13M8 12h13M8 18h13M3.5 6h.5M3.5 12h.5M3.5 18h.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FollowersIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 19c0-2.2-2.7-4-6-4s-6 1.8-6 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2" />
      <path d="M19 8v6M16 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function FollowingIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 19c0-2.2-3.1-4-7-4s-7 1.8-7 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M13 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ChatIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6.5C4 5.12 5.12 4 6.5 4h11C18.88 4 20 5.12 20 6.5v7c0 1.38-1.12 2.5-2.5 2.5H10l-4.2 3.15c-.53.4-1.3.02-1.3-.64V6.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
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

// квадратная группировка фоток как в Feed (ровный квадрат)
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

// ---------- API wrappers ----------
const getUserByIdApi = (id) => http.get(`/users/${id}`);
const getUserPostsByIdApi = (id) => http.get(`/users/${id}/posts`);
const getFollowersApi = (id) => http.get(`/users/${id}/followers`);
const getFollowingApi = (id) => http.get(`/users/${id}/following`);

const getFollowStatusApi = (targetId) => http.get(`/follows/status/${targetId}`);
const toggleFollowApi = (targetId) => http.post(`/follows/${targetId}`);

const toggleLikeApi = (postId) => http.post(`/likes/${postId}`);

const getCommentsApi = (postId) => http.get(`/comments/${postId}`);
const createCommentApi = (postId, payload) => http.post(`/comments/${postId}`, payload);
const updatePostApi = (postId, payload) => http.patch(`/posts/${postId}`, payload);
const deletePostApi = (postId) => http.delete(`/posts/${postId}`);

// ---------- component ----------
export default function Profile() {
  const { user: me, isAuthed, logout } = useAuth();
  const params = useParams();
  const navigate = useNavigate();

  const targetId = params.id || me?.id || null;
  const isMe = !!me?.id && targetId === me.id;

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);

  const [followStatus, setFollowStatus] = useState("none"); // "none" | "following" | "requested" | "self"
  const [followLoading, setFollowLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // comments state per post
  const [openComments, setOpenComments] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentText, setCommentText] = useState({});
  const [commentLoading, setCommentLoading] = useState({});
  const [commentErr, setCommentErr] = useState({});

  const [expanded, setExpanded] = useState({}); // {postId: true}

  // меню в личном профиле
  const [menuOpen, setMenuOpen] = useState(false);

  const [postMenuOpen, setPostMenuOpen] = useState({});
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingPostText, setEditingPostText] = useState("");

  const [followListOpen, setFollowListOpen] = useState(false);
  const [followListTitle, setFollowListTitle] = useState("");
  const [followListLoading, setFollowListLoading] = useState(false);
  const [followListErr, setFollowListErr] = useState("");
  const [followListUsers, setFollowListUsers] = useState([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr("");
      try {
        if (!targetId) {
          setErr("No user id (not logged in?)");
          return;
        }

        const u = await getUserByIdApi(targetId);
        if (cancelled) return;
        setProfile(u.data);

        const p = await getUserPostsByIdApi(targetId);
        if (cancelled) return;
        setPosts(Array.isArray(p.data) ? p.data : []);

        if (isAuthed && !isMe) {
          try {
            const st = await getFollowStatusApi(targetId);
            if (!cancelled) setFollowStatus(st.data?.status || "none");
          } catch {
            if (!cancelled) setFollowStatus("none");
          }
        } else {
          setFollowStatus(isMe ? "self" : "none");
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e?.response?.data?.error || e?.response?.data?.message || e.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [targetId, isAuthed, isMe]);
  function SettingsIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="2" />
      <path
        d="M19.4 15a8 8 0 0 0 .1-2l2-1.5-2-3.5-2.4.6a8 8 0 0 0-1.7-1L15 3h-6l-.4 2.6a8 8 0 0 0-1.7 1L4.5 6 2.5 9.5l2 1.5a8 8 0 0 0 0 2l-2 1.5 2 3.5 2.4-.6a8 8 0 0 0 1.7 1L9 21h6l.4-2.6a8 8 0 0 0 1.7-1l2.4.6 2-3.5-2-1.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LogoutIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10 7V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M3 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 8l-4 4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

  // закрывать меню кликом вне
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => {
      const el = e.target;
      if (el?.closest?.("[data-profile-menu]")) return;
      setMenuOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const onToggleFollow = async () => {
    if (!targetId || isMe) return;
    setFollowLoading(true);
    try {
      const res = await toggleFollowApi(targetId);

      const next =
        res.data?.status ||
        (typeof res.data?.following === "boolean" ? (res.data.following ? "following" : "none") : null) ||
        (followStatus === "following" ? "none" : "following");

      setFollowStatus(next);

      // обновим счетчик followers в профиле
      setProfile((prev) => {
        if (!prev?._count) return prev;
        const followers = prev._count.followers ?? 0;

        // requested не меняет счетчик
        if (next === "requested") return prev;

        const delta = next === "following" ? 1 : -1;
        return {
          ...prev,
          _count: { ...prev._count, followers: Math.max(0, followers + delta) },
        };
      });
    } catch (e) {
      alert(e?.response?.data?.error || e?.response?.data?.message || e.message);
    } finally {
      setFollowLoading(false);
    }
  };

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
  }, []);

  const onToggleComments = useCallback(
    async (postId) => {
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
    },
    [openComments, commentsByPost]
  );

  const onSendComment = useCallback(
    async (postId) => {
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
    },
    [commentText]
  );

  const onSavePostEdit = useCallback(async (postId) => {
    const code = editingPostText.trim();
    if (!code) return;

    try {
      const res = await updatePostApi(postId, { code });
      const updated = res.data;
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, code: updated.code } : p)));
      setEditingPostId(null);
      setEditingPostText("");
    } catch (e) {
      alert(e?.response?.data?.error || e?.response?.data?.message || e.message);
    }
  }, [editingPostText]);

  const onDeletePost = useCallback(async (postId) => {
    if (!window.confirm("Удалить пост?")) return;

    try {
      await deletePostApi(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setProfile((prev) => {
        if (!prev?._count) return prev;
        return {
          ...prev,
          _count: { ...prev._count, posts: Math.max(0, (prev._count.posts ?? 0) - 1) },
        };
      });
    } catch (e) {
      alert(e?.response?.data?.error || e?.response?.data?.message || e.message);
    }
  }, []);

  const openFollowList = useCallback(async (mode) => {
    if (!targetId) return;
    setFollowListTitle(mode === "followers" ? "Подписчики" : "Подписки");
    setFollowListOpen(true);
    setFollowListLoading(true);
    setFollowListErr("");
    setFollowListUsers([]);

    try {
      const res = mode === "followers" ? await getFollowersApi(targetId) : await getFollowingApi(targetId);
      setFollowListUsers(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setFollowListErr(e?.response?.data?.error || e?.response?.data?.message || e.message);
    } finally {
      setFollowListLoading(false);
    }
  }, [targetId]);

  const onLogout = () => {    setMenuOpen(false);
    logout();
    navigate("/login");
  };

  const onChat = useCallback(async () => {
  if (!profile?.id) return;
  try {
    const res = await http.post(`/chats/direct/${profile.id}`);
    const chatId = res.data?.id;
    if (chatId) navigate(`/chats/${chatId}`);
  } catch (e) {
    alert(e?.response?.data?.error || e?.response?.data?.message || e.message);
  }
}, [profile?.id, navigate]);


  if (loading) return <div style={{ padding: 18, color: "rgba(255,255,255,0.8)" }}>Loading...</div>;
  if (err) return <div style={{ padding: 18, color: "crimson" }}>{err}</div>;
  if (!profile) return <div style={{ padding: 18, color: "rgba(255,255,255,0.8)" }}>User not found</div>;

  const nameTop = profile.displayName || profile.username || "User";
  const created = formatRuDate(profile.createdAt);
  const counts = profile._count || {};

  return (
    <div style={{ padding: 18 }}>
      {/* шапка профиля */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
        {/* LEFT: avatar + info */}
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <Avatar username={profile.username} avatarUrl={profile.avatarUrl} size={72} />

          <div style={{ display: "grid", gap: 6, paddingTop: 2 }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: "rgba(255,255,255,0.95)", lineHeight: 1.1 }}>
              {nameTop}
            </div>

            <div style={{ color: "rgba(255,255,255,0.68)", fontWeight: 700 }}>
              @{profile.username}
              {created ? <span style={{ marginLeft: 10, fontWeight: 600 }}>• {created}</span> : null}
            </div>

            {profile.bio ? (
              <div style={{ color: "rgba(255,255,255,0.85)", whiteSpace: "pre-wrap", maxWidth: 720 }}>
                {profile.bio}
              </div>
            ) : null}

            <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 6, color: "rgba(255,255,255,0.70)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 800 }}>
                <Icon><PostsIcon /></Icon> {counts.posts ?? 0}
              </span>
              <button
                onClick={() => openFollowList("followers")}
                style={{
                  all: "unset",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
                title="Показать подписчиков"
              >
                <Icon><FollowersIcon /></Icon> {counts.followers ?? 0}
              </button>
              <button
                onClick={() => openFollowList("following")}
                style={{
                  all: "unset",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
                title="Показать подписки"
              >
                <Icon><FollowingIcon /></Icon> {counts.following ?? 0}
              </button>
            </div>

            {/* ❗️ВАЖНО: тут БОЛЬШЕ НЕТ кнопок Follow/Chat — они справа */}
          </div>
        </div>

        {/* RIGHT: actions (для чужого профиля) ИЛИ menu (для моего) */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          {!isMe && isAuthed ? (
            <>
              <button
                onClick={onChat}
                title="Chat (soon)"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.86)",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <ChatIcon />
              </button>

              <button
                onClick={onToggleFollow}
                disabled={followLoading}
                style={{
                  height: 44,
                  padding: "0 16px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.90)",
                  fontWeight: 800,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {followLoading
                  ? "..."
                  : followStatus === "following"
                  ? "Unfollow"
                  : followStatus === "requested"
                  ? "Requested"
                  : "Follow"}
              </button>
            </>
          ) : null}

          {isMe ? (
            <div data-profile-menu style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.9)",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                }}
                title="Menu"
              >
                <span style={{ fontSize: 20, lineHeight: 1 }}>☰</span>
              </button>
              
              {menuOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 50,
                    width: 220,
                    background: "rgba(20,20,26,0.95)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 14,
                    boxShadow: "0 14px 40px rgba(0,0,0,0.55)",
                    overflow: "hidden",
                    zIndex: 20,
                    backdropFilter: "blur(10px)",
                    padding: 6,
                  }}
                >
                  <Link
                    to="/settings"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 10px",
                      textDecoration: "none",
                      color: "rgba(255,255,255,0.92)",
                      borderRadius: 12,
                      fontWeight: 800,
                    }}
                    className="mmMenuItem"
                  >
                    <span
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: "rgba(255,255,255,0.06)",
                        display: "grid",
                        placeItems: "center",
                        color: "rgba(255,255,255,0.92)",
                        flex: "0 0 auto",
                      }}
                    >
                      <SettingsIcon size={18} />
                    </span>
                    <span style={{ flex: 1 }}>Settings</span>
                  </Link>

                  <div
                    style={{
                      height: 1,
                      background: "rgba(255,255,255,0.08)",
                      margin: "6px 8px",
                    }}
                  />

                  <button
                    onClick={onLogout}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 10px",
                      border: 0,
                      background: "transparent",
                      cursor: "pointer",
                      fontWeight: 800,
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      color: "rgba(255,120,140,0.95)",
                    }}
                    className="mmMenuItem"
                  >
                    <span
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 12,
                        border: "1px solid rgba(255,120,140,0.25)",
                        background: "rgba(255,120,140,0.10)",
                        display: "grid",
                        placeItems: "center",
                        color: "rgba(255,120,140,0.95)",
                        flex: "0 0 auto",
                      }}
                    >
                      <LogoutIcon size={18} />
                    </span>
                    <span style={{ flex: 1 }}>Logout</span>
                  </button>

                  <style>{`
                    .mmMenuItem:hover { background: rgba(255,255,255,0.06); }
                    .mmMenuItem:active { transform: translateY(1px); }
                  `}</style>
                </div>
              )}

            </div>
          ) : null}
        </div>
      </div>

      {/* posts (как в Feed) */}
      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: "rgba(255,255,255,0.92)", marginBottom: 12 }}>
          Posts
        </div>

        {posts.length === 0 ? (
          <div style={{ color: "rgba(255,255,255,0.7)" }}>No posts</div>
        ) : (
          <div style={{ width: "min(760px, 100%)" }}>
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
                const isMyPost = sameId(p.author?.id ?? p.authorId, me?.id);

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
                    {/* header */}
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

                          {p.language ? (
                            <div style={{ color: "rgba(255,255,255,0.72)", fontWeight: 700 }}>
                              Lang: {p.language}
                            </div>
                          ) : null}
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

                    {/* photos */}
                    {imgs.length > 0 ? (
                      <div style={{ marginTop: 12 }}>
                        <PhotoGrid images={imgs} />
                      </div>
                    ) : null}

                    {/* text + показать ещё */}
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

                    {/* bottom bar */}
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

                      <div style={{ color: "rgba(255,255,255,0.55)", fontWeight: 700, fontSize: 13 }}>
                        {when}
                      </div>
                    </div>

                    {/* comments */}
                    {isOpen && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        {commLoading && <div style={{ color: "rgba(255,255,255,0.7)" }}>Loading comments...</div>}
                        {commErr && <div style={{ color: "crimson" }}>{commErr}</div>}

                        {isAuthed ? (
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
                        ) : null}

                        {commList.length === 0 && !commLoading ? (
                          <div style={{ color: "rgba(255,255,255,0.7)" }}>No comments</div>
                        ) : (
                          <div style={{ display: "grid", gap: 10 }}>
                            {commList.map((c) => (
                              <div key={c.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                <Avatar username={c.author?.username} avatarUrl={c.author?.avatarUrl} size={34} />
                                <div>
                                  <div style={{ fontWeight: 800, color: "rgba(255,255,255,0.92)" }}>
                                    {c.author?.username ?? "unknown"}
                                  </div>
                                  <div style={{ whiteSpace: "pre-wrap", color: "rgba(255,255,255,0.86)" }}>
                                    {c.text}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {followListOpen ? (
        <div
          onClick={() => setFollowListOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 60, display: "grid", placeItems: "center", padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "min(560px, 96vw)", maxHeight: "80vh", overflow: "hidden", borderRadius: 16, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(16,16,20,0.98)", display: "grid", gridTemplateRows: "auto 1fr" }}
          >
            <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.10)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 900, color: "rgba(255,255,255,0.95)" }}>{followListTitle}</div>
              <button onClick={() => setFollowListOpen(false)} style={{ border: 0, background: "transparent", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: 20 }}>×</button>
            </div>

            <div style={{ padding: 12, overflowY: "auto", display: "grid", gap: 8 }}>
              {followListLoading ? <div style={{ color: "rgba(255,255,255,0.7)" }}>Loading...</div> : null}
              {followListErr ? <div style={{ color: "crimson" }}>{followListErr}</div> : null}
              {!followListLoading && !followListErr && followListUsers.length === 0 ? (
                <div style={{ color: "rgba(255,255,255,0.7)" }}>Пусто</div>
              ) : null}

              {!followListLoading && !followListErr ? followListUsers.map((u) => (
                <Link
                  key={u.id}
                  to={`/profile/${u.id}`}
                  onClick={() => setFollowListOpen(false)}
                  style={{ textDecoration: "none", color: "inherit", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", padding: 10, display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.03)" }}
                >
                  <Avatar username={u.username} avatarUrl={u.avatarUrl} size={36} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: "rgba(255,255,255,0.93)", fontWeight: 800 }}>{u.displayName || u.username || "unknown"}</div>
                    <div style={{ color: "rgba(255,255,255,0.62)", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>@{u.username || "unknown"}</div>
                  </div>
                </Link>
              )) : null}
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
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

        /* ====== PHOTO GRID (всегда квадрат) ====== */
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
        .pgCell{
          position: relative;
          overflow: hidden;
          background: rgba(0,0,0,0.25);
        }
        .pgMore{
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.45);
          display: grid;
          place-items: center;
          color: white;
          font-weight: 900;
          font-size: 22px;
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
      `}</style>
    </div>
  );
}
