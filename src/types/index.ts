export * from "./flashcard";   // re-export your existing Flashcard types

/* Extra shapes used by Leitner stats */
export interface PracticeRecord {
  cardFront: string;
  cardBack: string;
  timestamp: number;
  difficulty: import("./flashcard").FlashcardDifficulty;
  previousBucket: number;
  newBucket: number;
}

export interface ProgressStats {
  totalCards: number;
  cardsByBucket: Record<number, number>;
  successRate: number;          // 0-100
  averageMovesPerCard: number;
  totalPracticeEvents: number;
}
