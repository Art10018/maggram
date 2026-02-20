// frontend/src/api/api.js
import axios from "axios";

// В проде запросы идут через nginx на /api (прокси на backend)
const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export default api;