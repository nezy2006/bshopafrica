"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { onToast, type ToastPayload } from "@/lib/toast";

const VARIANT_STYLES: Record<ToastPayload["variant"], string> = {
  info:    "bg-gray-900 text-white",
  success: "bg-green-600 text-white",
  error:   "bg-red-600 text-white",
};

export default function ToastHost() {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  useEffect(() => {
    return onToast(toast => {
      setToasts(t => [...t, toast]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== toast.id)), toast.duration);
    });
  }, []);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none px-4 w-full">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className={`pointer-events-auto max-w-md px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold ${VARIANT_STYLES[t.variant]}`}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
