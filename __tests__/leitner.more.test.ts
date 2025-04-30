/**
 * __tests__/leitner.more.test.ts
 *
 * “Round-trip” tests for all Leitner helpers:
 *   • toBucketSets
 *   • practice
 *   • update     ← now returns { buckets, from, to }
 *   • getHint
 *   • computeProgress
 */

import {
    toBucketSets,
    practice,
    update,
    getHint,
    computeProgress,
    BucketMap,
  } from "@/logic/leitner";
  import { Flashcard, FlashcardDifficulty } from "@/types/flashcard";
  import { describe, expect, test } from "vitest";
  
  const makeCard = (id: string, front = id): Flashcard => ({
    id,
    front,
    back: `${front}-back`,
    hint: `hint-${front}`,
    tags: [],
    createdAt: new Date(),
  });
  
  describe("Leitner helpers", () => {
    /* ────────────────────────── toBucketSets ───────────────────────── */
    test("toBucketSets converts sparse map → dense array", () => {
      const map: BucketMap = new Map([
        [0, new Set([makeCard("c0")])],
        [3, new Set([makeCard("c3")])],
      ]);
  
      const sets = toBucketSets(map);
      expect(sets).toHaveLength(4);
      expect(sets[0].has(Array.from(map.get(0)!)[0])).toBe(true);
      expect(sets[1].size).toBe(0);
      expect(Array.from(sets[3])[0].id).toBe("c3");
    });
  
    /* ─────────────────────────── practice ──────────────────────────── */
    test("practice returns cards due today (power-of-two interval)", () => {
      const sets = [
        new Set([makeCard("c0")]), // bucket 0
        new Set([makeCard("c1")]), // bucket 1
        new Set([makeCard("c2")]), // bucket 2
      ];
  
      expect(practice(sets, 1).size).toBe(1); // only bucket 0
      expect(practice(sets, 2).size).toBe(2); // buckets 0 & 1
      expect(practice(sets, 4).size).toBe(3); // all three
    });
  
    /* ──────────────────────────── update ──────────────────────────── */
    test("update moves card according to difficulty", () => {
      const card = makeCard("x");
      const original: BucketMap = new Map([[1, new Set([card])]]);
  
      // HARD → stay in bucket 1
      let { buckets: hardMap } = update(original, card, FlashcardDifficulty.HARD);
      expect(hardMap.get(1)?.has(card)).toBe(true);
  
      // WRONG → move back to bucket 0
      let { buckets: wrongMap } = update(hardMap, card, FlashcardDifficulty.WRONG);
      expect(wrongMap.get(0)?.has(card)).toBe(true);
  
      // EASY → advance to bucket 1 again
      let { buckets: easyMap } = update(wrongMap, card, FlashcardDifficulty.EASY);
      expect(easyMap.get(1)?.has(card)).toBe(true);
    });
  
    /* ─────────────────────────── getHint ─────────────────────────── */
    test("getHint falls back gracefully when no hint", () => {
      const c1 = makeCard("h1");
      expect(getHint(c1)).toMatch(/^hint-/);
  
      const c2 = { ...makeCard("h2"), hint: "" };
      expect(getHint(c2)).toBe("No hint available for this card.");
    });
  
    /* ───────────────────────── computeProgress ─────────────────────── */
    test("computeProgress aggregates stats correctly", () => {
      const cA = makeCard("A");
      const cB = makeCard("B");
      const buckets: BucketMap = new Map([
        [0, new Set([cA])],
        [2, new Set([cB])],
      ]);
  
      const history = [
        {
          cardFront    : cA.front,
          cardBack     : cA.back,
          timestamp    : Date.now(),
          difficulty   : FlashcardDifficulty.EASY,
          previousBucket: 0,
          newBucket    : 1,
        },
        {
          cardFront    : cB.front,
          cardBack     : cB.back,
          timestamp    : Date.now(),
          difficulty   : FlashcardDifficulty.WRONG,
          previousBucket: 2,
          newBucket    : 0,
        },
      ];
  
      const stats = computeProgress(buckets, history);
      expect(stats.totalCards).toBe(2);
      expect(stats.cardsByBucket[0]).toBe(1);
      expect(stats.cardsByBucket[2]).toBe(1);
      expect(stats.successRate).toBeCloseTo(50);     // 1 correct out of 2
      expect(stats.averageMovesPerCard).toBe(1);
      expect(stats.totalPracticeEvents).toBe(2);
    });
  });
  