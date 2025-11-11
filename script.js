// --------- YENİ SCRIPT.JS (SADELEŞTİRİLMİŞ VERSİYON) ---------

let audioCtx; // Stüdyomuzu (AudioContext) burada tutacağız

// Fonksiyonumuzu sadeleştirdik.
// 1. parametre: frekans (ton), 2. parametre: süre (saniye)
function playSound(frequency, durationInSeconds) {
  // Eğer stüdyo (audioCtx) henüz uyanmadıysa (ilk tıklama), uyandıralım.
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  // 1. Enstrümanı (Oscillator) oluştur
  const oscillator = audioCtx.createOscillator();

  // 2. TONU AYARLA
  oscillator.type = "sine"; // Sesin dalga tipi
  oscillator.frequency.value = frequency; // Parametreden gelen frekansı (tonu) ayarla

  // 3. Hoparlöre bağla (Aradaki mikseri kaldırdık)
  oscillator.connect(audioCtx.destination);

  // 4. Sesi ne zaman başlatıp biteceğini planla
  const now = audioCtx.currentTime;
  oscillator.start(now); // Şimdi çalmaya başla
  oscillator.stop(now + durationInSeconds); // Tam olarak süre sonunda durdur
}

// --- AYARLARIMIZ ---
// Bu ayarları kolayca görebilmek için en üste taşıdık
const MORSE_TONE = 700; // İkisi için de KULLANILACAK TON (700Hz)
const DIT_DURATION = 0.1; // Kısa süre (100ms)
const DAH_DURATION = 0.3; // Uzun süre (300ms)

// --- HTML Butonlarını Bulma ve Olay Ekleme ---

// 1. HTML'deki 'btnDit' id'li butonu bul
const ditButton = document.getElementById("btnDit");

// 2. 'btnDit' butonuna tıklanınca ne olacağını söyle
ditButton.addEventListener("click", () => {
  console.log(`Çalınıyor: Ton=${MORSE_TONE}Hz, Süre=${DIT_DURATION}s`);
  // playSound fonksiyonunu 700Hz ton ve 0.1s süre ile çağır
  playSound(MORSE_TONE, DIT_DURATION);
});

// 3. HTML'deki 'btnDah' id'li butonu bul
const dahButton = document.getElementById("btnDah");

// 4. 'btnDah' butonuna tıklanınca ne olacağını söyle
dahButton.addEventListener("click", () => {
  console.log(`Çalınıyor: Ton=${MORSE_TONE}Hz, Süre=${DAH_DURATION}s`);
  // playSound fonksiyonunu 700Hz ton ve 0.3s süre ile çağır
  playSound(MORSE_TONE, DAH_DURATION);
});

console.log("MorseLingo beyni yüklendi! (Versiyon 2 - Sadeleştirilmiş)");
