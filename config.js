// config.js
// Tüm sabit ayarları buradan yönetiyoruz.

// Ses Ayarları
export const MORSE_TONE = 700; // Hz

// Zamanlama Ayarları (Milisaniye)
const UNIT_DURATION_MS = 100;
export const DIT_DURATION = UNIT_DURATION_MS;
export const DAH_DURATION = UNIT_DURATION_MS * 3;
export const SYMBOL_GAP = UNIT_DURATION_MS; // Semboller arası (dit ve dah arası)
export const LETTER_GAP = UNIT_DURATION_MS * 3; // Harfler arası (bir kelime içinde)
export const DIT_DAH_THRESHOLD_MS = 150; // Vurma için dit/dah eşiği
export const COMMIT_LETTER_GAP_MS = 400; // Vurma için harfi bitirme süresi

// Oyun Ayarları
export const MAX_HEARTS = 5;
export const FEEDBACK_WRONG_DELAY = 3000; // Yanlış cevap mesajının ekranda kalma süresi
export const FEEDBACK_CORRECT_DELAY = 1000; // Doğru cevap sonrası bekleme süresi
export const FAIL_LESSON_DELAY = 2500; // Can bitince menüye dönme süresi
