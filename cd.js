"use strict";

(() => {
  const cdEl = document.getElementById("cd");

  const framesCount = 12;
  const width = 35;
  const height = 17;
  const aspectX = 0.6;
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const radius = Math.min((width - 1) * aspectX, height - 1) / 2;
  const holeRadius = radius * 0.28;
  const bandWidth = 0.45;
  const glowWidth = 1.4;

  const normalizeAngle = (angle) => {
    const full = Math.PI * 2;
    return ((angle % full) + full) % full;
  };

  const angleDelta = (a, b) => {
    const full = Math.PI * 2;
    let diff = Math.abs(a - b) % full;
    if (diff > Math.PI) {
      diff = full - diff;
    }
    return diff;
  };

  const highlightChar = (angle) => {
    const dir = normalizeAngle(angle + Math.PI / 2);
    const sin = Math.sin(dir);
    const cos = Math.cos(dir);
    if (Math.abs(sin) < 0.35) {
      return "_";
    }
    if (Math.abs(cos) < 0.35) {
      return "|";
    }
    return cos * sin > 0 ? "/" : "\\";
  };

  const buildFrame = (angle) => {
    const rows = [];
    const bandChar = highlightChar(angle);
    for (let y = 0; y < height; y += 1) {
      let row = "";
      const dy = y - cy;
      for (let x = 0; x < width; x += 1) {
        const dx = x - cx;
        const sdx = dx * aspectX;
        const dist = Math.sqrt(sdx * sdx + dy * dy);
        if (dist > radius + 0.2) {
          row += " ";
          continue;
        }
        if (dist < holeRadius - 0.35) {
          row += " ";
          continue;
        }
        const pointAngle = Math.atan2(dy, sdx);
        const lineDist = Math.abs(
          sdx * Math.cos(angle) + dy * Math.sin(angle)
        );
        let char = "o";
        if (dist < holeRadius + 0.35) {
          char = ".";
        }
        if (radius - dist < 0.75) {
          char = ".";
        }
        if (lineDist < glowWidth) {
          char = ".";
        }
        if (lineDist < bandWidth) {
          char = bandChar;
        }
        if (dist > radius - 0.45 && angleDelta(pointAngle, angle) < 0.18) {
          char = "*";
        }
        row += char;
      }
      rows.push(row);
    }
    return rows.join("\n");
  };

  const frames = Array.from({ length: framesCount }, (_, index) => {
    const angle = (index / framesCount) * Math.PI * 2;
    return buildFrame(angle);
  });

  let frameIndex = 0;
  const frameDelay = 160;

  const render = () => {
    cdEl.textContent = frames[frameIndex];
    frameIndex = (frameIndex + 1) % frames.length;
  };

  render();
  setInterval(render, frameDelay);
})();
