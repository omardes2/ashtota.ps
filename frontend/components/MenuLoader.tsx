"use client";
import { useEffect } from "react";
import { useMenuStore } from "@/store/useMenuStore";

// يحمّل المنيو من قاعدة البيانات عند بدء التطبيق (يستبدل البيانات التجريبية)
export default function MenuLoader() {
  const load = useMenuStore((s) => s.load);
  useEffect(() => {
    load();
  }, [load]);
  return null;
}
