"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BranchState {
  branchId: string | null;
  setBranch: (id: string) => void;
  clearBranch: () => void;
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set) => ({
      branchId: null,
      setBranch: (id) => set({ branchId: id }),
      clearBranch: () => set({ branchId: null }),
    }),
    { name: "qashtoota-branch" }
  )
);
