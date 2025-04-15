
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { storageService } from "@/services/storage-service";
import { useToast } from "@/components/ui/use-toast";

interface FlashcardCreatorProps {
  onCardCreated?: () => void;
  initialText?: string;
}

export const FlashcardCreator: React.FC<FlashcardCreatorProps> = ({
  onCardCreated,
  initialText = "",
}) => {
  const [front, setFront] = useState(initialText);
  const [back, setBack] = useState("");
  const [hint, setHint] = useState("");
  const [tags, setTags] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!front.trim()) {
      toast({
        title: "Error",
        description: "Front side of the card cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    const tagList = tags
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag !== "");
    
    const newCard = storageService.saveFlashcard({
      front,
      back,
      hint,
      tags: tagList,
    });
    
    toast({
      title: "Success",
      description: "New flashcard created successfully",
    });
    
    // Reset form
    setFront("");
    setBack("");
    setHint("");
    setTags("");
    
    if (onCardCreated) {
      onCardCreated();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create New Flashcard</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="front">Front (Question)</Label>
            <Textarea
              id="front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Enter the question or front side text"
              required
              className="min-h-[100px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="back">Back (Answer)</Label>
            <Textarea
              id="back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Enter the answer or back side text (optional)"
              className="min-h-[100px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="hint">Hint (Optional)</Label>
            <Input
              id="hint"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="Enter a hint"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. history, science, important"
            />
          </div>
          
          <Button type="submit" className="w-full">
            Create Flashcard
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
