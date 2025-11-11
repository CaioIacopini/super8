import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Super8Matches from "./pages/Super8Matches";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/super8/:id" element={<Super8Matches />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
