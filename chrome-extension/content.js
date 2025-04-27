/**
 * Specification:
 * Listens for messages from popup.js.
 * Posts a NEW_FLASHCARD message to the React app via window.postMessage,
 * avoiding duplicates based on ID.
 */

if (!window.__flashcardContentLoaded) {
  window.__flashcardContentLoaded = true;   // mark as loaded

  // Track last sent flashcard ID to avoid duplicate sends
  let lastSentFlashcardId = null;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "NEW_FLASHCARD") {
      const incoming = message.flashcard;
      console.log("content.js received flashcard:", incoming);

      // Prevent sending the same flashcard twice
      if (incoming.id === lastSentFlashcardId) {
        console.log("Duplicate flashcard ignored:", incoming.id);
        sendResponse({ status: "duplicate_ignored" });
        return false;
      }

      lastSentFlashcardId = incoming.id;

      // Post message to the React app
      window.postMessage(
        { type: "FROM_EXTENSION", flashcard: incoming },
        "http://localhost:8080"
      );

      console.log("Flashcard posted to window");
      sendResponse({ status: "success" });
      return true;
    }
  });

  console.log(" Flashcard extension content script loaded");
}
