export type ReviewSource = "curated" | "google";

export type Testimonial = {
  id: string;
  nombre: string;
  texto: string;
  rating: number;
  mascota?: string;
  ubicacion?: string;
  source: ReviewSource;
};
