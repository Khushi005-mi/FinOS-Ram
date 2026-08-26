import { create } from "zustand";
import { UploadedFileItem, UploadWizardStep, SourceType } from "../types/uploadTypes";

interface UploadState {
  currentStep: UploadWizardStep;
  files: UploadedFileItem[];
  batchId: string | null;
  isProcessing: boolean;

  // Actions
  setStep: (step: UploadWizardStep) => void;
  addFiles: (newFiles: File[]) => void;
  removeFile: (fileId: string) => void;
  updateSourceType: (fileId: string, sourceType: SourceType) => void;
  updateColumnMapping: (fileId: string, mapping: Record<string, string>) => void;
  resetWizard: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  currentStep: 1,
  files: [],
  batchId: null,
  isProcessing: false,

  setStep: (step) => set({ currentStep: step }),

  addFiles: (newFiles) =>
    set((state) => {
      const formattedItems: UploadedFileItem[] = newFiles.map((file, index) => ({
        id: `${file.name}-${Date.now()}-${index}`,
        file,
        name: file.name,
        size: file.size,
        sourceType: "GENERAL_LEDGER", // Default source type
        status: "pending",
        detectedHeaders: [],
        columnMapping: {},
      }));

      return { files: [...state.files, ...formattedItems] };
    }),

  removeFile: (fileId) =>
    set((state) => ({
      files: state.files.filter((f) => f.id !== fileId),
    })),

  updateSourceType: (fileId, sourceType) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === fileId ? { ...f, sourceType } : f)),
    })),

  updateColumnMapping: (fileId, mapping) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === fileId ? { ...f, columnMapping: mapping, status: "mapped" } : f
      ),
    })),

  resetWizard: () =>
    set({
      currentStep: 1,
      files: [],
      batchId: null,
      isProcessing: false,
    }),
}));