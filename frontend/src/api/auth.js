import api from "../lib/api";

// register теперь НЕ обязан возвращать token/user.
// Он может вернуть { pending: true, email } или просто { ok: true }.
export const registerApi = async (username, email, password) => {
  const { data } = await api.post("/auth/register", { username, email, password });
  return data;
};

// login: поддерживает оба вызова
// loginApi("username_or_email", "password")
// loginApi({ login, password })
export const loginApi = async (loginOrPayload, passwordArg) => {
  const login =
    typeof loginOrPayload === "object" && loginOrPayload !== null
      ? loginOrPayload.login || loginOrPayload.username || loginOrPayload.email || ""
      : loginOrPayload || "";

  const password =
    typeof loginOrPayload === "object" && loginOrPayload !== null
      ? loginOrPayload.password || ""
      : passwordArg || "";

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