import axios from "axios";

const api = axios.create({
  baseURL: "https://super8-1.onrender.com",
});

export default api;
