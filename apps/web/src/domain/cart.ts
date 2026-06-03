export type CartItem = {
  id: string;
  slug: string;
  nombre: string;
  precio: number;
  imagen: string;
  cantidad: number;
};

export type CartSnapshot = {
  items: CartItem[];
  total: number;
  count: number;
};
