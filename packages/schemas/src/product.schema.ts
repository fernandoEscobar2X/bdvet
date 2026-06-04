import { z } from "zod";
import type { Category, Product } from "@bordervet/core";
import type { Equals, Expect } from "./assert";

export const categorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
});

export const productSchema = z.object({
  id: z.string(),
  sku: z.string(),
  slug: z.string(),
  name: z.string(),
  brandId: z.string(),
  categoryId: z.string(),
  price: z.number(),
  compareAtPrice: z.number().nullable(),
  description: z.string(),
  imageUrls: z.array(z.string()),
  active: z.boolean(),
  prescriptionRequired: z.boolean(),
  trackInventory: z.boolean(),
});

type _Category = Expect<Equals<z.infer<typeof categorySchema>, Category>>;
type _Product = Expect<Equals<z.infer<typeof productSchema>, Product>>;
