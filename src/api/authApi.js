import api from "./axiosInstance";

export const loginApi = (data) => api.post("/auth/login", data);