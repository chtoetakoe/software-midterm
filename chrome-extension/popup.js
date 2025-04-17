// popup.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("flashcard-form");
  const backInput = document.getElementById("back");

  // Get selected text from chrome.storage.local
  chrome.storage.local.get(["selectionText"], (result) => {
    if (result.selectionText) {
      backInput.value = result.selectionText;
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const front = document.getElementById("front").value.trim();
    const back = document.getElementById("back").value.trim();
    const hint = document.getElementById("hint").value.trim();
    const tags = document.getElementById("tags").value.trim().split(",").map(t => t.trim()).filter(Boolean);

    const flashcard = {
      id: crypto.randomUUID(),
      front,
      back,
      hint,
      tags,
      createdAt: new Date().toISOString()
    };

    // Search for the tab running localhost:8080
    chrome.tabs.query({}, (tabs) => {
      const targetTab = tabs.find(tab => tab.url && tab.url.startsWith("http://localhost:8080"));

      if (targetTab?.id) {
        console.log("📤 Sending flashcard to localhost tab:", targetTab.id);

        chrome.tabs.sendMessage(
          targetTab.id,
          {
            type: "NEW_FLASHCARD",
            flashcard
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error("Error sending message:", chrome.runtime.lastError.message);
            } else {
              console.log("✅ Flashcard sent successfully.");
            }
            window.close();
          }
        );
      } else {
        alert("❌ Could not find an open tab for http://localhost:8080. Please open your React app.");
      }
    });
  });
});
