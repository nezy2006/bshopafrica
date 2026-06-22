"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import type { InvoiceDetails } from "@/lib/whmcs";

function Spinner() {
  return (
    <svg className="animate-spin w-6 h-6 text-[#6B21A8]" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

/* ─── Paid state ─────────────────────────────────────────────────────────── */
function InvoicePaid({ invoice }: { invoice: InvoiceDetails }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.1 }}
        className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(34,197,94,0.4)]"
      >
        <motion.svg viewBox="0 0 52 52" fill="none" className="w-12 h-12">
          <motion.path
            d="M14 27l9 9 16-18"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
          />
        </motion.svg>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <h1 className="text-3xl font-black text-black mb-2">Payment Confirmed!</h1>
        <p className="text-gray-500 text-sm mb-6">
          Invoice #{invoice.id} · Check your email for next steps.
        </p>

        {/* Order details */}
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 mb-6 text-left">
          <h2 className="font-bold text-black text-sm mb-4 uppercase tracking-wide">Order Summary</h2>
          <div className="space-y-2">
            {invoice.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.description}</span>
                <span className="font-semibold text-black">${item.amount}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-black text-black">
            <span>Total Paid</span>
            <span className="text-[#6B21A8]">${invoice.total}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-8 py-3.5 bg-[#6B21A8] text-white font-bold rounded-full text-sm hover:bg-[#581c87] transition-colors"
          >
            Go to Dashboard
          </Link>
          <a
            href={`https://bshopafrica.com/billing/viewinvoice.php?id=${invoice.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3.5 border-2 border-[#6B21A8] text-[#6B21A8] font-bold rounded-full text-sm hover:bg-purple-50 transition-colors"
          >
            View Invoice →
          </a>
          <Link
            href="/"
            className="px-8 py-3.5 border-2 border-gray-200 text-gray-700 font-bold rounded-full text-sm hover:border-gray-300 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Pending state ──────────────────────────────────────────────────────── */
function InvoicePending({ invoice, onRefresh }: { invoice: InvoiceDetails | null; onRefresh: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
    >
      <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
        <svg className="w-12 h-12 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h1 className="text-2xl font-black text-black mb-2">Payment Pending</h1>
      {invoice ? (
        <p className="text-gray-500 text-sm mb-4">
          Invoice #{invoice.id} · Total: ${invoice.total} · Status: <span className="font-semibold text-amber-600">{invoice.status}</span>
        </p>
      ) : (
        <p className="text-gray-500 text-sm mb-4">Checking payment status…</p>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 text-sm text-amber-800 text-left space-y-2">
        <p className="font-semibold">Your payment may still be processing.</p>
        <p>If you completed payment on PayPal, it can take a few minutes for WHMCS to confirm. This page refreshes automatically.</p>
        <p>If you did not complete payment, you can return to WHMCS to pay the invoice.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-6 py-3 bg-[#6B21A8] text-white font-bold rounded-full text-sm hover:bg-[#581c87] transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Check Again
        </button>
        {invoice && (
          <a
            href={`https://bshopafrica.com/billing/viewinvoice.php?id=${invoice.id}&paynow=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-full text-sm hover:border-gray-300 transition-colors"
          >
            Pay Invoice on WHMCS →
          </a>
        )}
      </div>
    </motion.div>
  );
}

/* ─── PawaPay success ────────────────────────────────────────────────────── */
function PawapaySuccess() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.1 }}
        className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(34,197,94,0.4)]"
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12">
          <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h1 className="text-3xl font-black text-black mb-2">Mobile Money Payment Confirmed!</h1>
        <p className="text-gray-500 text-sm mb-6">
          Your payment was received. Your order is being provisioned now.
        </p>

        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 text-sm text-green-800 text-left space-y-1">
          <p className="font-semibold">What happens next?</p>
          <p>• WHMCS is creating your account and registering your domain.</p>
          <p>• You will receive a confirmation email with your account details.</p>
          <p>• Hosting accounts are usually ready within 5 minutes.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-8 py-3.5 bg-[#6B21A8] text-white font-bold rounded-full text-sm hover:bg-[#581c87] transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="px-8 py-3.5 border-2 border-gray-200 text-gray-700 font-bold rounded-full text-sm hover:border-gray-300 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
function CheckoutCompleteInner() {
  const searchParams = useSearchParams();
  const method       = searchParams.get("method");
  const invoiceId    = searchParams.get("invoiceId");

  const [invoice,  setInvoice]  = useState<InvoiceDetails | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  const resolvedInvoiceId = invoiceId
    ?? (typeof window !== "undefined" ? localStorage.getItem("bshop_pending_invoice") : null);

  const fetchInvoice = useCallback(async () => {
    if (!resolvedInvoiceId) { setLoading(false); return; }
    try {
      const res  = await fetch(`/api/checkout/complete?invoiceId=${resolvedInvoiceId}`);
      const json = await res.json() as { success: boolean; invoice?: InvoiceDetails; error?: string };
      if (json.success && json.invoice) {
        setInvoice(json.invoice);
        if (json.invoice.status.toLowerCase() === "paid") {
          localStorage.removeItem("bshop_pending_invoice");
        }
      } else {
        setError(json.error ?? "Could not load invoice");
      }
    } catch { setError("Network error — please try again"); }
    finally { setLoading(false); }
  }, [resolvedInvoiceId]);

  useEffect(() => {
    if (method === "pawapay") { setLoading(false); return; }
    fetchInvoice();
  }, [method, fetchInvoice]);

  // Auto-refresh every 5 seconds while pending
  useEffect(() => {
    if (method === "pawapay") return;
    if (!resolvedInvoiceId) return;
    if (invoice?.status.toLowerCase() === "paid") return;
    const t = setInterval(() => { fetchInvoice(); }, 5000);
    return () => clearInterval(t);
  }, [method, resolvedInvoiceId, invoice, fetchInvoice]);

  const isPaid = invoice?.status.toLowerCase() === "paid";

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          {method === "pawapay" ? (
            <PawapaySuccess />
          ) : loading ? (
            <div className="text-center py-16 space-y-4">
              <Spinner />
              <p className="text-gray-400 text-sm">Checking payment status…</p>
            </div>
          ) : error && !invoice ? (
            <div className="text-center py-12">
              <p className="text-red-500 font-semibold mb-4">{error}</p>
              <Link href="/" className="text-[#6B21A8] font-bold text-sm hover:underline">Return to Home</Link>
            </div>
          ) : isPaid && invoice ? (
            <InvoicePaid invoice={invoice} />
          ) : (
            <InvoicePending invoice={invoice} onRefresh={fetchInvoice} />
          )}
        </div>

        {!loading && !isPaid && method !== "pawapay" && (
          <div className="mt-4 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <Spinner />
              <span>Auto-refreshing every 5 seconds…</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[#6B21A8] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading…</p>
        </div>
      </div>
    }>
      <CheckoutCompleteInner />
    </Suspense>
  );
}
