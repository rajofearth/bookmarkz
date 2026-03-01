import { create } from "zustand";

interface SemanticIndexerState {
  isRunning: boolean;
  isPaused: boolean;
  processedCount: number;
  totalCount: number;
  errorCount: number;
  setRunning: (running: boolean) => void;
  setPaused: (paused: boolean) => void;
  setProcessedCount: (count: number | ((prev: number) => number)) => void;
  setTotalCount: (count: number) => void;
  setErrorCount: (count: number | ((prev: number) => number)) => void;
  resetProgress: () => void;
}

export const useSemanticIndexerStore = create<SemanticIndexerState>()(
  (set) => ({
    isRunning: false,
    isPaused: false,
    processedCount: 0,
    totalCount: 0,
    errorCount: 0,
    setRunning: (running) => set({ isRunning: running }),
    setPaused: (paused) => set({ isPaused: paused }),
    setProcessedCount: (count) =>
      set((state) => ({
        processedCount:
          typeof count === "function" ? count(state.processedCount) : count,
      })),
    setTotalCount: (totalCount) => set({ totalCount }),
    setErrorCount: (count) =>
      set((state) => ({
        errorCount: typeof count === "function" ? count(state.errorCount) : count,
      })),
    resetProgress: () =>
      set({
        processedCount: 0,
        totalCount: 0,
        errorCount: 0,
      }),
  }),
);
