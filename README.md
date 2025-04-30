# ✨ Gesture Flashcard Chrome Extension

This project is a Chrome Extension + Web App for reviewing flashcards using hand gestures via webcam.

## 📌 What It Does

- ✅ Save flashcards by highlighting text on any webpage
- ✅ Automatically opens a popup to customize and store the flashcard
- ✅ Review flashcards in two modes:
  - **Manual**: Flip card, click to rate difficulty
  - **Gesture**: Flip card, then use hand gestures to score:
    - 👍 Thumbs Up → Easy  
    - ✋ Flat Hand → Hard  
    - 👎 Thumbs Down → Wrong

All flashcards and review data are stored in `localStorage`.

---

## 🧠 Engineering Highlights

### 📄 Specification

This project follows the "Spec → Test → Implement → Iterate → Document" approach:

- `FlashcardView.tsx`: Displays one flashcard, supports flipping + scoring  
- `FlashcardReview.tsx`: Handles state, navigation, and switching between manual and gesture modes  
- `GestureRunner.tsx`: Streams webcam, detects gestures using MediaPipe + TensorFlow.js  
- `storage-service.ts`: Handles flashcard storage and review tracking

---

### 📦 Abstract Data Type (ADT) Design

```ts
// AF: A flashcard represents a question-answer pair with optional tags and hint
// RI: Flashcard must have non-empty `front`, `id`; tags must be a string array
// SRE:
{
  id: "123abc",
  front: "What is AI?",
  back: "Artificial Intelligence",
  tags: ["CS", "AI"],
  createdAt: "2025-04-25T12:00:00Z"
}
```

---

### ✅ Tests

> Tests written for:
- `storage-service.ts` (save/load/update/delete flashcards, save reviews)
- `FlashcardView` (flip behavior, button actions, tag rendering)
- Gesture classification (e.g. `detectGesture()` function)

---

## 🛠️ Folder Structure

```
├── chrome-extension/
│   ├── background.js
│   ├── content.js
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   └── review.html
├── src/
│   ├── components/
│   │   ├── FlashcardReview.tsx
│   │   └── FlashcardView.tsx
│   ├── gesture/
│   │   ├── GestureRunner.tsx
│   │   ├── gestureDetection.ts
│   │   └── gestureRecognition.ts
│   ├── hooks/
│   │   └── use-toast.ts
│   ├── lib/
│   │   └── utils.ts
│   ├── services/
│   │   └── storage-service.ts
│   ├── pages/
│   │   └── Index.tsx
│   ├── App.tsx
│   └── main.tsx
```

---

## 🧪 How to Use the Extension

1. **Build the React App**
   ```bash
   npm run build
   ```

2. **Open Chrome Extensions:**
   - Go to `chrome://extensions`
   - Enable **Developer Mode**
   - Click "Load Unpacked" and select the `chrome-extension/` folder

3. **Try It Out**
   - Visit any webpage
   - Highlight text → Right-click → "Add to Flashcard"
   - Customize card in popup
   - Open the main app → Start reviewing!

---

## 👩‍💻 Technologies Used

- React + TypeScript
- Tailwind CSS
- TensorFlow.js + MediaPipe Hands
- LocalStorage API
- Chrome Extension APIs

---

## 🎓 Built for Software Engineering Midterm

- ✅ Clear Specification
- ✅ Abstract Functions and Representation Invariants
- ✅ Clean Git workflow and commit history
- ✅ Meaningful testing and documentation

---

 

