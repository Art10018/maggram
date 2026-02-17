import http from "./http";

// ====== Я ======
export const updateMyProfileApi = (payload) => http.patch("/users/me/profile", payload);
export const updateMyCredentialsApi = (payload) => http.patch("/users/me/credentials", payload);

export const uploadMyAvatarApi = (file) => {
  const fd = new FormData();
  fd.append("avatar", file);
  return http.post("/users/me/avatar", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// ====== Другие пользователи ======
export const getUserByIdApi = (id) => http.get(`/users/${id}`);
export const getUserPostsByIdApi = (id) => http.get(`/users/${id}/posts`);

// ====== Алиасы (совместимость) ======
export const getUserApi = getUserByIdApi;
export const getUserPostsApi = getUserPostsByIdApi;
