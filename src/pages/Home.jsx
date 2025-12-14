// src/pages/Home.jsx
import React, { useRef } from "react";
import LiveSource from "../components/LiveSource";

import {
  FiMousePointer,
  FiRepeat,
  FiEye,
  FiMove,
  FiMinusSquare,
  FiZap,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

export default function Home() {
  const sendEvent = (text, type = "info") => {
    window.dispatchEvent(
      new CustomEvent("eventstream", { detail: { text, type } })
    );
  };

  // helper: broadcast code snippet to live source panel
  const sendLiveSource = (code) => {
    window.dispatchEvent(new CustomEvent("live-source", { detail: { code } }));
  };

  // throttle mousemove
  const lastMoveRef = useRef(0);
  const handleMouseMove = (e) => {
    const now = Date.now();
    if (now - lastMoveRef.current < 200) return;
    lastMoveRef.current = now;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    sendEvent(`> mousemove at (${x}, ${y})`);
  };

  const handleWheel = (e) => {
    // show wheel delta
    sendEvent(`> wheel deltaY: ${Math.round(e.deltaY)}`);
  };

  // small library of code snippets for each card
  const snippets = {
    click: `// click handler\nconst btn = document.querySelector("#btn-click");\nbtn.addEventListener("click", () => console.log("Button clicked!"));`,
    dblclick: `// dblclick handler\nconst card = document.querySelector(".dbl-card");\ncard.addEventListener("dblclick", () => console.log("Double clicked!"));`,
    mouseover: `// mouseover/mouseout\nconst box = document.querySelector(".hover-card");\nbox.addEventListener("mouseover", () => console.log("mouseover"));\nbox.addEventListener("mouseout", () => console.log("mouseout"));`,
    contextmenu: `$("#ctx-target").on("contextmenu", function(e) {\n  // Prevent default context menu\n  e.preventDefault();\n  const el = $(this);\n  el.addClass("ring-2 ring-red-500");\n  console.log("Right-click detected!");\n  showFeedback("Opening menu...");\n});`,
    mousedown: `// mousedown / mouseup\nconst el = document.querySelector(".press-area");\nel.addEventListener("mousedown", () => console.log("mousedown"));\nel.addEventListener("mouseup", () => console.log("mouseup"));`,
    enterleave: `// mouseenter / mouseleave\nconst area = document.querySelector(".enter-area");\narea.addEventListener("mouseenter", () => console.log("mouseenter"));\narea.addEventListener("mouseleave", () => console.log("mouseleave"));`,
    wheel: `// wheel event\nconst card = document.querySelector(".wheel-card");\ncard.addEventListener("wheel", (e) => console.log("wheel deltaY:", e.deltaY));`,
    auxclick: `// auxclick (middle button)\nconst mid = document.querySelector(".aux-card");\nmid.addEventListener("auxclick", (e) => console.log("auxclick button:", e.button));`,
  };

  return (
    <main className="flex-1 overflow-y-auto custom-scrollbar bg-background-dark p-6 lg:p-10">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-white tracking-tight">DOM & jQuery Playground</h2>
          <p className="text-slate-400">Interact with elements below to trigger events. Observe the console for real-time code output.</p>
        </div>

        {/* MOUSE EVENTS ONLY (copied visual from initial design) */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
              <span className="material-symbols-outlined text-primary">mouse</span>
              Mouse Interaction Lab
            </h3>
            <div className="flex gap-2">
              <span className="text-xs font-mono bg-slate-800/60 text-slate-300 px-2 py-1 rounded border border-slate-700">MouseEvent</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Single Click */}
            <div
              className="rounded-xl border border-[#223649] border-[#223649] bg-slate-800/60 p-6 flex flex-col items-center justify-center gap-4 relative group"
              onMouseEnter={() => sendLiveSource(snippets.click)}
              onFocus={() => sendLiveSource(snippets.click)}
              tabIndex={0}
            >
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Event: click</span>
              </div>
              <div className="p-3 rounded-full bg-slate-900/60 text-primary mb-1">
                <FiMousePointer size={28} />
              </div>
              <h4 className="font-semibold text-white">Single Click</h4>
              <button
                id="btn-click"
                className="bg-primary text-white text-sm font-medium py-2 px-6 rounded-lg shadow-lg shadow-primary/20 active:scale-95 transition-all w-full md:w-auto"
                onClick={() => sendEvent("> click", "success")}
                onMouseEnter={() => sendLiveSource(snippets.click)}
              >
                Trigger Action
              </button>
              <p className="text-xs text-slate-400 text-center max-w-[200px]">Fires when a pointing device button is pressed and released.</p>
            </div>

            {/* Double Click */}
            <div
              className="rounded-xl border border-[#223649] bg-slate-800/60 p-6 flex flex-col items-center justify-center gap-4 relative group"
              onMouseEnter={() => sendLiveSource(snippets.dblclick)}
              tabIndex={0}
            >
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Event: dblclick</span>
              </div>
              <div className="p-3 rounded-full bg-slate-900/60 text-purple-400 mb-1">
                <FiRepeat size={28} />
              </div>
              <h4 className="font-semibold text-white">Double Click</h4>
              <div
                className="select-none cursor-pointer bg-slate-800/50 border-2 border-dashed border-slate-700 text-slate-300 text-sm font-medium py-2 px-6 rounded-lg active:scale-95 transition-all w-full md:w-auto text-center"
                onDoubleClick={() => sendEvent("> dblclick", "success")}
                onMouseEnter={() => sendLiveSource(snippets.dblclick)}
              >
                Double Tap Here
              </div>
              <p className="text-xs text-slate-400 text-center max-w-[200px]">Fires when a pointing device button is clicked twice rapidly.</p>
            </div>

            {/* Hover Effects (mouseover/mouseout) */}
            <div
              className="rounded-xl border border-[#223649] bg-slate-800/60 p-6 flex flex-col items-center justify-center gap-4 relative group"
              onMouseEnter={() => sendLiveSource(snippets.mouseover)}
              tabIndex={0}
            >
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Event: mouseover / mouseout</span>
              </div>
              <div className="p-3 rounded-full bg-slate-900/60 text-amber-400 mb-1">
                <FiEye size={28} />
              </div>
              <h4 className="font-semibold text-white">Hover Effects</h4>
              <div className="relative w-full md:w-48 h-12 bg-slate-800/50 rounded-lg overflow-hidden cursor-help hover:shadow-inner"
                   onMouseEnter={() => { sendEvent("> mouseover"); sendLiveSource(snippets.mouseover); }}
                   onMouseLeave={() => sendEvent("> mouseout")}>
                <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-slate-300 transition-transform duration-300">
                  Mouse Over Me
                </div>
              </div>
              <p className="text-xs text-slate-400 text-center max-w-[200px]">Triggers <code className="not-italic">mouseover</code> on entry and <code className="not-italic">mouseout</code> on exit.</p>
            </div>

            {/* Context Menu */}
            <div
              className="rounded-xl border border-[#223649] bg-slate-800/60 p-6 flex flex-col items-center justify-center gap-4 relative group"
              onMouseEnter={() => sendLiveSource(snippets.contextmenu)}
              tabIndex={0}
            >
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Event: contextmenu</span>
              </div>
              <div className="p-3 rounded-full bg-slate-900/60 text-red-400 mb-1">
                <FiMinusSquare size={28} />
              </div>
              <h4 className="font-semibold text-white">Context Menu</h4>
              <div
                id="ctx-target"
                className="w-full md:w-auto cursor-context-menu bg-slate-800/50 border border-slate-700 hover:shadow-inner text-slate-300 text-sm font-medium py-2 px-6 rounded-lg transition-all text-center"
                onContextMenu={(e) => { e.preventDefault(); sendEvent("> contextmenu (right-click) captured!", "warning"); }}
                onMouseEnter={() => sendLiveSource(snippets.contextmenu)}
              >
                Right Click Me
              </div>
              <p className="text-xs text-slate-400 text-center max-w-[200px]">Fires when the user attempts to open a context menu (right click).</p>
            </div>

            {/* Mouse Move (large box) */}
            <div
              className="rounded-xl border border-[#223649] bg-slate-800/60 p-6 flex flex-col items-center justify-center gap-4"
              onMouseMove={handleMouseMove}
              onMouseEnter={() => sendLiveSource(snippets.mouseover)}
            >
              <div className="flex items-center gap-4">
                <FiMove size={22} className="text-sky-400" />
                <div className="text-slate-300">Move mouse here</div>
              </div>
              <p className="text-xs text-slate-400 text-center max-w-[240px]">Mouse move events are throttled and streamed to the event console.</p>
            </div>

            {/* NEW: Mouse Down / Mouse Up */}
            <div
              className="rounded-xl border border-[#223649] bg-slate-800/60 p-6 flex flex-col items-center justify-center gap-4"
              onMouseEnter={() => sendLiveSource(snippets.mousedown)}
              tabIndex={0}
            >
              <div className="p-3 rounded-full bg-slate-900/60 text-sky-400 mb-1">
                <FiChevronDown size={28} />
              </div>
              <h4 className="font-semibold text-white">Mouse Down / Up</h4>
              <div
                className="w-full md:w-auto bg-slate-800/50 border border-slate-700 text-slate-300 text-sm font-medium py-2 px-6 rounded-lg transition-all text-center select-none cursor-pointer"
                onMouseDown={() => sendEvent("> mousedown", "info")}
                onMouseUp={() => sendEvent("> mouseup", "success")}
              >
                Press and Release
              </div>
              <p className="text-xs text-slate-400 text-center max-w-[220px]">Demonstrates <code className="not-italic">mousedown</code> (press) and <code className="not-italic">mouseup</code> (release).</p>
            </div>

            {/* NEW: Mouse Enter / Leave (distinct from mouseover/out) */}
            <div
              className="rounded-xl border border-[#223649] bg-slate-800/60 p-6 flex flex-col items-center justify-center gap-4"
              onMouseEnter={() => sendLiveSource(snippets.enterleave)}
              tabIndex={0}
            >
              <div className="p-3 rounded-full bg-slate-900/60 text-amber-400 mb-1">
                <FiChevronUp size={28} />
              </div>
              <h4 className="font-semibold text-white">Mouse Enter / Leave</h4>
              <div
                className="relative w-full md:w-48 h-12 bg-slate-800/50 rounded-lg overflow-hidden cursor-pointer flex items-center justify-center text-sm font-medium text-slate-300"
                onMouseEnter={() => sendEvent("> mouseenter")}
                onMouseLeave={() => sendEvent("> mouseleave")}
              >
                Enter / Leave Area
              </div>
              <p className="text-xs text-slate-400 text-center max-w-[220px]">Demonstrates <code className="not-italic">mouseenter</code> and <code className="not-italic">mouseleave</code> (do not bubble).</p>
            </div>

            {/* NEW: Wheel (scroll) */}
            <div
              className="rounded-xl border border-[#223649] bg-slate-800/60 p-6 flex flex-col items-center justify-center gap-4"
              onWheel={handleWheel}
              onMouseEnter={() => sendLiveSource(snippets.wheel)}
            >
              <div className="p-3 rounded-full bg-slate-900/60 text-purple-400 mb-1">
                <FiZap size={28} />
              </div>
              <h4 className="font-semibold text-white">Wheel</h4>
              <div className="w-full md:w-auto bg-slate-800/50 border border-slate-700 text-slate-300 text-sm font-medium py-2 px-6 rounded-lg transition-all text-center">
                Scroll inside this card
              </div>
              <p className="text-xs text-slate-400 text-center max-w-[240px]">Captures <code className="not-italic">wheel</code> events and reports the <code>deltaY</code>.</p>
            </div>

            {/* NEW: Auxclick (middle-click) */}
            <div
              className="rounded-xl border border-[#223649] bg-slate-800/60 p-6 flex flex-col items-center justify-center gap-4"
              onMouseEnter={() => sendLiveSource(snippets.auxclick)}
              tabIndex={0}
            >
              <div className="p-3 rounded-full bg-slate-900/60 text-sky-400 mb-1">
                <FiMousePointer size={28} />
              </div>
              <h4 className="font-semibold text-white">Aux Click (middle)</h4>
              <div
                className="w-full md:w-auto cursor-pointer bg-slate-800/50 border border-slate-700 hover:shadow-inner text-slate-300 text-sm font-medium py-2 px-6 rounded-lg transition-all text-center"
                onAuxClick={(e) => { e.preventDefault(); sendEvent(`> auxclick (button=${e.button})`, "warning"); }}
              >
                Middle Click Me
              </div>
              <p className="text-xs text-slate-400 text-center max-w-[220px]">Captures <code className="not-italic">auxclick</code> (commonly middle/mouse wheel click).</p>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
