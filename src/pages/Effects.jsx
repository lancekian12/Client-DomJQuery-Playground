import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  MdAnimation,
  MdBlurOn,
  MdFlip,
  MdQueue,
  MdPlayArrow,
  MdStop,
  MdLayers,
  MdTune,
  MdPlayCircleOutline,
} from "react-icons/md";

/*
 EffectsLiveCode - updated debug-friendly version
 Key fix: style changes applied via requestAnimationFrame to ensure transitions take effect.
*/

function sendEvent(text, type = "info") {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent("eventstream", { detail: { text, type } }));
  } catch (e) {
    console.debug("sendEvent failed:", e, text, type);
  }
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

  const [queue, setQueue] = useState([]);
  const runningRef = useRef(false);
  const [runningCount, setRunningCount] = useState(0);

  const [activeEl, setActiveEl] = useState(null);
  const [currentOp, setCurrentOp] = useState(null);

  const nextTaskId = useRef(1);
  const initialStyles = useRef({});

  const [liveCode, setLiveCode] = useState(
    `// Examples:\n// myElement.slideUP(100)\n// myElement.fadeToggle('box3')\n`
  );

  useEffect(() => {
    sendEvent("Animations demo ready", "muted");

    ["box1", "box2", "box3"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        // explicit starting style ensures transitions have a start value
        el.style.opacity = el.style.opacity || "1";
        el.style.transform = el.style.transform || "none";
        const cs = window.getComputedStyle(el);
        initialStyles.current[id] = initialStyles.current[id] || {
          opacity: cs.opacity,
          transform: cs.transform === "none" ? "" : cs.transform,
          height: cs.height,
          left: el.style.left || "",
          top: el.style.top || "",
        };
      }
    });
  }, []);

  const enqueue = useCallback((targetId, op, params = {}) => {
    const task = { id: nextTaskId.current++, target: targetId, op, params };
    console.log("enqueue ->", task);
    setQueue((q) => [...q, task]);
    sendEvent(`queued ${op} -> ${targetId}`, "info");
    setCallbackStatus("Queued");
  }, []);

  function stopAll() {
    setQueue([]);
    runningRef.current = false;
    setRunningCount(0);
    setActiveEl(null);
    setCurrentOp(null);
    ["box1", "box2", "box3"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        const cs = window.getComputedStyle(el);
        el.style.transition = "";
        el.style.opacity = cs.opacity;
        el.style.transform = cs.transform === "none" ? "" : cs.transform;
        el.style.height = cs.height;
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
    sendEvent(`restored ${targetId}`, "info");
  }

  // small helper: apply style-changing function on next frame
  function applyStyleNextFrame(fn) {
    // use rAF to ensure transition property is registered before change
    requestAnimationFrame(() => {
      // double RAF is sometimes helpful for edge cases; keep single RAF first
      fn();
    });
  }

  function applyTask(task) {
    const { target, op, params } = task;
    const el = document.getElementById(target);
    console.log("applyTask:", task, "elFound:", !!el);
    if (!el) {
      sendEvent(`target ${target} not found`, "warning");
      return Promise.resolve();
    }

    if (!initialStyles.current[target]) {
      const cs = window.getComputedStyle(el);
      initialStyles.current[target] = {
        opacity: cs.opacity,
        transform: cs.transform === "none" ? "" : cs.transform,
        height: cs.height,
        left: el.style.left || "",
        top: el.style.top || "",
      };
    }

    setActiveEl(target);
    setCurrentOp(op);
    setRunningCount((c) => c + 1);

    const easingStr = EASING_MAP[easing] || easing;
    el.style.transition = `all ${duration}ms ${easingStr}`;

    function finish(reason = "done") {
      setTimeout(() => {
        el.style.transition = "";
      }, 30);
      setRunningCount((c) => Math.max(0, c - 1));
      sendEvent(`${op} finished -> ${target} (${reason})`, "success");
      setCallbackStatus(`Callback: ${op} ${reason}`);
    }

    return new Promise((resolve) => {
      // Use applyStyleNextFrame for changes so transition takes effect
      if (op === "fadeToggle") {
        const cur = parseFloat(window.getComputedStyle(el).opacity || "1");
        const show = cur < 0.5;
        applyStyleNextFrame(() => {
          el.style.opacity = show ? "1" : "0";
        });
        setTimeout(() => {
          finish(show ? "shown" : "hidden");
          resolve();
        }, duration);
      } else if (op === "fadeIn") {
        applyStyleNextFrame(() => {
          el.style.opacity = "1";
        });
        setTimeout(() => {
          finish("shown");
          resolve();
        }, duration);
      } else if (op === "fadeOut") {
        applyStyleNextFrame(() => {
          el.style.opacity = "0";
        });
        setTimeout(() => {
          finish("hidden");
          resolve();
        }, duration);
      } else if (op === "slideUp") {
        el.style.overflow = "hidden";
        applyStyleNextFrame(() => {
          el.style.height = "0px";
        });
        setTimeout(() => {
          finish("slid-up");
          resolve();
        }, duration);
      } else if (op === "slideDown") {
        el.style.overflow = "hidden";
        const h = initialStyles.current[target]?.height || "72px";
        applyStyleNextFrame(() => {
          el.style.height = h;
        });
        setTimeout(() => {
          finish("slid-down");
          resolve();
        }, duration);
      } else if (op === "slideToggle") {
        const curH = parseFloat(window.getComputedStyle(el).height || "0");
        if (curH < 2) {
          const h = initialStyles.current[target]?.height || "72px";
          applyStyleNextFrame(() => {
            el.style.height = h;
          });
          setTimeout(() => {
            finish("slid-down");
            resolve();
          }, duration);
        } else {
          el.style.overflow = "hidden";
          applyStyleNextFrame(() => {
            el.style.height = "0px";
          });
          setTimeout(() => {
            finish("slid-up");
            resolve();
          }, duration);
        }
      } else if (op === "animateMoveRight") {
        applyStyleNextFrame(() => {
          el.style.transform = "translateX(80px) rotate(0deg) scale(1.02)";
        });
        setTimeout(() => {
          finish("moved-right");
          resolve();
        }, duration);
      } else if (op === "animateLeft") {
        applyStyleNextFrame(() => {
          el.style.transform = "translateX(-50px) rotate(-6deg) scale(0.98)";
        });
        setTimeout(() => {
          finish("moved-left");
          resolve();
        }, duration);
      } else if (op === "toggleClass") {
        el.classList.toggle("ring-4");
        const added = el.classList.contains("ring-4");
        if (added) el.style.boxShadow = "0 8px 24px rgba(96,165,250,0.12)";
        else el.style.boxShadow = "";
        setTimeout(() => {
          finish(added ? "class-added" : "class-removed");
          resolve();
        }, 120);
      } else if (op === "queueDelay") {
        setTimeout(() => {
          finish("delay");
          resolve();
        }, duration);
      } else if (op === "stop") {
        el.style.transition = "";
        const cs = window.getComputedStyle(el);
        el.style.opacity = cs.opacity;
        el.style.transform = cs.transform === "none" ? "" : cs.transform;
        finish("stopped");
        resolve();
      } else if (op === "chainAll") {
        applyStyleNextFrame(() => {
          el.style.opacity = "0.2";
        });
        setTimeout(() => {
          applyStyleNextFrame(() => {
            el.style.transform = "translateY(-12px)";
          });
        }, duration / 2);
        setTimeout(() => {
          applyStyleNextFrame(() => {
            el.style.opacity = "1";
          });
        }, duration);
        setTimeout(() => {
          finish("chained");
          resolve();
        }, duration + 50);
      } else {
        // generic animate
        if (params && params.to) {
          applyStyleNextFrame(() => {
            Object.keys(params.to).forEach((k) => {
              if (k === "opacity") el.style.opacity = String(params.to[k]);
              if (k === "left") el.style.left = params.to[k];
              if (k === "top") el.style.top = params.to[k];
              if (k === "transform") el.style.transform = params.to[k];
            });
          });
        }
        setTimeout(() => {
          finish("animated");
          resolve();
        }, duration);
      }
    });
  }

  useEffect(() => {
    if (runningRef.current) return;
    if (queue.length === 0) {
      setCallbackStatus("Idle");
      return;
    }

    runningRef.current = true;
    setCallbackStatus("Running");
    console.log("queue-runner starting — queue length:", queue.length);
    const run = async () => {
      while (true) {
        let task;
        setQueue((q) => {
          task = q[0];
          return q.slice(1);
        });
        if (!task) break;
        setCallbackStatus(`Running: ${task.op}`);
        sendEvent(`running ${task.op} -> ${task.target}`, "info");
        console.log("running task ->", task);
        await applyTask(task);
      }
      runningRef.current = false;
      setCallbackStatus("Idle");
      setActiveEl(null);
      setCurrentOp(null);
      console.log("queue-runner finished");
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue]);

  // convenience calls
  const triggerAnimate = (target) => enqueue(target, "animateMoveRight", { to: { transform: "translateX(80px)" } });
  const triggerFadeToggle = (target) => enqueue(target, "fadeToggle");
  const triggerSlideToggle = (target) => enqueue(target, "slideToggle");
  const triggerToggleClass = (target) => enqueue(target, "toggleClass");

  const chainAllBoxes = () => {
    ["box1", "box2", "box3"].forEach((id) => {
      enqueue(id, "fadeOut");
      enqueue(id, "queueDelay");
      enqueue(id, "fadeIn");
      enqueue(id, "animateMoveRight");
    });
  };

  // Programmatic API on window
  useEffect(() => {
    if (typeof window === "undefined") return;

    function makeTargetAndDuration(arg1, arg2, defaultTarget = "box1") {
      if (typeof arg1 === "string") return { target: arg1, dur: typeof arg2 === "number" ? arg2 : undefined };
      if (typeof arg1 === "number") return { target: defaultTarget, dur: arg1 };
      return { target: defaultTarget, dur: undefined };
    }

    window.myElement = {
      slideUp: (a, b) => {
        const { target, dur } = makeTargetAndDuration(a, b);
        if (typeof dur === "number") setDuration(dur);
        enqueue(target, "slideUp");
      },
      slideUP: (a, b) => window.myElement.slideUp(a, b),
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
      fadeToggle: (a) => {
        const target = typeof a === "string" ? a : "box1";
        enqueue(target, "fadeToggle");
      },
      fadeIn: (a) => {
        const target = typeof a === "string" ? a : "box1";
        enqueue(target, "fadeIn");
      },
      fadeOut: (a) => {
        const target = typeof a === "string" ? a : "box1";
        enqueue(target, "fadeOut");
      },
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
      chainAll: () => chainAllBoxes(),
      stopAll: () => stopAll(),
      restore: (a) => restore(typeof a === "string" ? a : "box1"),
    };

    window.$effects = window.myElement;
    console.log("window.myElement API ready — try: myElement.slideUP(100) or myElement.fadeToggle('box3')");
  }, [enqueue]);

  function runLiveCode() {
    if (!liveCode) return;
    try {
      // eslint-disable-next-line no-eval
      const result = eval(liveCode);
      console.log("LiveCode result:", result);
    } catch (err) {
      console.error("LiveCode error:", err);
      alert("LiveCode error: " + err.message);
    }
  }

  // Direct test button: triggers a direct fade toggle (bypasses other code paths)
  function directTestToggleBox3() {
    const el = document.getElementById("box3");
    if (!el) {
      alert("box3 not found in DOM");
      return;
    }
    // Apply transition then change style on next frame — same approach used above
    el.style.transition = `all ${duration}ms ${EASING_MAP[easing] || easing}`;
    applyStyleNextFrame(() => {
      el.style.opacity = (parseFloat(window.getComputedStyle(el).opacity) < 0.5) ? "1" : "0";
    });
    console.log("Direct test toggled box3");
  }

  return (
    <main className="flex-1 overflow-y-auto p-6 lg:p-10">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-white tracking-tight">jQuery Effects & Animations — Live Code</h2>
          <p className="text-slate-400">Type commands below and press Run. You can also call <code>myElement</code> from your browser console.</p>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 rounded-xl border border-[#223649] bg-slate-800/60 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-white"><span className="p-1 rounded bg-slate-900/50 text-primary"><MdAnimation/></span>jQuery Effects Lab</h3>
            </div>

            <div className="rounded-lg bg-slate-900/40 border border-slate-700 p-4 min-h-[220px] relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none" style={{backgroundImage:"radial-gradient(#334155 1px, transparent 1px)", backgroundSize:"20px 20px", opacity:0.06}}/>
              <div className="relative z-10 flex items-start gap-6 p-6">
                <div id="box1" style={{ width:110, height:72, borderRadius:8, background:"linear-gradient(135deg,#7c3aed,#6d28d9)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, opacity:1, transform:"none"}}><span>#box1</span></div>
                <div id="box2" style={{ width:140, height:72, borderRadius:8, background:"linear-gradient(135deg,#06b6d4,#14b8a6)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, opacity:1, transform:"none"}}><span>#box2</span></div>
                <div id="box3" style={{ width:72, height:72, borderRadius:"9999px", background:"linear-gradient(135deg,#8b5cf6,#a78bfa)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:14, opacity:1, transform:"none"}}><span>#box3</span></div>
              </div>

              <div className="absolute right-3 bottom-3 text-xs text-slate-400">Stage: 100% Zoom</div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              <button className="rounded-lg p-3 ..." onClick={()=> enqueue('box3','fadeToggle')}><MdBlurOn/> Fade Toggle #1</button>
              <button className="rounded-lg p-3 ..." onClick={()=> enqueue('box2','slideToggle')}><MdFlip/> Slide Toggle #2</button>
              <button className="rounded-lg p-3 ..." onClick={()=> enqueue('box3','animateMoveRight')}><MdPlayArrow/> Move #3</button>
              <button className="rounded-lg p-3 ..." onClick={()=> chainAllBoxes()}><MdQueue/> Chain All</button>

              <button className="rounded-lg p-3 ..." onClick={()=> stopAll()}><MdStop/> Stop All Animations</button>
              <button className="rounded-lg p-3 ..." onClick={()=> enqueue('box2','toggleClass')}><MdLayers/> Toggle Class</button>
              <button className="rounded-lg p-3 ..." onClick={()=> enqueue('box1','fadeIn')}><MdPlayCircleOutline/> Fade In</button>
              <button className="rounded-lg p-3 ..." onClick={()=> enqueue('box1','fadeOut')}><MdPlayCircleOutline/> Fade Out</button>
            </div>

            <div className="mt-4 bg-slate-900/40 border border-slate-700 rounded p-3">
              <div className="text-xs text-slate-400 mb-2">LIVE CODE</div>
              <textarea value={liveCode} onChange={(e)=>setLiveCode(e.target.value)} rows={6} className="w-full p-2 bg-black/10 text-sm text-slate-200 rounded" />
              <div className="flex gap-2 mt-2">
                <button className="px-3 py-1 rounded bg-sky-600 text-white text-sm" onClick={runLiveCode}>Run</button>
                <button className="px-3 py-1 rounded bg-slate-700 text-white text-sm" onClick={()=>setLiveCode("// Try: myElement.slideUP(100)\nmyElement.fadeToggle('box3')\n")}>Reset</button>
                <button className="px-3 py-1 rounded bg-emerald-600 text-white text-sm" onClick={directTestToggleBox3}>Direct Test</button>
                <div className="text-xs text-slate-400 ml-auto">Open console to view logs</div>
              </div>
            </div>

          </div>

          <div className="rounded-xl border border-[#223649] bg-slate-800/60 p-4 flex flex-col gap-3">
            <div className="text-xs font-mono text-slate-400">EFFECT INSPECTOR</div>
            <div><div className="text-xs text-slate-400">Active Element</div><div className="text-sky-400 font-semibold">{activeEl ?? "#none"}</div></div>
            <div><div className="text-xs text-slate-400">Current Operation</div><pre className="bg-slate-900/40 border border-slate-700 rounded p-2 text-xs text-slate-200 overflow-x-auto">{currentOp ? `. ${currentOp}()` : "—"}</pre></div>
            <div><div className="text-xs text-slate-400">Animation Queue</div><div className="mt-1 text-xs text-slate-300">Running: <span className="text-emerald-400 font-semibold">{runningCount}</span> — Pending: <span className="text-slate-200 font-semibold">{queue.length}</span></div></div>

            <div className="mt-auto">
              <div className="text-xs font-mono text-slate-400">PERFORMANCE TIP</div>
              <div className="text-xs text-slate-300 mt-2">Prefer transforms & opacity for best performance.</div>
            </div>
          </div>
        </section>

        <div className="rounded-xl border border-[#223649] bg-slate-800/60 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-slate-400 mb-2">Duration (ms)</div>
              <input type="range" min="50" max="2000" value={duration} onChange={(e)=> setDuration(Number(e.target.value)) } className="w-full" />
              <div className="text-xs text-slate-300 mt-1">{duration} ms</div>
            </div>

            <div>
              <div className="text-xs text-slate-400 mb-2">Easing Function</div>
              <select value={easing} onChange={(e)=> setEasing(e.target.value) } className="bg-slate-800/40 border border-slate-700 text-slate-200 px-2 py-2 rounded w-full">
                {Object.keys(EASING_MAP).map((k)=> (<option key={k} value={k}>{k}</option>))}
              </select>
            </div>

            <div>
              <div className="text-xs text-slate-400 mb-2">Callback Status</div>
              <div className="bg-slate-900/40 border border-slate-700 rounded px-3 py-2 text-slate-200">{callbackStatus}</div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
