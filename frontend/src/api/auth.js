import api from "./api";

export const registerApi = (data) => api.post("/auth/register", data);
export const loginApi = (data) => api.post("/auth/login", data);

export const verifyEmailApi = (data) => api.post("/auth/verify-email", data);
export const resendEmailApi = (data) => api.post("/auth/resend-email", data);