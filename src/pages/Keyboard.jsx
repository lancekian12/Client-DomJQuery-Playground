import React, { useEffect, useRef, useState } from "react";
import { MdKeyboard, MdKeyboardArrowDown, MdSportsEsports } from "react-icons/md";

export default function Keyboard() {
  const [keyInfo, setKeyInfo] = useState({ key: "", code: "", which: null });
  const [modifiers, setModifiers] = useState({
    Shift: false,
    Ctrl: false,
    Alt: false,
  });
  const [wasd, setWASD] = useState({ W: false, A: false, S: false, D: false });
  const inputRef = useRef(null);

  // helper to dispatch events for the LiveSource pane
  function sendEvent(text, type = "info") {
    window.dispatchEvent(
      new CustomEvent("eventstream", { detail: { text, type } })
    );
  }

  // push a small code snippet into LiveSource on mount (so right pane shows code)
  useEffect(() => {
    const codeSnippet = `// Keyboard demo: live events
window.addEventListener("keydown", (e) => {
  console.log("keydown", e.key, e.code, e.which);
});
`;
    window.dispatchEvent(
      new CustomEvent("live-source", { detail: { code: codeSnippet } })
    );
  }, []);

  function prettyKeyName(k) {
    if (!k && k !== "") return "";
    if (k === " ") return "Space";
    return k.length === 1 ? k.toUpperCase() : k;
  }

  function handleKeyDown(e) {
    // normalize
    const key = e.key === "" || e.key == null ? "" : e.key;
    const code = e.code || "";
    const which = e.which || e.keyCode || 0;

    setKeyInfo({
      key: prettyKeyName(key),
      code: code || prettyKeyName(key),
      which,
    });

    // modifiers: keep them true while pressed
    setModifiers((m) => ({
      Shift: e.shiftKey || m.Shift,
      Ctrl: e.ctrlKey || m.Ctrl,
      Alt: e.altKey || m.Alt,
    }));

    // WASD highlight (support lowercase too)
    const k = (key || "").toLowerCase();
    if (["w", "a", "s", "d"].includes(k)) {
      setWASD((s) => ({ ...s, [k.toUpperCase()]: true }));
    }

    // send a live event for the stream
    sendEvent(`keydown — key="${key}" code="${code}" which=${which}`, "info");
  }

  function handleKeyUp(e) {
    const key = e.key || "";
    const code = e.code || "";
    const which = e.which || e.keyCode || 0;

    // update modifiers from the event state
    setModifiers({ Shift: e.shiftKey, Ctrl: e.ctrlKey, Alt: e.altKey });

    const k = (key || "").toLowerCase();
    if (["w", "a", "s", "d"].includes(k)) {
      setWASD((s) => ({ ...s, [k.toUpperCase()]: false }));
    }

    // send a muted/secondary event
    sendEvent(`keyup — key="${key}" code="${code}" which=${which}`, "muted");
  }

  // attach global listeners so WASD & modifiers light up even if input not focused
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    // initial status
    sendEvent("Keyboard demo initialized", "muted");
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="flex-1 overflow-y-auto p-6 lg:p-10 text-slate-800 dark:bg-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            DOM & jQuery Playground
          </h2>
          <p className="text-slate-700 dark:text-slate-400">
            Keyboard Interaction Lab — focus the input and press keys to see
            live values.
          </p>
        </div>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
              <span className="p-1 rounded bg-slate-50 dark:bg-slate-900/50 text-sky-600 dark:text-sky-400">
                <MdKeyboard />
              </span>
              Keyboard Interaction Lab
            </h3>
            <div className="flex gap-2">
              <span className="text-xs font-mono bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                KeyboardEvent
              </span>
            </div>
          </div>

          {/* GRID: Key Capture spans full width on md, Modifier + WASD below */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Capture - spans both columns on md */}
            <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white dark:border-[#223649] dark:bg-slate-800/60 p-6 flex flex-col gap-4 relative transition-colors duration-200">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-full bg-slate-50 dark:bg-slate-900/60 text-sky-600">
                  <MdKeyboard size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Key Capture</h4>
                  <p className="text-xs text-slate-700 dark:text-slate-400">
                    Focus the input and start typing to see key codes in
                    real-time.
                  </p>
                </div>
              </div>

              <input
                ref={inputRef}
                onKeyDown={(e) => handleKeyDown(e)}
                onKeyUp={(e) => handleKeyUp(e)}
                className="mt-2 w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-200"
                placeholder="Press any key here..."
                aria-label="key-capture-input"
              />

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded text-center dark:bg-slate-900/40">
                  <div className="text-xs text-slate-500 uppercase font-mono">
                    Key
                  </div>
                  <div className="mt-1 text-slate-900 font-semibold text-lg dark:text-white">
                    {keyInfo.key || "—"}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded text-center dark:bg-slate-900/40">
                  <div className="text-xs text-slate-500 uppercase font-mono">
                    Code
                  </div>
                  <div className="mt-1 text-sky-600 font-semibold dark:text-sky-400">
                    {keyInfo.code || "—"}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded text-center dark:bg-slate-900/40">
                  <div className="text-xs text-slate-500 uppercase font-mono">
                    Which
                  </div>
                  <div className="mt-1 text-emerald-600 font-semibold dark:text-emerald-400">
                    {keyInfo.which || "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Modifier Test */}
            <div className="rounded-xl border border-slate-200 bg-white dark:border-[#223649] dark:bg-slate-800/60 p-6 flex flex-col gap-4 items-center justify-center transition-colors duration-200">
              <div className="p-3 rounded-full bg-slate-50 dark:bg-slate-900/60 text-amber-600">
                <MdKeyboardArrowDown size={22} />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white">Modifier Test</h4>
              <p className="text-xs text-slate-700 dark:text-slate-400 text-center max-w-[220px]">
                Hold modifier keys to see them light up.
              </p>

              <div className="mt-3 w-full flex justify-center gap-3">
                {Object.keys(modifiers).map((m) => (
                  <div
                    key={m}
                    className={`px-3 py-1 rounded text-sm font-mono border select-none ${
                      modifiers[m]
                        ? "bg-sky-600/80 text-white ring-2 ring-sky-400 border-sky-600/80"
                        : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/30 dark:text-slate-300 dark:border-slate-700"
                    }`}
                  >
                    {m.toUpperCase()}
                  </div>
                ))}
              </div>
            </div>

            {/* WASD Control */}
            <div className="rounded-xl border border-slate-200 bg-white dark:border-[#223649] dark:bg-slate-800/60 p-6 flex flex-col gap-4 items-center justify-center transition-colors duration-200">
              <div className="p-3 rounded-full bg-slate-50 dark:bg-slate-900/60 text-emerald-600 flex items-center justify-center">
                <MdSportsEsports size={24} />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white">WASD Control</h4>
              <p className="text-xs text-slate-700 dark:text-slate-400 text-center max-w-[220px]">
                Press W, A, S, D to highlight keys.
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2 items-center justify-center">
                <div />
                <div
                  className={`w-14 h-14 rounded-lg flex items-center justify-center font-semibold text-lg ${
                    wasd.W
                      ? "bg-emerald-400 text-black"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300"
                  }`}
                >
                  W
                </div>
                <div />

                <div
                  className={`w-14 h-14 rounded-lg flex items-center justify-center font-semibold text-lg ${
                    wasd.A
                      ? "bg-emerald-400 text-black"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300"
                  }`}
                >
                  A
                </div>
                <div
                  className={`w-14 h-14 rounded-lg flex items-center justify-center font-semibold text-lg ${
                    wasd.S
                      ? "bg-emerald-400 text-black"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300"
                  }`}
                >
                  S
                </div>
                <div
                  className={`w-14 h-14 rounded-lg flex items-center justify-center font-semibold text-lg ${
                    wasd.D
                      ? "bg-emerald-400 text-black"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300"
                  }`}
                >
                  D
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
