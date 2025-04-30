/* ------------------------------------------------------------------
 * Leitner helpers for spaced-repetition
 * ------------------------------------------------------------------
 *  ▸ BucketMap      = Map<number, Set<Flashcard>>
 *  ▸ toBucketSets   : BucketMap → Array<Set<Flashcard>>
 *  ▸ practice       : choose cards due on a given day
 *  ▸ update         : move a single card after user rates it
 *  ▸ getHint        : safe helper for hint display
 *  ▸ computeProgress: aggregate per-bucket / success-rate stats
 * ------------------------------------------------------------------ */

import {
    Flashcard,
    FlashcardDifficulty,           // EASY | HARD | WRONG
  } from "@/types/flashcard";
  
  import type { PracticeRecord, ProgressStats } from "@/types";
  
  export type BucketMap = Map<number, Set<Flashcard>>;
  
  /* ─────────────────────────────────────────────────────────────── */
  /* 1. Convert BucketMap → fixed-length array for quick indexing   */
  /* ─────────────────────────────────────────────────────────────── */
  export function toBucketSets(map: BucketMap): Array<Set<Flashcard>> {
    const max = Math.max(0, ...map.keys());
    const arr: Array<Set<Flashcard>> = Array.from({ length: max + 1 }, () => new Set());
    for (const [n, set] of map) arr[n] = new Set(set);
    return arr;
  }
  
  /* ─────────────────────────────────────────────────────────────── */
  /* 2. Pick cards that are due on `day`                            */
  /*    bucket-0 = every day, bucket-n = every 2ⁿ days              */
  /* ─────────────────────────────────────────────────────────────── */
  export function practice(sets: Array<Set<Flashcard>>, day: number): Set<Flashcard> {
    const out = new Set<Flashcard>();
    sets[0]?.forEach(c => out.add(c));
    for (let n = 1; n < sets.length; n++) {
      if (day % (1 << n) === 0) sets[n]?.forEach(c => out.add(c));
    }
    return out;
  }
  
  /* ─────────────────────────────────────────────────────────────── */
  /* 3. Move a card after user marks it EASY | HARD | WRONG         */
  /*    Returns new map plus {from,to} buckets                      */
  /* ─────────────────────────────────────────────────────────────── */
  export function update(
    map: BucketMap,
    card: Flashcard,
    diff: FlashcardDifficulty,
  ): { buckets: BucketMap; from: number; to: number } {
    /* deep-copy */
    const m: BucketMap = new Map([...map].map(([k, v]) => [k, new Set(v)]));
  
    /* locate origin bucket */
    let from = 0;
    for (const [k, set] of m) if (set.has(card)) from = k;
    m.get(from)!.delete(card);
  
    /* decide destination */
    const to =
      diff === FlashcardDifficulty.WRONG ? 0 :
      diff === FlashcardDifficulty.HARD  ? from :
      from + 1;
  
    if (!m.has(to)) m.set(to, new Set());
    m.get(to)!.add(card);
  
    return { buckets: m, from, to };
  }
  
  /* ─────────────────────────────────────────────────────────────── */
  /* 4. Safe hint helper                                            */
  /* ─────────────────────────────────────────────────────────────── */
  export const getHint = (c: Flashcard) =>
    c.hint && c.hint.trim() !== "" ? c.hint : "No hint available for this card.";
  
  /* ─────────────────────────────────────────────────────────────── */
  /* 5. Progress summary                                            */
  /* ─────────────────────────────────────────────────────────────── */
  export function computeProgress(
    buckets: BucketMap,
    history: PracticeRecord[],
  ): ProgressStats {
    const totalCards   = [...buckets.values()].reduce((n, s) => n + s.size, 0);
  
    /* per-bucket counts */
    const cardsByBucket: Record<number, number> = {};
    buckets.forEach((set, n) => (cardsByBucket[n] = set.size));
  
    /* success-rate (EASY or HARD counted as correct) */
    const correct = history.filter(
      h => h.difficulty === FlashcardDifficulty.EASY ||
           h.difficulty === FlashcardDifficulty.HARD,
    ).length;
  
    /* average moves per unique card */
    const movesPerCard: Record<string, number> = {};
    history.forEach(h => {
      const key = `${h.cardFront}:${h.cardBack}`;
      movesPerCard[key] = (movesPerCard[key] ?? 0) + 1;
    });
    const averageMoves =
      Object.values(movesPerCard).length
        ? Object.values(movesPerCard).reduce((a, b) => a + b, 0) /
          Object.values(movesPerCard).length
        : 0;
  
    return {
      totalCards,
      cardsByBucket,
      successRate: history.length ? (correct / history.length) * 100 : 0,
      averageMovesPerCard: averageMoves,
      totalPracticeEvents: history.length,
    };
  }
  