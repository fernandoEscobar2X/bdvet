import type { OrderChannel, OrderStatus } from "./enums";

export interface Order {
  id: string;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  subtotal: number;
  channel: OrderChannel;
  idempotencyKey: string;
  createdAt: string;
}

// Líneas de la orden con snapshots congelados al crear (CONTEXT §8): cambiar
// un precio después NO altera órdenes históricas.
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  skuSnapshot: string;
  nameSnapshot: string;
  priceSnapshot: number;
  quantity: number;
  subtotalSnapshot: number;
}
