import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlashcardView } from "./FlashcardView";
import { GestureRunner } from "@/gesture/GestureRunner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flashcard, FlashcardDifficulty } from "@/types/flashcard";
import { storageService } from "@/services/storage-service";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Hand, ThumbsUp, ThumbsDown } from "lucide-react";

interface FlashcardReviewProps {
  onCreateNew: () => void;
  flashcards?: Flashcard[];
}

export const FlashcardReview: React.FC<FlashcardReviewProps> = ({
  onCreateNew,
  flashcards: propFlashcards
}) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [reviewMode, setReviewMode] = useState("manual");
  const { toast } = useToast();
  const detectorRef = useRef<any>(null);

  useEffect(() => {
    console.log("Loading flashcards...");
    if (flashcards.length > 0) return; // prevent stacking flashcards
  
    if (propFlashcards && propFlashcards.length > 0) {
      setFlashcards(propFlashcards);
    } else {
      const storedCards = storageService.getAllFlashcards();
      setFlashcards(storedCards);
    }
  }, []);
  

  const handleReview = (difficulty: FlashcardDifficulty) => {
    const updated = [...flashcards];
    updated.splice(currentIndex, 1);
    setFlashcards(updated);
    setCurrentIndex((prev) => (prev >= updated.length ? 0 : prev));
    setShowHint(false);

    toast({
      title: "Card Reviewed",
      description: `You marked this as ${difficulty}`,
    });
  };

  if (flashcards.length === 0) {
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

  const currentCard = flashcards[currentIndex];

  return (
    <Tabs value={reviewMode} onValueChange={setReviewMode} className="w-full max-w-md mx-auto">
      <TabsList className="grid grid-cols-2 mb-4">
        <TabsTrigger value="manual">Manual</TabsTrigger>
        <TabsTrigger value="gesture">Gesture</TabsTrigger>
      </TabsList>

      <TabsContent value="manual">
        <FlashcardView
          card={currentCard}
          showHint={showHint}
          onReview={handleReview}
        />
        <div className="flex justify-between mt-4">
          <Button variant="ghost" onClick={() => setShowHint(!showHint)}>
            {showHint ? "Hide Hint" : "Show Hint"}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                detectorRef.current?.stop();
                setCurrentIndex((prev) => Math.max(prev - 1, 0));
                setTimeout(() => detectorRef.current?.start(), 150);
              }}
              disabled={currentIndex === 0}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                detectorRef.current?.stop();
                setCurrentIndex((prev) => Math.min(prev + 1, flashcards.length - 1));
                setTimeout(() => detectorRef.current?.start(), 150);
              }}
              disabled={currentIndex === flashcards.length - 1}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="gesture">
        <div className="space-y-4">
          <div className="text-center mb-2 p-3 bg-muted rounded-md">
            <p className="font-medium">Use hand gestures to rate this card:</p>
            <div className="flex justify-center gap-6 mt-2">
              <span className="flex flex-col items-center">
                <ThumbsUp className="h-6 w-6 text-green-500" />
                <span className="text-sm mt-1">Easy</span>
              </span>
              <span className="flex flex-col items-center">
                <Hand className="h-6 w-6 text-yellow-500" />
                <span className="text-sm mt-1">Medium</span>
              </span>
              <span className="flex flex-col items-center">
                <ThumbsDown className="h-6 w-6 text-red-500" />
                <span className="text-sm mt-1">Hard</span>
              </span>
            </div>
          </div>

          <GestureRunner
            isActive={reviewMode === "gesture"}
            onGesture={(gesture) => {
              if (gesture === "thumbs_up") handleReview(FlashcardDifficulty.EASY);
              if (gesture === "flat_hand") handleReview(FlashcardDifficulty.MEDIUM);
              if (gesture === "thumbs_down") handleReview(FlashcardDifficulty.HARD);
            }}
            detectorRef={detectorRef}
          />

          <FlashcardView
            card={currentCard}
            showHint={showHint}
            onReview={handleReview}
          />

          <Button
            variant="ghost"
            onClick={() => setShowHint(!showHint)}
            className="w-full"
          >
            {showHint ? "Hide Hint" : "Show Hint"}
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
};
