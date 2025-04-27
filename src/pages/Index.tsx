/**
 * Index.tsx
 * 
 * This is the main page of the app. It does three things:
 * 
 * 1. Loads flashcards from local storage when the app starts.
 * 2. Listens for messages sent by the Chrome Extension (via window.postMessage).
 * 3. Renders the <FlashcardReview> component to let users review their flashcards.
 * 
 * If a new flashcard comes from the extension:
 * - It checks for duplicates
 * - Saves the new flashcard
 * - Shows a toast message: "Flashcard Saved"
 */


import React, { useState, useEffect } from "react";
import { FlashcardReview } from "@/components/FlashcardReview";
import { Flashcard } from "@/types/flashcard";
import { storageService } from "@/services/storage-service";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const storedCards = storageService.getAllFlashcards();
    setFlashcards(storedCards);
  }, []);

  useEffect(() => {
    const handleExtensionMessage = (event: MessageEvent) => {
      if (event.source !== window) return;
      if (!event.data || event.data.type !== "FROM_EXTENSION") return;

      const incoming = event.data.flashcard;
      if (!incoming?.id || !incoming?.front) return;

      const incomingCard: Flashcard = {
        id: incoming.id,
        front: incoming.front,
        back: incoming.back || "",
        hint: incoming.hint || "",
        tags: incoming.tags || [],
        createdAt: new Date(incoming.createdAt || Date.now()),
      };

      const existing = storageService.getAllFlashcards();
      const alreadyExists = existing.some(card => card.id === incomingCard.id);
      if (alreadyExists) return;

      storageService.saveFlashcard(incomingCard);
      setFlashcards(storageService.getAllFlashcards());

      toast({
        title: "Flashcard Saved",
        description: "New flashcard added from extension",
      });
    };

    window.addEventListener("message", handleExtensionMessage);
    return () => window.removeEventListener("message", handleExtensionMessage);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background py-8 px-4 sm:px-6">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">
          Flashcard
        </h1>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full">
        <FlashcardReview
          flashcards={flashcards}
          onCreateNew={() => null} 
        />
      </main>
    </div>
  );
};

export default Index;
