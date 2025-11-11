// --------- YENİ SCRIPT.JS (Alıştırma 2) ---------

let audioCtx; // Ses stüdyomuz
const MORSE_TONE = 700; // 700Hz ton
let currentOscillator = null; // O anda çalan bir ses var mı?
let pressStartTime = 0; // Tuşa ne zaman bastığımızı kaydetmek için

// --- 1. Mors Zamanlama ve Eşik Değeri ---
// Eğer 150ms'den az basılı tutarsa "DIT", çok tutarsa "DAH" sayacağız
const DIT_DAH_THRESHOLD_MS = 150;

// --- 2. SÖZLÜĞÜMÜZ (Aynı) ---
const MORSE_LESSON_1 = {
  E: ".",
  T: "-",
  I: "..",
  A: ".-",
  N: "-.",
  M: "--",
};
const lessonKeys = Object.keys(MORSE_LESSON_1);

// --- 3. YENİ SES MOTORU (Bas-Çal, Bırak-Sustur) ---

// Sesi BAŞLATAN fonksiyon
function startTone() {
  // 1. Stüdyo yoksa kur
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // 2. Zaten çalan bir ses varsa (hata durumu), durdur.
  if (currentOscillator) {
    currentOscillator.stop();
  }

  // 3. Yeni enstrüman (oscillator) oluştur ve ayarla
  currentOscillator = audioCtx.createOscillator();
  currentOscillator.type = "sine";
  currentOscillator.frequency.value = MORSE_TONE;
  currentOscillator.connect(audioCtx.destination);

  // 4. Çalmaya başla ve başlama zamanını kaydet
  const now = audioCtx.currentTime;
  currentOscillator.start(now);
  pressStartTime = Date.now(); // Milisaniye cinsinden şu anki zaman
  console.log("Ses BAŞLADI");
}

// Sesi DURDURAN fonksiyon
// Bu fonksiyon aynı zamanda basma süresine göre DIT veya DAH olduğuna karar verir
function stopTone() {
  // 1. Çalan bir ses yoksa (hata durumu), bir şey yapma
  if (!currentOscillator) {
    return;
  }

  // 2. Sesi durdur
  const now = audioCtx.currentTime;
  currentOscillator.stop(now);
  currentOscillator = null; // "Çalan ses yok" diye işaretle

  // 3. Süreyi hesapla
  const pressDuration = Date.now() - pressStartTime;

  // 4. DIT mi DAH mı olduğuna karar ver
  let tappedSymbol = "";
  if (pressDuration < DIT_DAH_THRESHOLD_MS) {
    tappedSymbol = ".";
    console.log(`Vuruş: DIT (${pressDuration}ms)`);
  } else {
    tappedSymbol = "-";
    console.log(`Vuruş: DAH (${pressDuration}ms)`);
  }

  // 5. Kullanıcının vuruşunu ekrana ekle
  updateUserTaps(tappedSymbol);
}

// --- 4. HTML Elemanlarını Bulma ---
const keyButton = document.getElementById("btnMorseKey");
const checkButton = document.getElementById("btnCheckAnswer");
const clearButton = document.getElementById("btnClear");
const letterDisplay = document.getElementById("letterToTap");
const tapsDisplay = document.getElementById("userTapsDisplay");
const feedbackText = document.getElementById("pFeedback");

// --- 5. OYUN MANTIĞI ---

let currentLetter = ""; // Sorulan harf
let userTaps = ""; // Kullanıcının şu ana kadar vurdukları

// Yeni soru hazırla
function startNewQuestion() {
  // Rastgele harf seç
  const randomIndex = Math.floor(Math.random() * lessonKeys.length);
  currentLetter = lessonKeys[randomIndex];

  // Arayüzü güncelle
  letterDisplay.textContent = currentLetter;
  userTaps = ""; // Vuruşları sıfırla
  tapsDisplay.textContent = "_"; // Ekranda '_' göster
  feedbackText.textContent = "";
  feedbackText.className = "";

  console.log(
    `Yeni soru: ${currentLetter} (Doğru kod: ${MORSE_LESSON_1[currentLetter]})`
  );
}

// Kullanıcının vuruşlarını ekrana yaz
function updateUserTaps(symbol) {
  if (userTaps === "_") {
    // Eğer ekran boşsa ('_')
    userTaps = "";
  }
  userTaps += symbol;
  tapsDisplay.textContent = userTaps;
}

// --- 6. Olay Dinleyicileri (Event Listeners) ---

// MORS TUŞUNA BASILINCA (mousedown)
keyButton.addEventListener("mousedown", (e) => {
  e.preventDefault(); // Tarayıcının varsayılan 'sürükleme' işlemini engelle
  startTone();
});

// MORS TUŞU BIRAKILINCA (mouseup)
keyButton.addEventListener("mouseup", (e) => {
  e.preventDefault();
  stopTone();
});

// FARE TUŞTAN DIŞARI ÇIKARSA (kazara)
// (Kullanıcı basılı tutarken faresini butonun dışına çekerse sesin takılı kalmasını engeller)
keyButton.addEventListener("mouseleave", (e) => {
  if (currentOscillator) {
    console.log("Fare dışarı çıktı, ses durduruldu.");
    stopTone();
  }
});

// "Kontrol Et" Butonu
checkButton.addEventListener("click", () => {
  const correctCode = MORSE_LESSON_1[currentLetter];

  if (userTaps === correctCode) {
    // --- DOĞRU CEVAP ---
    feedbackText.textContent = "Harika! Doğru!";
    feedbackText.className = "feedback-correct";

    // 1.5 saniye bekle ve yeni soruya geç
    setTimeout(startNewQuestion, 1500);
  } else {
    // --- YANLIŞ CEVAP ---
    feedbackText.textContent = `Yanlış! (Doğrusu: ${correctCode})`;
    feedbackText.className = "feedback-wrong";

    // Yanlışı 2 saniye göster, sonra vuruşları temizle
    setTimeout(() => {
      userTaps = "";
      tapsDisplay.textContent = "_";
      feedbackText.textContent = "";
      feedbackText.className = "";
    }, 2000);
  }
});

// "Temizle" Butonu
clearButton.addEventListener("click", () => {
  userTaps = "";
  tapsDisplay.textContent = "_";
  feedbackText.textContent = "";
  feedbackText.className = "";
  console.log("Vuruşlar temizlendi.");
});

// --- Sayfa yüklendiğinde oyunu başlat ---
console.log("MorseLingo Alıştırma 2 Yüklendi!");
startNewQuestion();
