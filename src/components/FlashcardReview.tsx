/**
 * FlashcardReview.tsx
 
 * -----------------------------------
 * Displays *one deck* of flashcards and lets the user review them in **two
 * modes**:
 *   1. **Manual**   – flip the card, then click Easy / Hard / Wrong buttons.
 *   2. **Gesture** – flip the card, then rate it with hand‑gestures detected
 *                    by the webcam (👍 / ✋ / 👎).
 *
 * Behind the scenes each review is recorded in **localStorage** and the card
 * is moved through Leitner buckets (spaced‑repetition).  Only cards *due
 * today* (according to the Leitner algorithm) are shown.
 *
 * Main data‑flow ➜  storage‑service <‑> Leitner helpers <‑> this component.
 * ---------------------------------------------------------------------------
 */

import React, { useEffect, useRef, useState } from "react";
import {Tabs,TabsContent,TabsList,TabsTrigger,} from "@/components/ui/tabs";
import {Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GestureRunner } from "@/gesture/GestureRunner";
import { FlashcardView } from "./FlashcardView";

import { Flashcard, FlashcardDifficulty } from "@/types/flashcard";
import { storageService } from "@/services/storage-service";
import { useToast } from "@/components/ui/use-toast";

// Leitner helpers:  toBucketSets()  practice()  getHint()
import { toBucketSets, practice, getHint } from "@/logic/leitner";

import { ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";

/* -------------------------------------------------------------------------
 *  CONSTANTS
 * ---------------------------------------------------------------------- */

/** Display size for webcam & card area (desktop). */
const CAM_W = 640;
const CAM_H = 420;



/* -------------------------------------------------------------------------
 *  COMPONENT PROPS
 * ---------------------------------------------------------------------- */

interface Props {
  /** Callback when user clicks the fallback “Create New” button. */
  onCreateNew: () => void;
  /** Optional: external deck – if omitted we load from storage/Leitner. */
  flashcards?: Flashcard[];
}

/* -------------------------------------------------------------------------
 *  MAIN COMPONENT
 * ---------------------------------------------------------------------- */

export const FlashcardReview: React.FC<Props> = ({ onCreateNew, flashcards: propCards }) => {
  /* ────────────────────────────── STATE ─────────────────────────────── */
  const [cards,      setCards]      = useState<Flashcard[]>([]);   // today’s queue
  const [idx,        setIdx]        = useState(0);                 // current card index
  const [cardKey,    setCardKey]    = useState(0);                 // force‑re‑mount
  const [mode,       setMode]       = useState<"manual" | "gesture">("gesture");
  const [showHint,   setShowHint]   = useState(false);
  const [gestureLabel, setGestureLabel] = useState<string | null>(null);
  const [busy,       setBusy]       = useState(false);             // disable UI during animation

  /* ────────────────────────────── REFS ────────────────────────────────
   * Mutable containers that survive re‑renders – ideal for timing flags.
   */
  const idxRef           = useRef(0);
  const flippedRef       = useRef(false);          // has user flipped the card?
  const reviewedLockRef  = useRef(false);          // debounce duplicate reviews
  const cooldownRef      = useRef(false);          // 1.9 s delay between gestures
  const lastGestureRef   = useRef<string | null>(null);

  const { toast } = useToast();

  /* -------------------------------------------------------------------
   *  1️⃣  LOAD TODAY’S PRACTICE DECK (once on mount)
   * ---------------------------------------------------------------- */
  useEffect(() => {
    // 1. Build Leitner bucket map from localStorage
    const map  = storageService.getBucketMap();
    // 2. Convert map → ordered array of Set<Flashcard>
    const sets = toBucketSets(map);
    // 3. Compute which buckets are *due today* (Leitner rule)
    const todayIndex = Math.floor(Date.now() / 86_400_000); // days since epoch
    const todayDeck  = Array.from(practice(sets, todayIndex));
    setCards(todayDeck);
  }, [propCards]);

  /* Keep idx in bounds when deck size changes (eg. after review). */
  useEffect(() => {
    idxRef.current = idx;
    if (idx >= cards.length && cards.length > 0) setIdx(0);
  }, [idx, cards.length]);

  const currentCard = cards[idx];

  /* -------------------------------------------------------------------
   *  2️⃣  SAVE REVIEW & POP CARD FROM QUEUE
   * ---------------------------------------------------------------- */
  const commitReview = (d: FlashcardDifficulty) => {
    if (!currentCard || busy || reviewedLockRef.current) return;

    reviewedLockRef.current = true;
    setBusy(true);

    // Persist review & update Leitner buckets
    storageService.saveReview({ cardId: currentCard.id, difficulty: d });

    toast({ title: "Card Reviewed", description: `Marked as ${d}` });

    // Small delay lets flip animation finish before next card appears
    setTimeout(() => {
      // Remove the reviewed card from *today’s* queue only
      setCards(prev => {
        const updated = prev.filter((_, i) => i !== idxRef.current);
        setIdx(i => (i >= updated.length ? Math.max(0, updated.length - 1) : i));
        return updated;
      });

      // Reset transient flags
      setCardKey(k => k + 1);
      flippedRef.current      = false;
      reviewedLockRef.current = false;
      cooldownRef.current     = false;
      lastGestureRef.current  = null;
      setGestureLabel(null);
      setShowHint(false);
      setBusy(false);
    }, 350);
  };

  /* -------------------------------------------------------------------
   *  3️⃣  RENDER EMPTY STATE (no cards due today)
   * ---------------------------------------------------------------- */
  if (!currentCard) {
    return (
      <Card className="max-w-md mx-auto text-center p-6">
        <CardHeader>
          <CardTitle>No flashcards to review.</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={onCreateNew}>Create New</Button>
        </CardContent>
      </Card>
    );
  }

  /* -------------------------------------------------------------------
   *  4️⃣  RENDER UI (tabs: Manual / Gesture)
   * ---------------------------------------------------------------- */
  return (
    <Tabs
      value={mode}
      onValueChange={v => setMode(v as "manual" | "gesture")}
      className="w-full max-w-md mx-auto"
    >
      {/* ───────────────────────── TAB BAR ─────────────────────── */}
      <TabsList className="grid grid-cols-2 mb-4">
        <TabsTrigger value="manual">Manual</TabsTrigger>
        <TabsTrigger value="gesture">Gesture</TabsTrigger>
      </TabsList>

      {/* ========================================================= */}
      {/*  MANUAL MODE                                            */}
      {/* ========================================================= */}
      <TabsContent value="manual">
        <div className="flex flex-col items-center gap-6 w-full mt-6">
          {/* Card */}
          <div style={{ width: CAM_W }}>
            <FlashcardView
              key={`card-${cardKey}-manual`}
              card={currentCard}
              showHint={showHint}
              onReview={commitReview}
              interactionMode="manual"
            />
          </div>

          {/* Hint toggle & navigation */}
          <div className="flex justify-between w-full max-w-md px-2">
            <Button variant="ghost" onClick={() => setShowHint(h => !h)}>
              <Lightbulb className="mr-1 h-4 w-4" />
              {showHint ? "Hide Hint" : "Show Hint"}
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" disabled={idx === 0 || busy} onClick={() => setIdx(i => Math.max(i - 1, 0))}>
                <ChevronLeft size={16} />
              </Button>
              <Button variant="outline" disabled={idx === cards.length - 1 || busy} onClick={() => setIdx(i => Math.min(i + 1, cards.length - 1))}>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>

      {/* ========================================================= */}
      {/*  GESTURE MODE                                            */}
      {/* ========================================================= */}
      <TabsContent value="gesture">
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Quick instructions */}
          <p className="text-sm text-muted-foreground text-center">
            👋 Flip the card first, then use your hand to rate it:
            <span className="ml-1 font-medium">👍 Easy, ✋ Hard, 👎 Wrong</span>
          </p>

          {/* Webcam overlay (GestureRunner draws detections on canvas) */}
          <div
            className="relative rounded-lg shadow-lg overflow-hidden bg-black"
            style={{ width: CAM_W, height: CAM_H }}
          >

             
            <GestureRunner
              isActive
              width={CAM_W}
              height={CAM_H}
              onGesture={g => {
                setGestureLabel(g);

                /* Ignore duplicates, fast repeats, or if card not flipped yet */
                if (!flippedRef.current || cooldownRef.current || lastGestureRef.current === g || reviewedLockRef.current || busy) return;

                lastGestureRef.current = g;
                cooldownRef.current   = true;

                if (g === "thumbs_up")     commitReview(FlashcardDifficulty.EASY);
                else if (g === "flat_hand") commitReview(FlashcardDifficulty.HARD);
                else if (g === "thumbs_down") commitReview(FlashcardDifficulty.WRONG);

                setTimeout(() => {
                  cooldownRef.current   = false;
                  lastGestureRef.current = null;
                }, 1900);
              }}
            />

            {/* Current gesture label */}
            {gestureLabel && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/80 px-3 py-1 rounded text-sm font-semibold">
                {gestureLabel === "thumbs_up"   && "👍 EASY"}
                {gestureLabel === "flat_hand"    && "✋ HARD"}
                {gestureLabel === "thumbs_down" && "👎 WRONG"}
              </div>
            )}

            {/* Hint overlay (bottom‑bar) */}
            {showHint && (
              <div className="absolute bottom-0 w-full bg-yellow-200/90 text-gray-900 text-center text-sm py-1 flex items-center justify-center">
                <Lightbulb className="h-4 w-4 mr-1" /> {getHint(currentCard)}
              </div>
            )}

            {/* Desktop: tiny Hint toggle in corner */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHint(h => !h)}
              className="absolute top-2 right-2 hidden md:inline-flex bg-white/80"
            >
              <Lightbulb className="h-4 w-4 mr-1" />
              {showHint ? "Hide" : "Hint"}
            </Button>
          </div>

          {/* Same card rendered below webcam for bigger display */}
          <div style={{ width: CAM_W }}>
            <FlashcardView
              key={`card-${cardKey}-gesture`}
              card={currentCard}
              showHint={showHint}
              onReview={commitReview}
              acceptGestureOnlyWhenFlipped
              onFlipped={f => (flippedRef.current = f)}
              interactionMode="gesture"
            />
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              disabled={idx === 0 || busy}
              onClick={() => setIdx(i => Math.max(i - 1, 0))}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              disabled={idx === cards.length - 1 || busy}
              onClick={() => setIdx(i => Math.min(i + 1, cards.length - 1))}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};
