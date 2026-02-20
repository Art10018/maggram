import axios from "axios";

const http = axios.create({
  baseURL: "/api",
  withCredentials: false,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default http;

