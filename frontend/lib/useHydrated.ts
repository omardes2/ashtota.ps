"use client";
import { useEffect, useState } from "react";

// يمنع اختلاف الترطيب (hydration mismatch) عند قراءة localStorage
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
