// /assets/javascripts/utils/gameAlert.js
// Reusable alert content for your Overlay.
// Usage:
//   import { createGameAlert } from '../utils/gameAlert.js'
//   const alertEl = createGameAlert({
//     message: "No more actions available.",
//     okText: "OK",
//     autoHideMs: 3000,              // null/undefined to disable auto-hide
//     backgroundUrl: "/assets/images/data/frames/overlay.png",
//     onOk: () => overlay.hide(),    // you'll usually pass overlay.hide
//   });
//   overlay.show(alertEl);

export function createGameAlert({
  message,
  okText = "OK",
  autoHideMs = null,
  backgroundUrl = "/assets/images/frames/overlay.png",
  onOk = () => {},
} = {}) {
  // Root
  const root = document.createElement("div");
  root.className = "game-alert";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", "Game message");

  // Background frame (image to leverage browser scaling nicely)
  const bg = document.createElement("img");
  bg.className = "game-alert__bg";
  bg.alt = "";
  bg.decoding = "async";
  bg.src = backgroundUrl;

  // Content column
  const box = document.createElement("div");
  box.className = "game-alert__box";

  const text = document.createElement("div");
  text.className = "dialog-message";
  text.textContent = message ?? "";

  const btn = document.createElement("button");
  btn.className = "game-btn game-btn--primary game-alert__ok";
  btn.type = "button";
  btn.textContent = okText;

  // Events
  function close() {
    try { onOk(); } catch {}
  }
  btn.addEventListener("click", close);

  // Keyboard: Enter = OK, Escape = OK
  function onKey(e) {
    if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }
  root.addEventListener("keydown", onKey);

  // Auto-focus OK button once mounted
  queueMicrotask(() => btn.focus());

  // Optional auto-hide
  let timer = null;
  if (typeof autoHideMs === "number" && autoHideMs > 0) {
    timer = setTimeout(() => close(), autoHideMs);
  }

  // Clean up helper (if your overlay calls it)
  root.cleanup = () => {
    root.removeEventListener("keydown", onKey);
    if (timer) clearTimeout(timer);
  };

  // Compose DOM
  box.appendChild(text);
  box.appendChild(btn);
  root.appendChild(bg);
  root.appendChild(box);

  return root;
}
