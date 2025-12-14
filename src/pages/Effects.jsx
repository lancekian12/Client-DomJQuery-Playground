import React, { useCallback, useEffect, useRef, useState } from "react";
import { MdBlurOn, MdFlip, MdPlayArrow, MdQueue } from "react-icons/md";

/*
  Smooth slide fix:
   - Wrap panel content in #panelInner
   - Animate outer height (layout) + inner transform/opacity (GPU) together
   - transitionend on height used to resolve Promise
   - duration/easing read from refs
*/

function sendEvent(text, type = "info") {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent("eventstream", { detail: { text, type } }));
  } catch (e) {}
}

const EASING_MAP = {
  linear: "linear",
  ease: "ease",
  "ease-in": "ease-in",
  "ease-out": "ease-out",
  "ease-in-out": "ease-in-out",
  swing: "cubic-bezier(.42,.0,.58,1)",
};

export default function EffectsLiveCode() {
  const [duration, setDuration] = useState(400);
  const [easing, setEasing] = useState("swing");
  const [callbackStatus, setCallbackStatus] = useState("Idle");

  // keep latest values available inside async functions
  const durationRef = useRef(duration);
  const easingRef = useRef(easing);
  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { easingRef.current = easing; }, [easing]);

  const [queue, setQueue] = useState([]);
  const queueRef = useRef([]);
  const runningRef = useRef(false);
  const [runningCount, setRunningCount] = useState(0);

  const [activeEl, setActiveEl] = useState(null);
  const [currentOp, setCurrentOp] = useState(null);

  const nextTaskId = useRef(1);
  const initialStyles = useRef({});

  useEffect(() => {
    sendEvent("Animations demo ready", "muted");
    const ids = ["box1", "box2", "box3", "panelBox", "panelInner", "customStage"];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        const cs = window.getComputedStyle(el);
        initialStyles.current[id] = initialStyles.current[id] || {
          opacity: cs.opacity,
          transform: cs.transform === "none" ? "" : cs.transform,
          height: cs.height,
          left: el.style.left || "",
          top: el.style.top || "",
          display: cs.display || "block",
        };
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyStyleNextFrame(fn) {
    requestAnimationFrame(() => requestAnimationFrame(fn));
  }

  function stopAll() {
    queueRef.current = [];
    setQueue([]);
    runningRef.current = false;
    setRunningCount(0);
    setActiveEl(null);
    setCurrentOp(null);
    ["box1", "box2", "box3", "panelBox", "panelInner", "customStage"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        const cs = window.getComputedStyle(el);
        try { el.style.transition = ""; } catch (e) {}
        el.style.opacity = cs.opacity;
        el.style.transform = cs.transform === "none" ? "" : cs.transform;
        el.style.height = cs.height;
        el.style.display = cs.display;
      }
    });
    sendEvent("Stopped all animations", "warning");
    setCallbackStatus("Stopped");
  }

  function restore(targetId) {
    const el = document.getElementById(targetId);
    if (!el) return;
    const base = initialStyles.current[targetId] || {};
    el.style.transition = "";
    el.style.opacity = base.opacity ?? "";
    el.style.transform = base.transform ?? "";
    el.style.height = base.height ?? "";
    el.style.left = base.left ?? "";
    el.style.top = base.top ?? "";
    el.style.display = base.display ?? "";
    sendEvent(`restored ${targetId}`, "info");
  }

  // animateHeight now optionally coordinates an inner element transform/opacity animation
  function animateHeightWithInner(node, innerNode, from, to) {
    return new Promise((resolve) => {
      const dur = durationRef.current;
      const easingStr = EASING_MAP[easingRef.current] || easingRef.current;

      // Outer: height (layout)
      node.style.overflow = "hidden";
      node.style.willChange = "height";

      // Inner: transform + opacity (GPU)
      if (innerNode) {
        innerNode.style.willChange = "transform, opacity";
        // make sure inner starts at neutral position (no vertical offset) when expanding
        innerNode.style.transition = `transform ${dur}ms ${easingStr}, opacity ${dur}ms ${easingStr}`;
      }

      // Set starting height without transition
      node.style.transition = "";
      node.style.height = from;

      // force reflow
      void node.offsetHeight;

      // For visual smoothness: if we're expanding, set inner initially slightly up and faded (so it can slide in),
      // if collapsing, inner starts at neutral and will slide up/fade.
      if (innerNode) {
        applyStyleNextFrame(() => {
          if (from === "0px" || from === "0") {
            // we are expanding: start inner slightly up & invisible so it animates into place
            innerNode.style.transform = "translateY(-8px)";
            innerNode.style.opacity = "0";
            // force repaint for inner
            void innerNode.offsetHeight;
          } else {
            // collapsing: ensure inner is neutral before starting height animation
            innerNode.style.transform = "translateY(0)";
            innerNode.style.opacity = "1";
            void innerNode.offsetHeight;
          }
        });
      }

      // Enable height transition then change target
      node.style.transition = `height ${dur}ms ${easingStr}`;

      // on next RAF set the target height
      requestAnimationFrame(() => {
        node.style.height = to;
        // start inner animation slightly after height starts to look natural
        if (innerNode) {
          requestAnimationFrame(() => {
            // expanding: animate to neutral; collapsing: animate to slightly up + hide
            if (from === "0px" || from === "0") {
              innerNode.style.transform = "translateY(0)";
              innerNode.style.opacity = "1";
            } else {
              innerNode.style.transform = "translateY(-8px)";
              innerNode.style.opacity = "0";
            }
          });
        }
      });

      let done = false;
      function onEnd(e) {
        if (e && e.propertyName !== "height") return;
        if (done) return;
        done = true;
        node.removeEventListener("transitionend", onEnd);
        // clean up
        node.style.transition = "";
        node.style.willChange = "";
        if (innerNode) {
          innerNode.style.transition = "";
          innerNode.style.willChange = "";
        }
        resolve();
      }
      node.addEventListener("transitionend", onEnd, { passive: true });

      // safety fallback
      setTimeout(() => {
        if (done) return;
        done = true;
        node.removeEventListener("transitionend", onEnd);
        node.style.transition = "";
        node.style.willChange = "";
        if (innerNode) {
          innerNode.style.transition = "";
          innerNode.style.willChange = "";
        }
        resolve();
      }, dur + 100);
    });
  }

  function applyTask(task) {
    const { target, op, params } = task;
    const el = target ? document.getElementById(target) : null;

    if (!el && op !== "queueDelay" && !op.startsWith("batch")) {
      sendEvent(`target ${target} not found`, "warning");
      return Promise.resolve();
    }

    if (el && !initialStyles.current[target]) {
      const cs = window.getComputedStyle(el);
      initialStyles.current[target] = {
        opacity: cs.opacity,
        transform: cs.transform === "none" ? "" : cs.transform,
        height: cs.height,
        left: el.style.left || "",
        top: el.style.top || "",
        display: cs.display || "block",
      };
    }

    setActiveEl(target);
    setCurrentOp(op);
    setRunningCount((c) => c + 1);

    const easingStr = EASING_MAP[easingRef.current] || easingRef.current;

    function finish(reason = "done") {
      setTimeout(() => {
        try { if (el) el.style.transition = ""; } catch (e) {}
      }, 30);
      setRunningCount((c) => Math.max(0, c - 1));
      sendEvent(`${op} finished -> ${target ?? "batch"} (${reason})`, "success");
      setCallbackStatus(`Callback: ${op} ${reason}`);
    }

    const dur = () => durationRef.current;

    const setOpacity = (node, value) => {
      node.style.transition = `opacity ${dur()}ms ${easingStr}`;
      applyStyleNextFrame(() => (node.style.opacity = String(value)));
    };

    return new Promise((resolve) => {
      // batch ops
      if (op === "batchFadeOut") {
        const ids = ["box1", "box2", "box3"];
        ids.forEach((id) => {
          const n = document.getElementById(id);
          if (n) setOpacity(n, 0);
        });
        setTimeout(() => { finish("batch-faded"); resolve(); }, dur());
        return;
      }
      if (op === "batchFadeIn") {
        const ids = ["box1", "box2", "box3"];
        ids.forEach((id) => {
          const n = document.getElementById(id);
          if (n) setOpacity(n, 1);
        });
        setTimeout(() => { finish("batch-shown"); resolve(); }, dur());
        return;
      }
      if (op === "batchMoveTemp") {
        const ids = ["box1", "box2", "box3"];
        const half = Math.max(60, Math.round(dur() / 2));
        ids.forEach((id) => {
          const n = document.getElementById(id);
          if (!n) return;
          const baseTransform = initialStyles.current[id]?.transform ?? n.style.transform ?? "";
          n.style.transition = `transform ${half}ms ${easingStr}`;
          applyStyleNextFrame(() => { n.style.transform = "translateX(80px)"; });
          setTimeout(() => {
            n.style.transition = `transform ${half}ms ${easingStr}`;
            applyStyleNextFrame(() => { n.style.transform = baseTransform || ""; });
          }, half);
        });
        setTimeout(() => { finish("batch-moved"); resolve(); }, dur() + 20);
        return;
      }

      // queueDelay
      if (op === "queueDelay") {
        setTimeout(() => { finish("delay"); resolve(); }, dur());
        return;
      }

      // fade ops
      if (op === "fadeToggle") {
        const cur = parseFloat(window.getComputedStyle(el).opacity || "1");
        const show = cur < 0.5;
        setOpacity(el, show ? 1 : 0);
        setTimeout(() => { finish(show ? "shown" : "hidden"); resolve(); }, dur());
        return;
      }
      if (op === "fadeIn") {
        setOpacity(el, 1);
        setTimeout(() => { finish("shown"); resolve(); }, dur());
        return;
      }
      if (op === "fadeOut") {
        setOpacity(el, 0);
        setTimeout(() => { finish("hidden"); resolve(); }, dur());
        return;
      }

      // SLIDE: use the inner wrapper (#panelInner) for GPU movement while height animates
      if (op === "slideUp") {
        // el === panelBox expected; find inner
        const inner = document.getElementById(`${target}Inner`) || document.getElementById("panelInner") || null;
        el.style.display = initialStyles.current[target]?.display || "block";
        void el.offsetHeight;
        const full = `${el.scrollHeight}px` || initialStyles.current[target]?.height || "0px";
        // animate height & inner transform/opacity
        animateHeightWithInner(el, inner, full, "0px").then(() => {
          el.style.display = "none";
          el.style.height = "";
          if (inner) { inner.style.transform = ""; inner.style.opacity = ""; }
          finish("slid-up");
          resolve();
        });
        return;
      }
      if (op === "slideDown") {
        const inner = document.getElementById(`${target}Inner`) || document.getElementById("panelInner") || null;
        el.style.display = initialStyles.current[target]?.display || "block";
        // explicit 0 start so height animation works
        el.style.height = "0px";
        void el.offsetHeight;
        const full = `${el.scrollHeight}px` || initialStyles.current[target]?.height || "72px";
        animateHeightWithInner(el, inner, "0px", full).then(() => {
          el.style.height = "";
          if (inner) { inner.style.transform = ""; inner.style.opacity = ""; }
          finish("slid-down");
          resolve();
        });
        return;
      }
      if (op === "slideToggle") {
        const inner = document.getElementById(`${target}Inner`) || document.getElementById("panelInner") || null;
        const cs = window.getComputedStyle(el);
        const curH = parseFloat(cs.height || "0");
        const isHidden = cs.display === "none" || curH < 2;
        if (isHidden) {
          el.style.display = initialStyles.current[target]?.display || "block";
          void el.offsetHeight;
          const full = `${el.scrollHeight}px` || initialStyles.current[target]?.height || "72px";
          animateHeightWithInner(el, inner, "0px", full).then(() => {
            el.style.height = "";
            if (inner) { inner.style.transform = ""; inner.style.opacity = ""; }
            finish("slid-down");
            resolve();
          });
        } else {
          void el.offsetHeight;
          const full = `${el.scrollHeight}px` || initialStyles.current[target]?.height || "72px";
          animateHeightWithInner(el, inner, full, "0px").then(() => {
            el.style.display = "none";
            el.style.height = "";
            if (inner) { inner.style.transform = ""; inner.style.opacity = ""; }
            finish("slid-up");
            resolve();
          });
        }
        return;
      }

      // movement ops (unchanged)
      if (op === "animateMoveRight") {
        const base = initialStyles.current[target]?.transform ?? window.getComputedStyle(el).transform ?? "";
        const half = Math.max(60, Math.round(dur() / 2));
        el.style.transition = `transform ${half}ms ${easingStr}`;
        applyStyleNextFrame(() => { el.style.transform = "translateX(80px)"; });
        setTimeout(() => {
          el.style.transition = `transform ${half}ms ${easingStr}`;
          applyStyleNextFrame(() => { el.style.transform = base || ""; });
        }, half);
        setTimeout(() => { finish("moved-right"); resolve(); }, dur() + 10);
        return;
      }
      if (op === "animateLeft") {
        const base = initialStyles.current[target]?.transform ?? window.getComputedStyle(el).transform ?? "";
        const half = Math.max(60, Math.round(dur() / 2));
        el.style.transition = `transform ${half}ms ${easingStr}`;
        applyStyleNextFrame(() => { el.style.transform = "translateX(-80px)"; });
        setTimeout(() => {
          el.style.transition = `transform ${half}ms ${easingStr}`;
          applyStyleNextFrame(() => { el.style.transform = base || ""; });
        }, half);
        setTimeout(() => { finish("moved-left"); resolve(); }, dur() + 10);
        return;
      }

      // toggleClass / stop / generic animate unchanged...
      if (op === "toggleClass") {
        el.classList.toggle("ring-4");
        const added = el.classList.contains("ring-4");
        if (added) el.style.boxShadow = "0 8px 24px rgba(96,165,250,0.12)"; else el.style.boxShadow = "";
        setTimeout(() => { finish(added ? "class-added" : "class-removed"); resolve(); }, 120);
        return;
      }

      if (op === "stop") {
        try { el.style.transition = ""; } catch (e) {}
        const cs = window.getComputedStyle(el);
        el.style.opacity = cs.opacity;
        el.style.transform = cs.transform === "none" ? "" : cs.transform;
        finish("stopped");
        resolve();
        return;
      }

      if (params && params.to) {
        const transitions = [];
        if (params.to.transform != null) transitions.push(`transform ${dur()}ms ${easingStr}`);
        if (params.to.opacity != null) transitions.push(`opacity ${dur()}ms ${easingStr}`);
        if (params.to.left != null) transitions.push(`left ${dur()}ms ${easingStr}`);
        if (params.to.top != null) transitions.push(`top ${dur()}ms ${easingStr}`);
        if (params.to.height != null) transitions.push(`height ${dur()}ms ${easingStr}`);
        if (transitions.length) el.style.transition = transitions.join(", ");
        applyStyleNextFrame(() => {
          Object.keys(params.to).forEach((k) => {
            if (k === "opacity") el.style.opacity = String(params.to[k]);
            if (k === "left") el.style.left = params.to[k];
            if (k === "top") el.style.top = params.to[k];
            if (k === "transform") el.style.transform = params.to[k];
            if (k === "height") el.style.height = params.to[k];
          });
        });
        setTimeout(() => { finish("animated"); resolve(); }, dur());
        return;
      }

      finish("no-op");
      resolve();
    });
  }

  async function runLoop() {
    if (runningRef.current) return;
    runningRef.current = true;
    setCallbackStatus("Running");

    while (queueRef.current.length > 0) {
      const task = queueRef.current.shift();
      setQueue([...queueRef.current]);
      if (!task) continue;
      setCallbackStatus(`Running: ${task.op}`);
      sendEvent(`running ${task.op} -> ${task.target ?? "batch"}`, "info");
      try {
        await applyTask(task);
      } catch (e) {
        console.error("applyTask error:", e);
      }
    }

    runningRef.current = false;
    setCallbackStatus("Idle");
    setActiveEl(null);
    setCurrentOp(null);
  }

  const enqueue = useCallback((targetId, op, params = {}) => {
    const task = { id: nextTaskId.current++, target: targetId, op, params };
    queueRef.current.push(task);
    setQueue([...queueRef.current]);
    setCallbackStatus("Queued");
    runLoop();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function makeTargetAndDuration(arg1, arg2, defaultTarget = "box1") {
      if (typeof arg1 === "string")
        return { target: arg1, dur: typeof arg2 === "number" ? arg2 : undefined };
      if (typeof arg1 === "number") return { target: defaultTarget, dur: arg1 };
      return { target: defaultTarget, dur: undefined };
    }

    window.myElement = {
      slideUp: (a, b) => {
        const { target, dur } = makeTargetAndDuration(a, b);
        if (typeof dur === "number") setDuration(dur);
        enqueue(target, "slideUp");
      },
      slideDown: (a, b) => {
        const { target, dur } = makeTargetAndDuration(a, b);
        if (typeof dur === "number") setDuration(dur);
        enqueue(target, "slideDown");
      },
      slideToggle: (a, b) => {
        const { target, dur } = makeTargetAndDuration(a, b);
        if (typeof dur === "number") setDuration(dur);
        enqueue(target, "slideToggle");
      },
      fadeToggle: (a) => { const target = typeof a === "string" ? a : "box1"; enqueue(target, "fadeToggle"); },
      fadeIn: (a) => { const target = typeof a === "string" ? a : "box1"; enqueue(target, "fadeIn"); },
      fadeOut: (a) => { const target = typeof a === "string" ? a : "box1"; enqueue(target, "fadeOut"); },
      animate: (a, params = {}, dur) => {
        const target = typeof a === "string" ? a : "box1";
        if (typeof dur === "number") setDuration(dur);
        enqueue(target, "animate", { to: params.to || params });
      },
      animateMoveRight: (a, b) => {
        const { target, dur } = makeTargetAndDuration(a, b);
        if (typeof dur === "number") setDuration(dur);
        enqueue(target, "animateMoveRight");
      },
      animateLeft: (a, b) => {
        const { target, dur } = makeTargetAndDuration(a, b);
        if (typeof dur === "number") setDuration(dur);
        enqueue(target, "animateLeft");
      },
      chainAllGrouped: () => {
        enqueue(null, "batchFadeOut");
        enqueue(null, "queueDelay");
        enqueue(null, "batchFadeIn");
        enqueue(null, "queueDelay");
        enqueue(null, "batchMoveTemp");
      },
      stopAll: () => stopAll(),
      restore: (a) => restore(typeof a === "string" ? a : "box1"),
    };

    window.$effects = window.myElement;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enqueue]);

  // UI helpers
  const fadeInBox = (id) => enqueue(id, "fadeIn");
  const fadeOutBox = (id) => enqueue(id, "fadeOut");
  const fadeToggleBox = (id) => enqueue(id, "fadeToggle");
  const slideUpBox = (id) => enqueue(id, "slideUp");
  const slideDownBox = (id) => enqueue(id, "slideDown");
  const slideToggleBox = (id) => enqueue(id, "slideToggle");
  const moveRightBox = (id) => enqueue(id, "animateMoveRight");
  const moveLeftBox = (id) => enqueue(id, "animateLeft");
  const toggleClassBox = (id) => enqueue(id, "toggleClass");

  const executeChain = () => {
    enqueue("box3", "fadeOut");
    enqueue(null, "queueDelay");
    enqueue("box3", "fadeIn");
    enqueue(null, "queueDelay");
    enqueue("box3", "animateMoveRight");
  };

  function directTestToggleBox3() {
    const el = document.getElementById("box3");
    if (!el) { alert("box3 not found in DOM"); return; }
    const easingStr = EASING_MAP[easingRef.current] || easingRef.current;
    el.style.transition = `opacity ${durationRef.current}ms ${easingStr}`;
    applyStyleNextFrame(() => {
      el.style.opacity = parseFloat(window.getComputedStyle(el).opacity) < 0.5 ? "1" : "0";
    });
  }

  // ---------- UI JSX ----------
  return (
    <main className="min-h-screen p-6 bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">jQuery Effects & Animations — Live Lab</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              Click controls below or call <code className="bg-slate-50 dark:bg-slate-800 px-1 rounded">myElement</code> from the console
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Running: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{runningCount}</span> — Queue: <span className="font-semibold">{queue.length}</span>
            </div>
            <button onClick={() => stopAll()} className="px-3 py-1 rounded bg-rose-600 text-white text-sm">Stop All</button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1: Fading */}
          <section className="rounded-xl border border-slate-200 bg-white dark:border-[#223649] dark:bg-slate-800/60 p-4 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="p-2 rounded bg-slate-50 dark:bg-slate-900/40"><MdBlurOn /></div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">1. Fading Effects</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Opacity transitions (fadeIn / fadeOut)</div>
                </div>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Example</div>
            </div>

            <div className="mt-4 flex items-center justify-center">
              <div id="box1" className="w-[110px] h-[110px] rounded-xl flex items-center justify-center font-bold text-white bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg">.box</div>
            </div>

            <pre className="mt-4 bg-slate-50 border border-slate-200 text-xs p-3 rounded text-slate-700 dark:bg-slate-900/40 dark:border-slate-700 dark:text-slate-300">{`$('.box').fadeToggle( 'slow' );`}</pre>

            <div className="mt-4 flex gap-3">
              <button onClick={() => fadeInBox("box1")} className="flex-1 rounded px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white">Fade In</button>
              <button onClick={() => fadeOutBox("box1")} className="flex-1 rounded px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white">Fade Out</button>
              <button onClick={() => fadeToggleBox("box1")} className="flex-1 rounded px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white">Toggle</button>
            </div>
          </section>

          {/* 2: Sliding */}
          <section className="rounded-xl border border-slate-200 bg-white dark:border-[#223649] dark:bg-slate-800/60 p-4 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="p-2 rounded bg-slate-50 dark:bg-slate-900/40"><MdFlip /></div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">2. Sliding Effects</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">slideUp / slideDown</div>
                </div>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Panel</div>
            </div>

            <div className="mt-4 flex justify-center">
              <div className="w-[260px]">
                <div id="panelPreview" className="rounded-md p-4 bg-slate-50 border border-slate-200 text-slate-800 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-300">
                  {/* NOTE: panelBox contains panelInner - inner is animated with transform/opacity */}
                  <div id="panelBox" className="overflow-hidden">
                    <div id="panelInner" className="p-3 rounded bg-white text-sm dark:bg-slate-700 dark:text-slate-200">
                      Hidden Content
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">Use slide toggles to animate height smoothly.</div>

            <div className="mt-4 flex gap-3">
              <button onClick={() => slideUpBox("panelBox")} className="flex-1 rounded px-3 py-2 bg-sky-600 text-white">Slide Up</button>
              <button onClick={() => slideDownBox("panelBox")} className="flex-1 rounded px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white">Slide Down</button>
              <button onClick={() => slideToggleBox("panelBox")} className="flex-1 rounded px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white">Toggle</button>
            </div>
          </section>
        </div>

        {/* custom animate and other UI... (unchanged) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white dark:border-[#223649] dark:bg-slate-800/60 p-4 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="p-2 rounded bg-slate-50 dark:bg-slate-900/40"><MdPlayArrow /></div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">3. Custom Animation (.animate)</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Compose movement, opacity and size</div>
                </div>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Preview</div>
            </div>

            <div className="mt-6 flex items-center gap-6">
              <div className="flex-1 h-[140px] rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center dark:bg-slate-900/40 dark:border-slate-700">
                <div id="customStage" className="p-4 bg-sky-500 rounded-lg shadow-lg">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 2c0 0-7 3-7 9 0 4.418 3.582 8 8 8s8-3.582 8-8c0-6-9-9-9-9z" fill="#0ea5e9" />
                  </svg>
                </div>
              </div>

              <div className="w-[320px] bg-white border border-slate-200 p-3 rounded dark:bg-slate-900/40 dark:border-slate-700">
                <div className="text-xs text-slate-500 mb-2 dark:text-slate-400">PROPERTIES</div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-600 dark:text-slate-400">Move (px)</label>
                    <input id="moveRight" placeholder="80" className="mt-1 w-full p-2 rounded bg-slate-50 border border-slate-200 text-sm dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-200" />
                  </div>

                  <div>
                    <label className="text-xs text-slate-600 dark:text-slate-400">Opacity</label>
                    <input id="opacityVal" placeholder="0.5" className="mt-1 w-full p-2 rounded bg-slate-50 border border-slate-200 text-sm dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-200" />
                  </div>

                  <div className="pt-2 grid grid-cols-2 gap-2">
                    <button onClick={() => {
                        const mrVal = document.getElementById("moveRight")?.value;
                        const opVal = document.getElementById("opacityVal")?.value;
                        const mr = Number(mrVal) || 80;
                        const op = opVal !== undefined && opVal !== "" ? Number(opVal) : 1;
                        enqueue("customStage", "animate", { to: { transform: `translateX(${mr}px)`, opacity: isNaN(op) ? 1 : op }});
                      }} className="w-full rounded px-3 py-2 bg-emerald-600 text-white">Move Right</button>

                    <button onClick={() => {
                        const mrVal = document.getElementById("moveRight")?.value;
                        const opVal = document.getElementById("opacityVal")?.value;
                        const mr = Number(mrVal) || 80;
                        const op = opVal !== undefined && opVal !== "" ? Number(opVal) : 1;
                        enqueue("customStage", "animate", { to: { transform: `translateX(${-Math.abs(mr)}px)`, opacity: isNaN(op) ? 1 : op }});
                      }} className="w-full rounded px-3 py-2 bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-white">Move Left</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">Use the properties panel to run a custom animate on the stage.</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="rounded-xl border border-slate-200 bg-white dark:border-[#223649] dark:bg-slate-800/60 p-4 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="p-2 rounded bg-slate-50 dark:bg-slate-900/40"><MdQueue /></div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">4. Chaining & Callbacks</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Sequence animations with callbacks</div>
                </div>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Chain</div>
            </div>

            <div className="mt-6 flex items-center gap-6">
              <div id="box3" className="w-24 h-24 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">1</div>
              <div className="text-slate-700 dark:text-slate-300">I will fade out, delay, then fade in and move.</div>
            </div>

            <div className="mt-6">
              <button onClick={executeChain} className="px-4 py-2 rounded bg-sky-600 text-white">Execute Chain »</button>
            </div>
          </section>

          <aside className="rounded-xl border border-slate-200 bg-white dark:border-[#223649] dark:bg-slate-800/60 p-4 transition-colors duration-200">
            <div className="text-xs text-slate-500 dark:text-slate-400">Controls</div>
            <div className="mt-4 flex items-center gap-4">
              <div className="text-xs text-slate-600 dark:text-slate-400">Duration</div>
              <input type="range" min="50" max="2000" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full" />
              <div className="text-xs text-slate-700 dark:text-slate-300">{duration} ms</div>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="text-xs text-slate-600 dark:text-slate-400">Easing</div>
              <select value={easing} onChange={(e) => setEasing(e.target.value)} className="bg-white border border-slate-200 text-slate-800 px-2 py-1 rounded dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-200">
                {Object.keys(EASING_MAP).map((k) => <option key={k} value={k}>{k}</option>)}
              </select>

              <div className="ml-auto text-xs text-slate-600 dark:text-slate-400">Callback Status: <span className="text-slate-800 dark:text-slate-200 ml-2">{callbackStatus}</span></div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
