"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AUTH_KEYS } from "@/lib/auth";

function ImpersonateInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState("client");

  useEffect(() => {
    const id        = params.get("id");
    const email     = params.get("email") ?? "";
    const fullname  = params.get("name") ?? "";
    const firstname = params.get("firstname") ?? "";

    if (!id) { router.replace("/admin/login"); return; }

    setName(fullname || firstname || "client");

    localStorage.setItem(AUTH_KEYS.clientId,    id);
    localStorage.setItem(AUTH_KEYS.clientEmail, email);
    localStorage.setItem(AUTH_KEYS.clientName,  fullname);
    localStorage.setItem(AUTH_KEYS.clientFirst, firstname);
    localStorage.setItem(AUTH_KEYS.loginTime,   Date.now().toString());

    const t = setTimeout(() => router.replace("/dashboard"), 1000);
    return () => clearTimeout(t);
  }, [params, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#6B21A8] border-t-transparent animate-spin" />
        <p className="text-gray-600 font-medium">Logging in as {name}…</p>
      </div>
    </div>
  );
}

export default function ImpersonatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#6B21A8] border-t-transparent animate-spin" />
      </div>
    }>
      <ImpersonateInner />
    </Suspense>
  );
}
