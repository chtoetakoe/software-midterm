/**
 * storage-service.ts
 *
 * This service manages reading and writing flashcards and reviews from localStorage.
 *
 * AF (Abstraction Function):
 *   - Represents a persistent collection of flashcards and review logs stored as JSON.
 *   - Allows saving, updating, and deleting cards; saving and retrieving reviews.
 *
 * RI (Representation Invariant):
 *   - Every flashcard has a non-empty front and an id
 *   - Tags must be an array of strings
 *   - Review cardId must refer to an existing card
 *
 * SRE (Example):
 *   Flashcard: {
 *     id: "abc123",
 *     front: "What is AI?",
 *     back: "Artificial Intelligence",
 *     hint: "Think machines",
 *     tags: ["CS"],
 *     createdAt: "2024-04-01T00:00:00Z"
 *   }
 *   Review: {
 *     cardId: "abc123",
 *     difficulty: "EASY",
 *     reviewedAt: "2024-04-02T12:00:00Z"
 *   }
 */

import { Flashcard, FlashcardDifficulty, FlashcardReview } from "../types/flashcard";

// In a real extension, this would use chrome.storage.local
// For this we'll use localStorage
class StorageService {
  private readonly STORAGE_KEY = "flashcard-grabber-cards";
  private readonly REVIEWS_KEY = "flashcard-grabber-reviews";
  
  constructor() {
    // Initialize storage if empty
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.REVIEWS_KEY)) {
      localStorage.setItem(this.REVIEWS_KEY, JSON.stringify([]));
    }
  }

  getAllFlashcards(): Flashcard[] {
    const cardsJson = localStorage.getItem(this.STORAGE_KEY) || "[]";
    const cards = JSON.parse(cardsJson) as Flashcard[];
    
    // Convert string dates back to Date objects
    return cards.map(card => ({
      ...card,
      createdAt: new Date(card.createdAt),
      lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : undefined
    }));
  }

  saveFlashcard(card: Omit<Flashcard, "id" | "createdAt">): Flashcard {
    const cards = this.getAllFlashcards();
    
    const newCard: Flashcard = {
      ...card,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    
    cards.push(newCard);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cards));
    
    return newCard;
  }

  updateFlashcard(id: string, updates: Partial<Flashcard>): Flashcard | null {
    const cards = this.getAllFlashcards();
    const cardIndex = cards.findIndex(c => c.id === id);
    
    if (cardIndex === -1) return null;
    
    const updatedCard = { ...cards[cardIndex], ...updates };
    cards[cardIndex] = updatedCard;
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cards));
    return updatedCard;
  }

  deleteFlashcard(id: string): boolean {
    const cards = this.getAllFlashcards();
    const newCards = cards.filter(c => c.id !== id);
    
    if (newCards.length === cards.length) return false;
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newCards));
    return true;
  }

  saveReview(review: Omit<FlashcardReview, "reviewedAt">): void {
    const reviewsJson = localStorage.getItem(this.REVIEWS_KEY) || "[]";
    const reviews = JSON.parse(reviewsJson) as FlashcardReview[];
    
    const newReview: FlashcardReview = {
      ...review,
      reviewedAt: new Date()
    };
    
    reviews.push(newReview);
    localStorage.setItem(this.REVIEWS_KEY, JSON.stringify(reviews));
    
    // Also update the card's lastReviewed and difficulty
    const cards = this.getAllFlashcards();
    const card = cards.find(c => c.id === review.cardId);
    
    if (card) {
      this.updateFlashcard(card.id, {
        lastReviewed: newReview.reviewedAt,
        difficulty: newReview.difficulty
      });
    }
  }

  getCardReviews(cardId: string): FlashcardReview[] {
    const reviewsJson = localStorage.getItem(this.REVIEWS_KEY) || "[]";
    const reviews = JSON.parse(reviewsJson) as FlashcardReview[];
    
    return reviews
      .filter(r => r.cardId === cardId)
      .map(r => ({
        ...r,
        reviewedAt: new Date(r.reviewedAt)
      }));
  }
  

    
}

export const storageService = new StorageService();
