// src/components/LiveSource.jsx
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
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
} from "react-icons/fi";

/**
 * LiveSource
 * Props:
 *  - title (string)
 *  - initialCode (string)
 */
export default function LiveSource({
  title = "LIVE SOURCE",
  initialCode = null,
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
  const streamRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (initialCode) setCode(initialCode);
  }, [initialCode]);

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
    setEvents((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), text, type },
    ]);
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

  const filtered = events.filter((ev) =>
    filter === "all" ? true : ev.type === filter
  );

  // submit input (for demo, we just append to stream)
  function handleCommandSubmit(e) {
    e.preventDefault();
    const value = inputRef.current?.value?.trim();
    if (!value) return;
    appendEvent({ text: `> ${value}`, type: "info" });
    inputRef.current.value = "";
  }

  return (
    <>
      {/* Scrollbar styling: WebKit + Firefox.
          Track set to tailwind's slate-700 approximate (#334155).
          Thumb kept dark so it blends with theme.
      */}
      <style>{`
        /* apply to any element with .live-source-scroll */
        .live-source-scroll {
          scrollbar-width: thin; /* firefox */
          scrollbar-color: rgba(255,255,255,0.06) #334155; /* thumb track (thumb track) */
        }
        .live-source-scroll::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .live-source-scroll::-webkit-scrollbar-track {
          background: #334155; /* border-slate-700 */
        }
        .live-source-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.06);
          border-radius: 9999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        /* optional: hover state for thumb */
        .live-source-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.10);
        }
      `}</style>
      <div className="border-l border-[#223649] h-full">
        <aside className="w-full md:w-[420px] bg-slate-900/80  rounded-none p-3 sticky top-14 h-[calc(100vh-56px)] flex flex-col">
          {/* small header row like the screenshot */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                className="text-slate-400 hover:text-white p-1"
                title="Back"
              >
                <FiChevronLeft />
              </button>
              <div>
                <div className="text-xs font-mono text-slate-400">
                  LIVE SOURCE
                </div>
                <div className="text-sm font-semibold text-white -mt-0.5">
                  Live event stream
                </div>
              </div>
            </div>

            {/* small status dot on the right */}
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full bg-emerald-400 ring-1 ring-emerald-500/30"
                title="connected"
              />
            </div>
          </div>

          {/* Code pane — larger, dark, rounded */}
          {codeVisible && (
            <div className="mb-3">
              <div className="relative rounded-lg bg-[#111217] border border-slate-800 overflow-hidden">
                {/* small top bar for code area (file name / copy) */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/60">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <span className="inline-block w-2 h-2 rounded-sm bg-pink-500 mr-1" />
                    <span>src/demo.js</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="text-xs px-2 py-1 rounded border border-slate-800 text-slate-300 hover:bg-slate-800/50"
                      onClick={copyCode}
                    >
                      <FiCopy className="inline-block mr-1" /> Copy
                    </button>
                    <button
                      className="text-xs px-2 py-1 rounded border border-slate-800 text-slate-300 hover:bg-slate-800/50"
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

                {/* --- REPLACED: code content now uses SyntaxHighlighter --- */}
                <div className="live-source-scroll">
                  <SyntaxHighlighter
                    language="javascript"
                    style={atomDark}
                    showLineNumbers={false}
                    wrapLongLines={true}
                    customStyle={{
                      background: "transparent", // keep container background
                      margin: 0,
                      padding: "1rem",
                      maxHeight: "260px",
                      overflow: "auto",
                      fontSize: "0.75rem",
                      borderRadius: "0.5rem",
                    }}
                    codeTagProps={{
                      style: {
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', monospace",
                      },
                    }}
                  >
                    {code}
                  </SyntaxHighlighter>
                </div>
              </div>
            </div>
          )}

          {/* small toolbar row (kept but visually subtle) */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <div className="flex items-center gap-2">
              <button
                className="text-slate-300 px-2 py-1 rounded bg-slate-800/50"
                onClick={sendDemoEvent}
                title="Send demo event"
              >
                <FiPlay className="inline-block mr-1" /> Send
              </button>
              <button
                className="px-2 py-1 rounded border border-slate-800 bg-slate-800/40"
                onClick={clearEvents}
                title="Clear stream"
              >
                <FiTrash2 />
              </button>
              <button
                className="px-2 py-1 rounded border border-slate-800 bg-slate-800/40"
                onClick={exportEvents}
                title="Export stream"
              >
                <FiDownload />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <FiFilter className="text-slate-500" />
              <select
                className="bg-slate-800/40 border border-slate-800 text-slate-300 text-xs rounded px-2 py-1"
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

          {/* Event stream header (thin divider with label + right-side control) */}
          <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-400 bg-transparent border-t border-b border-slate-800/40 mb-2">
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 rounded bg-slate-800/60 flex items-center justify-center text-[10px] text-slate-300">
                ▣
              </span>
              <span className="font-mono">EVENT STREAM</span>
            </div>

            <div className="flex items-center gap-2">
              {/* small circular icon on right matching screenshot */}
              <button
                className="w-7 h-7 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-800 text-slate-300"
                title="options"
              >
                <FiChevronDown />
              </button>
            </div>
          </div>

          {/* STREAM LIST (fills remaining height) */}
          <div
            ref={streamRef}
            className="flex-1 overflow-auto bg-transparent rounded-md px-1 live-source-scroll"
          >
            {filtered.length === 0 ? (
              <div className="text-xs text-slate-400 p-3 text-center">
                No events yet — interact with the demo area.
              </div>
            ) : (
              filtered.map((ev) => (
                <div
                  key={ev.id}
                  className="px-3 py-2 rounded hover:bg-slate-800/40 transition flex flex-col gap-1"
                >
                  <div className="flex items-center gap-2">
                    <div className="text-[11px] text-slate-500 font-mono w-20">
                      {new Date(ev.id).toLocaleTimeString()}
                    </div>
                    <div
                      className="flex-1 text-xs font-mono break-words"
                      style={{
                        color:
                          ev.type === "success"
                            ? "#6ee7b7"
                            : ev.type === "warning"
                            ? "#fb923c"
                            : ev.type === "muted"
                            ? "#94a3b8"
                            : "#60a5fa",
                      }}
                    >
                      {ev.text}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* bottom input area (small) */}
          <form
            onSubmit={handleCommandSubmit}
            className="mt-2 flex items-center gap-2"
          >
            <button
              type="button"
              className="text-slate-400 text-xs flex items-center px-2 py-2"
              title="toggle"
            >
              <FiChevronRight />
            </button>
            <input
              ref={inputRef}
              placeholder="Type JS command..."
              className="flex-1 bg-slate-800/50 border border-slate-800 text-slate-300 text-xs px-3 py-2 rounded outline-none focus:ring-1 focus:ring-sky-500"
            />
            <button
              type="submit"
              className="text-xs px-3 py-2 rounded bg-sky-600 text-white"
            >
              Run
            </button>
          </form>
        </aside>
      </div>
    </>
  );
}
