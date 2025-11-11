// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
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
