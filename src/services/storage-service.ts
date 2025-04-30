/**
 * storage-service.ts  – localStorage data-layer
 * ------------------------------------------------------------
 *  • Flashcards  → STORAGE_KEY  ("flashcard-grabber-cards")
 *  • Reviews     → REVIEWS_KEY  ("flashcard-grabber-reviews")
 *  • Leitner map → BUCKETS_KEY  ("flashcard-grabber-buckets")
 */

import {
  Flashcard,
  FlashcardDifficulty,
  FlashcardReview,
} from "@/types/flashcard";

import {
  BucketMap,
  update as updateLeitner,
} from "@/logic/leitner";

class StorageService {
  private readonly STORAGE_KEY = "flashcard-grabber-cards";
  private readonly REVIEWS_KEY = "flashcard-grabber-reviews";
  private readonly BUCKETS_KEY = "flashcard-grabber-buckets";

  /* ───── constructor: create empty keys on first run ───── */
  constructor() {
    if (!localStorage.getItem(this.STORAGE_KEY))
      localStorage.setItem(this.STORAGE_KEY, "[]");

    if (!localStorage.getItem(this.REVIEWS_KEY))
      localStorage.setItem(this.REVIEWS_KEY, "[]");

    if (!localStorage.getItem(this.BUCKETS_KEY)) {
      // put every existing card (if any) into bucket-0
      const cards: Flashcard[] = JSON.parse(
        localStorage.getItem(this.STORAGE_KEY)!
      );
      const map: BucketMap = new Map([[0, new Set(cards)]]);
      this.saveBucketMap(map);
    }
  }

  /* ───── basic CRUD for flashcards ───── */
  getAllFlashcards(): Flashcard[] {
    return (JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "[]") as Flashcard[])
      .map(c => ({
        ...c,
        createdAt: new Date(c.createdAt),
        lastReviewed: c.lastReviewed ? new Date(c.lastReviewed) : undefined,
      }));
  }

  saveFlashcard(draft: Omit<Flashcard, "id" | "createdAt">): Flashcard {
    const cards = this.getAllFlashcards();
    const newCard: Flashcard = { ...draft, id: crypto.randomUUID(), createdAt: new Date() };
    cards.push(newCard);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cards));

    /* ➜ add to bucket-0 */
    const buckets = this.getBucketMap();
    if (!buckets.has(0)) buckets.set(0, new Set());
    buckets.get(0)!.add(newCard);
    this.saveBucketMap(buckets);

    return newCard;
  }

  updateFlashcard(id: string, patch: Partial<Flashcard>): Flashcard | null {
    const cards = this.getAllFlashcards();
    const idx   = cards.findIndex(c => c.id === id);
    if (idx === -1) return null;
    cards[idx] = { ...cards[idx], ...patch };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cards));
    return cards[idx];
  }

  deleteFlashcard(id: string): boolean {
    const cards = this.getAllFlashcards();
    const filtered = cards.filter(c => c.id !== id);
    if (filtered.length === cards.length) return false;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));

    // also remove from buckets
    const map = this.getBucketMap();
    map.forEach(set => set.forEach(c => c.id === id && set.delete(c)));
    this.saveBucketMap(map);
    return true;
  }

  /* ───── save a review & update Leitner buckets ───── */
  saveReview(review: Omit<FlashcardReview, "reviewedAt">): void {
    /* 1️⃣  append to reviews list */
    const reviews: FlashcardReview[] =
      JSON.parse(localStorage.getItem(this.REVIEWS_KEY) || "[]");
    const dated: FlashcardReview = { ...review, reviewedAt: new Date() };
    reviews.push(dated);
    localStorage.setItem(this.REVIEWS_KEY, JSON.stringify(reviews));

    /* 2️⃣  update flashcard meta */
    const card = this.updateFlashcard(review.cardId, {
      lastReviewed: dated.reviewedAt,
      difficulty:   dated.difficulty,
    });
    if (!card) return; // card removed elsewhere

    /* 3️⃣  move the card in Leitner buckets */
    const { buckets } = updateLeitner(
      this.getBucketMap(),
      card,
      dated.difficulty
    );
    this.saveBucketMap(buckets);
  }

  getCardReviews(cardId: string): FlashcardReview[] {
    const all = JSON.parse(localStorage.getItem(this.REVIEWS_KEY) || "[]") as FlashcardReview[];
    return all
      .filter(r => r.cardId === cardId)
      .map(r => ({ ...r, reviewedAt: new Date(r.reviewedAt) }));
  }

  /* ───── Leitner bucket persistence helpers ───── */
  getBucketMap(): BucketMap {
    const raw = localStorage.getItem(this.BUCKETS_KEY);
    if (!raw) return new Map([[0, new Set<Flashcard>()]]);
    const obj: Record<number, Flashcard[]> = JSON.parse(raw);
    return new Map(
      Object.entries(obj).map(([k, arr]) => [Number(k), new Set(arr)])
    );
  }

  private saveBucketMap(map: BucketMap) {
    const obj: Record<number, Flashcard[]> = {};
    map.forEach((set, k) => (obj[k] = Array.from(set)));
    localStorage.setItem(this.BUCKETS_KEY, JSON.stringify(obj));
  }

  /* optional helper for stats */
  getPracticeHistory() {
    return JSON.parse(localStorage.getItem(this.REVIEWS_KEY) || "[]") as FlashcardReview[];
  }
}

/* singleton */
export const storageService = new StorageService();
