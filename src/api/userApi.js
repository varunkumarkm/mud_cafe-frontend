import api from "./axiosInstance";

export const getAllUsers = () => api.get("/users");
export const createUser = (data) => api.post("/users", data);
export const deactivateUser = (id) => api.patch(`/users/${id}/deactivate`);
export const activateUser = (id) => api.patch(`/users/${id}/activate`);