// background.js
chrome.runtime.onInstalled.addListener(() => {
  console.log("Flashcard extension installed");
  
  // Create context menu for highlighting text
  chrome.contextMenus.create({
    id: "save-flashcard",
    title: "Add to Flashcard",
    contexts: ["selection"]
  });
});

// Handle the context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "save-flashcard" && info.selectionText) {
    // Save the selected text
    chrome.storage.local.set({ selectionText: info.selectionText });
    
    // Open the popup
    chrome.action.openPopup();
  }
});