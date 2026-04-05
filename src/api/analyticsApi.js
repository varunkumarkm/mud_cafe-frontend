import api from "./axiosInstance";

export const getDailySummary = () => api.get("/analytics/summary");
export const getRevenue = (from, to) =>
    api.get(`/analytics/revenue?from=${from}&to=${to}`);
export const getTopItems = (from, to) =>
    api.get(`/analytics/top-items?from=${from}&to=${to}`);