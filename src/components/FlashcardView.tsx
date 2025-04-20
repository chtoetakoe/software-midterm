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
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({
  card,
  onReview,
  showHint = false,
}) => {
  const [flipped, setFlipped] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setFlipped(false);
  }, [card]);

  const handleFlip = () => {
    if (animating) return;

    setAnimating(true);
    setFlipped(!flipped);

    setTimeout(() => {
      setAnimating(false);
    }, 500);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card
        className={cn(
          "relative h-64 cursor-pointer w-full p-6 transition-all duration-300 rounded-xl",
          animating && "flip-card",
          "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md"
        )}
        onClick={handleFlip}
      >
        <CardContent className="flex items-center justify-center h-full p-4 text-center">
          {!flipped ? (
            <div className="space-y-4">
              <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{card.front}</p>
              {showHint && card.hint && (
                <p className="text-sm italic text-muted-foreground">Hint: {card.hint}</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {card.back ? (
                <p className="text-xl text-zinc-800 dark:text-zinc-200">{card.back}</p>
              ) : (
                <p className="text-lg text-muted-foreground italic">No answer provided</p>
              )}
              {card.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-4 justify-center">
                  {card.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 rounded-full border border-zinc-200 dark:border-zinc-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => onReview(FlashcardDifficulty.HARD)}
          className="text-red-700 border-red-300 hover:bg-red-50"
        >
          <X size={18} className="mr-2" />
          Hard
        </Button>

        <Button
          variant="outline"
          onClick={() => onReview(FlashcardDifficulty.MEDIUM)}
          className="text-yellow-800 border-yellow-300 hover:bg-yellow-50"
        >
          <AlertTriangle size={18} className="mr-2" />
          Medium
        </Button>

        <Button
          variant="outline"
          onClick={() => onReview(FlashcardDifficulty.EASY)}
          className="text-green-700 border-green-300 hover:bg-green-50"
        >
          <BadgeCheck size={18} className="mr-2" />
          Easy
        </Button>
      </div>
    </div>
  );
};
