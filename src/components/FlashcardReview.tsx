import React, { useEffect, useRef, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GestureRunner } from "@/gesture/GestureRunner";
import { FlashcardView } from "./FlashcardView";
import {
  Flashcard,
  FlashcardDifficulty,
} from "@/types/flashcard";
import { storageService } from "@/services/storage-service";
import { useToast } from "@/components/ui/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  Hand,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

interface Props {
  onCreateNew: () => void;
  flashcards?: Flashcard[];
}

export const FlashcardReview: React.FC<Props> = ({
  onCreateNew,
  flashcards: propCards,
}) => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [idx, setIdx] = useState(0);
  const [reviewMode, setReviewMode] = useState<"manual" | "gesture">("manual");
  const [showHint, setShowHint] = useState(false);
  const [detectedGesture, setDetectedGesture] = useState<string | null>(null);
  const [isProcessingReview, setIsProcessingReview] = useState(false);

  const { toast } = useToast();

  const detectorRef = useRef<any>(null);
  const lastGestureRef = useRef<string | null>(null);
  const gestureCooldownRef = useRef(false);
  const cardFlippedRef = useRef(false);
  const hasReviewedThisCardRef = useRef(false);

  useEffect(() => {
    const loadedCards = propCards ?? storageService.getAllFlashcards();
    setCards(loadedCards);
  }, [propCards]);

  useEffect(() => {
    console.log("📦 CARDS updated:", cards.map(c => c.front));
    if (idx >= cards.length && cards.length > 0) {
      console.log("🔁 Resetting index to 0");
      setIdx(0);
    }
  }, [cards]);

  const currentCard = cards[idx];
  console.log("📌 CURRENT CARD:", currentCard?.front, "at index", idx);

  const handleReview = (d: FlashcardDifficulty) => {
    const current = cards[idx];
    if (!current || !current.id || hasReviewedThisCardRef.current || isProcessingReview) return;

    console.log("👉 REVIEWING:", current.front, d);
    hasReviewedThisCardRef.current = true;
    setIsProcessingReview(true);

    // Save review first
    storageService.saveReview({
      cardId: current.id,
      difficulty: d,
    });

    // Show toast to acknowledge the review
    toast({ 
      title: "Card Reviewed", 
      description: `Marked as ${d}` 
    });

    // Delay removing the card to allow user to see the gesture feedback
    setTimeout(() => {
      console.log("👉 Removing card with ID:", current.id);
      
      // Remove the current card
      const updatedCards = cards.filter((_, i) => i !== idx);
      setCards(updatedCards);
      
      // Reset all state flags
      cardFlippedRef.current = false;
      hasReviewedThisCardRef.current = false;
      setShowHint(false);
      setDetectedGesture(null);
      lastGestureRef.current = null;
      gestureCooldownRef.current = false;
      setIsProcessingReview(false);
    }, 1500);  // Longer delay (1.5 seconds) before removing card
  };

  const handleModeChange = (v: string) =>
    setReviewMode(v as "manual" | "gesture");

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

  return (
    <Tabs
      value={reviewMode}
      onValueChange={handleModeChange}
      className="w-full max-w-md mx-auto"
    >
      <TabsList className="grid grid-cols-2 mb-4">
        <TabsTrigger value="manual">Manual</TabsTrigger>
        <TabsTrigger value="gesture">Gesture</TabsTrigger>
      </TabsList>

      <TabsContent value="manual">
        <FlashcardView
          key={currentCard.id}
          card={currentCard}
          showHint={showHint}
          onReview={handleReview}
          interactionMode="manual"
        />
        <div className="flex justify-between mt-4">
          <Button variant="ghost" onClick={() => setShowHint((h) => !h)}>
            {showHint ? "Hide Hint" : "Show Hint"}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIdx((p) => Math.max(p - 1, 0))}
              disabled={idx === 0}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              onClick={() => setIdx((p) => Math.min(p + 1, cards.length - 1))}
              disabled={idx === cards.length - 1}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="gesture">
        <div className="flex flex-col items-center gap-6">
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

          <div className="relative">
            <GestureRunner
              isActive={reviewMode === "gesture"} // Keep camera active at all times in gesture mode
              detectorRef={detectorRef}
              onGesture={(g) => {
                setDetectedGesture(g);

                if (
                  !cardFlippedRef.current ||
                  gestureCooldownRef.current ||
                  lastGestureRef.current === g ||
                  hasReviewedThisCardRef.current ||
                  isProcessingReview  // Still check processing to avoid multiple reviews
                ) return;

                lastGestureRef.current = g;
                gestureCooldownRef.current = true;

                if (g === "thumbs_up") handleReview(FlashcardDifficulty.EASY);
                else if (g === "flat_hand") handleReview(FlashcardDifficulty.MEDIUM);
                else if (g === "thumbs_down") handleReview(FlashcardDifficulty.HARD);

                setTimeout(() => {
                  gestureCooldownRef.current = false;
                  lastGestureRef.current = null;
                }, 2000);
              }}
            />
            {detectedGesture && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 px-4 py-1 rounded shadow text-sm font-semibold">
                {detectedGesture === "thumbs_up" && "👍 EASY"}
                {detectedGesture === "flat_hand" && "✋ MEDIUM"}
                {detectedGesture === "thumbs_down" && "👎 HARD"}
              </div>
            )}
          </div>

          <FlashcardView
            key={currentCard.id}
            card={currentCard}
            showHint={showHint}
            onReview={handleReview}
            acceptGestureOnlyWhenFlipped
            onFlipped={(flipped) => {
              console.log("🔄 onFlipped triggered:", flipped);
              cardFlippedRef.current = flipped;
            }}
            interactionMode="gesture"
          />

          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setIdx((p) => Math.max(p - 1, 0))}
              disabled={idx === 0 || isProcessingReview}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              onClick={() => setIdx((p) => Math.min(p + 1, cards.length - 1))}
              disabled={idx === cards.length - 1 || isProcessingReview}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};