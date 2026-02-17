import { useMemo, useRef, useState } from "react";
import http from "../api/http";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export default function NewPost() {
  const fileRef = useRef(null);

  const [language, setLanguage] = useState("JavaScript");
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]); // File[]
  const [previews, setPreviews] = useState([]); // {url, name}[]
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);

  const canPublish = useMemo(() => {
    return !loading && (text.trim().length > 0 || files.length > 0) && language.trim().length > 0;
  }, [loading, text, files, language]);

  const addFiles = (list) => {
    const incoming = Array.from(list || []).filter(Boolean);
    if (!incoming.length) return;

    const nextFiles = [...files, ...incoming].slice(0, 10);
    setFiles(nextFiles);

    const nextPrev = nextFiles.map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
    }));

    previews.forEach((p) => {
      try { URL.revokeObjectURL(p.url); } catch {}
    });

    setPreviews(nextPrev);
  };

  const onPickFiles = () => fileRef.current?.click();

  const onRemove = (idx) => {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);

    previews.forEach((p) => {
      try { URL.revokeObjectURL(p.url); } catch {}
    });

    const nextPrev = next.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
    setPreviews(nextPrev);
  };

  const onClearAll = () => {
    previews.forEach((p) => {
      try { URL.revokeObjectURL(p.url); } catch {}
    });
    setFiles([]);
    setPreviews([]);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  };

  const onPublish = async () => {
    if (!canPublish) return;

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("language", language);
      fd.append("code", text);

      files.forEach((f) => fd.append("images", f));

      await http.post("/posts", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setText("");
      onClearAll();
      // ✅ НИКАКИХ alert — просто успех тихо
    } catch (e) {
      alert(e?.response?.data?.error || e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const grid = useMemo(() => {
    const n = previews.length;
    const items = previews.slice(0, 5);
    const extra = n - items.length;
    return { n, items, extra };
  }, [previews]);

  return (
    <div style={{ padding: 18 }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: "rgba(255,255,255,0.95)", marginBottom: 14 }}>
        New Post
      </div>

      <div
        style={{
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(0,0,0,0.22)",
          padding: 14,
          maxWidth: 780,
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
          <input
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="Language"
            style={{
              width: 220,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.22)",
              color: "rgba(255,255,255,0.92)",
              outline: "none",
              fontWeight: 700,
            }}
          />

          <div style={{ flex: 1 }} />

          {files.length > 0 && (
            <button
              onClick={onClearAll}
              style={{
                height: 40,
                padding: "0 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.85)",
                cursor: "pointer",
                fontWeight: 800,
              }}
              title="Remove all photos"
            >
              Clear
            </button>
          )}
        </div>

        <div
          onClick={onPickFiles}
          onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
          onDrop={onDrop}
          style={{
            borderRadius: 16,
            border: `1.6px dashed ${dragOver ? "rgba(170,120,255,0.75)" : "rgba(255,255,255,0.22)"}`,
            background: dragOver ? "rgba(170,120,255,0.10)" : "rgba(255,255,255,0.03)",
            padding: 14,
            cursor: "pointer",
            position: "relative",
            userSelect: "none",
          }}
          title="Click or drop images"
        >
          {previews.length === 0 ? (
            <div
              style={{
                height: 260,
                borderRadius: 14,
                display: "grid",
                placeItems: "center",
                color: "rgba(255,255,255,0.75)",
                fontWeight: 800,
                gap: 10,
              }}
            >
              <div style={{ width: 56, height: 56, borderRadius: 16, border: "2px dashed rgba(255,255,255,0.35)", display:"grid", placeItems:"center" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path d="M12 4v10" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M8 8l4-4 4 4" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 20h14" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ fontSize: 18 }}>Добавьте фото</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>
                клик или перетащите сюда
              </div>
            </div>
          ) : (
            <>
              <div className="npGrid">
                {grid.items.map((p, idx) => {
                  const isLastWithMore = idx === 4 && grid.extra > 0;
                  return (
                    <div key={p.url} className={`npCell npCell-${clamp(grid.items.length, 1, 5)}-${idx}`}>
                      <img
                        src={p.url}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />

                      <button
                        onClick={(e) => { e.stopPropagation(); onRemove(idx); }}
                        title="Remove"
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          width: 34,
                          height: 34,
                          borderRadius: 999,
                          border: "1px solid rgba(255,255,255,0.14)",
                          background: "rgba(0,0,0,0.45)",
                          color: "white",
                          cursor: "pointer",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 16,
                        }}
                      >
                        ✕
                      </button>

                      {isLastWithMore && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(0,0,0,0.45)",
                            display: "grid",
                            placeItems: "center",
                            color: "white",
                            fontWeight: 900,
                            fontSize: 22,
                          }}
                        >
                          +{grid.extra}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); onPickFiles(); }}
                title="Add more photos"
                style={{
                  position: "absolute",
                  right: 12,
                  bottom: 12,
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(0,0,0,0.45)",
                  color: "white",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M8.5 12.5 14.8 6.2a3 3 0 1 1 4.2 4.2l-7.1 7.1a5 5 0 0 1-7.1-7.1l7.8-7.8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Напишите что-нибудь..."
            rows={4}
            style={{
              width: "100%",
              resize: "vertical",
              minHeight: 120,
              padding: "12px 12px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.22)",
              color: "rgba(255,255,255,0.92)",
              outline: "none",
              lineHeight: 1.4,
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button
            onClick={onPublish}
            disabled={!canPublish}
            style={{
              height: 44,
              padding: "0 18px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: canPublish ? "rgba(170, 120, 255, 0.20)" : "rgba(255,255,255,0.06)",
              color: canPublish ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.50)",
              fontWeight: 900,
              cursor: canPublish ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>

      <style>{`
        .npGrid{
          height: 320px;
          border-radius: 14px;
          overflow: hidden;
          display: grid;
          gap: 6px;
          grid-template-columns: 1fr;
          grid-template-rows: 1fr;
        }
        .npCell{
          position: relative;
          border-radius: 12px;
          overflow: hidden;
        }

        .npCell-1-0{ grid-column: 1; grid-row: 1; }

        .npGrid:has(.npCell-2-0){ grid-template-columns: 1fr 1fr; }
        .npCell-2-0{ grid-column: 1; grid-row: 1; }
        .npCell-2-1{ grid-column: 2; grid-row: 1; }

        .npGrid:has(.npCell-3-0){ grid-template-columns: 1.6fr 1fr; grid-template-rows: 1fr 1fr; }
        .npCell-3-0{ grid-column: 1; grid-row: 1 / span 2; }
        .npCell-3-1{ grid-column: 2; grid-row: 1; }
        .npCell-3-2{ grid-column: 2; grid-row: 2; }

        .npGrid:has(.npCell-4-0){ grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
        .npCell-4-0{ grid-column: 1; grid-row: 1; }
        .npCell-4-1{ grid-column: 2; grid-row: 1; }
        .npCell-4-2{ grid-column: 1; grid-row: 2; }
        .npCell-4-3{ grid-column: 2; grid-row: 2; }

        .npGrid:has(.npCell-5-0){ grid-template-columns: 1.6fr 1fr; grid-template-rows: 1fr 1fr 1fr; }
        .npCell-5-0{ grid-column: 1; grid-row: 1 / span 3; }
        .npCell-5-1{ grid-column: 2; grid-row: 1; }
        .npCell-5-2{ grid-column: 2; grid-row: 2; }
        .npCell-5-3{ grid-column: 2; grid-row: 3; }
        .npCell-5-4{ display:none; }

        @media (max-width: 820px){
          .npGrid{ height: 260px; }
        }
      `}</style>
    </div>
  );
}
