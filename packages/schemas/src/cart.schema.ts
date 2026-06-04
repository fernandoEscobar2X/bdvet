import { z } from "zod";
import type { CartItem } from "@bordervet/core";
import type { Equals, Expect } from "./assert";

export const cartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number(),
});

type _CartItem = Expect<Equals<z.infer<typeof cartItemSchema>, CartItem>>;
