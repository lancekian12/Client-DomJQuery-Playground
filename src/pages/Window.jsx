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
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  const [scroll, setScroll] = useState({
    x: typeof window !== "undefined" ? window.scrollX : 0,
    y: typeof window !== "undefined" ? window.scrollY : 0,
  });

  const [inspector, setInspector] = useState({
    lastEvent: "none",
    target: "Window (Global)",
    data: {},
  });

  const [lifecycle, setLifecycle] = useState({
    domReady: typeof document !== "undefined" ? document.readyState !== "loading" : false,
    loaded: false,
    focused: typeof document !== "undefined" ? document.hasFocus() : true,
  });

  const [beforeUnloadActive, setBeforeUnloadActive] = useState(false);

  // Mobile-only inspector toggle
  const [showInspectorMobile, setShowInspectorMobile] = useState(false);

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

      setInspector((s) => ({
        ...s,
        lastEvent: "resize",
        target: "Window (Global)",
        data: { width: w, height: h, timeStamp: performance.now().toFixed(1) },
      }));

      sendEvent(`resize — ${w}x${h}`, "info");
    }

    function handleScroll() {
      const x = window.scrollX;
      const y = window.scrollY;
      setScroll({ x, y });

      setInspector((s) => ({
        ...s,
        lastEvent: "scroll",
        target: "Window (Global)",
        data: { scrollX: x, scrollY: y, timeStamp: performance.now().toFixed(1) },
      }));

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

    // Set initial lifecycle flags in case events already fired
    if (document.readyState !== "loading") {
      setLifecycle((s) => ({ ...s, domReady: true }));
    }
    window.addEventListener("load", () =>
      setLifecycle((s) => ({ ...s, loaded: true }))
    );

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);

    sendEvent("Window interaction lab initialized", "muted");

    // cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [beforeUnloadActive]);

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 text-slate-800 dark:bg-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* TITLE */}
        <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Window &amp; BOM Events
            </h2>
            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-400 max-w-2xl">
              Monitor viewport dimensions, scroll positions, and page lifecycle
              events in real-time by interacting with the browser window.
            </p>
          </div>

          {/* mobile inspector toggle (visible only on small screens) */}
          <div className="sm:hidden mt-2">
            <button
              onClick={() => setShowInspectorMobile((s) => !s)}
              aria-expanded={showInspectorMobile}
              className="inline-flex items-center gap-2 px-3 py-2 rounded bg-slate-50 border border-slate-200 text-slate-700 text-sm dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-200"
            >
              {showInspectorMobile ? "Hide Inspector" : "Show Inspector"}
            </button>
          </div>
        </div>

        {/* MAIN: primary panel(s). On md+ we show two columns; on mobile we stack */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT (main) */}
          <div className="rounded-xl border border-slate-200 bg-white dark:border-[#223649] dark:bg-slate-800/60 p-4 sm:p-6 flex flex-col gap-4 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                <span className="p-1 rounded bg-slate-50 dark:bg-slate-900/50 text-sky-600 dark:text-sky-400">
                  <MdDesktopWindows />
                </span>
                Window Interaction Lab
              </h3>

              <div className="hidden sm:flex gap-2">
                <span className="text-xs font-mono bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                  window
                </span>
                <span className="text-xs font-mono bg-slate-100 text-orange-700 dark:bg-slate-800/60 dark:text-orange-300 px-2 py-1 rounded border border-orange-200 dark:border-orange-400/40">
                  onresize
                </span>
                <span className="text-xs font-mono bg-slate-100 text-purple-700 dark:bg-slate-800/60 dark:text-purple-300 px-2 py-1 rounded border border-purple-200 dark:border-purple-400/40">
                  onscroll
                </span>
              </div>
            </div>

            {/* VIEWPORT + SCROLL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 flex flex-col gap-3 dark:bg-slate-900/40 dark:border-slate-700">
                <div className="text-xs text-slate-600 uppercase font-mono">
                  Viewport Size
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white break-words">
                  <span className="inline-block">{viewport.width}</span>
                  <span className="text-slate-400 mx-1">×</span>
                  <span className="inline-block">{viewport.height}</span>
                </div>
                <div className="text-xs sm:text-sm text-sky-600 flex items-center gap-1 dark:text-sky-400">
                  <span className="w-2 h-2 rounded-full bg-sky-600 dark:bg-sky-400" />
                  Monitoring changes…
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 flex flex-col gap-3 dark:bg-slate-900/40 dark:border-slate-700">
                <div className="text-xs text-slate-600 uppercase font-mono">
                  Scroll Position
                </div>
                <div className="flex justify-between text-slate-900 font-semibold dark:text-white text-lg sm:text-xl">
                  <div>
                    <span className="text-xs text-slate-500 block">X-Axis</span>
                    <span className="block break-words">{scroll.x}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Y-Axis</span>
                    <span className="block break-words">{scroll.y}</span>
                  </div>
                </div>
                <div className="h-2 rounded bg-slate-200 overflow-hidden dark:bg-slate-700">
                  <div
                    className="h-full bg-sky-500 transition-all duration-200"
                    style={{ width: `${Math.min(scroll.y / 5, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* STATE */}
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex flex-wrap gap-3 items-center dark:bg-slate-900/40 dark:border-slate-700">
              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <MdCheckCircle className="text-emerald-600" />
                DOM Ready
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <MdCheckCircle className="text-emerald-600" />
                Window Loaded
              </div>
              <div className="text-xs px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-300">
                STATE:{" "}
                <span className="text-emerald-600 font-semibold dark:text-emerald-400">
                  {lifecycle.focused ? "Focused" : "Blurred"}
                </span>
              </div>
            </div>

            {/* CONTROLS: stacked on mobile, inline on sm+ */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="inline-flex items-center gap-2 px-3 py-2 rounded bg-slate-50 border border-slate-200 text-slate-700 text-sm dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-200 w-full sm:w-auto justify-center"
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
                className="inline-flex items-center gap-2 px-3 py-2 rounded bg-slate-50 border border-slate-200 text-slate-700 text-sm dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-200 w-full sm:w-auto justify-center"
              >
                <MdArrowDownward /> Scroll Bottom
              </button>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded bg-slate-50 border border-slate-200 text-slate-700 text-sm dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-200 w-full sm:w-auto justify-center"
              >
                <MdPrint /> Print Window
              </button>
            </div>

            <div>
              <button
                onClick={() => setBeforeUnloadActive((s) => !s)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded border text-sm w-full sm:w-auto ${
                  beforeUnloadActive
                    ? "bg-amber-100 border-amber-300 text-amber-700"
                    : "bg-slate-50 border border-slate-200 text-slate-700 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-300"
                } justify-center`}
              >
                <MdWarningAmber />
                onbeforeunload {beforeUnloadActive ? "active" : "inactive"}
              </button>
            </div>
          </div>

          {/* EVENT INSPECTOR - on md+ it's always visible; on mobile it is collapsible */}
          <div
            className={`rounded-xl border border-slate-200 bg-white dark:border-[#223649] dark:bg-slate-800/60 p-4 transition-colors duration-200 ${
              // if mobile and not shown, hide visually but keep in DOM for smooth toggle
              !showInspectorMobile ? "hidden sm:flex" : "flex"
            } flex-col gap-3`}
            aria-hidden={!showInspectorMobile && window.innerWidth < 640}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono text-slate-600 dark:text-slate-400">
                EVENT INSPECTOR
              </div>
              <div className="hidden sm:block text-xs text-slate-500">
                Live
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Last Event Type</div>
              <div className="text-sky-600 font-semibold dark:text-sky-400 break-words">
                {inspector.lastEvent}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Target</div>
              <div className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 font-mono dark:bg-slate-900/40 dark:border-slate-700 dark:text-slate-300 break-words">
                {inspector.target}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Captured Data</div>
              <pre
                className="bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-700 overflow-auto max-h-40 md:max-h-60 dark:bg-slate-900/40 dark:border-slate-700 dark:text-slate-200"
                aria-live="polite"
              >
{JSON.stringify(inspector.data, null, 2)}
              </pre>
            </div>

            <div className="mt-2 text-xs text-slate-700 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-300">
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
