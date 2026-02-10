// config.js
// Tüm sabit ayarları buradan yönetiyoruz.

// Ses Ayarları
export const MORSE_TONE = 700; // Hz

// Zamanlama Ayarları (Milisaniye)
const UNIT_DURATION_MS = 100;
export const DIT_DURATION = UNIT_DURATION_MS;
export const DAH_DURATION = UNIT_DURATION_MS * 3;
export const SYMBOL_GAP = UNIT_DURATION_MS;
export const LETTER_GAP = UNIT_DURATION_MS * 3;
export const WORD_GAP = UNIT_DURATION_MS * 7;
export const DIT_DAH_THRESHOLD_MS = 150;
export const COMMIT_LETTER_GAP_MS = 400;

// Oyun Ayarları
export const MAX_HEARTS = 5;
export const FEEDBACK_WRONG_DELAY = 3000; // 'Dinle' modu için varsayılan
export const FEEDBACK_CORRECT_DELAY = 1000;
export const FAIL_LESSON_DELAY = 2500;

// YENİ: 'Vur' modu için daha kısa geri bildirim süresi (İstek 2)
export const FEEDBACK_WRONG_DELAY_TAP = 1500; // 1.5 saniye

// OYUNLAŞTIRMA (GAMIFICATION) AYARLARI
export const XP_PER_ANSWER = 10;
export const XP_PER_LESSON_COMPLETE = 50;
