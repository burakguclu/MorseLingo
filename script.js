// --------- YENİ SCRIPT.JS (Alıştırma 1) ---------

let audioCtx; // Ses stüdyomuz
const MORSE_TONE = 700; // 700Hz ton

// --- 1. Mors Zamanlama Kuralları (Milisaniye cinsinden) ---
// Bir "birim" (unit) belirleyelim. "Dit" 1 birimdir.
const UNIT_DURATION_MS = 100; // 100 milisaniye = 0.1 saniye
const DIT_DURATION = UNIT_DURATION_MS; // Kısa ses (1 birim)
const DAH_DURATION = UNIT_DURATION_MS * 3; // Uzun ses (3 birim)
const SYMBOL_GAP = UNIT_DURATION_MS; // Bir harfin içindeki sesler arası boşluk (örn: A'daki '.' ile '-' arası) (1 birim)
// Not: Harfler arası boşluk 3 birim, kelimeler arası 7 birimdir. Şimdilik gerek yok.

// --- 2. Temel Ses Çalma Fonksiyonumuz (Güncellendi) ---
// Artık süreyi milisaniye (ms) olarak alıyor
function playSound(durationInMs) {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  const oscillator = audioCtx.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.value = MORSE_TONE;
  oscillator.connect(audioCtx.destination);

  const now = audioCtx.currentTime;
  const durationInSeconds = durationInMs / 1000.0;

  oscillator.start(now);
  oscillator.stop(now + durationInSeconds);
}

// --- 3. JavaScript'te "Bekleme" (Uyku) Fonksiyonu ---
// Bu, sesler arasında beklememizi sağlayacak
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- 4. MORS KODU SÖZLÜĞÜ ---
// Duolingo gibi, sadece birkaç harfle başlayalım
const MORSE_LESSON_1 = {
  E: ".",
  T: "-",
  I: "..",
  A: ".-",
  N: "-.",
  M: "--",
};
// Öğreteceğimiz harflerin listesi
const lessonKeys = Object.keys(MORSE_LESSON_1);

// --- 5. ORKESTRA ŞEFİ: playSequence ---
// '.-' gibi bir kodu alıp sırayla çalar
// 'async' ve 'await' anahtar kelimeleri, 'sleep' fonksiyonunun bitmesini beklememizi sağlar.
async function playSequence(code) {
  // 'code' string'ini ('.-') tek tek karakterlere ayır ('['.', '-']')
  const symbols = code.split("");

  for (const symbol of symbols) {
    if (symbol === ".") {
      console.log("Çal: Dit");
      playSound(DIT_DURATION);
      await sleep(DIT_DURATION); // Sesin bitmesini bekle
    } else if (symbol === "-") {
      console.log("Çal: Dah");
      playSound(DAH_DURATION);
      await sleep(DAH_DURATION); // Sesin bitmesini bekle
    }

    // İki ses arasında (dit ve dah arası) boşluk ver
    console.log("Boşluk");
    await sleep(SYMBOL_GAP);
  }
}

// --- 6. HTML Elemanlarını Bulma ---
const playButton = document.getElementById("btnPlaySound");
const checkButton = document.getElementById("btnCheckAnswer");
const guessInput = document.getElementById("inputGuess");
const feedbackText = document.getElementById("pFeedback");

// --- 7. OYUN MANTIĞI ---

let currentLetter = ""; // Sorulan harfi burada tutacağız

// Yeni bir soru hazırlayan fonksiyon
function startNewQuestion() {
  // 1. Rastgele bir harf seç
  const randomIndex = Math.floor(Math.random() * lessonKeys.length);
  currentLetter = lessonKeys[randomIndex];

  // 2. Arayüzü temizle
  guessInput.value = ""; // Metin kutusunu boşalt
  feedbackText.textContent = ""; // Geri bildirimi temizle
  feedbackText.className = ""; // Geri bildirimin rengini (class) sıfırla

  console.log(`Yeni soru: ${currentLetter} (${MORSE_LESSON_1[currentLetter]})`);

  // 3. Sorunun sesini otomatik çal
  // (Kullanıcı 'Sesi Çal'a basmadan önce bir kez biz çalalım)
  playButton.disabled = true; // Ses çalarken butonları kilitle
  checkButton.disabled = true;

  playSequence(MORSE_LESSON_1[currentLetter]).then(() => {
    // 'playSequence' bitince butonları geri aç
    playButton.disabled = false;
    checkButton.disabled = false;
    guessInput.focus(); // Metin kutusuna odaklansın
  });
}

// "Sesi Çal" butonuna tıklanınca
playButton.addEventListener("click", () => {
  // Sadece mevcut sorunun kodunu tekrar çal
  playButton.disabled = true; // Çalarken kilitle
  playSequence(MORSE_LESSON_1[currentLetter]).then(() => {
    playButton.disabled = false; // Bitince aç
    guessInput.focus();
  });
});

// "Kontrol Et" butonuna tıklanınca
checkButton.addEventListener("click", () => {
  // Kullanıcının tahminini al ve büyük harfe çevir
  const userGuess = guessInput.value.toUpperCase();

  if (userGuess === currentLetter) {
    // --- DOĞRU CEVAP ---
    feedbackText.textContent = "Doğru!";
    feedbackText.className = "feedback-correct"; // Yeşil renk

    // 1.5 saniye bekle ve yeni soruya geç
    setTimeout(() => {
      startNewQuestion();
    }, 1500);
  } else {
    // --- YANLIŞ CEVAP ---
    feedbackText.textContent = "Yanlış! Tekrar dene.";
    feedbackText.className = "feedback-wrong"; // Kırmızı renk

    // Yanlış cevabı kutudan sil
    guessInput.value = "";
    guessInput.focus();
  }
});

// --- Sayfa ilk yüklendiğinde oyunu başlat ---
console.log("MorseLingo Alıştırma 1 Yüklendi!");
// Kullanıcının ilk tıklamasıyla 'audioCtx' başlatılabilsin diye
// ilk soruyu hemen sormak yerine, 'Sesi Çal' butonuna basmasını bekleyebiliriz.
// Şimdilik daha basit gidelim ve ilk soruyu biz başlatalım:
startNewQuestion();
