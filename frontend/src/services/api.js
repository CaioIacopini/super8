// src/services/api.js
import axios from "axios";

// Use Vite env variable VITE_API_URL when available. Falls back to
// the Render deployment URL (production) or localhost for local dev.
const envUrl = import.meta.env.VITE_API_URL;
const baseURL =
  envUrl ||
  (window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://super8-1.onrender.com");

const api = axios.create({
  baseURL,
});

// sempre que tiver token no localStorage, envia
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("super8_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
