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
    const text = selection?.toString().trim();
    if (text) {
      setSelectedText(text);
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
      <CardContent className="p-6 space-y-4" onMouseUp={handleMouseUp}>
        <p className="text-sm text-muted-foreground">
          Select any part of this text to create a flashcard. Try highlighting a sentence or definition below:
        </p>
        <div className="prose max-w-none select-text">
          <p>
            Software engineering is the discipline of designing, developing, testing, and maintaining software systems. It emphasizes code quality, modularity, and adaptability.
          </p>
          <p>
            Abstraction functions (AF) and representation invariants (RI) are concepts used to ensure correctness in software design, particularly for abstract data types (ADTs).
          </p>
          <p>
            Gesture recognition with TensorFlow.js allows applications to interpret hand movements via webcam using pre-trained models like HandPose or MoveNet.
          </p>
        </div>

        {selectedText && (
          <div className="text-sm text-foreground italic">
            Selected: "{selectedText}"
          </div>
        )}

        <Button onClick={handleAddFlashcard} disabled={!selectedText} className="mt-4">
          <PlusCircle className="mr-2 h-4 w-4" />
          Save as Flashcard
        </Button>
      </CardContent>
    </Card>
  );
};
