"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/shared/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      localStorage.setItem("qashtoota-user", JSON.stringify({ phone, name: "عميل قشطوطة" }));
    } catch {}
    router.push("/account");
  }

  return (
    <div className="container-p flex min-h-[70vh] items-center justify-center py-10">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl3 bg-white p-6 shadow-card">
        <div className="mb-4 flex justify-center"><Logo /></div>
        <h1 className="mb-1 text-center text-xl font-black text-ink">تسجيل الدخول</h1>
        <p className="mb-5 text-center text-sm text-gray-500">أدخل رقم هاتفك للمتابعة</p>
        <label className="block">
          <span className="mb-1 block text-sm font-bold">رقم الهاتف</span>
          <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xxxxxxxx" className="w-full rounded-xl2 border-2 border-cloud px-3 py-2 outline-none focus:border-brand-light" />
        </label>
        <button className="btn-primary mt-4 w-full">دخول</button>
        <p className="mt-4 text-center text-sm text-gray-500">
          ليس لديك حساب؟ <Link href="/register" className="font-bold text-brand">أنشئ حساب</Link>
        </p>
      </form>
    </div>
  );
}
