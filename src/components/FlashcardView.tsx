import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flashcard as FlashcardType, FlashcardDifficulty } from "@/types/flashcard";
import { BadgeCheck, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlashcardViewProps {
  card: FlashcardType;
  onReview: (difficulty: FlashcardDifficulty) => void;
  showHint?: boolean;
  acceptGestureOnlyWhenFlipped?: boolean;
  onFlipped?: (flipped: boolean) => void;
  interactionMode?: "manual" | "gesture";
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({
  card,
  onReview,
  showHint = false,
  acceptGestureOnlyWhenFlipped = false,
  onFlipped,
  interactionMode = "manual",
}) => {
  const [flipped, setFlipped] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setFlipped(false);
    onFlipped?.(false);
  }, [card.id, interactionMode]); // or optionally: [card.id, idx, interactionMode]
  
  const handleFlip = () => {
    if (animating) return;
    setAnimating(true);
    const next = !flipped;
    setFlipped(next);
    
    
    onFlipped?.(next);

    setTimeout(() => {
      setAnimating(false);
    }, 400);
  };

  const handleReview = (difficulty: FlashcardDifficulty) => {
    if (acceptGestureOnlyWhenFlipped && !flipped) return;
    if (!card) return; // add this safety
    onReview(difficulty);
  };
  

  return (
    <div className="w-full max-w-md mx-auto">
      <Card
        className={cn("relative h-64 cursor-pointer w-full p-2 overflow-hidden", animating && "flip-card")}
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
          <Button variant="destructive" onClick={() => handleReview(FlashcardDifficulty.HARD)}>
            <X size={18} />
            <span>Hard</span>
          </Button>
          <Button variant="outline" onClick={() => handleReview(FlashcardDifficulty.MEDIUM)}>
            <AlertTriangle size={18} />
            <span>Medium</span>
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
