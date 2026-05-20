export interface CartDomain {
  id: string;
  type: "domain";
  name: string;
  tld: string;
  domain: string;
  price: number;
}

export interface CartHosting {
  id: string;
  type: "hosting";
  name: string;
  planId?: number;
  monthly: number;
  yearly: number;
  cycle: "monthly" | "yearly";
}

export interface CartSSL {
  id: string;
  type: "ssl";
  name: string;
  price: number;
}

export interface CartEmail {
  id: string;
  type: "email";
  name: string;
  price: number;
}

export type CartItem = CartDomain | CartHosting | CartSSL | CartEmail;

// Legacy shape kept for checkout compat
export interface Cart { domain?: CartDomain; hosting?: CartHosting; }

const KEY = "bshop_cart";

function dispatch(): void {
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event("bshop_cart_update"));
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as CartItem[];
    // Migrate legacy { domain, hosting } shape
    const legacy = parsed as Cart;
    const items: CartItem[] = [];
    if (legacy.domain)  items.push({ ...legacy.domain,  id: legacy.domain.domain ?? "domain",  type: "domain"  });
    if (legacy.hosting) items.push({ ...legacy.hosting, id: "hosting", type: "hosting", cycle: "yearly" });
    return items;
  } catch { return []; }
}

export function saveCart(items: CartItem[]): void {
  localStorage.setItem(KEY, JSON.stringify(items));
  dispatch();
}

export function addToCart(item: CartItem): void {
  let items = getCart().filter(i => i.type !== item.type);
  items.push(item);
  localStorage.setItem(KEY, JSON.stringify(items));
  dispatch();
}

export function removeFromCart(id: string): void {
  saveCart(getCart().filter(i => i.id !== id));
}

export function updateCartItem(id: string, updates: Partial<CartItem>): void {
  saveCart(getCart().map(i => (i.id === id ? { ...i, ...updates } as CartItem : i)));
}

export function clearCart(): void {
  localStorage.removeItem(KEY);
  dispatch();
}

export function getCartCount(): number {
  return getCart().length;
}

export interface CartTotals {
  subtotal:          number;
  discount:          number;
  discountLabel:     string;
  total:             number;
  hasBundleDiscount: boolean;
}

export function calculateTotal(items?: CartItem[]): CartTotals {
  const cart    = items ?? getCart();
  const domain  = cart.find(i => i.type === "domain")  as CartDomain  | undefined;
  const hosting = cart.find(i => i.type === "hosting") as CartHosting | undefined;
  const ssl     = cart.find(i => i.type === "ssl")     as CartSSL     | undefined;
  const email   = cart.find(i => i.type === "email")   as CartEmail   | undefined;

  let subtotal = 0;
  if (domain)  subtotal += domain.price;
  if (hosting) subtotal += hosting.cycle === "monthly" ? hosting.monthly * 12 : hosting.yearly;
  if (ssl)     subtotal += ssl.price;
  if (email)   subtotal += email.price;

  const hasBundleDiscount = !!(domain && hosting);
  const discount = hasBundleDiscount ? domain!.price : 0;

  return {
    subtotal,
    discount,
    discountLabel: hasBundleDiscount ? `Free domain (${domain!.domain})` : "",
    total: subtotal - discount,
    hasBundleDiscount,
  };
}
