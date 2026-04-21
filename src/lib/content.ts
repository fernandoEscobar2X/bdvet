import site from "@/content/site.json";
import hero from "@/content/hero.json";
import services from "@/content/services.json";
import products from "@/content/products.json";
import testimonials from "@/content/testimonials.json";
import contact from "@/content/contact.json";
import policies from "@/content/policies.json";

import type { Product } from "@/domain/product";
import type { ConsultationService } from "@/domain/consultation";
import type { Testimonial } from "@/domain/review";

export const siteContent = site;
export const heroSlides = hero;
export const servicesContent = services as ConsultationService[];
export const productsContent = products as Product[];
export const testimonialsContent = testimonials as Testimonial[];
export const contactContent = contact;
export const policiesContent = policies;

export const featuredProducts = productsContent.filter(
  (product) => product.destacado && product.activo,
);

export const activeProducts = productsContent.filter((product) => product.activo);

export const findProductBySlug = (slug: string) =>
  productsContent.find((product) => product.slug === slug);

export const relatedProducts = (current: Product, limit = 3) =>
  activeProducts
    .filter((product) => product.slug !== current.slug && product.categoria === current.categoria)
    .slice(0, limit);
