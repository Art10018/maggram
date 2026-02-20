import api from "./api";

// register теперь НЕ обязан возвращать token/user.
// Он может вернуть { pending: true, email } или просто { ok: true }.
export const registerApi = async (username, email, password) => {
  const { data } = await api.post("/auth/register", { username, email, password });
  return data;
};

// login как раньше: { token, user }
export const loginApi = async (login, password) => {
  const { data } = await api.post("/auth/login", { login, password });
  return data;
};

// verify email: { token, user }
export const verifyEmailApi = async (email, code) => {
  const { data } = await api.post("/auth/verify-email", { email, code });
  return data;
};

export const resendEmailApi = async (email) => {
  const { data } = await api.post("/auth/resend-email", { email });
  return data;
};