"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CouponState {
  code: string;
  setCode: (code: string) => void;
  clear: () => void;
}

export const useCouponStore = create<CouponState>()(
  persist(
    (set) => ({
      code: "",
      setCode: (code) => set({ code }),
      clear: () => set({ code: "" }),
    }),
    { name: "qashtoota-coupon" }
  )
);
