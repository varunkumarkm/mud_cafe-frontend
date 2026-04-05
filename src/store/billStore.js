import { create } from "zustand";

export const useBillStore = create((set) => ({
  activeBill: null,

  setActiveBill: (bill) => set({ activeBill: bill }),

  clearActiveBill: () => set({ activeBill: null }),

  addItem: (item) =>
    set((s) => ({
      activeBill: s.activeBill
        ? { ...s.activeBill, items: [...(s.activeBill.items || []), item] }
        : null,
    })),

  removeItem: (itemId) =>
    set((s) => ({
      activeBill: s.activeBill
        ? {
            ...s.activeBill,
            items: s.activeBill.items.filter((i) => i.id !== itemId),
          }
        : null,
    })),
}));