import api from "./axiosInstance";

export const createBill = (data) => api.post("/bills", data);
export const getBillByTable = (tableId) => api.get(`/bills/table/${tableId}`);
export const addItem = (billId, data) => api.post(`/bills/${billId}/items`, data);
export const removeItem = (billId, itemId) => api.delete(`/bills/${billId}/items/${itemId}`);
export const markAsPaid = (billId, data) => api.patch(`/bills/${billId}/pay`, data);
export const applyDiscount = (billId, data) => api.patch(`/bills/${billId}/discount`, data);
export const getRecentPaidBills = () => api.get("/bills/recent");