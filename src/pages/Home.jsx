import React, { useEffect, useRef, useState } from "react";
import { FaMouse } from "react-icons/fa";
import {
  MdMouse,
  MdLoop,
  MdRemoveRedEye,
  MdOpenWith,
  MdIndeterminateCheckBox,
  MdBolt,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
} from "react-icons/md";

export default function Home() {
  const wheelRef = useRef(null);

  useEffect(() => {
    const el = wheelRef.current;
    if (!el) return;

    // Non-passive listener so we can call preventDefault()
    const onWheel = (e) => {
      // normal scrolling inside the element is allowed
      // but if we're at the top and scrolling up, or at the bottom and scrolling down,
      // preventDefault so the page doesn't scroll.
      const delta = e.deltaY;
      const atTop = el.scrollTop === 0;
      const atBottom =
        Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight;

      if ((delta < 0 && atTop) || (delta > 0 && atBottom)) {
        e.preventDefault();
        e.stopPropagation();
      }
      // else allow the element to scroll normally
    };

    el.addEventListener("wheel", onWheel, { passive: false });

    // Also helpful on some touch devices: ensure touch move won't chain (modern browsers + Tailwind's overscroll helps too)
    // (We do not add touchmove preventDefault here to avoid interfering with native behaviour; overscroll-contain is preferred.)

    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const sendEvent = (text, type = "info") => {
    window.dispatchEvent(
      new CustomEvent("eventstream", { detail: { text, type } })
    );
  };

  const sendLiveSource = (code) => {
    window.dispatchEvent(new CustomEvent("live-source", { detail: { code } }));
  };

  const [activeCard, setActiveCard] = useState(null);
  const activeTimeoutRef = useRef(null);
  function activateCard(id, text, type = "info", duration = 1800) {
    if (activeTimeoutRef.current) clearTimeout(activeTimeoutRef.current);
    setActiveCard(id);
    sendEvent(text, type);
    activeTimeoutRef.current = setTimeout(() => {
      setActiveCard(null);
      activeTimeoutRef.current = null;
    }, duration);
  }

  const [visual, setVisual] = useState({});
  const visualTimers = useRef({});
  function flashVisual(id, duration = 420) {
    if (visualTimers.current[id]) clearTimeout(visualTimers.current[id]);
    setVisual((s) => ({ ...s, [id]: true }));
    visualTimers.current[id] = setTimeout(() => {
      setVisual((s) => {
        const copy = { ...s };
        delete copy[id];
        return copy;
      });
      delete visualTimers.current[id];
    }, duration);
  }

  // persistent pressed UI state for the "Press and Release" button
  const [pressed, setPressed] = useState(false);

  // pointerId per control & dbl timer
  const pointerDownRef = useRef({});
  const dblClickClickTimer = useRef(null);

  // suppression window: while set, other controls (like Trigger Action) ignore presses/releases
  const suppressUntilRef = useRef(0);

  // helper: release pointer capture safely
  const releasePointerCaptureSafe = (el, id) => {
    try {
      if (el && typeof el.releasePointerCapture === "function")
        el.releasePointerCapture(id);
    } catch (err) {}
  };

  useEffect(() => {
    // Intercept low-level input events during suppression window (capture phase)
    const intercept = (e) => {
      if (Date.now() < suppressUntilRef.current) {
        // Prevent any synthetic mouse/click from reaching siblings
        try {
          if (e.cancelable) e.preventDefault();
        } catch (err) {}
        try {
          e.stopPropagation();
        } catch (err) {}
        try {
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        } catch (err) {}
      }
    };

    window.addEventListener("pointerdown", intercept, true);
    window.addEventListener("mousedown", intercept, true);
    window.addEventListener("click", intercept, true);

    return () => {
      window.removeEventListener("pointerdown", intercept, true);
      window.removeEventListener("mousedown", intercept, true);
      window.removeEventListener("click", intercept, true);
    };
  }, []);

  // Hold timers (for press-and-hold)
  const holdTimers = useRef({}); // { [id]: { timeout, interval, started, count, pointerId } }

  function startHold(id, e, opts = {}) {
    const { firstDelay = 500, repeatInterval = 150 } = opts;
    // store pointer id
    pointerDownRef.current[id] = e.pointerId ?? "mouse";
    try {
      if (e.currentTarget && e.currentTarget.setPointerCapture) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    } catch (err) {}

    // visual feedback immediately
    flashVisual(id);

    // prepare container
    const container = {};
    holdTimers.current[id] = container;
    container.pointerId = pointerDownRef.current[id];
    container.started = false;
    container.count = 0;

    // schedule first hold start
    container.timeout = setTimeout(() => {
      container.started = true;
      container.count = 0;
      activateCard(id, `> hold start`, "warning");
      flashVisual(id);
      // begin repeating ticks
      container.interval = setInterval(() => {
        container.count += 1;
        activateCard(id, `> hold (${container.count})`, "warning", 700);
        flashVisual(id, 220);
      }, repeatInterval);
    }, firstDelay);
  }

  function stopHold(id, e) {
    const container = holdTimers.current[id];
    // if nothing scheduled, ignore
    if (!container) {
      pointerDownRef.current[id] = null;
      releasePointerCaptureSafe(e.currentTarget, e.pointerId);
      return;
    }

    // clear timers
    if (container.timeout) clearTimeout(container.timeout);
    if (container.interval) clearInterval(container.interval);

    const wasStarted = container.started;
    delete holdTimers.current[id];
    pointerDownRef.current[id] = null;
    releasePointerCaptureSafe(e.currentTarget, e.pointerId);

    if (wasStarted) {
      // ended a hold
      activateCard(id, "> release (after hold)", "success");
      flashVisual(id);
    } else {
      // wasn't a hold — treat as a normal quick click
      // but respect suppression window if set
      if (Date.now() < suppressUntilRef.current) {
        return;
      }
      activateCard("click", "> click", "success");
      flashVisual("btn-click");
    }
  }

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (activeTimeoutRef.current) clearTimeout(activeTimeoutRef.current);
      if (dblClickClickTimer.current) clearTimeout(dblClickClickTimer.current);
      Object.values(visualTimers.current).forEach((t) => clearTimeout(t));
      Object.values(holdTimers.current).forEach((c) => {
        if (c.timeout) clearTimeout(c.timeout);
        if (c.interval) clearInterval(c.interval);
      });
      visualTimers.current = {};
      holdTimers.current = {};
    };
  }, []);

  // mousemove throttling
  const lastMoveRef = useRef(0);
  const handleMouseMove = (e) => {
    const now = Date.now();
    if (now - lastMoveRef.current < 200) return;
    lastMoveRef.current = now;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    activateCard("mousemove", `> mousemove at (${x}, ${y})`, "info");
  };

  const isPressingRef = useRef(false);
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (!isPressingRef.current) return;

      // clear pressing flags AND clear persistent UI
      isPressingRef.current = false;
      setPressed(false);

      activateCard("mousedown", "> mouseup", "success");
      // don't use flashVisual for sustained pressed UI — the persistent state handles it
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("pointerup", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("pointerup", handleGlobalMouseUp);
    };
  }, []);
  const handleWheel = (e) => {
    activateCard("wheel", `> wheel deltaY: ${Math.round(e.deltaY)}`, "info");
  };

  const snippets = {
    click: `// click handler\nconst btn = document.querySelector("#btn-click");\nbtn.addEventListener("click", () => console.log("Button clicked!"));`,
    dblclick: `// dblclick handler\nconst card = document.querySelector(".dbl-card");\ncard.addEventListener("dblclick", () => console.log("Double clicked!"));`,
    mouseover: `// mouseover/mouseout\nconst box = document.querySelector(".hover-card");\nbox.addEventListener("mouseover", () => console.log("mouseover"));\nbox.addEventListener("mouseout", () => console.log("mouseout"));`,
    contextmenu: `$("#ctx-target").on("contextmenu", function(e) {\n  e.preventDefault();\n  const el = $(this);\n  el.addClass("ring-2 ring-red-500");\n  console.log("Right-click detected!");\n});`,
    mousedown: `// mousedown / mouseup\nconst el = document.querySelector(".press-area");\nel.addEventListener("mousedown", () => console.log("mousedown"));\nel.addEventListener("mouseup", () => console.log("mouseup"));`,
    enterleave: `// mouseenter / mouseleave\nconst area = document.querySelector(".enter-area");\narea.addEventListener('mouseenter', () => console.log('mouseenter'));\narea.addEventListener('mouseleave', () => console.log('mouseleave'));`,
    wheel: `// wheel event\nconst card = document.querySelector(".wheel-card");\ncard.addEventListener("wheel", (e) => console.log("wheel deltaY:", e.deltaY));`,
    auxclick: `// auxclick (middle button)\nconst mid = document.querySelector(".aux-card");\nmid.addEventListener("auxclick", (e) => console.log("auxclick button:", e.button));`,
  };

  return (
    <main className="flex-1 overflow-y-auto custom-scrollbar dark:bg-background-dark text-slate-800 dark:text-slate-100 p-6 lg:p-10 transition-colors duration-200">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            DOM & jQuery Playground
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Interact with elements below to trigger events. Observe the console
            for real-time code output.
          </p>
        </div>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
              <FaMouse className="text-sky-500 dark:text-sky-400" size={25} />
              Mouse Interaction Lab
            </h3>
            <div className="flex gap-2">
              <span className="text-xs font-mono bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                MouseEvent
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Single Click with Hold support */}
            <div
              className="rounded-xl border border-slate-200 bg-white dark:border-[#223649] dark:bg-slate-800/60 p-6 flex flex-col items-center justify-center gap-4 relative group transition-colors duration-200"
              onMouseEnter={() => sendLiveSource(snippets.click)}
              onFocus={() => sendLiveSource(snippets.click)}
              tabIndex={0}
            >
              <div
                className={`absolute top-3 right-3 transition-opacity ${
                  activeCard === "click"
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Event: click / hold
                </span>
              </div>

              <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-900/60 text-sky-600 mb-1 flex items-center justify-center">
                <MdMouse size={28} />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white">
                Single Click
              </h4>

              <button
                id="btn-click"
                style={{
                  WebkitTapHighlightColor: "transparent",
                  userSelect: "none",
                  touchAction: "manipulation",
                }}
                className={`select-none cursor-pointer bg-white border-2 border-dashed border-slate-200 text-slate-700 text-sm font-medium py-2 px-6 rounded-lg active:scale-95 transition-all w-full md:w-auto text-center focus:outline-none focus:ring-0 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-300 ${
                  visual["dblclick"] ? "scale-95 shadow-inner transform" : ""
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (Date.now() < suppressUntilRef.current) return;
                }}
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  // if a suppression window is active (another control recently acted), ignore this press
                  if (Date.now() < suppressUntilRef.current) {
                    try {
                      e.preventDefault();
                      e.stopPropagation();
                    } catch (err) {}
                    return;
                  }
                  // start hold logic; quick release will be treated as click in stopHold
                  startHold("btn-click", e, {
                    firstDelay: 500,
                    repeatInterval: 150,
                  });
                }}
                onPointerUp={(e) => {
                  if (e.button !== 0) return;
                  // if suppression window active, ignore
                  if (Date.now() < suppressUntilRef.current) {
                    // ensure we clean up possible hold timers
                    if (holdTimers.current["btn-click"]) {
                      if (holdTimers.current["btn-click"].timeout)
                        clearTimeout(holdTimers.current["btn-click"].timeout);
                      if (holdTimers.current["btn-click"].interval)
                        clearInterval(holdTimers.current["btn-click"].interval);
                      delete holdTimers.current["btn-click"];
                    }
                    pointerDownRef.current["btn-click"] = null;
                    releasePointerCaptureSafe(e.currentTarget, e.pointerId);
                    return;
                  }
                  stopHold("btn-click", e);
                }}
                onPointerCancel={(e) => {
                  // cancel hold
                  if (holdTimers.current["btn-click"]) {
                    if (holdTimers.current["btn-click"].timeout)
                      clearTimeout(holdTimers.current["btn-click"].timeout);
                    if (holdTimers.current["btn-click"].interval)
                      clearInterval(holdTimers.current["btn-click"].interval);
                    delete holdTimers.current["btn-click"];
                  }
                  pointerDownRef.current["btn-click"] = null;
                  releasePointerCaptureSafe(e.currentTarget, e.pointerId);
                }}
                onMouseDown={(e) => {
                  if (e.button === 0) {
                    if (Date.now() < suppressUntilRef.current) return;
                    flashVisual("btn-click");
                  }
                }}
                onMouseUp={(e) => {
                  if (e.button === 0) flashVisual("btn-click");
                }}
                onMouseEnter={() => sendLiveSource(snippets.click)}
                aria-pressed={false}
              >
                Trigger Action
              </button>

              <p className="text-xs text-slate-600 dark:text-slate-400 text-center max-w-[200px]">
                Tap quickly to click, or press-and-hold to enter a repeating
                hold state — release to finish.
              </p>
            </div>

            {/* Double Click */}
            <div
              className="rounded-xl border border-slate-200 bg-white dark:border-[#223649] dark:bg-slate-800/60 p-6 flex flex-col items-center justify-center gap-4 relative group transition-colors duration-200"
              onMouseEnter={() => sendLiveSource(snippets.dblclick)}
              tabIndex={0}
            >
              <div
                className={`absolute top-3 right-3 transition-opacity ${
                  activeCard === "dblclick"
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Event: dblclick
                </span>
              </div>
              <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-900/60 text-purple-500 mb-1 flex items-center justify-center">
                <MdLoop size={28} />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white">
                Double Click
              </h4>

              <div
                role="button"
                tabIndex={0}
                style={{
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "transparent",
                  userSelect: "none",
                }}
                className="select-none cursor-pointer bg-white border-2 border-dashed border-slate-200 text-slate-700 text-sm font-medium py-2 px-6 rounded-lg active:scale-95 transition-all w-full md:w-auto text-center focus:outline-none focus:ring-0 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-300"
                onPointerDown={(e) => {
                  if (e.button !== 0) return;

                  // stop propagation and the browser's default synthesis as early as possible
                  try {
                    e.stopPropagation();
                  } catch (err) {}
                  try {
                    if (e.cancelable) e.preventDefault();
                  } catch (err) {}

                  // set suppression immediately
                  suppressUntilRef.current = Date.now() + 500;

                  pointerDownRef.current["dbl"] = e.pointerId ?? "mouse";
                  try {
                    if (e.currentTarget && e.currentTarget.setPointerCapture) {
                      e.currentTarget.setPointerCapture(e.pointerId);
                    }
                  } catch (err) {}

                  // for extra safety on touch
                  if (e.pointerType === "touch") {
                    try {
                      e.preventDefault();
                    } catch (err) {}
                  }
                }}
                onPointerUp={(e) => {
                  if (e.button !== 0) return;

                  // stop events reaching siblings
                  try {
                    e.stopPropagation();
                  } catch (err) {}
                  try {
                    if (e.cancelable) e.preventDefault();
                  } catch (err) {}

                  const started = pointerDownRef.current["dbl"];
                  const thisId = e.pointerId ?? "mouse";

                  if (started != null && started === thisId) {
                    // keep the suppression short but present for synthetic events
                    suppressUntilRef.current = Date.now() + 350;

                    // cancel/queue single-click fallback like before...
                    if (dblClickClickTimer.current) {
                      clearTimeout(dblClickClickTimer.current);
                      dblClickClickTimer.current = null;
                    }
                    dblClickClickTimer.current = setTimeout(() => {
                      activateCard("dblclick", "> click (single)", "info");
                      flashVisual("dblclick");
                      dblClickClickTimer.current = null;
                    }, 220);
                  }

                  pointerDownRef.current["dbl"] = null;
                  releasePointerCaptureSafe(e.currentTarget, e.pointerId);
                }}
                onPointerCancel={(e) => {
                  pointerDownRef.current["dbl"] = null;
                  if (dblClickClickTimer.current) {
                    clearTimeout(dblClickClickTimer.current);
                    dblClickClickTimer.current = null;
                  }
                  releasePointerCaptureSafe(e.currentTarget, e.pointerId);
                }}
                onDoubleClick={(e) => {
                  // real dblclick -> cancel single-click and run dbl action
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
                    e.nativeEvent.stopImmediatePropagation();
                  }
                  if (dblClickClickTimer.current) {
                    clearTimeout(dblClickClickTimer.current);
                    dblClickClickTimer.current = null;
                  }

                  // suppress siblings briefly (protect against synthetic events)
                  suppressUntilRef.current = Date.now() + 350;

                  activateCard("dblclick", "> dblclick", "success");
                  flashVisual("dblclick");
                }}
                onMouseEnter={() => sendLiveSource(snippets.dblclick)}
              >
                Double Tap Here
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 text-center max-w-[200px]">
                Fires when a pointing device button is clicked twice rapidly.
              </p>
            </div>

            {/* Hover Effects */}
            <div
              className="rounded-xl border border-slate-200 bg-white dark:border-[#223649] dark:bg-slate-800/60 p-6 flex flex-col items-center justify-center gap-4 relative group transition-colors duration-200"
              onMouseEnter={() => sendLiveSource(snippets.mouseover)}
              tabIndex={0}
            >
              <div
                className={`absolute top-3 right-3 transition-opacity ${
                  activeCard === "mouseover"
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Event: mouseover / mouseout
                </span>
              </div>
              <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-900/60 text-amber-500 mb-1">
                <MdRemoveRedEye size={28} />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white">
                Hover Effects
              </h4>
              <div
                className={`relative w-full md:w-48 h-12 bg-white border border-slate-200 rounded-lg overflow-hidden cursor-pointer hover:bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700 dark:hover:bg-slate-700/50 transition-colors duration-200 ${
                  visual["mouseover"] ? "scale-95" : ""
                }`}
                onMouseEnter={() => {
                  activateCard("mouseover", "> mouseover", "info");
                  sendLiveSource(snippets.mouseover);
                }}
                onMouseLeave={() => sendEvent("> mouseout")}
                onClick={() =>
                  activateCard(
                    "mouseover",
                    "> click/hover triggered",
                    "success"
                  )
                }
              >
                <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-slate-700 dark:text-slate-300 transition-transform duration-300 select-none">
                  Mouse Over Me
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 text-center max-w-[200px]">
                Triggers <code className="not-italic">mouseover</code> on entry
                and <code className="not-italic">mouseout</code> on exit.
              </p>
            </div>

            {/* Context Menu */}
            <div
              className="rounded-xl border border-slate-200 bg-white dark:border-[#223649] dark:bg-slate-800/60 p-6 flex flex-col items-center justify-center gap-4 relative group transition-colors duration-200"
              onMouseEnter={() => sendLiveSource(snippets.contextmenu)}
              tabIndex={0}
            >
              <div
                className={`absolute top-3 right-3 transition-opacity ${
                  activeCard === "contextmenu"
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Event: contextmenu
                </span>
              </div>
              <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-900/60 text-red-500 mb-1">
                <MdIndeterminateCheckBox size={28} />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white">
                Context Menu
              </h4>
              <div
                id="ctx-target"
                className={`w-full md:w-auto cursor-context-menu bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium py-2 px-6 rounded-lg transition-all text-center select-none focus:outline-none dark:bg-slate-800/50 dark:border-slate-700 dark:hover:bg-slate-700/50 ${
                  visual["contextmenu"] ? "ring-2 ring-red-500" : ""
                }`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  activateCard(
                    "contextmenu",
                    "> contextmenu (right-click) captured!",
                    "warning"
                  );
                  flashVisual("contextmenu");
                }}
                onMouseEnter={() => sendLiveSource(snippets.contextmenu)}
              >
                Right Click Me
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 text-center max-w-[200px]">
                Fires when the user attempts to open a context menu (right
                click).
              </p>
            </div>

            {/* Mouse Move (large box) */}
            <div
              className="rounded-xl border border-slate-200 bg-white dark:border-[#223649] dark:bg-slate-800/60 p-6 flex flex-col items-center justify-center gap-4 transition-colors duration-200"
              onMouseMove={handleMouseMove}
              onMouseEnter={() => sendLiveSource(snippets.mouseover)}
            >
              <div className="flex items-center gap-4">
                <MdOpenWith
                  size={22}
                  className="text-sky-500 dark:text-sky-400"
                />
                <div className="text-slate-700 dark:text-slate-300">
                  Move mouse here
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 text-center max-w-[240px]">
                Mouse move events are throttled and streamed to the event
                console.
              </p>
            </div>

            {/* Mouse Down / Up */}
            <div
              className="rounded-xl border border-slate-200 bg-white dark:border-[#223649] dark:bg-slate-800/60 p-6 flex flex-col items-center justify-center gap-4 transition-colors duration-200"
              onMouseEnter={() => sendLiveSource(snippets.mousedown)}
              tabIndex={0}
            >
              <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-900/60 text-sky-500 mb-1">
                <MdKeyboardArrowDown size={28} />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white">
                Mouse Down / Up
              </h4>
              <div
                role="button"
                tabIndex={0}
                className={`w-full md:w-auto bg-white border border-slate-200 text-slate-700 text-sm font-medium py-2 px-6 rounded-lg transition-all text-center select-none cursor-pointer ${
                  pressed ? "scale-95 shadow-inner" : ""
                } dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-300`}
                onMouseDown={(e) => {
                  if (e.button !== 0) return;
                  isPressingRef.current = true;
                  setPressed(true);
                  activateCard("mousedown", "> mousedown", "info");
                }}
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  isPressingRef.current = true;
                  setPressed(true);
                  activateCard("mousedown", "> mousedown", "info");
                }}
              >
                Press and Release
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 text-center max-w-[220px]">
                Demonstrates <code className="not-italic">mousedown</code>{" "}
                (press) and <code className="not-italic">mouseup</code>{" "}
                (release).
              </p>
            </div>

            {/* Mouse Enter / Leave */}
            <div
              className="rounded-xl border border-slate-200 bg-white dark:border-[#223649] dark:bg-slate-800/60 p-6 flex flex-col items-center justify-center gap-4 transition-colors duration-200"
              onMouseEnter={() => sendLiveSource(snippets.enterleave)}
              tabIndex={0}
            >
              <div
                className={`absolute top-3 right-3 transition-opacity ${
                  activeCard === "enterleave" ? "opacity-100" : "opacity-0"
                }`}
              >
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Event: mouseenter / mouseleave
                </span>
              </div>
              <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-900/60 text-amber-500 mb-1">
                <MdKeyboardArrowUp size={28} />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white">
                Mouse Enter / Leave
              </h4>
              <div
                className="relative w-full md:w-48 h-12 bg-white rounded-lg overflow-hidden cursor-pointer flex items-center justify-center text-sm font-medium text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 select-none"
                onMouseEnter={() => {
                  activateCard("enterleave", "> mouseenter", "info");
                  flashVisual("enterleave");
                }}
                onMouseLeave={() => sendEvent("> mouseleave")}
              >
                Enter / Leave Area
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 text-center max-w-[220px]">
                Demonstrates <code className="not-italic">mouseenter</code> and{" "}
                <code className="not-italic">mouseleave</code> (do not bubble).
              </p>
            </div>

            {/* Wheel (SCROLLABLE CARD) */}
            <div
              className="rounded-xl border border-slate-200 bg-white dark:border-[#223649] dark:bg-slate-800/60 p-6 flex flex-col items-center justify-center gap-4 transition-colors duration-200"
              onWheel={handleWheel}
              onMouseEnter={() => sendLiveSource(snippets.wheel)}
            >
              <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-900/60 text-purple-500 mb-1">
                <MdBolt size={28} />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white">
                Wheel
              </h4>

              {/* Minimal "old" visual preserved — just make it scrollable */}
              <div
                ref={wheelRef}
                className="w-full md:w-auto bg-white border border-slate-200 text-slate-700 text-sm font-medium py-2 px-6 rounded-lg overflow-y-auto dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-300"
                style={{
                  maxHeight: "9rem", // controls when it becomes scrollable; tweak if you want taller/shorter
                  overscrollBehavior: "contain", // prevent scroll chaining
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {/* Keep content minimal — but include a few lines so it's scrollable */}
                <div className="space-y-1">
                  <div>Scroll inside this card</div>
                  <div>Line 2 — try wheel / trackpad</div>
                  <div>Line 3 — keep scrolling</div>
                  <div>Line 4 — almost there</div>
                  <div>Line 5 — keep going</div>
                  <div>Line 6 — end</div>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 text-center max-w-[240px]">
                Same old look — but now you can scroll inside. Page shouldn't
                move when you reach the edges.
              </p>
            </div>

            {/* Auxclick */}
            <div
              className="rounded-xl border border-slate-200 bg-white dark:border-[#223649] dark:bg-slate-800/60 p-6 flex flex-col items-center justify-center gap-4 transition-colors duration-200"
              onMouseEnter={() => sendLiveSource(snippets.auxclick)}
              tabIndex={0}
            >
              <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-900/60 text-sky-500 mb-1">
                <MdMouse size={28} />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white">
                Aux Click (middle)
              </h4>
              <div
                role="button"
                tabIndex={0}
                className={`w-full md:w-auto cursor-pointer bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium py-2 px-6 rounded-lg transition-all text-center select-none ${
                  visual["auxclick"] ? "ring-2 ring-sky-400" : ""
                } dark:bg-slate-800/50 dark:border-slate-700 dark:hover:bg-slate-700/50 dark:text-slate-300`}
                onAuxClick={(e) => {
                  e.preventDefault();
                  activateCard(
                    "auxclick",
                    `> auxclick (button=${e.button})`,
                    "warning"
                  );
                  flashVisual("auxclick");
                }}
                onMouseDown={(e) => {
                  if (e.button === 1) {
                    e.preventDefault();
                    activateCard(
                      "auxclick",
                      `> auxclick (button=${e.button})`,
                      "warning"
                    );
                    flashVisual("auxclick");
                  }
                }}
                onClick={() =>
                  activateCard(
                    "auxclick",
                    "> click (primary) on aux card",
                    "info"
                  )
                }
              >
                Middle Click Me
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 text-center max-w-[220px]">
                Captures <code className="not-italic">auxclick</code> (commonly
                middle/mouse wheel click).
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
