// ✅ review.js upgraded with styled flashcard viewer + TensorFlow gesture support

let flashcards = [];
let currentIndex = 0;
const container = document.getElementById("card-container");
const webcam = document.getElementById("webcam");
const gestureCanvas = document.getElementById("gesture-canvas");
const ctx = gestureCanvas.getContext("2d");

const btnEasy = document.getElementById("easy");
const btnMedium = document.getElementById("medium");
const btnHard = document.getElementById("hard");

btnEasy.addEventListener("click", () => handleReview("easy"));
btnMedium.addEventListener("click", () => handleReview("medium"));
btnHard.addEventListener("click", () => handleReview("hard"));

chrome.storage.local.get("flashcards", (data) => {
  flashcards = data.flashcards || [];
  showCard();
});

function showCard() {
  container.innerHTML = "";
  if (flashcards.length === 0 || currentIndex >= flashcards.length) {
    container.innerHTML = "<p>You're done reviewing! 🎉</p>";
    return;
  }

  const card = flashcards[currentIndex];
  const cardDiv = document.createElement("div");
  cardDiv.className = "card";
  cardDiv.innerHTML = `
    <div class="flashcard">
      <h3>${card.front || "<em>(No question yet)</em>"}</h3>
      <p><strong>Answer:</strong> ${card.back}</p>
      ${card.hint ? `<p class="hint">Hint: ${card.hint}</p>` : ""}
      ${card.tags.length > 0 ? `<div class="tags">${card.tags.map(t => `<span class='tag'>${t}</span>`).join(" ")}</div>` : ""}
    </div>
  `;
  container.appendChild(cardDiv);
}

function handleReview(difficulty) {
  console.log("Gesture review:", difficulty);
  currentIndex++;
  showCard();
}

// Gesture Detection
let detector;
let lastGesture = "";

async function initGestureDetection() {
  const model = handPoseDetection.SupportedModels.MediaPipeHands;
  const detectorConfig = {
    runtime: "tfjs",
    modelType: "lite",
    maxHands: 1,
    solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands"
  };
  detector = await handPoseDetection.createDetector(model, detectorConfig);
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  webcam.srcObject = stream;
  webcam.style.display = "block";

  detectGestures();
}

async function detectGestures() {
  requestAnimationFrame(async function loop() {
    const hands = await detector.estimateHands(webcam);
    ctx.clearRect(0, 0, gestureCanvas.width, gestureCanvas.height);

    if (hands.length > 0) {
      drawKeypoints(hands[0].keypoints);
      const gesture = classifyGesture(hands[0]);
      if (gesture && gesture !== lastGesture) {
        lastGesture = gesture;
        handleReview(gesture);
      }
    }
    requestAnimationFrame(loop);
  });
}

function drawKeypoints(points) {
  for (const pt of points) {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "#00FF00";
    ctx.fill();
  }
}

function classifyGesture(hand) {
  const thumb = hand.keypoints.find(p => p.name === "thumb_tip");
  const index = hand.keypoints.find(p => p.name === "index_finger_tip");
  const middle = hand.keypoints.find(p => p.name === "middle_finger_tip");
  if (!thumb || !index || !middle) return null;

  const dx = thumb.x - index.x;
  const dy = thumb.y - index.y;

  if (dy < -30) return "easy";    // 👍
  if (dy > 30) return "hard";     // 👎
  if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return "medium"; // ✋
  return null;
}

initGestureDetection();
