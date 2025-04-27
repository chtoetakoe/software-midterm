import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GestureRunner } from "@/gesture/GestureRunner";
import { FlashcardView } from "./FlashcardView";
import { Flashcard, FlashcardDifficulty } from "@/types/flashcard";
import { storageService } from "@/services/storage-service";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, ChevronRight, Hand, ThumbsUp, ThumbsDown } from "lucide-react";

interface Props {
  onCreateNew: () => void;
  flashcards?: Flashcard[];
}

export const FlashcardReview: React.FC<Props> = ({
  onCreateNew,
  flashcards: propCards,
}) => {
  /* ───────────────────────────────── state & refs ─────────────────────────── */
  const [cards, setCards]   = useState<Flashcard[]>([]);
  const [idx,   setIdx]     = useState(0);
  const [cardKey, setCardKey] = useState(0);        // forces FlashcardView remount
  const [showHint, setShowHint] = useState(false);
  const [gestureLabel, setGestureLabel] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { toast } = useToast();

  const idxRef              = useRef(0);            // live index for timeout
  const cardFlippedRef       = useRef(false);
  const gestureCooldownRef   = useRef(false);
  const lastGestureRef       = useRef<string | null>(null);
  const reviewedLockRef      = useRef(false);

  /* ─────────────────────────────── load cards once ────────────────────────── */
  useEffect(() => {
    const loaded = propCards ?? storageService.getAllFlashcards();
    setCards(loaded);
  }, [propCards]);

  /* keep idx valid and mirror into idxRef                                      */
  useEffect(() => {
    idxRef.current = idx;
    if (idx >= cards.length && cards.length > 0) setIdx(0);
  }, [idx, cards.length]);

  const currentCard = cards[idx];

  /* ─────────────────────────────── review logic ───────────────────────────── */
  const handleReview = (difficulty: FlashcardDifficulty) => {
    if (!currentCard || busy || reviewedLockRef.current) return;

    reviewedLockRef.current = true;
    setBusy(true);

    storageService.saveReview({ cardId: currentCard.id, difficulty });
    toast({ title: "Card Reviewed", description: `Marked as ${difficulty}` });

    setTimeout(() => {
      /* remove the card using the latest index ref                              */
      setCards(prev => {
        const updated = prev.filter((_, i) => i !== idxRef.current);
        /* compute next index after removal                                      */
        setIdx(i => (i >= updated.length ? Math.max(0, updated.length - 1) : i));
        return updated;
      });

      setCardKey(k => k + 1);              // force FlashcardView refresh
      /* reset gesture locks & UI                                               */
      cardFlippedRef.current  = false;
      gestureCooldownRef.current = false;
      lastGestureRef.current  = null;
      reviewedLockRef.current = false;
      setGestureLabel(null);
      setShowHint(false);
      setBusy(false);
    }, 350);                               // small UX delay
  };

  /* ───────────────────────────── empty-deck view ───────────────────────────── */
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

  /* ─────────────────────────────────── UI ──────────────────────────────────── */
  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6">
      {/* Header with gesture hints */}
      <div className="text-center w-full bg-muted rounded-md p-4">
        <p className="font-medium mb-2">Flip the card, then show a gesture:</p>
        <div className="flex justify-center gap-6">
          <span className="flex flex-col items-center">
            <ThumbsUp className="h-6 w-6 text-green-500" />
            <span className="text-xs mt-1">Easy</span>
          </span>
          <span className="flex flex-col items-center">
            <Hand className="h-6 w-6 text-yellow-500" />
            <span className="text-xs mt-1">Medium</span>
          </span>
          <span className="flex flex-col items-center">
            <ThumbsDown className="h-6 w-6 text-red-500" />
            <span className="text-xs mt-1">Hard</span>
          </span>
        </div>
      </div>

      {/* Webcam + detector (kept mounted, no key) */}
      <div className="relative">
        <GestureRunner
          isActive
          onGesture={(g) => {
            setGestureLabel(g);

            if (
              !cardFlippedRef.current ||
              gestureCooldownRef.current ||
              lastGestureRef.current === g ||
              reviewedLockRef.current ||
              busy
            ) {
              return;
            }

            lastGestureRef.current = g;
            gestureCooldownRef.current = true;

            if (g === "thumbs_up")      handleReview(FlashcardDifficulty.EASY);
            else if (g === "flat_hand") handleReview(FlashcardDifficulty.MEDIUM);
            else if (g === "thumbs_down") handleReview(FlashcardDifficulty.HARD);

            /* allow a new gesture after 1.5 s */
            setTimeout(() => {
              gestureCooldownRef.current = false;
              lastGestureRef.current = null;
            }, 1500);
          }}
        />

        {gestureLabel && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 px-4 py-1 rounded shadow text-sm font-semibold">
            {gestureLabel === "thumbs_up"   && "👍 EASY"}
            {gestureLabel === "flat_hand"   && "✋ MEDIUM"}
            {gestureLabel === "thumbs_down" && "👎 HARD"}
          </div>
        )}
      </div>

      {/* Flashcard view */}
      <FlashcardView
        key={`flashcard-${cardKey}`}
        card={currentCard}
        showHint={showHint}
        onReview={handleReview}
        acceptGestureOnlyWhenFlipped
        onFlipped={(f) => (cardFlippedRef.current = f)}
        interactionMode="gesture"
      />

      {/* Navigation buttons */}
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => setIdx(i => Math.max(i - 1, 0))}
          disabled={idx === 0 || busy}
        >
          <ChevronLeft size={16} />
        </Button>
        <Button
          variant="outline"
          onClick={() => setIdx(i => Math.min(i + 1, cards.length - 1))}
          disabled={idx === cards.length - 1 || busy}
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
};
