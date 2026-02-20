import http from "./http";

export const getCommentsApi = (postId) => http.get(`/comments/${postId}`);
export const createCommentApi = (postId, text) => http.post(`/comments/${postId}`, { text });
