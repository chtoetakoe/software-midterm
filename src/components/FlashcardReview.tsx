// In FlashcardReview.tsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlashcardView } from "./FlashcardView";
import { GestureDetector } from "./GestureDetector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flashcard, FlashcardDifficulty } from "@/types/flashcard";
import { storageService } from "@/services/storage-service";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface FlashcardReviewProps {
  onCreateNew: () => void;
  flashcards?: Flashcard[]; // Add this line
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

  useEffect(() => {
    // If flashcards are provided via props, use those
    if (propFlashcards && propFlashcards.length > 0) {
      setFlashcards(propFlashcards);
    } else {
      // Otherwise load from storage as before
      const storedCards = storageService.getAllFlashcards();
      setFlashcards(storedCards);
    }
  }, [propFlashcards]); // Add depen


  const handleReview = (difficulty: FlashcardDifficulty) => {
    const updated = [...flashcards];
    // Optionally save review state later
    updated.splice(currentIndex, 1); // remove reviewed card
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
          onReview={handleReview}
          showHint={showHint}
        />
        <div className="flex justify-between mt-4">
          <Button variant="ghost" onClick={() => setShowHint(!showHint)}>
            {showHint ? "Hide Hint" : "Show Hint"}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
              disabled={currentIndex === 0}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, flashcards.length - 1))}
              disabled={currentIndex === flashcards.length - 1}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="gesture">
        <GestureDetector
         onGestureDetected={handleReview}
         isActive={true} // or toggle this with state later if needed
       />
      <FlashcardView
    card={currentCard}
    onReview={handleReview}
    showHint={showHint}
  />
</TabsContent>

    </Tabs>
  );
};
