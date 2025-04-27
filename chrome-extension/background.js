/**
 * Specification:
 * Sets up a context menu to allow users to save selected text as a flashcard.
 * When the context menu is clicked, it stores the selected text and opens the popup for card creation.
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log("Flashcard extension installed");
  
  // create context menu for highlighting text
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