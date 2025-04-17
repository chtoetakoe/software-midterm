// content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "NEW_FLASHCARD") {
    console.log("📥 content.js received flashcard:", message.flashcard);
    
    // Format the message exactly as expected by your React app
    window.postMessage(
      { 
        type: "FROM_EXTENSION", 
        flashcard: message.flashcard 
      }, 
      "http://localhost:8080"
    );
    
    console.log("📤 Message posted to window");
    
    // Send response back to popup
    sendResponse({ status: "success" });
    return true; // Keep the message channel open for the async response
  }
});

// Log to verify the content script is loaded
console.log("🔌 Flashcard extension content script loaded");