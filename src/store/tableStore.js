import { create } from "zustand";

export const useTableStore = create((set) => ({
  tables: [],

  setTables: (tables) => set({ tables }),

  updateStatus: (id, status) =>
    set((s) => ({
      tables: s.tables.map((t) =>
        t.id === id ? { ...t, status } : t
      ),
    })),

  addTable: (table) =>
    set((s) => ({ tables: [...s.tables, table] })),

  removeTable: (id) =>
    set((s) => ({ tables: s.tables.filter((t) => t.id !== id) })),
}));