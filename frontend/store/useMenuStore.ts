"use client";
import { create } from "zustand";
import type { Branch, Category, DeliveryZone, Product } from "@/types";
import { branches as mockBranches } from "@/data/branches";
import { categories as mockCategories } from "@/data/categories";
import { products as mockProducts } from "@/data/products";
import { fetchMenu } from "@/lib/api";

interface MenuState {
  branches: Branch[];
  categories: Category[];
  products: Product[];
  zones: DeliveryZone[];
  source: "mock" | "api";
  loaded: boolean;
  load: () => Promise<void>;
  getBranch: (id: string | null) => Branch | undefined;
  getProduct: (slug: string) => Product | undefined;
  zonesForBranch: (branchId: string | null) => DeliveryZone[];
}

export const useMenuStore = create<MenuState>((set, get) => ({
  branches: mockBranches,
  categories: mockCategories,
  products: mockProducts,
  zones: [],
  source: "mock",
  loaded: false,
  load: async () => {
    const menu = await fetchMenu();
    if (menu && menu.products.length) {
      set({
        branches: menu.branches,
        categories: menu.categories,
        products: menu.products,
        zones: menu.zones,
        source: "api",
        loaded: true,
      });
    } else {
      set({ loaded: true });
    }
  },
  getBranch: (id) => get().branches.find((b) => b.id === id),
  getProduct: (slug) => get().products.find((p) => p.slug === slug),
  zonesForBranch: (branchId) => get().zones.filter((z) => z.branchId === branchId),
}));
