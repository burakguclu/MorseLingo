// audio.js
// Tüm Web Audio API mantığını yönetir.

import * as config from "./config.js";

let audioCtx;
let currentOscillator = null;
let pressStartTime = 0;
let soundEffects = {};
let gainNode = null;

// Dinamik ayarlar
let currentVolume = 0.8; // 0-1 arası
let currentFrequency = config.MORSE_TONE;

// === YARDIMCI FONKSİYONLAR ===

function getAudioContext() {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      console.warn("Web Audio API bu tarayıcıda desteklenmiyor.");
      return null;
    }
    audioCtx = new AudioCtx();
    gainNode = audioCtx.createGain();
    gainNode.gain.value = currentVolume;
    gainNode.connect(audioCtx.destination);
  }
  return audioCtx;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function playSound(durationInMs) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.value = currentFrequency;
  oscillator.connect(gainNode);

  const now = ctx.currentTime;
  const durationInSeconds = durationInMs / 1000.0;

  oscillator.start(now);
  oscillator.stop(now + durationInSeconds);
}

// === DIŞA AKTARILAN FONKSİYONLAR ===

/**
 * Ses seviyesini ayarlar (0-100 arası).
 */
export function setVolume(volumePercent) {
  currentVolume = Math.max(0, Math.min(1, volumePercent / 100));
  if (gainNode) {
    gainNode.gain.value = currentVolume;
  }
  // HTML audio efektlerinin sesini de ayarla
  Object.values(soundEffects).forEach((audio) => {
    if (audio) audio.volume = currentVolume;
  });
}

/**
 * Mors frekansını ayarlar (Hz).
 */
export function setFrequency(freq) {
  currentFrequency = freq;
}

// === DIŞA AKTARILAN FONKSİYONLAR ===

/**
 * Ses efektleri için HTML <audio> elemanlarını ön yükler.
 * DÜZELTME: Yeni sesler eklendi (İstek 1)
 */
export function initAudioEffects() {
  soundEffects["correct"] = document.getElementById("audioCorrect");
  soundEffects["wrong"] = document.getElementById("audioWrong");
  soundEffects["complete"] = document.getElementById("audioComplete");
  soundEffects["failed"] = document.getElementById("audioFailed");

  Object.values(soundEffects).forEach((audio) => {
    if (audio) {
      audio.load();
    }
  });
}

/**
 * Bir harf, kelime veya cümlenin mors kodunu çalar.
 * Boşluklar kelime arası gap olarak çalınır.
 */
export async function playMorseItem(item, MORSE_CODE) {
  const letters = item.split("");

  for (let i = 0; i < letters.length; i++) {
    const letter = letters[i];

    // Boşluk = kelimeler arası gap
    if (letter === " ") {
      await sleep(config.WORD_GAP);
      continue;
    }

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

    // Sonraki karakter boşluk değilse ve son harf değilse letter gap
    if (i < letters.length - 1 && letters[i + 1] !== " ") {
      await sleep(config.LETTER_GAP);
    }
  }
}

/**
 * Mors tuşuna basıldığında tonu başlatır.
 */
export function startTone() {
  const ctx = getAudioContext();
  if (!ctx) return Date.now();
  if (currentOscillator) {
    currentOscillator.stop();
  }

  currentOscillator = ctx.createOscillator();
  currentOscillator.type = "sine";
  currentOscillator.frequency.value = currentFrequency;
  currentOscillator.connect(gainNode);
  currentOscillator.start(ctx.currentTime);

  pressStartTime = Date.now();
  return pressStartTime;
}

/**
 * Mors tuşu bırakıldığında tonu durdurur ve vuruşu hesaplar.
 */
export function stopTone(pStartTime) {
  if (!currentOscillator) {
    return null;
  }

  currentOscillator.stop(getAudioContext().currentTime);
  currentOscillator = null;

  const pressDuration = Date.now() - pressStartTime;
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

/**
 * 'correct', 'wrong', 'complete' veya 'failed' ses efektini çalar.
 * @param {string} soundId - Çalınacak sesin ID'si
 */
export function playEffect(soundId) {
  const sound = soundEffects[soundId];
  if (sound) {
    sound.currentTime = 0;
    sound.play();
  }
}
