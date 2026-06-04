import type { CartSnapshot } from "@/domain/cart";
import type { CartItem, OrderStatus } from "@bordervet/core";

export interface CheckoutAdapter {
  buildCheckoutUrl(snapshot: CartSnapshot): string;
}

// Contrato de dominio para cuando el checkout pase al backend (Fase 6). Usa los
// tipos compartidos de @bordervet/core; se referencian solo a nivel de tipos
// (se borran en el bundle, sin cambiar el runtime actual del storefront).
export interface CheckoutRequest {
  items: CartItem[];
  customerName: string;
  customerPhone: string;
}

export interface CheckoutResult {
  orderId: string;
  status: OrderStatus;
}
