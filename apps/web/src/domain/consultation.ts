export type ConsultationCtaType = "whatsapp" | "calendly";

export type ConsultationService = {
  id: string;
  nombre: string;
  precio?: number | null;
  duracion?: string | null;
  descripcion: string;
  bullets: string[];
  ctaType: ConsultationCtaType;
  ctaLabel: string;
  ctaTarget: string;
};
