import {
    toBucketSets,
    practice,
    update,
  } from "@/logic/leitner";
  import { Flashcard, FlashcardDifficulty } from "@/types/flashcard";
import { expect, test } from "vitest";
  
  function card(front: string): Flashcard {
    return {
      id: crypto.randomUUID(),
      front,
      back: "",
      hint: "",
      tags: [],
      createdAt: new Date(),
    };
  }
  
  test("practice() always returns bucket-0 cards", () => {
    const c1 = card("Q1");
    const buckets = new Map<number, Set<Flashcard>>([[0, new Set([c1])]]);
    const sets = toBucketSets(buckets);
    const today = 0;                 // any integer
    const deck = practice(sets, today);
    expect(deck.has(c1)).toBe(true);
  });
  
  test("update() moves Easy card forward one bucket", () => {
    const c1 = card("Q1");
    const map = new Map<number, Set<Flashcard>>([[0, new Set([c1])]]);
    const { buckets } = update(map, c1, FlashcardDifficulty.EASY);
    expect(buckets.get(1)?.has(c1)).toBe(true);
  });
  