import type { CartSnapshot } from "@/domain/cart";

export interface CheckoutAdapter {
  buildCheckoutUrl(snapshot: CartSnapshot): string;
}
