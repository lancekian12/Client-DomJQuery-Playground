import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import EventMasterLayout from "./layouts/EventMasterLayout";
import Home from "./pages/Home";
import Keyboard from "./pages/Keyboard";
import FormPage from "./pages/Form";
import Effects from "./pages/Effects";
import Docs from "./pages/Docs";
import Window from "./pages/Window";

export default function App() {
  return (
    <BrowserRouter>
      {/* Root: white/light by default, dark overrides when .dark exists */}
      <div className="min-h-screen bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100 transition-colors duration-200">
        <Routes>
          <Route path="/" element={<EventMasterLayout />}>
            <Route index element={<Home />} />
            <Route path="keyboard" element={<Keyboard />} />
            <Route path="window" element={<Window />} />
            <Route path="form" element={<FormPage />} />
            <Route path="effects" element={<Effects />} />
            <Route path="docs" element={<Docs />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
