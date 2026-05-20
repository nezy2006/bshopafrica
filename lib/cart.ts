export interface CartDomain {
  type:   "domain";
  name:   string;   // "mybusiness"
  tld:    string;   // ".com"
  domain: string;   // "mybusiness.com"
  price:  number;   // per year USD
}

export interface CartHosting {
  type:    "hosting";
  name:    string;  // "Business Grower Kit"
  monthly: number;  // 12
  yearly:  number;  // 144
}

export interface Cart {
  domain?:  CartDomain;
  hosting?: CartHosting;
}

export function getCart(): Cart {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("bshop_cart");
    return raw ? (JSON.parse(raw) as Cart) : {};
  } catch { return {}; }
}

export function saveCart(cart: Cart): void {
  localStorage.setItem("bshop_cart", JSON.stringify(cart));
}

export function clearCart(): void {
  localStorage.removeItem("bshop_cart");
}
