
import { Flashcard, FlashcardDifficulty, FlashcardReview } from "../types/flashcard";

// In a real extension, this would use chrome.storage.local
// For this demo, we'll use localStorage
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
  
  // Add some sample cards for demo purposes
  populateSampleCards(): void {
    if (this.getAllFlashcards().length === 0) {
      const sampleCards = [
        {
          front: "What is the capital of France?",
          back: "Paris",
          hint: "City of Light",
          tags: ["geography", "europe"]
        },
        {
          front: "Who wrote 'To Kill a Mockingbird'?",
          back: "Harper Lee",
          hint: "Published in 1960",
          tags: ["literature", "american"]
        },
        {
          front: "What is the main function of CSS in web development?",
          back: "To style and layout web pages",
          hint: "Cascading Style Sheets",
          tags: ["programming", "web"]
        }
      ];
      
      sampleCards.forEach(card => this.saveFlashcard(card));
    }
  }
}

export const storageService = new StorageService();
