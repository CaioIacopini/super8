import axios from "axios";

const api = axios.create({
  baseURL: window.location.origin, // usa o mesmo domínio que está aberto
});

export default api;
