import http from "./http";

// status: { status: "none" | "following" | ... } (как у тебя в бэке)
export const getFollowStatusApi = (targetId) => http.get(`/follows/status/${targetId}`);

// toggle follow/unfollow
export const toggleFollowApi = (targetId) => http.post(`/follows/${targetId}`);
