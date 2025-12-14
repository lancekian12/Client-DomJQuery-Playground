import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import EventMasterLayout from "./layouts/EventMasterLayout";
import Home from "./pages/Home";
import Keyboard from "./pages/Keyboard";
import FormPage from "./pages/Form";
import Effects from "./pages/Effects";
import Docs from "./pages/Docs";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EventMasterLayout />}>
          <Route index element={<Home />} />
          <Route path="keyboard" element={<Keyboard />} />
          <Route path="form" element={<FormPage />} />
          <Route path="effects" element={<Effects />} />
          <Route path="docs" element={<Docs />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
