import http from "./http";

// ✅ новые имена (которые я предлагал)
export const getAllPostsApi = () => http.get("/posts");
export const createPostApi = (payload) => http.post("/posts", payload);

// ✅ старые имена (совместимость с твоими компонентами)
export const apiGetAllPosts = getAllPostsApi;
export const apiCreatePost = createPostApi;

// если где-то у тебя было createPostApi(form) — тоже ок
