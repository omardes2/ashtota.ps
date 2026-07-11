"use client";
import { create } from "zustand";
import type { Product } from "@/types";

interface ToastData {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface UiState {
  branchModalOpen: boolean;
  openBranchModal: () => void;
  closeBranchModal: () => void;

  customizeProduct: Product | null;
  openCustomize: (p: Product) => void;
  closeCustomize: () => void;

  cartDrawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;

  toast: ToastData | null;
  showToast: (message: string, type?: ToastData["type"]) => void;
  clearToast: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  branchModalOpen: false,
  openBranchModal: () => set({ branchModalOpen: true }),
  closeBranchModal: () => set({ branchModalOpen: false }),

  customizeProduct: null,
  openCustomize: (p) => set({ customizeProduct: p }),
  closeCustomize: () => set({ customizeProduct: null }),

  cartDrawerOpen: false,
  openCartDrawer: () => set({ cartDrawerOpen: true }),
  closeCartDrawer: () => set({ cartDrawerOpen: false }),

  toast: null,
  showToast: (message, type = "success") =>
    set({ toast: { id: Date.now(), message, type } }),
  clearToast: () => set({ toast: null }),
}));
