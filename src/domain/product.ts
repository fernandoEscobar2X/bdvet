export type ProductCategory = "todos" | "perros" | "gatos";
export type ProductSpecies = "dog" | "cat" | "both";

export type Product = {
  id: string;
  slug: string;
  nombre: string;
  marca: string;
  categoria: Exclude<ProductCategory, "todos">;
  species: ProductSpecies;
  precio: number;
  precioOriginal?: number | null;
  imagen: string;
  imagenes?: string[];
  descripcion: string;
  detalles: string[];
  badge?: string | null;
  destacado?: boolean;
  activo: boolean;
};
