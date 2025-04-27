/// <reference types="vitest" />
import { beforeEach, expect, test } from "vitest";
import { storageService } from "../src/services/storage-service";
import { FlashcardDifficulty } from "../src/types/flashcard";

beforeEach(() => {
  localStorage.clear(); // ✅ Clear storage before each test
});

// Tests saving a new flashcard and retrieving it
test("saves a flashcard", () => {
  const saved = storageService.saveFlashcard({
    front: "What is AI?",
    back: "Artificial Intelligence",
    hint: "Think machines",
    tags: ["CS"],
  });

  const all = storageService.getAllFlashcards();
  expect(all).toHaveLength(1);
  expect(all[0].front).toBe("What is AI?");
  expect(all[0].id).toBe(saved.id);
});

// Tests updating a flashcard and verifying the change
test("updates a flashcard", () => {
  const card = storageService.saveFlashcard({
    front: "Old",
    back: "Old answer",
    hint: "",
    tags: [],
  });

  const updated = storageService.updateFlashcard(card.id, {
    front: "New Question"
  });

  expect(updated?.front).toBe("New Question");

  const refreshed = storageService.getAllFlashcards();
  expect(refreshed[0].front).toBe("New Question");
});

// Tests deleting a flashcard and confirming it's removed
test("deletes a flashcard", () => {
  const card = storageService.saveFlashcard({
    front: "Delete me",
    back: "Gone soon",
    hint: "",
    tags: [],
  });

  const success = storageService.deleteFlashcard(card.id);
  expect(success).toBe(true);

  const remaining = storageService.getAllFlashcards();
  expect(remaining).toHaveLength(0);
});

// Tests saving a review for a flashcard and retrieving it
test("saves a review", () => {
  const card = storageService.saveFlashcard({
    front: "Reviewed card",
    back: "Answer",
    hint: "",
    tags: [],
  });

  storageService.saveReview({
    cardId: card.id,
    difficulty: FlashcardDifficulty.MEDIUM,
  });

  const reviews = storageService.getCardReviews(card.id);
  expect(reviews).toHaveLength(1);
  expect(reviews[0].difficulty).toBe(FlashcardDifficulty.MEDIUM);
});
