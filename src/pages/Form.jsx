import React, { useEffect, useRef, useState } from "react";
import {
  MdPerson,
  MdEmail,
  MdLock,
  MdNumbers,
  MdSend,
  MdWarningAmber,
  MdCheckCircle,
} from "react-icons/md";

function sendStream(detail) {
  window.dispatchEvent(new CustomEvent("eventstream", { detail }));
}

function prettyTime() {
  return new Date().toLocaleTimeString();
}

/**
 * FormDemo
 * Props:
 *  - title (string) : main title shown at top
 *  - description (string) : subtitle/description under title
 */
export default function FormDemo({
  title = "DOM & jQuery Playground",
  description = "Interact with form elements below to trigger capture events. Observe the console for real-time validation feedback.",
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    number: 18,
    role: "",
    preference: "email",
    message: "",
    accepted: false,
  });

  const [inspector, setInspector] = useState({
    lastEventType: "none",
    targetId: null,
    currentValue: "",
    validationState: null,
  });

  const [submissionLog, setSubmissionLog] = useState({
    lastSubmitted: null,
    prevented: false,
    message: "",
  });

  const nameRef = useRef(null);

  useEffect(() => {
    const codeSnippet = `// Form demo: listens for focus/change/submit
const form = document.querySelector("#demo-form");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  console.log("submit prevented");
});`;
    window.dispatchEvent(new CustomEvent("live-source", { detail: { code: codeSnippet } }));
    sendStream({ text: "Form demo ready", type: "muted" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateInspector(evType, target) {
    const id = target?.id || (target?.name ? `#${target.name}` : null);
    const value = target?.type === "checkbox" ? String(target.checked) : target?.value ?? "";
    let validation = null;
    if (target?.type === "email") {
      validation = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "valid" : "invalid";
    }

    setInspector({
      lastEventType: evType,
      targetId: id,
      currentValue: value,
      validationState: validation,
    });

    sendStream({
      text: `${evType} — ${id ?? target?.tagName} value="${value}"`,
      type: evType === "submit" ? "success" : evType === "blur" ? "muted" : "info",
    });
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
    updateInspector("change", e.target);
  }

  function handleInput(e) {
    updateInspector("input", e.target);
  }

  function handleFocus(e) {
    updateInspector("focus", e.target);
  }

  function handleBlur(e) {
    updateInspector("blur", e.target);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmissionLog({
      lastSubmitted: prettyTime(),
      prevented: true,
      message: "Warning: preventDefault() — The form will not actually submit to a server.",
    });
    updateInspector("submit", e.target);
    sendStream({ text: `submit intercepted — ${prettyTime()}`, type: "warning" });
  }

  return (
    <main className="p-6 lg:p-10 flex-1 transition-colors duration-200 text-slate-800 dark:bg-slate-900 dark:text-slate-100">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* TITLE + DESCRIPTION: moved outside the card (as requested) */}
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>
          <p className="text-slate-700 dark:text-slate-400 mt-1">{description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: form card spanning 2 columns on md */}
          <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white dark:border-[#223649] dark:bg-slate-800/60 p-6 flex flex-col gap-4 transition-colors duration-200">
            <form id="demo-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Row 1: Text & Email */}
              <div>
                <label htmlFor="f-name" className="text-xs font-semibold text-slate-700 dark:text-slate-400 block mb-2 flex items-center gap-2">
                  <MdPerson className="text-slate-600 dark:text-slate-300" />
                  <span>TEXT INPUT</span>
                </label>
                <input
                  id="f-name"
                  name="name"
                  ref={nameRef}
                  value={form.name}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onChange={handleChange}
                  onInput={handleInput}
                  placeholder="e.g. John Doe"
                  className="mt-1 w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-200"
                />
              </div>

              <div>
                <label htmlFor="f-email" className="text-xs font-semibold text-slate-700 dark:text-slate-400 block mb-2 flex items-center gap-2">
                  <MdEmail className="text-slate-600 dark:text-slate-300" />
                  <span>EMAIL INPUT</span>
                </label>
                <input
                  id="f-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onChange={handleChange}
                  onInput={handleInput}
                  placeholder="john@example.com"
                  className="mt-1 w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-200"
                />
              </div>

              {/* Row 2: Password & Number */}
              <div>
                <label htmlFor="f-password" className="text-xs font-semibold text-slate-700 dark:text-slate-400 block mb-2 flex items-center gap-2">
                  <MdLock className="text-slate-600 dark:text-slate-300" />
                  <span>PASSWORD</span>
                </label>
                <input
                  id="f-password"
                  name="password"
                  type="password"
                  value={form.password}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onChange={handleChange}
                  onInput={handleInput}
                  placeholder="••••••••"
                  className="mt-1 w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-200"
                />
              </div>

              <div>
                <label htmlFor="f-number" className="text-xs font-semibold text-slate-700 dark:text-slate-400 block mb-2 flex items-center gap-2">
                  <MdNumbers className="text-slate-600 dark:text-slate-300" />
                  <span>NUMBER</span>
                </label>
                <input
                  id="f-number"
                  name="number"
                  type="number"
                  min={0}
                  value={form.number}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onChange={handleChange}
                  onInput={handleInput}
                  className="mt-1 w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-200"
                />
              </div>

              {/* Row 3: Select & Preference (radio) */}
              <div>
                <label htmlFor="f-role" className="text-xs font-semibold text-slate-700 dark:text-slate-400 block mb-2">SELECT DROPDOWN</label>
                <select
                  id="f-role"
                  name="role"
                  value={form.role}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onChange={handleChange}
                  className="mt-1 w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-200"
                >
                  <option value="">Select a role...</option>
                  <option value="frontend">Frontend</option>
                  <option value="backend">Backend</option>
                  <option value="fullstack">Full-stack</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-400 block mb-2">PREFERENCE</label>
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-slate-800 dark:text-slate-300">
                    <input
                      type="radio"
                      name="preference"
                      value="email"
                      checked={form.preference === "email"}
                      onChange={handleChange}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      className="form-radio"
                    />
                    <span className="text-xs">Email</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-slate-800 dark:text-slate-300">
                    <input
                      type="radio"
                      name="preference"
                      value="phone"
                      checked={form.preference === "phone"}
                      onChange={handleChange}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      className="form-radio"
                    />
                    <span className="text-xs">Phone</span>
                  </label>
                </div>
              </div>

              {/* Row 4: Textarea (full width) */}
              <div className="md:col-span-2">
                <label htmlFor="f-message" className="text-xs font-semibold text-slate-700 dark:text-slate-400 block mb-2">TEXT AREA</label>
                <textarea
                  id="f-message"
                  name="message"
                  rows={4}
                  value={form.message}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onChange={handleChange}
                  onInput={handleInput}
                  placeholder="Tell us about your coding journey..."
                  className="mt-1 w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-200"
                />
              </div>

              {/* Row 5: Checkbox + Submit */}
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-slate-800 dark:text-slate-300">
                  <input
                    id="f-accept"
                    name="accepted"
                    type="checkbox"
                    checked={form.accepted}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className="form-checkbox"
                  />
                  <span className="text-xs">I accept the terms &amp; conditions</span>
                </label>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded shadow"
                >
                  <span className="font-semibold">Submit Form</span>
                  <MdSend className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Right column: Event Inspector + Submission status */}
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-slate-200 bg-white dark:border-[#223649] dark:bg-slate-800/60 p-4 flex flex-col gap-3 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono text-slate-600 dark:text-slate-400">EVENT INSPECTOR</div>
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mt-1">Last Event Type</h4>
                </div>
                <div className="text-sm text-slate-700 dark:text-slate-400">{inspector.lastEventType}</div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-xs text-slate-600 dark:text-slate-400">Target Element ID</div>
                <div className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 font-mono dark:bg-slate-900/40 dark:border-slate-700 dark:text-slate-300">{inspector.targetId ?? "—"}</div>

                <div className="text-xs text-slate-600 dark:text-slate-400 mt-2">Current Value</div>
                <div className="bg-slate-50 border border-slate-200 rounded px-2 py-2 text-xs text-slate-700 font-mono break-words min-h-[48px] dark:bg-slate-900/40 dark:border-slate-700 dark:text-slate-200">
                  {inspector.currentValue || "—"}
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs text-slate-600 dark:text-slate-400">Validation State</div>
                  <div>
                    {inspector.validationState === "valid" && (
                      <span className="inline-flex items-center gap-2 bg-emerald-200 text-emerald-800 text-xs px-2 py-1 rounded">
                        <MdCheckCircle /> Valid Input
                      </span>
                    )}
                    {inspector.validationState === "invalid" && (
                      <span className="inline-flex items-center gap-2 bg-rose-600/80 text-white text-xs px-2 py-1 rounded">
                        <MdWarningAmber /> Invalid
                      </span>
                    )}
                    {!inspector.validationState && (
                      <span className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded dark:bg-slate-800/40 dark:text-slate-300">—</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white dark:border-[#223649] dark:bg-slate-800/60 p-4 transition-colors duration-200">
              <div className="flex items-start gap-3">
                <div>
                  <div className="text-xs font-mono text-slate-600 dark:text-slate-400">SUBMISSION STATUS</div>
                  <div className="mt-2">
                    {submissionLog.prevented ? (
                      <div className="flex items-center gap-2">
                        <MdWarningAmber className="text-amber-500" />
                        <div className="text-sm text-amber-700 font-semibold">Warning: preventDefault()</div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-700 font-semibold dark:text-slate-300">Not submitted</div>
                    )}
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-2">{submissionLog.message || "The form will not actually submit to a server. We are intercepting the submit event to show this message."}</div>

                    <div className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                      <div>Last submitted: <span className="text-slate-800 dark:text-slate-200 ml-1">{submissionLog.lastSubmitted ?? "—"}</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <button
                  className="text-xs px-2 py-1 rounded border border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-300"
                  onClick={() => {
                    setSubmissionLog({ lastSubmitted: null, prevented: false, message: "" });
                    sendStream({ text: "submission log cleared", type: "muted" });
                  }}
                  type="button"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
