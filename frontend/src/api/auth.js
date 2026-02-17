import http from "./http";

export const registerApi = (payload) => http.post("/auth/register", payload);

// ВАЖНО: передаём email + username вместе
export const loginApi = ({ login, password }) =>
  http.post("/auth/login", {
    email: login,
    username: login,
    password,
  });

export const meApi = () => http.get("/auth/me");
