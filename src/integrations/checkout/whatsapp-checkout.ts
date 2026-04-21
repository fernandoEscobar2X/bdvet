import type { CartSnapshot } from "@/domain/cart";
import type { CheckoutAdapter } from "./checkout-adapter";

export class WhatsAppCheckoutAdapter implements CheckoutAdapter {
  constructor(
    private readonly phone: string,
    private readonly businessName: string,
  ) {}

  buildCheckoutUrl(snapshot: CartSnapshot): string {
    const lines = snapshot.items.map((item) => {
      const subtotal = (item.precio * item.cantidad).toLocaleString("es-MX");
      return `• ${item.nombre} x${item.cantidad} — $${subtotal} MXN`;
    });

    const total = snapshot.total.toLocaleString("es-MX");
    const message = [
      `Hola ${this.businessName}, quiero hacer un pedido:`,
      "",
      ...lines,
      "",
      `Total estimado: $${total} MXN`,
      "",
      "¿Me confirman disponibilidad, forma de pago y tiempos de entrega en Tijuana?",
    ].join("\n");

    return `https://wa.me/${this.phone}?text=${encodeURIComponent(message)}`;
  }
}
