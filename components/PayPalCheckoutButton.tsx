"use client";

import { useEffect, useRef, useState } from "react";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";

interface PaypalOrderActions { order: { get: () => Promise<unknown> } }
interface PaypalButtonsConfig {
  style?: Record<string, string>;
  createOrder: () => Promise<string>;
  onApprove: (data: { orderID: string }, actions: PaypalOrderActions) => Promise<void>;
  onCancel?: () => void;
  onError?: (err: unknown) => void;
}
interface PaypalNamespace {
  Buttons: (config: PaypalButtonsConfig) => { render: (el: HTMLElement) => void };
}
declare global {
  interface Window { paypal?: PaypalNamespace; }
}

let scriptPromise: Promise<void> | null = null;
function loadPaypalScript(currency: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.paypal) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=${currency}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load PayPal"));
    document.body.appendChild(script);
  });
  return scriptPromise;
}

/** Renders the PayPal Buttons widget for a single WHMCS invoice. Payment happens
 *  entirely on-site via PayPal's JS SDK — createOrder/capture both call our own
 *  API routes, which talk to PayPal's REST API server-side and mark the WHMCS
 *  invoice paid on success. Nothing here ever redirects to WHMCS. */
export function PayPalCheckoutButton({
  invoiceId, amountUSD, orderIds, onSuccess, onError,
}: {
  invoiceId:  number;
  amountUSD:  number;
  orderIds?:  number[]; // secondary WHMCS orders to accept on success (new-order checkout only)
  onSuccess:  () => void;
  onError:    (message: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadPaypalScript("USD")
      .then(() => {
        if (cancelled || !containerRef.current || !window.paypal) return;
        containerRef.current.innerHTML = "";
        window.paypal.Buttons({
          style: { layout: "vertical", color: "gold", shape: "rect", label: "paypal" },
          createOrder: async () => {
            const res  = await fetch("/api/checkout/paypal-create", {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify({ invoiceId, amount: amountUSD }),
            });
            const json = (await res.json()) as { success: boolean; orderID?: string; error?: string };
            if (!json.success || !json.orderID) throw new Error(json.error ?? "Failed to start PayPal checkout");
            return json.orderID;
          },
          onApprove: async (data) => {
            const res  = await fetch("/api/checkout/paypal-capture", {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify({ orderID: data.orderID, invoiceId, orderIds }),
            });
            const json = (await res.json()) as { success: boolean; error?: string };
            if (!json.success) { onError(json.error ?? "Payment could not be completed. Please contact support."); return; }
            onSuccess();
          },
          onError: (err) => {
            console.error("[PayPalCheckoutButton]", err);
            onError("PayPal encountered an error. Please try again.");
          },
        }).render(containerRef.current);
        setLoaded(true);
      })
      .catch((e: unknown) => onError(e instanceof Error ? e.message : "Failed to load PayPal"));

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId, amountUSD]);

  return (
    <div>
      {!loaded && (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
          <span className="animate-spin inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full" />
          Loading PayPal…
        </div>
      )}
      <div ref={containerRef} />
    </div>
  );
}
