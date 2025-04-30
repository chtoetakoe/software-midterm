/**
 * Specification:
 * This component displays a single flashcard, supporting manual review or gesture-controlled flow.
 * 
 * Props:
 * - `card`: the flashcard to show
 * - `onReview(difficulty)`: callback triggered when user scores the card
 * - `showHint`: whether to show the hint section
 * - `acceptGestureOnlyWhenFlipped`: if true, disables gesture scoring until card is flipped
 * - `onFlipped(flipped)`: reports flipping state
 * - `interactionMode`: "manual" or "gesture"
 * 
 * Features:
 * - Front shows question; back shows answer and tags.
 * - User clicks card to flip it.
 * - Buttons are shown in manual mode for scoring.
 */

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flashcard as FlashcardType, FlashcardDifficulty } from "@/types/flashcard";
import { BadgeCheck, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// Props this component expects
interface FlashcardViewProps {
  card: FlashcardType;  // the flashcard to display
  onReview: (difficulty: FlashcardDifficulty) => void; // when user rates the card
  showHint?: boolean;   // should hint be shown?
  acceptGestureOnlyWhenFlipped?: boolean; // in gesture mode, must flip first?
  onFlipped?: (flipped: boolean) => void;  // callback when card is flipped
  interactionMode?: "manual" | "gesture"; // manual buttons vs gesture mode
} 
// FlashcardView displays one card — front shows question, back shows answer.
export const FlashcardView: React.FC<FlashcardViewProps> = ({
  card,
  onReview,
  showHint = false,
  acceptGestureOnlyWhenFlipped = false,
  onFlipped,
  interactionMode = "manual",
}) => {
  const [flipped, setFlipped] = useState(false); // is card flipped?
  const [animating, setAnimating] = useState(false); // animation delay
  
  // Reset flip state whenever we get a new card
  useEffect(() => {
    setFlipped(false);
    onFlipped?.(false);
  }, [card.id, interactionMode]); 
  
  // When user clicks the card, flip it (with delay to avoid spam clicks)
  const handleFlip = () => {
    if (animating) return;
    setAnimating(true);
    const next = !flipped;
    setFlipped(next);
    
    
    onFlipped?.(next); // notify parent

    setTimeout(() => {
      setAnimating(false);
    }, 400);
  };
    // When the user clicks Easy/Wring/Hard or when a gesture happens
  const handleReview = (difficulty: FlashcardDifficulty) => {
    
    // If gesture mode requires flipped card, do nothing until flipped
    if (acceptGestureOnlyWhenFlipped && !flipped) return;
    if (!card) return; 
    onReview(difficulty);
  };
  

  return (
    <div style={{ width: 640 }} className="mx-auto">
      <Card
        className={cn("relative h-80 md:h-[420px] cursor-pointer w-full p-2 overflow-hidden", animating && "flip-card")}
        onClick={handleFlip}
      >
        <CardContent className="flex items-center justify-center h-full p-6 text-center">
          {!flipped ? (
            <div className="space-y-4">
              <p className="text-lg font-medium">{card.front}</p>
              {showHint && card.hint && (
                <div className="mt-4 text-sm text-muted-foreground">
                  <p className="italic">Hint: {card.hint}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-lg">{card.back || <span className="italic text-muted-foreground">No answer provided yet</span>}</p>
              {card.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-4 justify-center">
                  {card.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 bg-accent text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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