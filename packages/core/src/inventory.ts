// Stock server-side (CONTEXT §8). La verdad del inventario vive en la DB y
// solo el backend la modifica; el carrito del frontend es solo visual.
export interface InventoryItem {
  id: string;
  productId: string;
  stockOnHand: number;
  reserved: number;
  lowStockThreshold: number;
}
