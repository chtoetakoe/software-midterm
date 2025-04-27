export enum FlashcardDifficulty {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint: string;
  tags: string[];
  createdAt: Date;
  lastReviewed?: Date;
  difficulty?: FlashcardDifficulty;
}

export interface FlashcardReview {
  cardId: string;
  reviewedAt: Date;
  difficulty: FlashcardDifficulty;
}
