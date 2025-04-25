import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlashcardReview } from "@/components/FlashcardReview";
import { Flashcard } from "@/types/flashcard";
import { storageService } from "@/services/storage-service";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [activeTab, setActiveTab] = useState("review");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const { toast } = useToast();

  // ✅ Load once
  useEffect(() => {
    const storedCards = storageService.getAllFlashcards();
    setFlashcards(storedCards);
  }, []);

  // ✅ Set up listener (with deduplication check)
  useEffect(() => {
    const handleExtensionMessage = (event: MessageEvent) => {
      if (event.source !== window) return;
      if (!event.data || event.data.type !== "FROM_EXTENSION") return;

      const incoming = event.data.flashcard;

      // Ensure flashcard is valid
      if (!incoming?.id || !incoming?.front) return;

      const incomingCard: Flashcard = {
        id: incoming.id,
        front: incoming.front,
        back: incoming.back || "",
        hint: incoming.hint || "",
        tags: incoming.tags || [],
        createdAt: new Date(incoming.createdAt || Date.now())
      };

      const existing = storageService.getAllFlashcards();
      const alreadyExists = existing.some(card => card.id === incomingCard.id);

      if (alreadyExists) {
        console.log("🚫 Duplicate flashcard ignored:", incomingCard.id);
        return;
      }

      storageService.saveFlashcard(incomingCard);
      const updated = storageService.getAllFlashcards();
      setFlashcards(updated);
      setActiveTab("review");

      toast({
        title: "Flashcard Saved",
        description: "New flashcard added from browser extension",
      });

      console.log("💾 Flashcard saved:", incomingCard);
    };

    window.addEventListener("message", handleExtensionMessage);
    return () => window.removeEventListener("message", handleExtensionMessage);
  }, []);

  const handleCreateNew = () => setActiveTab("create");

  return (
    <div className="min-h-screen flex flex-col bg-background py-8 px-4 sm:px-6">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">Flashcard</h1>
      </header>
      <main className="flex-1 max-w-3xl mx-auto w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="review">Review</TabsTrigger>
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="review">
            <FlashcardReview flashcards={flashcards} onCreateNew={handleCreateNew} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
