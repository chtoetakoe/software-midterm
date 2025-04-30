/**
 * FlashcardView.tsx
 * ---------------------------------------------------------------------------
 * Renders ONE flashcard — front shows *question*, back shows *answer* — and
 * lets the user score it as **Easy / Hard / Wrong** (buttons) *or* via hand
 * gesture (when `interactionMode === "gesture"`).
 *
 *  ▸ Front  – displays `card.front` and, optionally, a *hint*.
 *  ▸ Back   – displays `card.back` and tag chips.
 *  ▸ Flip   – clicking the card toggles front/back.
 *  ▸ Review – parent passes `onReview(difficulty)` which we call when
 *             the user chooses a rating (either button or gesture).
 *
 * Props recap 
 * ---------------------------------------------------------------------------
 * card    – the Flashcard object to display.
 * onReview(d) – callback when user rates the card.
 * showHint     – if true, show the hint bar (front side only).
 * acceptGestureOnlyWhenFlipped – in gesture‑mode, prevent scoring until user
 *                                 has flipped the card at least once.
 * onFlipped(f) – optional callback so parent can track flip state.
 * interactionMode – "manual" | "gesture" (buttons hidden in gesture mode).
 * ---------------------------------------------------------------------------
 */

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {Flashcard as FlashcardType,FlashcardDifficulty,} from "@/types/flashcard";
import { BadgeCheck, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getHint } from "@/logic/leitner"; // Re‑use helper for safe hint text

/* -------------------------------------------------------------------------
 *  PROPS INTERFACE
 * ---------------------------------------------------------------------- */

interface FlashcardViewProps {
  card: FlashcardType;
  onReview: (difficulty: FlashcardDifficulty) => void;
  showHint?: boolean;
  acceptGestureOnlyWhenFlipped?: boolean;
  onFlipped?: (flipped: boolean) => void;
  interactionMode?: "manual" | "gesture";
}

/* -------------------------------------------------------------------------
 *  COMPONENT
 * ---------------------------------------------------------------------- */

export const FlashcardView: React.FC<FlashcardViewProps> = ({
  card,
  onReview,
  showHint = false,
  acceptGestureOnlyWhenFlipped = false,
  onFlipped,
  interactionMode = "manual",
}) => {
  /* ── local UI state ─────────────────────────────────────────────── */
  const [flipped,    setFlipped]    = useState(false);
  const [animating,  setAnimating]  = useState(false); // debounces rapid clicks

  /* Reset flip whenever we get a *new* card or mode changes (gesture → manual) */
  useEffect(() => {
    setFlipped(false);
    onFlipped?.(false);
  }, [card.id, interactionMode]);

  /* Handle card flip */
  const handleFlip = () => {
    if (animating) return;          // ignore spam‑clicks during 400 ms anim

    setAnimating(true);
    const next = !flipped;
    setFlipped(next);
    onFlipped?.(next);

    setTimeout(() => setAnimating(false), 400);
  };

  /* Trigger parent callback when user selects a rating */
  const handleReview = (d: FlashcardDifficulty) => {
    if (acceptGestureOnlyWhenFlipped && !flipped) return; // gesture guard
    onReview(d);
  };

  /* -------------------------------------------------------------------
   *  RENDER
   * ---------------------------------------------------------------- */
  return (
    <div style={{ width: 640 }} className="mx-auto">
      {/* ---------------------------------------------------------------- */}
      {/*  CARD (click‑to‑flip)                                             */}
      {/* ---------------------------------------------------------------- */}
      <Card
        className={cn(
          "relative h-80 md:h-[420px] cursor-pointer w-full p-2 overflow-hidden",
          animating && "flip-card"
        )}
        onClick={handleFlip}
      >
        <CardContent className="flex items-center justify-center h-full p-6 text-center">
          {/* FRONT ------------------------------------------------------ */}
          {!flipped ? (
            <div className="space-y-4">
              <p className="text-lg font-medium">{card.front}</p>

              {/* Optional hint (uses getHint helper for safety/default). */}
              {showHint && (
                <div className="mt-4 text-sm text-muted-foreground">
                  <p className="italic">Hint: {getHint(card)}</p>
                </div>
              )}
            </div>
          ) : (
            /* BACK ----------------------------------------------------- */
            <div className="space-y-4">
              <p className="text-lg">
                {card.back || (
                  <span className="italic text-muted-foreground">No answer provided yet</span>
                )}
              </p>
              {card.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-4 justify-center">
                  {card.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-accent text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------------------------------------------------------------- */}
      {/*  REVIEW BUTTONS (hidden in gesture mode)                         */}
      {/* ---------------------------------------------------------------- */}
      {interactionMode !== "gesture" && (
        <div className="flex justify-between mt-6">
          <Button variant="destructive" onClick={() => handleReview(FlashcardDifficulty.WRONG)}>
            <X size={18} />
            <span>Wrong</span>
          </Button>
          <Button variant="outline" onClick={() => handleReview(FlashcardDifficulty.HARD)}>
            <AlertTriangle size={18} />
            <span>Hard</span>
          </Button>
          <Button variant="default" onClick={() => handleReview(FlashcardDifficulty.EASY)}>
            <BadgeCheck size={18} />
            <span>Easy</span>
          </Button>
        </div>
      )}
    </div>
  );
};
