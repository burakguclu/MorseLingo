// audio.js
// Tüm Web Audio API mantığını yönetir.

import * as config from "./config.js";

// Bu modülün kendi içinde yönettiği durum (state)
let audioCtx;
let currentOscillator = null;
let pressStartTime = 0;

// === YARDIMCI FONKSİYONLAR (Bu modüle özel) ===

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function playSound(durationInMs) {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.value = config.MORSE_TONE;
  oscillator.connect(ctx.destination);

  const now = ctx.currentTime;
  const durationInSeconds = durationInMs / 1000.0;

  oscillator.start(now);
  oscillator.stop(now + durationInSeconds);
}

// === DIŞA AKTARILAN FONKSİYONLAR (main.js kullanacak) ===

/**
 * Bir harf veya kelimenin mors kodunu çalar.
 * @param {string} item - Çalınacak harf veya kelime (örn: "SOS")
 * @param {Object} MORSE_CODE - Mors kodu sözlüğü
 */
export async function playMorseItem(item, MORSE_CODE) {
  const letters = item.split("");

  for (let i = 0; i < letters.length; i++) {
    const letter = letters[i];
    const code = MORSE_CODE[letter];
    if (!code) continue;

    const symbols = code.split("");

    for (let j = 0; j < symbols.length; j++) {
      const symbol = symbols[j];
      if (symbol === ".") {
        playSound(config.DIT_DURATION);
        await sleep(config.DIT_DURATION);
      } else if (symbol === "-") {
        playSound(config.DAH_DURATION);
        await sleep(config.DAH_DURATION);
      }
      if (j < symbols.length - 1) {
        await sleep(config.SYMBOL_GAP);
      }
    }

    if (i < letters.length - 1) {
      await sleep(config.LETTER_GAP);
    }
  }
}

/**
 * Mors tuşuna basıldığında tonu başlatır.
 * @returns {number} - Sese basılma zamanı (timestamp)
 */
export function startTone() {
  const ctx = getAudioContext();
  if (currentOscillator) {
    currentOscillator.stop();
  }

  currentOscillator = ctx.createOscillator();
  currentOscillator.type = "sine";
  currentOscillator.frequency.value = config.MORSE_TONE;
  currentOscillator.connect(ctx.destination);
  currentOscillator.start(ctx.currentTime);

  pressStartTime = Date.now();
  return pressStartTime;
}

/**
 * Mors tuşu bırakıldığında tonu durdurur ve vuruşu hesaplar.
 * @param {number} pStartTime - startTone() tarafından döndürülen basma zamanı
 * @returns {string} - '.' (dit) veya '-' (dah)
 */
export function stopTone(pStartTime) {
  if (!currentOscillator) {
    return null;
  }

  currentOscillator.stop(getAudioContext().currentTime);
  currentOscillator = null;

  const pressDuration = Date.now() - pStartTime;
  const tappedSymbol = pressDuration < config.DIT_DAH_THRESHOLD_MS ? "." : "-";

  return tappedSymbol;
}

/**
 * Devam eden bir sesi (varsa) durdurur.
 */
export function stopAllAudio() {
  if (currentOscillator) {
    currentOscillator.stop(getAudioContext().currentTime);
    currentOscillator = null;
  }
}
