import { z } from "zod";
import { ORDER_CHANNELS, ORDER_STATUSES } from "@bordervet/core";
import type { Order, OrderItem } from "@bordervet/core";
import type { Equals, Expect } from "./assert";

export const orderSchema = z.object({
  id: z.string(),
  status: z.enum(ORDER_STATUSES),
  customerName: z.string(),
  customerPhone: z.string(),
  subtotal: z.number(),
  channel: z.enum(ORDER_CHANNELS),
  idempotencyKey: z.string(),
  createdAt: z.string(),
});

export const orderItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  productId: z.string(),
  skuSnapshot: z.string(),
  nameSnapshot: z.string(),
  priceSnapshot: z.number(),
  quantity: z.number(),
  subtotalSnapshot: z.number(),
});

type _Order = Expect<Equals<z.infer<typeof orderSchema>, Order>>;
type _OrderItem = Expect<Equals<z.infer<typeof orderItemSchema>, OrderItem>>;
