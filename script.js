// 1. Stüdyomuzu (AudioContext) başlatalım.
// Tarayıcılar, kullanıcı bir yere tıklamadan sesi başlatmanızı engeller.
// Biz bu yüzden stüdyoyu "uykuda" başlatıp, tıklama olunca "uyandıracağız".
let audioCtx;

// 2. Ses üretme motorumuz (fonksiyonumuz)
// Bu fonksiyon, ne kadar süre (duration) ses çalacağımızı parametre alır.
function playSound(durationInSeconds) {
  // Eğer stüdyo (audioCtx) henüz uyanmadıysa (ilk tıklama), uyandıralım.
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  // 1. Enstrümanı (Oscillator) oluştur
  const oscillator = audioCtx.createOscillator();

  // 2. Ses Düğmesini (GainNode) oluştur (sesi aniden kesmek için)
  const gainNode = audioCtx.createGain();

  // 3. Enstrümanın ayarlarını yap
  oscillator.type = "sine"; // Sesin dalga tipi (sinüs, en yumuşak sestir)
  oscillator.frequency.setValueAtTime(700, audioCtx.currentTime); // Frekans (Hz). 700Hz mors için idealdir.

  // 4. Bağlantıları yap:
  // Enstrüman -> Ses Düğmesi -> Hoparlör
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  // 5. Sesi başlat ve bitir
  const now = audioCtx.currentTime;

  gainNode.gain.setValueAtTime(1, now); // Sesi aç
  oscillator.start(now); // Çalmaya başla

  // Sesi ne zaman durduracağımızı planla
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + durationInSeconds); // Sesi yavaşça kıs (tıkırtıyı engeller)
  oscillator.stop(now + durationInSeconds); // Belirtilen süre sonunda enstrümanı sustur
}

// 3. HTML'deki butonlarımızı bulalım
const ditButton = document.getElementById("btnDit");
const dahButton = document.getElementById("btnDah");

// 4. Mors Alfabesi zamanlama kuralları (saniye cinsinden)
const DIT_DURATION = 0.1; // Kısa ses (100ms)
const DAH_DURATION = 0.3; // Uzun ses (300ms - kural: Dit'in 3 katı)

// 5. Butonlara tıklama olaylarını (event) ekleyelim
ditButton.addEventListener("click", () => {
  console.log("Dit çalınıyor...");
  playSound(DIT_DURATION);
});

dahButton.addEventListener("click", () => {
  console.log("Dah çalınıyor...");
  playSound(DAH_DURATION);
});

console.log("MorseLingo beyni yüklendi!");
