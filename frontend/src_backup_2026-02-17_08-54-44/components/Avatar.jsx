import React from "react";

function hashToHue(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
}

export default function Avatar({ user, size = 40, src, alt }) {
  const username = user?.username || "";
  const letter = (username?.[0] || "?").toUpperCase();

  const hue = hashToHue(username);
  const bg = `hsl(${hue} 70% 45%)`;

  const resolveUrl = (u) => {
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) return u;
  return `/${u}`;
  };

  const finalSrc = resolveUrl(user?.avatarUrl);


  const common = {
    width: size,
    height: size,
    borderRadius: "50%",
    flex: "0 0 auto",
    display: "grid",
    placeItems: "center",
    fontWeight: 700,
    color: "white",
    userSelect: "none",
  };

  if (finalSrc) {
    return (
      <img
        src={finalSrc}
        alt={alt || username || "avatar"}
        style={{
          ...common,
          objectFit: "cover",
          background: "#222",
          border: "1px solid rgba(255,255,255,.12)",
        }}
        onError={(e) => {
          // если картинка не грузится — показываем букву
          e.currentTarget.removeAttribute("src");
        }}
      />
    );
  }

  return (
    <div
      title={username}
      style={{
        ...common,
        background: bg,
        border: "1px solid rgba(255,255,255,.12)",
        boxShadow: "0 6px 24px rgba(0,0,0,.35)",
      }}
    >
      {letter}
    </div>
  );
}
