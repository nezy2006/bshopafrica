// Minimal pub-sub toast system — no external dependency, mirrors the
// existing custom-event pattern used for cart/notification updates
// (e.g. "bshop_cart_update"). Rendered by components/ToastHost.tsx.

export type ToastVariant = "info" | "success" | "error";

export interface ToastPayload {
  id:       number;
  message:  string;
  variant:  ToastVariant;
  duration: number;
}

const EVENT = "bshop_toast";
let nextId = 1;

export function showToast(message: string, opts: { variant?: ToastVariant; duration?: number } = {}): void {
  if (typeof window === "undefined") return;
  const payload: ToastPayload = {
    id: nextId++,
    message,
    variant: opts.variant ?? "info",
    duration: opts.duration ?? 4000,
  };
  window.dispatchEvent(new CustomEvent<ToastPayload>(EVENT, { detail: payload }));
}

export function onToast(handler: (payload: ToastPayload) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => handler((e as CustomEvent<ToastPayload>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
