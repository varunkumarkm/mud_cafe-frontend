import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("jwt") || null,

  login: (user, token) => {
    localStorage.setItem("jwt", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("user");
    set({ user: null, token: null });
  },
}));