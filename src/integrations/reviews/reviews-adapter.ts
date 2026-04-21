import type { Testimonial } from "@/domain/review";

export interface ReviewsAdapter {
  getReviews(): Testimonial[];
}
