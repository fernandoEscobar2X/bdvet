import type { Testimonial } from "@/domain/review";
import type { ReviewsAdapter } from "./reviews-adapter";

export class CuratedReviewsAdapter implements ReviewsAdapter {
  constructor(private readonly reviews: Testimonial[]) {}

  getReviews(): Testimonial[] {
    return this.reviews;
  }
}
