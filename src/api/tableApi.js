import api from "./axiosInstance";

export const getAllTables = () => api.get("/tables");
export const createTable = (data) => api.post("/tables", data);
export const updateTable = (id, data) => api.put(`/tables/${id}`, data);
export const deleteTable = (id) => api.delete(`/tables/${id}`);
export const updateTableStatus = (id, status) =>
    api.patch(`/tables/${id}/status`, { status });