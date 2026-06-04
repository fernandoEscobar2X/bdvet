import { z } from "zod";
import type { InventoryItem } from "@bordervet/core";
import type { Equals, Expect } from "./assert";

export const inventoryItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  stockOnHand: z.number(),
  reserved: z.number(),
  lowStockThreshold: z.number(),
});

type _InventoryItem = Expect<Equals<z.infer<typeof inventoryItemSchema>, InventoryItem>>;
