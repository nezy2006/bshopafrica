"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AUTH_KEYS } from "@/lib/auth";

type SsoClient = { id: number; email: string; firstname: string; fullname: string };
type Status = "loading" | "unauthorized" | "error";

function ImpersonateInner() {
  const router  = useRouter();
  const params  = useSearchParams();
  const ranOnce = useRef(false);
  const [status, setStatus] = useState<Status>("loading");
  const [name,   setName]   = useState("client");

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    const clientId = params.get("client_id");
    const token     = params.get("token");

    if (!clientId || !token) { setStatus("unauthorized"); return; }

    (async () => {
      try {
        const res = await fetch("/api/auth/sso", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ clientId: Number(clientId), token }),
        });
        if (res.status === 401) { setStatus("unauthorized"); return; }

        const json = await res.json() as { success: boolean; client?: SsoClient; error?: string };
        if (!json.success || !json.client) { setStatus("error"); return; }

        const { id, email, firstname, fullname } = json.client;
        setName(fullname || firstname || "client");

        localStorage.setItem(AUTH_KEYS.clientId,    String(id));
        localStorage.setItem(AUTH_KEYS.clientEmail, email);
        localStorage.setItem(AUTH_KEYS.clientName,  fullname);
        localStorage.setItem(AUTH_KEYS.clientFirst, firstname);
        localStorage.setItem(AUTH_KEYS.loginTime,   Date.now().toString());

        setTimeout(() => router.replace("/dashboard"), 1000);
      } catch {
        setStatus("error");
      }
    })();
  }, [params, router]);

  if (status === "unauthorized") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <p className="text-red-600 font-bold text-lg">Unauthorized</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <p className="text-red-600 font-semibold">Could not log in as this client.</p>
      </div>
    );
  }

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
