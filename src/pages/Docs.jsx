// src/pages/Docs.jsx
import React, { useCallback, useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  MdMouse,
  MdKeyboard,
  MdInput,
  MdOpenInBrowser,
  MdFilterVintage,
  MdTouchApp,
  MdSwapHoriz,
} from "react-icons/md";
import { FiCopy } from "react-icons/fi";

/* ---------- CodePanel (theme-aware) ---------- */
function CodePanel({ filename = "src/example.js", code = "" }) {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" ? document.documentElement.classList.contains("dark") : false
  );

  useEffect(() => {
    function onStorage(e) {
      if (e.key === "theme") setIsDark(e.newValue === "dark");
    }
    window.addEventListener("storage", onStorage);

    const mo = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      window.removeEventListener("storage", onStorage);
      mo.disconnect();
    };
  }, []);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      // keep UX minimal in docs — no toast by default
    } catch (err) {
      console.warn("Copy failed", err);
    }
  }, [code]);

  return (
    <div className="mb-4">
      <div
        className={
          isDark
            ? "relative rounded-lg bg-[#0c0f13] border border-slate-800 overflow-hidden"
            : "relative rounded-lg bg-slate-50 border border-slate-200 overflow-hidden"
        }
      >
        {/* top bar */}
        <div
          className={
            isDark
              ? "flex items-center justify-between px-3 py-2 border-b border-slate-800/60"
              : "flex items-center justify-between px-3 py-2 border-b border-slate-200"
          }
        >
          <div className={isDark ? "flex items-center gap-2 text-xs text-slate-400 font-mono" : "flex items-center gap-2 text-xs text-slate-500 font-mono"}>
            <span className="inline-block w-2 h-2 rounded-sm bg-pink-500 mr-1" />
            <span>{filename}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copy}
              className={
                isDark
                  ? "text-xs px-2 py-1 rounded border border-slate-800 text-slate-300 hover:bg-slate-800/50 flex items-center gap-2"
                  : "text-xs px-2 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-2"
              }
            >
              <FiCopy /> Copy
            </button>
          </div>
        </div>

        {/* code area */}
        <div className="live-source-scroll">
          <SyntaxHighlighter
            language="javascript"
            style={isDark ? atomDark : oneLight}
            showLineNumbers={false}
            wrapLongLines={true}
            customStyle={{
              background: "transparent",
              margin: 0,
              padding: "1rem",
              maxHeight: "320px",
              overflow: "auto",
              fontSize: "0.78rem",
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
  );
}

/* ---------- Snippets ---------- */
const SNIPPETS = {
  click: `// Click event — simplest example
const btn = document.getElementById('myBtn');
btn.addEventListener('click', (e) => {
  // do something when clicked
  e.preventDefault();
  console.log('clicked', e.target);
});`,

  mouse: `// Mouse events — enter/leave/move
const box = document.querySelector('.hover-area');
box.addEventListener('mouseenter', () => console.log('enter'));
box.addEventListener('mouseleave', () => console.log('leave'));
box.addEventListener('mousemove', (e) => console.log('pos', e.clientX, e.clientY));`,

  keyboard: `// Keyboard events — keydown/keyup + input
window.addEventListener('keydown', (e) => console.log('keydown', e.key, e.code));
window.addEventListener('keyup', (e) => console.log('keyup', e.key, e.code));

const input = document.querySelector('#textInput');
input.addEventListener('input', (e) => console.log('input value', e.target.value));`,

  form: `// Form submit / input / change
const form = document.querySelector('#demoForm');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(form);
  console.log(Object.fromEntries(data.entries()));
});

form.querySelector('[name=email]').addEventListener('change', (e) => {
  console.log('email changed to', e.target.value);
});`,

  window: `// Window events — resize, scroll, load
window.addEventListener('resize', () => {
  console.log('size', window.innerWidth, window.innerHeight);
});

window.addEventListener('scroll', () => {
  console.log('scrollY', window.scrollY);
});

window.addEventListener('load', () => console.log('page loaded'));`,

  pointer: `// Pointer & touch events
const target = document.querySelector('.card');
target.addEventListener('pointerdown', (e) => console.log('pointerdown', e.pointerType));
target.addEventListener('pointermove', () => console.log('pointermove'));
target.addEventListener('pointerup', () => console.log('pointerup'));

target.addEventListener('touchstart', () => console.log('touchstart'));`,

  drag: `// Drag & Drop (desktop)
const drag = document.getElementById('drag');
drag.setAttribute('draggable', true);
drag.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', 'drag-1'));

const drop = document.getElementById('dropzone');
drop.addEventListener('dragover', (e) => e.preventDefault());
drop.addEventListener('drop', (e) => {
  e.preventDefault();
  const id = e.dataTransfer.getData('text/plain');
  console.log('dropped', id);
});`,

  focusBlur: `// Focus and blur handlers
const field = document.querySelector('#name');
field.addEventListener('focus', () => console.log('focused'));
field.addEventListener('blur', () => console.log('blurred'));`,

  propagation: `// Propagation (capture vs bubble) and stopping
const parent = document.getElementById('parent');
const child = document.getElementById('child');

parent.addEventListener('click', () => console.log('parent capture'), true); // capture
parent.addEventListener('click', () => console.log('parent bubble')); // bubble

child.addEventListener('click', (e) => {
  e.stopPropagation(); // stop bubbling to parents
  console.log('child clicked — stopped');
});`,

  custom: `// Custom events with detail payloads
const loginEvt = new CustomEvent('user:login', { detail: { id: 42, name: 'Ava' } });
window.dispatchEvent(loginEvt);

window.addEventListener('user:login', (e) => console.log('user logged in', e.detail));`,

  debounce: `// Debounce helper useful for scroll/resize handlers
function debounce(fn, wait = 150) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}
window.addEventListener('resize', debounce(() => console.log('resized (debounced)'), 200));`,
};

/* ---------- jQuery expanded snippets ---------- */
const JQ = {
  effects: `// jQuery effects: fade/slide/toggle
$('#panel').fadeIn(300);
$('#panel').fadeOut(300);
$('#nav').slideToggle(250);
$('#card').toggleClass('active');`,

  domManipulation: `// DOM manipulation: add/remove/replace
$('#list').append('<li>New item</li>');
$('#container').prepend('<header>Title</header>');
$('#old').remove();
$('#item').replaceWith('<div class="new">Replaced</div>');`,

  eventsDelegation: `// Events & Delegation (preferred for dynamic content)
$(document).on('click', '.btn', function(e) {
  console.log('button clicked', this);
});

// namespaced events
$('.menu').on('click.ui', (e) => console.log('ui click'));`,

  ajaxBasics: `// AJAX helpers: $.ajax, $.get, $.post, $.getJSON
$.get('/api/items', { limit: 10 })
  .done((data) => console.log('items', data))
  .fail((err) => console.error(err));

$.post('/api/save', { name: 'Ava' }, (res) => console.log('saved', res));`,

  traverse: `// Traversal: find, closest, parent, children, siblings
const items = $('#list').find('.item');
const nearest = $('#a').closest('.card');
const parents = $('#node').parents('.container');
const children = $('#menu').children();`,

  utilities: `// Utilities: $.each, $.map, $.extend, $.param
$.each([1,2,3], (i, v) => console.log(i, v));
const merged = $.extend({}, defaults, opts);
const qs = $.param({ a:1, b:2 });`,

  animateQueue: `// Animations + queue control
$('#box').animate({ left: '200px', opacity: 0.8 }, 400)
  .queue(function(next) {
    console.log('animation step complete');
    next();
  });

$('#box').stop(true, true); // stop queue and jump to end`, 

  dataAttr: `// Data & attributes
$('#card').data('id', 123);
console.log($('#card').data('id'))

$('#img').attr('src', '/img.jpg');
$('#link').prop('disabled', true);`,
  
  chainingCallbacks: `// Chaining & callbacks
$('#btn')
  .addClass('loading')
  .fadeOut(200, function() {
    $(this).removeClass('loading').text('Done').fadeIn(200);
  });`,

  plugins: `// Plugin basic pattern (authoring)
(function($) {
  $.fn.highlight = function() {
    return this.each(function() {
      $(this).css('background', 'yellow');
    });
  };
})(jQuery);

// usage:
$('.title').highlight();`,
};

/* ---------- Main component ---------- */
export default function Docs() {
  return (
    <div className="min-h-screen text-slate-800 dark:bg-slate-900 dark:text-slate-100 p-6 lg:p-12 transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">DOM Events</h1>
          <p className="text-slate-700 dark:text-slate-400 mt-3 leading-relaxed max-w-3xl">
            The Document Object Model (DOM) enables JavaScript to react to user and browser actions.
            Below are common event topics plus an expanded jQuery cheatsheet. Each example is a short,
            copy-ready snippet shown in a LiveSource-style code panel (theme-aware).
            This file is documentation-only — no runtime testing or interactive demos.
          </p>
        </header>

        {/* Click */}
        <section className="mb-8 rounded-xl border border-slate-200 dark:border-[#223649] bg-white dark:bg-slate-800/60 p-6 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded bg-slate-100 dark:bg-slate-900/50"><MdMouse className="text-slate-700 dark:text-slate-200" /></span>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Click Events</h2>
            </div>
            <div className="text-xs font-mono bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">MouseEvent</div>
          </div>

          <p className="text-slate-700 dark:text-slate-400 mt-3">
            <strong>What:</strong> <code>click</code> fires when a pointing device button is pressed and released over an element.
          </p>

          <div className="mt-4">
            <CodePanel filename="examples/click.js" code={SNIPPETS.click} />
          </div>
        </section>

        {/* Mouse */}
        <section className="mb-8 rounded-xl border border-slate-200 dark:border-[#223649] bg-white dark:bg-slate-800/60 p-6 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded bg-slate-100 dark:bg-slate-900/50"><MdMouse className="text-slate-700 dark:text-slate-200" /></span>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Mouse Events</h2>
            </div>
            <div className="text-xs font-mono bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">MouseEvent</div>
          </div>
          <p className="text-slate-700 dark:text-slate-400 mt-3">Use <code>mouseenter</code>, <code>mouseleave</code>, <code>mousemove</code> for hover and cursor tracking; throttle heavy work.</p>
          <div className="mt-4">
            <CodePanel filename="examples/mouse.js" code={SNIPPETS.mouse} />
          </div>
        </section>

        {/* Keyboard */}
        <section className="mb-8 rounded-xl border border-slate-200 dark:border-[#223649] bg-white dark:bg-slate-800/60 p-6 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded bg-slate-100 dark:bg-slate-900/50"><MdKeyboard className="text-slate-700 dark:text-slate-200" /></span>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Keyboard Events</h2>
            </div>
            <div className="text-xs font-mono bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">KeyboardEvent</div>
          </div>
          <p className="text-slate-700 dark:text-slate-400 mt-3"><code>keydown</code>/<code>keyup</code> are for physical key presses; <code>input</code> is for text fields (characters).</p>
          <div className="mt-4">
            <CodePanel filename="examples/keyboard.js" code={SNIPPETS.keyboard} />
          </div>
        </section>

        {/* Form */}
        <section className="mb-8 rounded-xl border border-slate-200 dark:border-[#223649] bg-white dark:bg-slate-800/60 p-6 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded bg-slate-100 dark:bg-slate-900/50"><MdInput className="text-slate-700 dark:text-slate-200" /></span>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Form Events</h2>
            </div>
            <div className="text-xs font-mono bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">HTMLFormElement</div>
          </div>
          <p className="text-slate-700 dark:text-slate-400 mt-3">Use <code>submit</code> for final data collection; <code>input</code> for live validation and <code>change</code> for finalized changes.</p>
          <div className="mt-4">
            <CodePanel filename="examples/form.js" code={SNIPPETS.form} />
          </div>
        </section>

        {/* Window */}
        <section className="mb-8 rounded-xl border border-slate-200 dark:border-[#223649] bg-white dark:bg-slate-800/60 p-6 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded bg-slate-100 dark:bg-slate-900/50"><MdOpenInBrowser className="text-slate-700 dark:text-slate-200" /></span>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Window & Global Events</h2>
            </div>
            <div className="text-xs font-mono bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">Window</div>
          </div>
          <p className="text-slate-700 dark:text-slate-400 mt-3"><code>resize</code>, <code>scroll</code>, <code>load</code> belong to the <code>window</code> — debounce expensive handlers.</p>
          <div className="mt-4">
            <CodePanel filename="examples/window.js" code={SNIPPETS.window} />
            <CodePanel filename="examples/debounce.js" code={SNIPPETS.debounce} />
          </div>
        </section>

        {/* Pointer & Touch */}
        <section className="mb-8 rounded-xl border border-slate-200 dark:border-[#223649] bg-white dark:bg-slate-800/60 p-6 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded bg-slate-100 dark:bg-slate-900/50"><MdTouchApp className="text-slate-700 dark:text-slate-200" /></span>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Pointer & Touch Events</h2>
            </div>
            <div className="text-xs font-mono bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">PointerEvent</div>
          </div>
          <p className="text-slate-700 dark:text-slate-400 mt-3">Prefer <code>pointer*</code> for unified handling across mouse/pen/touch; keep <code>touch*</code> only for low-level touch control.</p>
          <div className="mt-4">
            <CodePanel filename="examples/pointer.js" code={SNIPPETS.pointer} />
          </div>
        </section>

        {/* Drag & Drop */}
        <section className="mb-8 rounded-xl border border-slate-200 dark:border-[#223649] bg-white dark:bg-slate-800/60 p-6 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded bg-slate-100 dark:bg-slate-900/50"><MdSwapHoriz className="text-slate-700 dark:text-slate-200" /></span>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Drag & Drop</h2>
            </div>
            <div className="text-xs font-mono bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">Drag & Drop API</div>
          </div>
          <p className="text-slate-700 dark:text-slate-400 mt-3">HTML5 Drag & Drop is desktop-friendly; for touch use pointer-based solutions.</p>
          <div className="mt-4">
            <CodePanel filename="examples/drag.js" code={SNIPPETS.drag} />
          </div>
        </section>

        {/* Focus & Propagation & Custom */}
        <section className="mb-8 rounded-xl border border-slate-200 dark:border-[#223649] bg-white dark:bg-slate-800/60 p-6 transition-colors duration-200">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Focus, Propagation & Custom Events</h2>
          <div className="mt-3 text-slate-700 dark:text-slate-400">
            <p><strong>Focus/Blur:</strong> validation and accessibility. <strong>Propagation:</strong> capture → target → bubble. <strong>CustomEvent:</strong> domain-specific messages.</p>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <CodePanel filename="examples/focus-blur.js" code={SNIPPETS.focusBlur} />
            <CodePanel filename="examples/propagation.js" code={SNIPPETS.propagation} />
            <CodePanel filename="examples/custom.js" code={SNIPPETS.custom} />
          </div>
        </section>

        {/* jQuery Expanded */}
        <section className="mb-12 rounded-xl border border-slate-200 dark:border-[#223649] bg-white dark:bg-slate-800/60 p-6 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded bg-slate-100 dark:bg-slate-900/50"><MdFilterVintage className="text-slate-700 dark:text-slate-200" /></span>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">jQuery — Expanded Cheatsheet</h2>
            </div>
            <div className="text-xs font-mono bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">jQuery</div>
          </div>

          <p className="text-slate-700 dark:text-slate-400 mt-3">
            jQuery provides concise helpers for effects, traversal, events, AJAX, utilities and plugin patterns. Below are categorized snippets for common tasks.
          </p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-slate-900 dark:text-white font-semibold mb-2">Effects</h3>
              <CodePanel filename="examples/jquery/effects.js" code={JQ.effects} />

              <h3 className="text-slate-900 dark:text-white font-semibold mb-2">DOM Manipulation</h3>
              <CodePanel filename="examples/jquery/dom.js" code={JQ.domManipulation} />

              <h3 className="text-slate-900 dark:text-white font-semibold mb-2">Events & Delegation</h3>
              <CodePanel filename="examples/jquery/events.js" code={JQ.eventsDelegation} />
            </div>

            <div>
              <h3 className="text-slate-900 dark:text-white font-semibold mb-2">AJAX & Helpers</h3>
              <CodePanel filename="examples/jquery/ajax.js" code={JQ.ajaxBasics} />

              <h3 className="text-slate-900 dark:text-white font-semibold mb-2">Traversal & Filters</h3>
              <CodePanel filename="examples/jquery/traverse.js" code={JQ.traverse} />

              <h3 className="text-slate-900 dark:text-white font-semibold mb-2">Utilities & Iteration</h3>
              <CodePanel filename="examples/jquery/utils.js" code={JQ.utilities} />
            </div>

            <div>
              <h3 className="text-slate-900 dark:text-white font-semibold mb-2">Animations & Queue</h3>
              <CodePanel filename="examples/jquery/animate.js" code={JQ.animateQueue} />

              <h3 className="text-slate-900 dark:text-white font-semibold mb-2">Data & Attributes</h3>
              <CodePanel filename="examples/jquery/data.js" code={JQ.dataAttr} />
            </div>

            <div>
              <h3 className="text-slate-900 dark:text-white font-semibold mb-2">Chaining & Callbacks</h3>
              <CodePanel filename="examples/jquery/chain.js" code={JQ.chainingCallbacks} />

              <h3 className="text-slate-900 dark:text-white font-semibold mb-2">Plugin Pattern</h3>
              <CodePanel filename="examples/jquery/plugin.js" code={JQ.plugins} />
            </div>
          </div>

          <p className="text-slate-700 dark:text-slate-400 mt-4">
            <strong>Notes:</strong> Prefer modern Web APIs and CSS transitions for new projects. Use jQuery for quick scripts, legacy projects, or when you need concise cross-browser workarounds.
          </p>
        </section>

        <footer className="text-slate-600 dark:text-slate-400 text-sm mb-6">
          <p>
            This file is documentation-only and intentionally avoids running event listeners inside the docs.
            Copy any snippet and paste it into your console or project file to test.
          </p>
        </footer>
      </div>

      {/* scrollbar styles (used by .live-source-scroll) */}
      <style>{`
        .live-source-scroll { scrollbar-width: thin; }
        /* light mode */
        .live-source-scroll::-webkit-scrollbar { width: 10px; height: 10px; }
        .live-source-scroll::-webkit-scrollbar-track { background: #f1f5f9; }
        .live-source-scroll::-webkit-scrollbar-thumb { background: rgba(2,6,23,0.06); border-radius: 9999px; border: 2px solid transparent; background-clip: padding-box; }
        .live-source-scroll::-webkit-scrollbar-thumb:hover { background: rgba(2,6,23,0.10); }

        /* dark mode overrides when .dark present on <html> */
        .dark .live-source-scroll::-webkit-scrollbar-track { background: #334155; }
        .dark .live-source-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); }
        .dark .live-source-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.10); }
      `}</style>
    </div>
  );
}
