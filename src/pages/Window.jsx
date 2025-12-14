// src/components/Window.jsx
import React, { useEffect, useState } from "react";
import {
  MdDesktopWindows,
  MdCheckCircle,
  MdWarningAmber,
  MdArrowUpward,
  MdArrowDownward,
  MdPrint,
} from "react-icons/md";

function sendEvent(text, type = "info") {
  window.dispatchEvent(
    new CustomEvent("eventstream", { detail: { text, type } })
  );
}

export default function Window() {
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [scroll, setScroll] = useState({
    x: window.scrollX,
    y: window.scrollY,
  });

  const [inspector, setInspector] = useState({
    lastEvent: "none",
    target: "Window (Global)",
    data: {},
  });

  const [lifecycle, setLifecycle] = useState({
    domReady: false,
    loaded: false,
    focused: document.hasFocus(),
  });

  const [beforeUnloadActive, setBeforeUnloadActive] = useState(false);

  useEffect(() => {
    const codeSnippet = `// Window & BOM events
window.addEventListener("resize", () => {});
window.addEventListener("scroll", () => {});
window.addEventListener("beforeunload", (e) => {
  e.preventDefault();
  e.returnValue = "";
});`;
    window.dispatchEvent(
      new CustomEvent("live-source", { detail: { code: codeSnippet } })
    );
  }, []);

  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setViewport({ width: w, height: h });

      setInspector({
        lastEvent: "resize",
        target: "Window (Global)",
        data: { width: w, height: h, timeStamp: performance.now().toFixed(1) },
      });

      sendEvent(`resize — ${w}x${h}`, "info");
    }

    function handleScroll() {
      const x = window.scrollX;
      const y = window.scrollY;
      setScroll({ x, y });

      setInspector({
        lastEvent: "scroll",
        target: "Window (Global)",
        data: { scrollX: x, scrollY: y, timeStamp: performance.now().toFixed(1) },
      });

      sendEvent(`scroll — x:${x} y:${y}`, "info");
    }

    function handleFocus() {
      setLifecycle((s) => ({ ...s, focused: true }));
    }

    function handleBlur() {
      setLifecycle((s) => ({ ...s, focused: false }));
    }

    function handleBeforeUnload(e) {
      if (!beforeUnloadActive) return;
      e.preventDefault();
      e.returnValue = "";
      return "";
    }

    document.addEventListener("DOMContentLoaded", () =>
      setLifecycle((s) => ({ ...s, domReady: true }))
    );
    window.addEventListener("load", () =>
      setLifecycle((s) => ({ ...s, loaded: true }))
    );

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);

    sendEvent("Window interaction lab initialized", "muted");

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [beforeUnloadActive]);

  return (
    <main className="flex-1 overflow-y-auto p-6 lg:p-10">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* TITLE */}
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Window &amp; BOM Events
          </h2>
          <p className="text-slate-400">
            Monitor viewport dimensions, scroll positions, and page lifecycle
            events in real-time by interacting with the browser window.
          </p>
        </div>

        {/* MAIN: left large panel (full-width). Inspector moved below */}
        <section className="grid grid-cols-1 gap-6">
          {/* LEFT (main) */}
          <div className="rounded-xl border border-[#223649] bg-slate-800/60 p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                <span className="p-1 rounded bg-slate-900/50 text-primary">
                  <MdDesktopWindows />
                </span>
                Window Interaction Lab
              </h3>
              <div className="flex gap-2">
                <span className="text-xs font-mono bg-slate-800/60 text-slate-300 px-2 py-1 rounded border border-slate-700">
                  window
                </span>
                <span className="text-xs font-mono bg-slate-800/60 text-orange-300 px-2 py-1 rounded border border-orange-400/40">
                  onresize
                </span>
                <span className="text-xs font-mono bg-slate-800/60 text-purple-300 px-2 py-1 rounded border border-purple-400/40">
                  onscroll
                </span>
              </div>
            </div>

            {/* VIEWPORT + SCROLL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg bg-slate-900/40 border border-slate-700 p-4 flex flex-col gap-3">
                <div className="text-xs text-slate-400 uppercase font-mono">
                  Viewport Size
                </div>
                <div className="text-3xl font-bold text-white">
                  {viewport.width}
                  <span className="text-slate-400 mx-1">×</span>
                  {viewport.height}
                </div>
                <div className="text-xs text-sky-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  Monitoring changes…
                </div>
              </div>

              <div className="rounded-lg bg-slate-900/40 border border-slate-700 p-4 flex flex-col gap-3">
                <div className="text-xs text-slate-400 uppercase font-mono">
                  Scroll Position
                </div>
                <div className="flex justify-between text-white font-semibold">
                  <div>
                    <span className="text-xs text-slate-400 block">X-Axis</span>
                    {scroll.x}
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Y-Axis</span>
                    {scroll.y}
                  </div>
                </div>
                <div className="h-1 rounded bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-sky-500"
                    style={{ width: `${Math.min(scroll.y / 5, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* STATE */}
            <div className="rounded-lg bg-slate-900/40 border border-slate-700 p-4 flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <MdCheckCircle className="text-emerald-400" />
                DOM Ready
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <MdCheckCircle className="text-emerald-400" />
                Window Loaded
              </div>
              <div className="text-xs px-2 py-1 rounded bg-slate-800/60 border border-slate-700 text-slate-300">
                STATE:{" "}
                <span className="text-emerald-400 font-semibold">
                  {lifecycle.focused ? "Focused" : "Blurred"}
                </span>
              </div>
            </div>

            {/* CONTROLS */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="inline-flex items-center gap-2 px-3 py-2 rounded bg-slate-800/60 border border-slate-700 text-slate-200 text-sm"
              >
                <MdArrowUpward /> Scroll Top
              </button>
              <button
                onClick={() =>
                  window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: "smooth",
                  })
                }
                className="inline-flex items-center gap-2 px-3 py-2 rounded bg-slate-800/60 border border-slate-700 text-slate-200 text-sm"
              >
                <MdArrowDownward /> Scroll Bottom
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded bg-slate-800/60 border border-slate-700 text-slate-200 text-sm"
              >
                <MdPrint /> Print Window
              </button>
            </div>

            <div className="mt-2">
              <button
                onClick={() => setBeforeUnloadActive((s) => !s)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded border text-sm ${
                  beforeUnloadActive
                    ? "bg-amber-500/20 border-amber-400 text-amber-300"
                    : "bg-slate-800/40 border-slate-700 text-slate-300"
                }`}
              >
                <MdWarningAmber />
                onbeforeunload {beforeUnloadActive ? "active" : "inactive"}
              </button>
            </div>
          </div>

          {/* EVENT INSPECTOR moved below so you can scroll down */}
          <div className="rounded-xl border border-[#223649] bg-slate-800/60 p-4 flex flex-col gap-3">
            <div className="text-xs font-mono text-slate-400">EVENT INSPECTOR</div>

            <div>
              <div className="text-xs text-slate-400">Last Event Type</div>
              <div className="text-sky-400 font-semibold">
                {inspector.lastEvent}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400">Target</div>
              <div className="bg-slate-900/40 border border-slate-700 rounded px-2 py-1 text-slate-300 font-mono">
                {inspector.target}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400">Captured Data</div>
              <pre className="bg-slate-900/40 border border-slate-700 rounded p-2 text-xs text-slate-200 overflow-x-auto">
{JSON.stringify(inspector.data, null, 2)}
              </pre>
            </div>

            <div className="mt-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">
                UNLOAD PROTECTION
              </span>
              <p className="mt-1">
                A confirmation dialog will appear if you try to reload or close
                this tab, preventing accidental data loss.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
