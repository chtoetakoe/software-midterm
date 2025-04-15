
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlashcardCreator } from "@/components/FlashcardCreator";
import { FlashcardReview } from "@/components/FlashcardReview";
import { TextSelector } from "@/components/TextSelector";
import { BrainCircuit, BookText, PlusCircle } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("review");
  const [selectedText, setSelectedText] = useState("");
  
  const handleTextSelected = (text: string) => {
    setSelectedText(text);
    setActiveTab("create");
  };
  
  const handleCreateNew = () => {
    setSelectedText("");
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
          This demo simulates a browser extension that lets you select text on any webpage.
        </p>
      </header>
      
      <main className="flex-1 max-w-3xl mx-auto w-full">
        {activeTab !== "select" && (
          <TextSelector onTextSelected={handleTextSelected} />
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="review" className="flex items-center gap-2">
              <BookText size={16} />
              <span>Review Cards</span>
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <PlusCircle size={16} />
              <span>Create Card</span>
            </TabsTrigger>
            <TabsTrigger value="info" className="flex items-center gap-2">
              <BrainCircuit size={16} />
              <span>How It Works</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="review">
            <FlashcardReview onCreateNew={handleCreateNew} />
          </TabsContent>
          
          <TabsContent value="create">
            <FlashcardCreator 
              initialText={selectedText} 
              onCardCreated={() => setActiveTab("review")} 
            />
          </TabsContent>
          
          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>About Flashcard Grabber</CardTitle>
                <CardDescription>
                  Understanding how the browser extension works
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Text Selection</h3>
                  <p className="text-muted-foreground">
                    In the real extension, you can select any text on a webpage and right-click to create a flashcard.
                    The selected text becomes the front of the card.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Gesture Recognition</h3>
                  <p className="text-muted-foreground">
                    When reviewing cards, you can use hand gestures to indicate how well you knew the answer:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Thumbs Up: Easy - you knew the answer well</li>
                    <li>Flat Hand: Medium - you had to think about it</li>
                    <li>Thumbs Down: Hard - you didn't know the answer</li>
                  </ul>
                  <p className="text-muted-foreground mt-2">
                    For this demo version, you can use keyboard shortcuts (E, M, H) or the buttons to simulate gestures.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Storage</h3>
                  <p className="text-muted-foreground">
                    In the real extension, flashcards would be stored using chrome.storage.local.
                    This demo uses localStorage to simulate the same functionality.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Future Features</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Spaced repetition algorithm</li>
                    <li>Export/import as JSON or CSV</li>
                    <li>Improved gesture recognition with TensorFlow.js</li>
                    <li>Tag-based filtering and organization</li>
                    <li>Cloud sync across devices</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>© 2025 Flashcard Grabber • Browser Extension Demo</p>
      </footer>
    </div>
  );
};

export default Index;
