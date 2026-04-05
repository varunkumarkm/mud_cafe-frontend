import { create } from "zustand";

export const useNotificationStore = create((set, get) => ({
  notifications: [],

  add: (notification) =>
    set((s) => ({
      notifications: [notification, ...s.notifications].slice(0, 50),
    })),

  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),

  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}));