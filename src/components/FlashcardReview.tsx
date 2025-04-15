
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
}

export const FlashcardReview: React.FC<FlashcardReviewProps> = ({ onCreateNew }) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [reviewMode, setReviewMode] = useState("manual");
  const { toast } = useToast();
  
  useEffect(() => {
    // Load flashcards when component mounts
    const cards = storageService.getAllFlashcards();
    setFlashcards(cards);
    
    // If no cards exist, create sample cards
    if (cards.length === 0) {
      storageService.populateSampleCards();
      setFlashcards(storageService.getAllFlashcards());
    }
  }, []);
  
  const handleReview = (difficulty: FlashcardDifficulty) => {
    if (flashcards.length === 0) return;
    
    const currentCard = flashcards[currentIndex];
    
    // Save the review
    storageService.saveReview({
      cardId: currentCard.id,
      difficulty
    });
    
    // Show feedback
    toast({
      title: `Marked as ${difficulty.toLowerCase()}`,
      description: "Your progress has been saved",
    });
    
    // Move to next card
    handleNextCard();
  };
  
  const handleNextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Cycle back to the first card
      setCurrentIndex(0);
      toast({
        title: "Review complete",
        description: "Starting from the first card again",
      });
    }
  };
  
  const handlePrevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      // Cycle to the last card
      setCurrentIndex(flashcards.length - 1);
    }
  };
  
  const currentCard = flashcards[currentIndex];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="manual" value={reviewMode} onValueChange={setReviewMode}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="manual">Manual Review</TabsTrigger>
          <TabsTrigger value="gesture">Gesture Review</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual" className="space-y-6">
          {flashcards.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handlePrevCard}
                >
                  <ChevronLeft size={16} />
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  Card {currentIndex + 1} of {flashcards.length}
                </span>
                
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleNextCard}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
              
              <FlashcardView 
                card={currentCard} 
                onReview={handleReview}
                showHint={showHint}
              />
              
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowHint(!showHint)}
                >
                  {showHint ? "Hide Hint" : "Show Hint"}
                </Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="mb-4">No flashcards available for review.</p>
                <Button onClick={onCreateNew}>Create New Flashcard</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="gesture" className="space-y-6">
          {flashcards.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handlePrevCard}
                >
                  <ChevronLeft size={16} />
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  Card {currentIndex + 1} of {flashcards.length}
                </span>
                
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleNextCard}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
              
              <GestureDetector 
                onGestureDetected={handleReview}
                isActive={reviewMode === "gesture"} 
              />
              
              <FlashcardView 
                card={currentCard} 
                onReview={handleReview}
                showHint={showHint}
              />
              
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowHint(!showHint)}
                >
                  {showHint ? "Hide Hint" : "Show Hint"}
                </Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="mb-4">No flashcards available for review.</p>
                <Button onClick={onCreateNew}>Create New Flashcard</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
