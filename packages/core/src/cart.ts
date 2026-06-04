// Contrato del carrito que el frontend envía a la API (CONTEXT §9). El precio
// y el stock se validan server-side; el cliente solo manda producto y cantidad.
export interface CartItem {
  productId: string;
  quantity: number;
}
