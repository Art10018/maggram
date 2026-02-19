import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

export const registerApi = (payload) => api.post("/auth/register", payload);
export const verifyEmailApi = (payload) => api.post("/auth/verify-email", payload);
export const resendEmailApi = (payload) => api.post("/auth/resend-email", payload);
export const loginApi = (payload) => api.post("/auth/login", payload);

export default api;
