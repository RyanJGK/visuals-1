"use strict";

(() => {
  const loadingEl = document.getElementById("loadingText");
  const keysEl = document.getElementById("keys");
  const frames = ["Loading.", "Loading..", "Loading..."];
  let frameIndex = 0;

  const updateLoading = () => {
    if (!loadingEl) {
      return;
    }
    loadingEl.textContent = frames[frameIndex];
    frameIndex = (frameIndex + 1) % frames.length;
  };

  const buildKeyboard = () => {
    if (!keysEl) {
      return;
    }
    const rows = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
      [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.75],
      [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25],
      [1.5, 1.5, 5.5, 1.5, 1.5],
    ];

    rows.forEach((row, rowIndex) => {
      const rowEl = document.createElement("div");
      rowEl.className = "key-row";
      row.forEach((unit) => {
        const key = document.createElement("div");
        key.className = "key";
        if (rowIndex === rows.length - 1 && unit > 3) {
          key.classList.add("space");
        }
        key.style.setProperty("--w", unit);
        rowEl.appendChild(key);
      });
      keysEl.appendChild(rowEl);
    });
  };

  updateLoading();
  buildKeyboard();
  setInterval(updateLoading, 420);
})();
