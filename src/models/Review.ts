// ─── Review ───────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  productId: string;
  userId: string;
  /** Display name of the reviewer */
  userName: string;
  userAvatarUrl?: string;
  /** 1–5 stars */
  rating: number;
  title?: string;
  body: string;
  /** URLs to photos attached to the review */
  imageUrls?: string[];
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: Date;
}

// ─── Review Create Payload ────────────────────────────────────────────────────

export interface CreateReviewPayload {
  productId: string;
  rating: number;
  title?: string;
  body: string;
  imageUrls?: string[];
}
