// components/LiveSource.jsx
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import React, { useEffect, useRef, useState } from "react";
import {
  FiPlay,
  FiTrash2,
  FiDownload,
  FiCopy,
  FiChevronDown,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiChevronsUp,
  FiChevronsDown,
} from "react-icons/fi";

/**
 * LiveSource
 * Props:
 *  - title (string)
 *  - initialCode (string)
 *  - mobile (boolean)
 *
 * Notes:
 *  - Desktop markup & styles are unchanged (keeps desktop design exactly).
 *  - Mobile renders that same markup inside a bottom-sheet wrapper and
 *    attaches drag handlers on the header to set the sheet top (height).
 *  - This implementation intentionally avoids snapping-to-fullscreen;
 *    it clamps the open height so it never becomes full-screen.
 */
export default function LiveSource({
  title = "LIVE SOURCE",
  initialCode = null,
  mobile = false,
}) {
  const defaultCode = `$("#ctx-target").on("contextmenu", function(e) {
  // Prevent default context menu
  e.preventDefault();
  const el = $(this);
  el.addClass("ring-2 ring-red-500");
  console.log("Right-click detected!");
  showFeedback("Opening menu...");
});`;

  const [events, setEvents] = useState([
    {
      id: Date.now() - 60000,
      text: "System ready. Listening for mouse events...",
      type: "muted",
    },
  ]);
  const [filter, setFilter] = useState("all");
  const [codeVisible, setCodeVisible] = useState(true);
  const [code, setCode] = useState(initialCode ?? defaultCode);

  // theme detection
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  const streamRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (initialCode) setCode(initialCode);
  }, [initialCode]);

  // observe theme changes
  useEffect(() => {
    function onStorage(e) {
      if (e.key === "theme") {
        setIsDark(e.newValue === "dark");
      }
    }
    window.addEventListener("storage", onStorage);

    const observer = new MutationObserver(() => {
      const hasDark = document.documentElement.classList.contains("dark");
      setIsDark(hasDark);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      window.removeEventListener("storage", onStorage);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    function onEvent(e) {
      const d = e.detail || {};
      const text = d.text || JSON.stringify(d);
      const type = d.type || "info";
      appendEvent({ text, type });
    }

    function onLiveSource(e) {
      const codeStr = (e.detail && e.detail.code) || defaultCode;
      setCode(codeStr);
      appendEvent({ text: "> live source updated", type: "muted" });
    }

    window.addEventListener("eventstream", onEvent);
    window.addEventListener("live-event", onEvent);
    window.addEventListener("live-source", onLiveSource);

    return () => {
      window.removeEventListener("eventstream", onEvent);
      window.removeEventListener("live-event", onEvent);
      window.removeEventListener("live-source", onLiveSource);
    };
  }, []);

  useEffect(() => {
    if (!streamRef.current) return;
    streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [events]);

  function appendEvent({ text, type = "info" }) {
    setEvents((prev) => [...prev, { id: Date.now() + Math.random(), text, type }]);
  }

  function clearEvents() {
    setEvents([]);
  }

  function exportEvents() {
    const payload = JSON.stringify(events, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `event-stream-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyCode() {
    navigator.clipboard?.writeText(code).then(() => {
      appendEvent({ text: "> copied source to clipboard", type: "muted" });
    });
  }

  function sendDemoEvent() {
    window.dispatchEvent(
      new CustomEvent("eventstream", {
        detail: { text: "> mouseover event on .hover-card", type: "success" },
      })
    );
  }

  const filtered = events.filter((ev) => (filter === "all" ? true : ev.type === filter));

  // theming colors
  function colorForType(type) {
    if (isDark) {
      if (type === "success") return "#6ee7b7";
      if (type === "warning") return "#fb923c";
      if (type === "muted") return "#94a3b8";
      return "#60a5fa";
    } else {
      if (type === "success") return "#065f46";
      if (type === "warning") return "#b45309";
      if (type === "muted") return "#6b7280";
      return "#0f766e";
    }
  }

  // scrollbars
  const scrollbarCss = isDark
    ? `
      .live-source-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.06) #334155; }
      .live-source-scroll::-webkit-scrollbar { width: 10px; height: 10px; }
      .live-source-scroll::-webkit-scrollbar-track { background: #0b1220; }
      .live-source-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 9999px; border: 2px solid transparent; background-clip: padding-box;}
      .live-source-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.10); }
    `
    : `
      .live-source-scroll { scrollbar-width: thin; scrollbar-color: rgba(15,23,42,0.06) #f1f5f9; }
      .live-source-scroll::-webkit-scrollbar { width: 10px; height: 10px; }
      .live-source-scroll::-webkit-scrollbar-track { background: #f1f5f9; }
      .live-source-scroll::-webkit-scrollbar-thumb { background: rgba(2,6,23,0.06); border-radius: 9999px; border: 2px solid transparent; background-clip: padding-box;}
      .live-source-scroll::-webkit-scrollbar-thumb:hover { background: rgba(2,6,23,0.10); }
    `;

  function handleCommandSubmit(e) {
    e.preventDefault();
    const value = inputRef.current?.value?.trim();
    if (!value) return;
    appendEvent({ text: `> ${value}`, type: "info" });
    inputRef.current.value = "";
  }

  // ------------------ Mobile sheet drag (simple flexible) ------------------
  // Use header area of the aside as the drag handle (so the UI looks identical to desktop)
  const sheetRef = useRef(null);
  const dragging = useRef(false);
  const startYRef = useRef(0);
  const startTopRef = useRef(0);
  const [vh, setVh] = useState(typeof window !== "undefined" ? window.innerHeight : 800);

  // initial collapsed top - change this number to control how much of the pane shows when collapsed
  const collapsedOffset = 160; // px from bottom (shows ~160px of sheet in collapsed state)
  const [topPos, setTopPos] = useState((typeof window !== "undefined" ? window.innerHeight : 800) - collapsedOffset);

  useEffect(() => {
    function onResize() {
      setVh(window.innerHeight);
      // keep topPos in new bounds
      setTopPos((t) => clamp(t, minTopFor(window.innerHeight), window.innerHeight - 64));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mobile) return;
    setTopPos(window.innerHeight - collapsedOffset);
  }, [mobile]);

  function clamp(v, a, b) {
    return Math.min(Math.max(v, a), b);
  }

  // Prevent full-screen: set a reasonable minimum top (so sheet cannot become absolute-fullscreen)
  function minTopFor(viewportHeight) {
    // keep at least 120px space above sheet when fully expanded — tweak as needed;
    // if you want to allow closer-to-fullscreen use a smaller number.
    return Math.max(80, Math.round(viewportHeight * 0.08));
  }

  // pointer handlers: we attach these directly on the header element inside the aside,
  // start listening on document so pointer move/up still work if finger/mouse leaves the element.
  function onHeaderPointerDown(ev) {
    if (!mobile) return;
    ev.preventDefault();
    dragging.current = true;
    const clientY = ev.clientY ?? (ev.touches && ev.touches[0] && ev.touches[0].clientY);
    startYRef.current = clientY;
    startTopRef.current = topPos;

    // attach move/up on window/document so drag continues if pointer leaves the header
    window.addEventListener("pointermove", onWindowPointerMove);
    window.addEventListener("pointerup", onWindowPointerUp);
    window.addEventListener("touchmove", onWindowPointerMove, { passive: false });
    window.addEventListener("touchend", onWindowPointerUp);
    try { ev.target.setPointerCapture?.(ev.pointerId); } catch {}
  }

  function onWindowPointerMove(e) {
    if (!dragging.current) return;
    e.preventDefault();
    const clientY = e.clientY ?? (e.touches && e.touches[0] && e.touches[0].clientY);
    const dy = clientY - startYRef.current;
    const newTop = startTopRef.current + dy;
    const minTop = minTopFor(window.innerHeight);
    const maxTop = window.innerHeight - 64; // when sheet collapsed slightly (reserve 64px)
    setTopPos(clamp(newTop, minTop, maxTop));
  }

  function onWindowPointerUp(e) {
    if (!dragging.current) return;
    dragging.current = false;
    // remove listeners
    window.removeEventListener("pointermove", onWindowPointerMove);
    window.removeEventListener("pointerup", onWindowPointerUp);
    window.removeEventListener("touchmove", onWindowPointerMove);
    window.removeEventListener("touchend", onWindowPointerUp);
    // keep the sheet where user left it (no snapping) so it's "flexible"
  }

  const isCollapsed = mobile && topPos > vh - 140;

  // ============ AsideInner (exact same desktop UI) ============
  // We keep the exact markup used on desktop. The header area includes the pointer-down handler on mobile.
  const AsideInner = (
    <aside
      className={
        "w-full md:w-[420px] rounded-none p-3 flex flex-col h-full transition-colors duration-200 " +
        (isDark ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800")
      }
      style={{ minHeight: 0 }}
    >
      {/* small header row (this is also the mobile drag handle) */}
      <div
        className="flex items-center justify-between mb-3"
        onPointerDown={mobile ? onHeaderPointerDown : undefined}
        // Note: pointerdown only starts the drag; actual movement handled on window pointermove
      >
        <div className="flex items-center gap-2">
          <button
            className={isDark ? "text-slate-400 hover:text-white p-1" : "text-slate-600 hover:text-slate-900 p-1"}
            title="Back"
          >
            <FiChevronLeft />
          </button>
          <div>
            <div className={isDark ? "text-xs font-mono text-slate-400" : "text-xs font-mono text-slate-500"}>
              {title}
            </div>
            <div className={isDark ? "text-sm font-semibold text-white -mt-0.5" : "text-sm font-semibold text-slate-900 -mt-0.5"}>
              Live event stream
            </div>
          </div>
        </div>

        {/* small status dot on the right */}
        <div className="flex items-center gap-2">
          <span
            className={isDark ? "w-3 h-3 rounded-full bg-emerald-400 ring-1 ring-emerald-500/30" : "w-3 h-3 rounded-full bg-emerald-500 ring-1 ring-emerald-200"}
            title="connected"
          />
        </div>
      </div>

      {/* Code pane (first) */}
      {codeVisible && (
        <div className="mb-3">
          <div className={isDark ? "relative rounded-lg bg-[#0b0d10] border border-slate-800 overflow-hidden" : "relative rounded-lg bg-slate-50 border border-slate-200 overflow-hidden"}>
            {/* top bar */}
            <div className={isDark ? "flex items-center justify-between px-3 py-2 border-b border-slate-800/60" : "flex items-center justify-between px-3 py-2 border-b border-slate-200"}>
              <div className={isDark ? "flex items-center gap-2 text-xs text-slate-400 font-mono" : "flex items-center gap-2 text-xs text-slate-500 font-mono"}>
                <span className="inline-block w-2 h-2 rounded-sm bg-pink-500 mr-1" />
                <span>src/demo.js</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className={isDark ? "text-xs px-2 py-1 rounded border border-slate-800 text-slate-300 hover:bg-slate-800/50" : "text-xs px-2 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-100"}
                  onClick={copyCode}
                >
                  <FiCopy className="inline-block mr-1" /> Copy
                </button>
                <button
                  className={isDark ? "text-xs px-2 py-1 rounded border border-slate-800 text-slate-300 hover:bg-slate-800/50" : "text-xs px-2 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-100"}
                  onClick={() => {
                    setCode(defaultCode);
                    appendEvent({
                      text: "> restored default demo code",
                      type: "muted",
                    });
                  }}
                >
                  Restore
                </button>
              </div>
            </div>

            <div className="live-source-scroll">
              <SyntaxHighlighter
                language="javascript"
                style={isDark ? atomDark : oneLight}
                showLineNumbers={false}
                wrapLongLines={true}
                customStyle={{
                  background: "transparent",
                  margin: 0,
                  padding: "1rem",
                  maxHeight: "40vh",
                  overflow: "auto",
                  fontSize: "0.75rem",
                  borderRadius: "0.5rem",
                }}
                codeTagProps={{
                  style: {
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', monospace",
                  },
                }}
              >
                {code}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      )}

      {/* toolbar */}
      <div className={isDark ? "flex items-center justify-between text-xs text-slate-400 mb-2" : "flex items-center justify-between text-xs text-slate-500 mb-2"}>
        <div className="flex items-center gap-2">
          <button
            className={isDark ? "text-slate-300 px-2 py-1 rounded bg-slate-800/40" : "text-slate-700 px-2 py-1 rounded bg-slate-100"}
            onClick={sendDemoEvent}
            title="Send demo event"
          >
            <FiPlay className="inline-block mr-1" /> Send
          </button>
          <button
            className={isDark ? "px-2 py-1 rounded border border-slate-800 bg-slate-800/30 text-slate-300" : "px-2 py-1 rounded border border-slate-200 bg-white text-slate-600"}
            onClick={clearEvents}
            title="Clear stream"
          >
            <FiTrash2 />
          </button>
          <button
            className={isDark ? "px-2 py-1 rounded border border-slate-800 bg-slate-800/30 text-slate-300" : "px-2 py-1 rounded border border-slate-200 bg-white text-slate-600"}
            onClick={exportEvents}
            title="Export stream"
          >
            <FiDownload />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <FiFilter className={isDark ? "text-slate-500" : "text-slate-400"} />
          <select
            className={isDark ? "bg-slate-800/40 border border-slate-800 text-slate-300 text-xs rounded px-2 py-1" : "bg-white border border-slate-200 text-slate-600 text-xs rounded px-2 py-1"}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="muted">Muted</option>
          </select>
        </div>
      </div>

      {/* event stream header */}
      <div className={isDark ? "flex items-center justify-between px-2 py-1 text-xs text-slate-400 bg-transparent border-t border-b border-slate-800/40 mb-2" : "flex items-center justify-between px-2 py-1 text-xs text-slate-500 bg-transparent border-t border-b border-slate-100 mb-2"}>
        <div className="flex items-center gap-2">
          <span className={isDark ? "inline-block w-4 h-4 rounded bg-slate-800/60 flex items-center justify-center text-[10px] text-slate-300" : "inline-block w-4 h-4 rounded bg-slate-100 flex items-center justify-center text-[10px] text-slate-500"}>
            ▣
          </span>
          <span className="font-mono">EVENT STREAM</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            className={isDark ? "w-7 h-7 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-800 text-slate-300" : "w-7 h-7 rounded-full bg-white flex items-center justify-center border border-slate-200 text-slate-600"}
            title="options"
          >
            <FiChevronDown />
          </button>
        </div>
      </div>

      {/* STREAM LIST */}
      <div
        ref={streamRef}
        className="flex-1 overflow-auto bg-transparent rounded-md px-1 live-source-scroll"
        style={{ minHeight: 0 }}
      >
        {filtered.length === 0 ? (
          <div className={isDark ? "text-xs text-slate-400 p-3 text-center" : "text-xs text-slate-500 p-3 text-center"}>
            No events yet — interact with the demo area.
          </div>
        ) : (
          filtered.map((ev) => (
            <div
              key={ev.id}
              className={isDark ? "px-3 py-2 rounded hover:bg-slate-800/40 transition flex flex-col gap-1" : "px-3 py-2 rounded hover:bg-slate-50 transition flex flex-col gap-1"}
            >
              <div className="flex items-center gap-2">
                <div className={isDark ? "text-[11px] text-slate-500 font-mono w-20" : "text-[11px] text-slate-400 font-mono w-20"}>
                  {new Date(ev.id).toLocaleTimeString()}
                </div>
                <div
                  className="flex-1 text-xs font-mono break-words"
                  style={{
                    color: colorForType(ev.type),
                  }}
                >
                  {ev.text}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* bottom input area */}
      <form onSubmit={handleCommandSubmit} className="mt-2 flex items-center gap-2">
        <button
          type="button"
          className={isDark ? "text-slate-400 text-xs flex items-center px-2 py-2" : "text-slate-600 text-xs flex items-center px-2 py-2"}
          title="toggle"
          onClick={() => setCodeVisible((s) => !s)}
        >
          <FiChevronRight />
        </button>
        <input
          ref={inputRef}
          placeholder="Type JS command..."
          className={isDark ? "flex-1 bg-slate-800/50 border border-slate-800 text-slate-300 text-xs px-3 py-2 rounded outline-none focus:ring-1 focus:ring-sky-500" : "flex-1 bg-white border border-slate-200 text-slate-700 text-xs px-3 py-2 rounded outline-none focus:ring-1 focus:ring-sky-500"}
        />
        <button type="submit" className="text-xs px-3 py-2 rounded bg-sky-600 text-white">
          Run
        </button>
      </form>
    </aside>
  );

  // ---------------- final render ----------------
  return (
    <>
      <style>{scrollbarCss}</style>

      {/* desktop: unchanged, exact markup */}
      {!mobile && (
        <div className={isDark ? "border-l border-[#223649] h-full" : "border-l border-slate-200 h-full"}>
          <div
            className={
              "w-full md:w-[420px] rounded-none p-0 sticky top-14 h-[calc(100vh-56px)] flex flex-col transition-colors duration-200 " +
              (isDark ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800")
            }
            style={{ padding: 0 }}
          >
            {AsideInner}
          </div>
        </div>
      )}

      {/* mobile bottom-sheet: same AsideInner inside; header area of AsideInner is the drag handle */}
      {mobile && (
        <div
          ref={sheetRef}
          className="fixed left-0 right-0 z-50"
          style={{
            top: topPos,
            bottom: 0,
            touchAction: "none",
            pointerEvents: "auto",
          }}
        >
          <div
            className={
              "mx-3 rounded-t-xl shadow-2xl overflow-hidden flex flex-col " + (isDark ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800")
            }
            style={{ maxHeight: `calc(100vh - ${minTopFor(vh)}px)`, display: "flex", flexDirection: "column", height: "100%" }}
            role="region"
            aria-label="Live event stream"
          >
            {/* small visual handle under header (purely visual) */}
            <div className="w-full flex justify-center" style={{ paddingTop: 6 }}>
              <div style={{ width: 40, height: 4, borderRadius: 999 }} className={isDark ? "bg-slate-700 mb-2" : "bg-slate-200 mb-2"} />
            </div>

            {/* content area - AsideInner (header inside AsideInner is the drag handle) */}
            <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
              {AsideInner}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
