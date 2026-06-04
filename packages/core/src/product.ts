// Entidad de dominio canónica (CONTEXT §8). El frontend mantiene su propio
// view model de presentación; esta es la verdad del catálogo en el backend.
export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string;
  brandId: string;
  categoryId: string;
  price: number;
  compareAtPrice: number | null;
  description: string;
  imageUrls: string[];
  active: boolean;
  prescriptionRequired: boolean;
  trackInventory: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
}
