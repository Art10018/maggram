import http from "./http";

export const getFeedApi = () => http.get("/feed");
