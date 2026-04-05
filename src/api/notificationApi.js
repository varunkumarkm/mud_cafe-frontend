import api from "./axiosInstance";

export const getMyNotifications = () => api.get("/notifications");
export const markAsRead = (id) => api.patch(`/notifications/${id}/read`);
export const markAllRead = () => api.patch("/notifications/read-all");