// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.DEV
    ? "http://localhost:3000" // quando rodar Vite em dev
    : window.location.origin, // quando estiver buildado no Render
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
