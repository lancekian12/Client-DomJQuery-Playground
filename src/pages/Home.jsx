import React from "react";

export default function Home() {
  return (
    <main className="flex-1 p-6 overflow-auto">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">
          DOM & jQuery Playground
        </h1>
        <p className="text-slate-400 mb-6">
          Interact with elements below to trigger events. Observe the console
          for real-time code output.
        </p>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700">
            <h3 className="text-slate-100 font-semibold mb-3">
              Click Triggers
            </h3>
            <div className="space-y-3">
              <button className="px-4 py-2 bg-blue-600 rounded text-white">
                Click Me
              </button>
              <button className="px-4 py-2 bg-slate-700 rounded text-slate-200">
                Double Click Me
              </button>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700 flex items-center justify-center">
            <div className="w-32 h-32 rounded bg-pink-500 text-white flex items-center justify-center">
              Target Area
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
