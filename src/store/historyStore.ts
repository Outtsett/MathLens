import { create } from 'zustand';

export interface HistoryEntry {
  id: string;
  expression: string;
  latex: string;
  name: string;
  timestamp: number;
  isFavorite: boolean;
}

interface HistoryStore {
  entries: HistoryEntry[];
  addEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp' | 'isFavorite'>) => void;
  toggleFavorite: (id: string) => void;
  removeEntry: (id: string) => void;
  clearHistory: () => void;
  getFavorites: () => HistoryEntry[];
}

const STORAGE_KEY = 'mathlens-history';

function loadFromStorage(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage quota exceeded — silently ignore
  }
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  entries: loadFromStorage(),

  addEntry: (entry) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      isFavorite: false,
    };
    set((state) => {
      // Avoid duplicate consecutive entries with the same expression
      if (state.entries.length > 0 && state.entries[0].expression === entry.expression) {
        return state;
      }
      const updated = [newEntry, ...state.entries].slice(0, 200);
      saveToStorage(updated);
      return { entries: updated };
    });
  },

  toggleFavorite: (id) =>
    set((state) => {
      const updated = state.entries.map((e) =>
        e.id === id ? { ...e, isFavorite: !e.isFavorite } : e,
      );
      saveToStorage(updated);
      return { entries: updated };
    }),

  removeEntry: (id) =>
    set((state) => {
      const updated = state.entries.filter((e) => e.id !== id);
      saveToStorage(updated);
      return { entries: updated };
    }),

  clearHistory: () => {
    saveToStorage([]);
    set({ entries: [] });
  },

  getFavorites: () => get().entries.filter((e) => e.isFavorite),
}));
