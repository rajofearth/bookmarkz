import { create } from "zustand";

export type ModelLoadingStage =
  | "idle"
  | "initiate"
  | "download"
  | "progress"
  | "loading"
  | "done";

export type IndexerRunMode = "manual" | "background";

interface SemanticIndexerState {
  // ── Run state ───────────────────────────────────────────────────────
  isRunning: boolean;
  isPaused: boolean;
  activeMode: IndexerRunMode | null;
  processedCount: number;
  totalCount: number;
  errorCount: number;

  // ── Model loading ───────────────────────────────────────────────────
  /** True once the model is fully loaded for this run */
  modelReady: boolean;
  modelLoadingStage: ModelLoadingStage;
  modelLoadingProgress: number;
  modelLoadingDtype: string | null;
  modelLoadingSpeedBytesPerSec: number;
  /** Per-file download progress: filename → { loaded, total } */
  fileProgress: Record<string, { loaded: number; total: number }>;

  // ── Error ───────────────────────────────────────────────────────────
  error: string | null;

  // ── Actions ─────────────────────────────────────────────────────────
  setRunning: (running: boolean) => void;
  setPaused: (paused: boolean) => void;
  setActiveMode: (mode: IndexerRunMode | null) => void;
  setProcessedCount: (count: number | ((prev: number) => number)) => void;
  setTotalCount: (count: number) => void;
  setErrorCount: (count: number | ((prev: number) => number)) => void;
  setModelReady: (ready: boolean) => void;
  setModelLoadingStage: (stage: ModelLoadingStage) => void;
  setModelLoadingProgress: (progress: number) => void;
  setModelLoadingSpeedBytesPerSec: (speed: number) => void;
  setModelLoadingDtype: (dtype: string | null) => void;
  setFileProgress: (file: string, loaded: number, total: number) => void;
  setError: (error: string | null) => void;
  resetModelState: () => void;
  resetProgress: () => void;
}

export const useSemanticIndexerStore = create<SemanticIndexerState>()(
  (set) => ({
    isRunning: false,
    isPaused: false,
    activeMode: null,
    processedCount: 0,
    totalCount: 0,
    errorCount: 0,
    modelReady: false,
    modelLoadingStage: "idle",
    modelLoadingProgress: 0,
    modelLoadingDtype: null,
    modelLoadingSpeedBytesPerSec: 0,
    fileProgress: {},
    error: null,

    setRunning: (running) => set({ isRunning: running }),
    setPaused: (paused) => set({ isPaused: paused }),
    setActiveMode: (activeMode) => set({ activeMode }),
    setProcessedCount: (count) =>
      set((state) => ({
        processedCount:
          typeof count === "function" ? count(state.processedCount) : count,
      })),
    setTotalCount: (totalCount) => set({ totalCount }),
    setErrorCount: (count) =>
      set((state) => ({
        errorCount:
          typeof count === "function" ? count(state.errorCount) : count,
      })),
    setModelReady: (modelReady) => set({ modelReady }),
    setModelLoadingStage: (modelLoadingStage) => set({ modelLoadingStage }),
    setModelLoadingProgress: (modelLoadingProgress) =>
      set({ modelLoadingProgress }),
    setModelLoadingSpeedBytesPerSec: (modelLoadingSpeedBytesPerSec) =>
      set({ modelLoadingSpeedBytesPerSec }),
    setModelLoadingDtype: (modelLoadingDtype) => set({ modelLoadingDtype }),
    setFileProgress: (file, loaded, total) =>
      set((state) => ({
        fileProgress: {
          ...state.fileProgress,
          [file]: { loaded, total },
        },
      })),
    setError: (error) => set({ error }),
    resetModelState: () =>
      set({
        modelReady: false,
        modelLoadingStage: "idle",
        modelLoadingProgress: 0,
        modelLoadingDtype: null,
        modelLoadingSpeedBytesPerSec: 0,
        fileProgress: {},
        error: null,
      }),
    resetProgress: () =>
      set({
        processedCount: 0,
        totalCount: 0,
        errorCount: 0,
        activeMode: null,
        modelReady: false,
        modelLoadingStage: "idle",
        modelLoadingProgress: 0,
        modelLoadingDtype: null,
        modelLoadingSpeedBytesPerSec: 0,
        fileProgress: {},
        error: null,
      }),
  }),
);
