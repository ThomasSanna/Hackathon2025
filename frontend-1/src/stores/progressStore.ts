import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface BookStats {
  id: string;
  title?: string;
  progress: number; // 0-100
  currentPage: number;
  totalPages: number;
  lastRead: number; // timestamp
  isFavorite: boolean;
  timeSpent: number; // in seconds
}

interface ProgressState {
  books: Record<string, BookStats>;
  
  // Actions
  updateProgress: (id: string, updates: Partial<BookStats>) => void;
  toggleFavorite: (id: string) => void;
  getFormattedTime: (seconds: number) => string;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      books: {},

      updateProgress: (id, updates) => {
        set((state) => {
          const currentBook = state.books[id] || {
            id,
            progress: 0,
            currentPage: 1,
            totalPages: 1,
            lastRead: Date.now(),
            isFavorite: false,
            timeSpent: 0,
          };

          return {
            books: {
              ...state.books,
              [id]: {
                ...currentBook,
                ...updates,
                lastRead: Date.now(),
              },
            },
          };
        });
      },

      toggleFavorite: (id) => {
        set((state) => {
          const currentBook = state.books[id];
          if (!currentBook) return state; // Only toggle if book exists in store (or initialized)
          
          return {
            books: {
              ...state.books,
              [id]: {
                ...currentBook,
                isFavorite: !currentBook.isFavorite,
              },
            },
          };
        });
      },

      getFormattedTime: (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
      },
    }),
    {
      name: "reading-progress-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
