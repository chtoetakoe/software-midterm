
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface TextSelectorProps {
  onTextSelected: (text: string) => void;
}

export const TextSelector: React.FC<TextSelectorProps> = ({ onTextSelected }) => {
  const [selectedText, setSelectedText] = useState("");
  
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
    }
  };
  
  const handleAddFlashcard = () => {
    if (selectedText) {
      onTextSelected(selectedText);
      setSelectedText("");
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <p className="mb-4 text-sm text-muted-foreground">
          In the browser extension, you would select text on any webpage.
          For this demo, select text from the paragraph below:
        </p>
        
        <div 
          className="p-4 bg-background border rounded-md mb-4"
          onMouseUp={handleMouseUp}
        >
          <p>
            The human brain is remarkably adaptive, capable of forming new neural connections throughout life.
            This process, known as neuroplasticity, allows us to learn new information, develop skills, and
            recover from certain injuries. Flashcards leverage spaced repetition, a learning technique that
            exploits the psychological spacing effect. By reviewing information at increasing intervals, we
            strengthen memory retention and optimize learning efficiency.
          </p>
        </div>
        
        {selectedText && (
          <div className="preview-selection mb-4">
            <p className="text-sm font-medium">{selectedText}</p>
          </div>
        )}
        
        <Button
          onClick={handleAddFlashcard}
          disabled={!selectedText}
          className="w-full flex items-center justify-center gap-2"
        >
          <PlusCircle size={16} />
          <span>Create Flashcard from Selection</span>
        </Button>
      </CardContent>
    </Card>
  );
};
