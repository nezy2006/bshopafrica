"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    await new Promise(r => setTimeout(r, 600));
    if (username === "admin" && password === "bshop2025") {
      localStorage.setItem("bshop_admin_session", "true");
      router.replace("/admin/dashboard");
    } else {
      setError("Invalid username or password.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3b0764] via-[#6B21A8] to-[#4c1d95] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8"
      >
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="The B.Shop" width={140} height={42} className="h-10 w-auto object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-black text-black">Admin Login</h1>
          <p className="text-gray-400 text-sm mt-1">B.Shop Administration Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-black outline-none focus:border-[#6B21A8] focus:bg-white focus:shadow-[0_0_0_4px_rgba(107,33,168,0.1)] transition-all" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-black outline-none focus:border-[#6B21A8] focus:bg-white focus:shadow-[0_0_0_4px_rgba(107,33,168,0.1)] transition-all" />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3 font-medium">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#6B21A8] text-white font-bold rounded-xl hover:bg-[#581c87] transition-all disabled:opacity-70"
          >
            {loading ? (
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
            ) : "Sign In"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
