// In src/pages/Index.tsx
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlashcardCreator } from "@/components/FlashcardCreator";
import { FlashcardReview } from "@/components/FlashcardReview";
import { BrainCircuit, BookText, PlusCircle } from "lucide-react";
import { Flashcard } from "@/types/flashcard";
import { storageService } from "@/services/storage-service";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [activeTab, setActiveTab] = useState("review");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const { toast } = useToast();
  
  // Load flashcards on mount
  useEffect(() => {
    const storedCards = storageService.getAllFlashcards();
    setFlashcards(storedCards);
  }, []);
  
  // Set up listener for Chrome extension messages
  useEffect(() => {
    const handleExtensionMessage = (event: MessageEvent) => {
      console.log("Message received:", event);
      
      if (event.data && event.data.type === "FROM_EXTENSION") {
        console.log("🎯 React app received flashcard:", event.data.flashcard);
        
        // Transform the data to match your Flashcard type
        // The extension data might have createdAt as a string, so we convert it to Date
        const extensionFlashcard = event.data.flashcard;
        const flashcardData = {
          id: extensionFlashcard.id,
          front: extensionFlashcard.front,
          back: extensionFlashcard.back,
          hint: extensionFlashcard.hint || "",
          tags: extensionFlashcard.tags || [],
          createdAt: new Date(extensionFlashcard.createdAt)
        };
        
        // Save the flashcard using your storage service
        const newFlashcard = storageService.saveFlashcard(flashcardData);
        
        // Update state with all flashcards
        const updatedFlashcards = storageService.getAllFlashcards();
        setFlashcards(updatedFlashcards);
        
        // Switch to review tab
        setActiveTab("review");
        
        // Provide feedback
        toast({
          title: "Flashcard Saved",
          description: "New flashcard added from browser extension",
        });
        
        console.log("💾 Flashcard saved to storage");
      }
    };
    
    // Add the event listener
    window.addEventListener('message', handleExtensionMessage);
    console.log("👂 Extension message listener set up in React app");
    
    // Cleanup
    return () => {
      window.removeEventListener('message', handleExtensionMessage);
    };
  }, []); // No dependencies needed

  const handleCreateNew = () => {
    setActiveTab("create");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background py-8 px-4 sm:px-6">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">
          Flashcard Grabber
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Create and review flashcards with gesture-based feedback.
        </p>
      </header>
      <main className="flex-1 max-w-3xl mx-auto w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            {/* Your tab triggers here */}
          </TabsList>
          <TabsContent value="review">
            <FlashcardReview 
              flashcards={flashcards}
              onCreateNew={handleCreateNew}
            />
          </TabsContent>
          <TabsContent value="create">
            <FlashcardCreator
              onCardCreated={() => setActiveTab("review")}
            />
          </TabsContent>
          {/* Other tabs */}
        </Tabs>
      </main>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>© 2025 Flashcard Grabber • Browser Extension Demo</p>
      </footer>
    </div>
  );
};

export default Index;