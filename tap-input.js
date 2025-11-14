// tap-input.js
// "Vur" modülünün tüm durum (state) ve zamanlayıcı mantığını yönetir.

import { COMMIT_LETTER_GAP_MS } from "./config.js";
import * as audio from "./audio.js";
import * as ui from "./ui.js";

let domElements;
let pressStartTime = 0;
let letterGapTimer = null;
let currentTappedSymbol = ""; // O an vurulan harf (örn: '.-')
let committedTappedSymbols = []; // Tamamlanan harfler (örn: ['...', '---'])

/**
 * TapInput modülünü başlatır ve DOM elementlerini alır.
 * @param {object} elements - ui.initDOMElements() tarafından döndürülen nesne
 */
export function initTapInput(elements) {
  domElements = elements;
}

/**
 * 'Vur' tuşuna basıldığında çalışır.
 * @param {Event} e - Olay
 */
export function handleTapDown(e) {
  e.preventDefault();
  if (letterGapTimer) {
    clearTimeout(letterGapTimer);
    letterGapTimer = null;
  }
  pressStartTime = audio.startTone();
}

/**
 * 'Vur' tuşu bırakıldığında çalışır.
 * @param {Event} e - Olay
 */
export function handleTapUp(e) {
  e.preventDefault();
  const symbol = audio.stopTone(pressStartTime);
  if (symbol) {
    currentTappedSymbol += symbol;
    domElements.tap.currentTapsDisplay.textContent = currentTappedSymbol;
  }
  // Harfi bitirme zamanlayıcısını başlat
  letterGapTimer = setTimeout(commitCurrentSymbol, COMMIT_LETTER_GAP_MS);
}

/**
 * 'Vur' tuşundan fare/parmak ayrıldığında çalışır.
 * @param {Event} e - Olay
 */
export function handleTapLeave(e) {
  if (pressStartTime === 0) return; // Zaten basılı değilse
  e.preventDefault();
  const symbol = audio.stopTone(pressStartTime);
  if (symbol) {
    currentTappedSymbol += symbol;
    domElements.tap.currentTapsDisplay.textContent = currentTappedSymbol;
  }
  letterGapTimer = setTimeout(commitCurrentSymbol, COMMIT_LETTER_GAP_MS);
  pressStartTime = 0;
}

/**
 * Zamanlayıcı dolduğunda 'mevcut harfi' 'tamamlanan kelime'ye ekler.
 */
export function commitCurrentSymbol() {
  if (currentTappedSymbol === "") return;
  committedTappedSymbols.push(currentTappedSymbol);
  domElements.tap.committedWordDisplay.textContent =
    committedTappedSymbols.join(" ");
  currentTappedSymbol = "";
  domElements.tap.currentTapsDisplay.textContent = "_";
  letterGapTimer = null;
}

/**
 * 'Temizle' butonuna basıldığında vuruşları sıfırlar.
 */
export function handleTapClear() {
  currentTappedSymbol = "";
  committedTappedSymbols = [];
  ui.clearTapUI(domElements);
  if (letterGapTimer) {
    clearTimeout(letterGapTimer);
    letterGapTimer = null;
  }
}

/**
 * 'Vur' modülü için tüm vuruşları ve zamanlayıcıları sıfırlar.
 */
export function resetTapState() {
  currentTappedSymbol = "";
  committedTappedSymbols = [];
  if (letterGapTimer) {
    clearTimeout(letterGapTimer);
    letterGapTimer = null;
  }
  pressStartTime = 0;
}

/**
 * 'Kontrol Et'e basıldığında bekleyen harfi onayla ve tüm kelimeyi döndür.
 * @returns {string} - Kullanıcının vurduğu tüm kod (örn: '...---...')
 */
export function getCommittedTaps() {
  if (letterGapTimer) {
    clearTimeout(letterGapTimer);
    commitCurrentSymbol();
  }
  return committedTappedSymbols.join("");
}
