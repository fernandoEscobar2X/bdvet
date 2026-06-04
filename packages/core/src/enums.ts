// Estados del ciclo de vida de una orden (CONTEXT §8).
export const ORDER_STATUSES = [
  "DRAFT",
  "WHATSAPP_SENT",
  "CONFIRMED",
  "CANCELLED",
  "FULFILLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Canal de cierre de compra. Hoy solo WhatsApp (CONTEXT §5).
export const ORDER_CHANNELS = ["WHATSAPP"] as const;

export type OrderChannel = (typeof ORDER_CHANNELS)[number];
