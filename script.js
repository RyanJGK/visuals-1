"use strict";

(() => {
  const screen = document.getElementById("screen");
  const linesEl = document.getElementById("lines");

  const cursor = document.createElement("span");
  cursor.className = "cursor";
  cursor.textContent = "_";

  const state = {
    lineHeight: 18,
    screenHeight: 0,
    maxBuffer: 120,
    scrollOffset: 0,
    targetScrollOffset: 0,
    nextCharAt: 0,
    currentIndex: 0,
    currentTarget: "",
    currentLine: null,
    lines: [],
    jitterNextAt: 0,
    jitterEndAt: 0,
    jitterX: 0,
    jitterY: 0,
  };

  const registers = ["ax", "bx", "cx", "dx", "si", "di", "sp", "bp"];
  const ops = ["mov", "xor", "and", "or", "add", "sub", "cmp", "jmp", "call"];
  const labels = [
    "init_video",
    "mem_test",
    "irq_handler",
    "io_poll",
    "sys_boot",
    "main",
  ];
  const types = ["uint8_t", "uint16_t", "uint32_t", "int", "char", "volatile"];
  const vars = ["ptr", "idx", "count", "mask", "status", "port", "seed", "addr"];
  const flags = [
    "FLAG_READY",
    "FLAG_IO",
    "FLAG_DMA",
    "FLAG_BUSY",
    "FLAG_IRQ",
  ];
  const modules = ["timer", "video", "cache", "serial", "driver", "kernel"];
  const statusLines = [
    "COMPILING",
    "ACCESSING MEMORY",
    "LINKING",
    "CHECKSUM",
    "LOADING MODULE",
    "SEGFAULT",
    "SYNCING DISK",
  ];

  const randomBetween = (min, max) => min + Math.random() * (max - min);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const hex = (digits) => {
    let out = "";
    for (let i = 0; i < digits; i += 1) {
      out += Math.floor(Math.random() * 16).toString(16);
    }
    return `0x${out.toUpperCase()}`;
  };

  const dec = (min, max) => Math.floor(randomBetween(min, max)).toString(10);

  const generateStatusLine = () => {
    const base = pick(statusLines);
    if (base === "SEGFAULT") {
      return `SEGFAULT @ ${hex(4)}`;
    }
    if (base === "CHECKSUM") {
      return `CHECKSUM ${hex(4)} OK`;
    }
    if (base === "ACCESSING MEMORY") {
      return `ACCESSING MEMORY ${hex(4)}`;
    }
    if (base === "LOADING MODULE") {
      return `LOADING MODULE ${pick(modules).toUpperCase()}`;
    }
    if (base === "LINKING") {
      return `LINKING ${pick(modules)}.o`;
    }
    return `${base}...`;
  };

  const generateCLikeLine = () => {
    const roll = Math.random();
    if (roll < 0.35) {
      return `${pick(types)} ${pick(vars)} = ${hex(4)};`;
    }
    if (roll < 0.7) {
      return `if (${pick(vars)} & ${pick(flags)}) { ${pick(
        vars
      )} ^= ${hex(2)}; }`;
    }
    return `for (i = 0; i < ${dec(8, 128)}; i++) { ${pick(
      vars
    )}[i] ^= ${dec(1, 255)}; }`;
  };

  const generateAsmLine = () => {
    const op = pick(ops);
    if (op === "call") {
      return `call ${pick(labels)}`;
    }
    if (op === "jmp") {
      return `jmp ${pick(labels)}`;
    }
    return `${op} ${pick(registers)}, ${hex(4)}`;
  };

  const generateShellLine = () => {
    const roll = Math.random();
    if (roll < 0.5) {
      return `if [ $ERR -ne 0 ]; then ${pick(labels)}; fi`;
    }
    return `echo "[ OK ] ${pick(modules)} ${dec(1, 9)}.${dec(0, 9)}"`;
  };

  const generateLine = () => {
    const roll = Math.random();
    if (roll < 0.18) {
      return generateStatusLine();
    }
    if (roll < 0.55) {
      return generateCLikeLine();
    }
    if (roll < 0.82) {
      return generateAsmLine();
    }
    return generateShellLine();
  };

  const createLine = (text) => {
    const line = document.createElement("div");
    line.className = "line";
    const span = document.createElement("span");
    span.className = "text";
    span.textContent = text;
    line.appendChild(span);
    return { line, span };
  };

  const setCurrentLine = (lineObj) => {
    if (state.currentLine && state.currentLine.line.contains(cursor)) {
      state.currentLine.line.removeChild(cursor);
    }
    state.currentLine = lineObj;
    lineObj.line.appendChild(cursor);
  };

  const addStaticLine = (text) => {
    const lineObj = createLine(text);
    linesEl.appendChild(lineObj.line);
    state.lines.push(lineObj);
  };

  const addNewLine = () => {
    const lineObj = createLine("");
    linesEl.appendChild(lineObj.line);
    state.lines.push(lineObj);
    setCurrentLine(lineObj);
  };

  const updateTargets = () => {
    state.targetScrollOffset = Math.max(
      0,
      state.lines.length * state.lineHeight - state.screenHeight
    );
  };

  const updateMaxBuffer = () => {
    const screens = Math.max(3, Math.ceil(state.screenHeight / state.lineHeight));
    state.maxBuffer = Math.max(120, screens * 6);
  };

  const cleanupLines = () => {
    while (state.lines.length > state.maxBuffer) {
      const oldLine = state.lines.shift();
      linesEl.removeChild(oldLine.line);
      state.scrollOffset = Math.max(0, state.scrollOffset - state.lineHeight);
      state.targetScrollOffset = Math.max(
        0,
        state.targetScrollOffset - state.lineHeight
      );
    }
  };

  const measure = () => {
    let lineHeight = parseFloat(getComputedStyle(linesEl).lineHeight);
    if (Number.isNaN(lineHeight)) {
      const probe = createLine("X");
      linesEl.appendChild(probe.line);
      lineHeight = probe.line.getBoundingClientRect().height || 18;
      linesEl.removeChild(probe.line);
    }
    state.lineHeight = lineHeight;
    state.screenHeight = linesEl.clientHeight;
    updateMaxBuffer();
    updateTargets();
  };

  const scheduleNextChar = (now, lastChar, lineComplete) => {
    let delay = randomBetween(18, 68);
    if (lastChar && /[.,;:)\\]]/.test(lastChar)) {
      delay += randomBetween(80, 150);
    }
    if (Math.random() < 0.03) {
      delay += randomBetween(140, 320);
    }
    if (lineComplete) {
      delay += randomBetween(220, 600);
    }
    state.nextCharAt = now + delay;
  };

  const startLine = () => {
    addNewLine();
    state.currentTarget = generateLine();
    state.currentIndex = 0;
    updateTargets();
    cleanupLines();
  };

  const updateTyping = (now) => {
    if (!state.currentLine) {
      startLine();
      state.nextCharAt = now + randomBetween(240, 520);
      return;
    }
    if (now < state.nextCharAt) {
      return;
    }
    if (state.currentIndex < state.currentTarget.length) {
      const nextChar = state.currentTarget[state.currentIndex];
      state.currentLine.span.textContent += nextChar;
      state.currentIndex += 1;
      scheduleNextChar(now, nextChar, false);
    } else {
      if (state.currentLine.line.contains(cursor)) {
        state.currentLine.line.removeChild(cursor);
      }
      startLine();
      scheduleNextChar(now, "", true);
    }
  };

  const updateScroll = () => {
    state.scrollOffset +=
      (state.targetScrollOffset - state.scrollOffset) * 0.12;
    linesEl.style.transform = `translateY(${-state.scrollOffset.toFixed(2)}px)`;
  };

  const updateJitter = (now) => {
    if (!state.jitterNextAt) {
      state.jitterNextAt = now + randomBetween(10000, 20000);
    }
    if (now >= state.jitterNextAt) {
      state.jitterEndAt = now + randomBetween(200, 450);
      state.jitterX = randomBetween(-0.8, 0.8);
      state.jitterY = randomBetween(-0.8, 0.8);
      state.jitterNextAt = now + randomBetween(10000, 20000);
    }
    if (now < state.jitterEndAt) {
      screen.style.setProperty("--jitter-x", `${state.jitterX}px`);
      screen.style.setProperty("--jitter-y", `${state.jitterY}px`);
    } else {
      screen.style.setProperty("--jitter-x", "0px");
      screen.style.setProperty("--jitter-y", "0px");
    }
  };

  const animate = (now) => {
    updateTyping(now);
    updateScroll();
    updateJitter(now);
    requestAnimationFrame(animate);
  };

  const seed = () => {
    const initial = [
      "BOOT ROM v1.09",
      "ACCESSING MEMORY",
      "CALIBRATING TIMERS",
      "READY.",
    ];
    initial.forEach(addStaticLine);
    startLine();
    state.nextCharAt = performance.now() + randomBetween(220, 520);
  };

  window.addEventListener("resize", measure);
  measure();
  seed();
  requestAnimationFrame(animate);
})();
