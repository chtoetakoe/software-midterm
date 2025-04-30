/**
 * Specification:
 * This component manages reviewing flashcards either manually or via hand gestures.
 * 
 * Props:
 * - `onCreateNew`: callback triggered when user clicks "Create New".
 * - `flashcards`: optional initial list of flashcards to review.
 * 
 * Features:
 * - Displays flashcards in tabs: Manual or Gesture-based mode.
 * - Handles webcam input to detect gestures like thumbs up/down/flat hand.
 * - Tracks current card index and review state.
 * - Automatically removes reviewed flashcards from the active list.
 * 
 */


import React, { useEffect, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger,} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GestureRunner } from "@/gesture/GestureRunner";
import { FlashcardView } from "./FlashcardView";
import { Flashcard, FlashcardDifficulty } from "@/types/flashcard";
import { storageService } from "@/services/storage-service";
import { useToast } from "@/components/ui/use-toast";
import {ChevronLeft, ChevronRight, Lightbulb,} from "lucide-react";

/* Constants for webcam size */
const CAM_W = 640;
const CAM_H = 420;

interface Props { onCreateNew: () => void; flashcards?: Flashcard[] }

export const FlashcardReview: React.FC<Props> = ({
  onCreateNew, flashcards: propCards,
}) => {
   // State: current flashcards, index, flipped state, etc.
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [idx, setIdx] = useState(0);
  const [cardKey, setCardKey] = useState(0);
  const [mode, setMode] = useState<"manual" | "gesture">("gesture");
  const [showHint, setShowHint] = useState(false);
  const [gestureLabel, setGestureLabel] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
   
  // Toast feedback for review results
  const { toast } = useToast();
   
  // Refs for state that survives re-renders (used for timing/gesture sync)
  const idxRef = useRef(0);
  const flippedRef = useRef(false);
  const reviewedLockRef = useRef(false);
  const cooldownRef = useRef(false);
  const lastGestureRef = useRef<string | null>(null);

  // Load flashcards either from props or storage
  useEffect(() => {
    setCards(propCards ?? storageService.getAllFlashcards());
  }, [propCards]);

  // Keep index within bounds if deck updates
  useEffect(() => {
    idxRef.current = idx;
    if (idx >= cards.length && cards.length > 0) setIdx(0);
  }, [idx, cards.length]);

  const currentCard = cards[idx];

   // Handle reviewing a card (remove it from deck, show toast)
  const commitReview = (d: FlashcardDifficulty) => {
    if (!currentCard || busy || reviewedLockRef.current) return;

    reviewedLockRef.current = true;
    setBusy(true);
    storageService.saveReview({ cardId: currentCard.id, difficulty: d });
    toast({ title: "Card Reviewed", description: `Marked as ${d}` });

    setTimeout(() => {
      // Remove reviewed card and reset states
      setCards(prev => {
        const updated = prev.filter((_, i) => i !== idxRef.current);
        setIdx(i =>
          i >= updated.length ? Math.max(0, updated.length - 1) : i,
        );
        return updated;
      });

      setCardKey(k => k + 1); // force re-render
      flippedRef.current = false;
      reviewedLockRef.current = false;
      cooldownRef.current = false;
      lastGestureRef.current = null;
      setGestureLabel(null);
      setShowHint(false);
      setBusy(false);
    }, 350);
  };

  // If no cards left, show fallback
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

  /* ───── UI ───── */
  return (
    <Tabs
      value={mode}
      onValueChange={v => setMode(v as "manual" | "gesture")}
      className="w-full max-w-md mx-auto"
    >
      <TabsList className="grid grid-cols-2 mb-4">
        <TabsTrigger value="manual">Manual</TabsTrigger>
        <TabsTrigger value="gesture">Gesture</TabsTrigger>
      </TabsList>

      {/* Manual tab */}
      <TabsContent value="manual">
  <div className="flex flex-col items-center gap-6 w-full mt-6">
    {/* Flashcard */}
    <div style={{ width: CAM_W }}>
      <FlashcardView
        key={`card-${cardKey}-manual`}
        card={currentCard}
        showHint={showHint}
        onReview={commitReview}
        interactionMode="manual"
      />
    </div>

    {/* Hint toggle + nav buttons */}
    <div className="flex justify-between w-full max-w-md px-2">
      <Button variant="ghost" onClick={() => setShowHint(h => !h)}>
        <Lightbulb className="mr-1 h-4 w-4" />
        {showHint ? "Hide Hint" : "Show Hint"}
      </Button>
      <div className="flex gap-2">
        <Button variant="outline" disabled={idx === 0 || busy}
          onClick={() => setIdx(i => Math.max(i - 1, 0))}>
          <ChevronLeft size={16} />
        </Button>
        <Button variant="outline"
          disabled={idx === cards.length - 1 || busy}
          onClick={() => setIdx(i => Math.min(i + 1, cards.length - 1))}>
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  </div>
</TabsContent>


      {/* Gesture tab */}
<TabsContent value="gesture">
  <div className="flex flex-col items-center gap-6 w-full">
    {/* Instructions */}
    <p className="text-sm text-muted-foreground text-center">
      👋 Flip the card first, then use your hand to rate it:
      <span className="ml-1 font-medium">👍 Easy, ✋ Hard, 👎 Wrong</span>
    </p>

    {/* Webcam */}
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
          // Ignore if card not flipped or still in cooldown
          if (
            !flippedRef.current || cooldownRef.current ||
            lastGestureRef.current === g || reviewedLockRef.current || busy
          ) return;

          lastGestureRef.current = g;
          cooldownRef.current = true;

          // Gesture → Review Mapping
          if (g === "thumbs_up") commitReview(FlashcardDifficulty.EASY);
          else if (g === "flat_hand") commitReview(FlashcardDifficulty.HARD);
          else if (g === "thumbs_down") commitReview(FlashcardDifficulty.WRONG);

          // Cooldown before allowing next gesture
          setTimeout(() => {
            cooldownRef.current = false;
            lastGestureRef.current = null;
          }, 1900);
        }}
      />

      {/* gesture label */}
      {gestureLabel && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/80 px-3 py-1 rounded text-sm font-semibold">
          {gestureLabel === "thumbs_up" && "👍 EASY"}
          {gestureLabel === "flat_hand" && "✋ HARD"}
          {gestureLabel === "thumbs_down" && "👎 WRONG"}
        </div>
      )}

      {/* hint bar */}
      {showHint && currentCard.hint && (
        <div className="absolute bottom-0 w-full bg-yellow-200/90 text-gray-900 text-center text-sm py-1 flex items-center justify-center">
          <Lightbulb className="h-4 w-4 mr-1" /> {currentCard.hint}
        </div>
      )}

      {/* desktop hint toggle */}
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

    {/* Flashcard (same width) */}
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

    {/* nav buttons */}
    <div className="flex justify-center gap-4">
      <Button variant="outline" disabled={idx === 0 || busy}
        onClick={() => setIdx(i => Math.max(i - 1, 0))}>
        <ChevronLeft size={16} />
      </Button>
      <Button variant="outline"
        disabled={idx === cards.length - 1 || busy}
        onClick={() => setIdx(i => Math.min(i + 1, cards.length - 1))}>
        <ChevronRight size={16} />
      </Button>
    </div>
  </div>
</TabsContent>

    </Tabs>
  );
};
