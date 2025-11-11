// --------- SCRIPT.JS (Bölüm 3: TAM SÜRÜM - Can Sistemi Dahil) ---------

// --- 1. GLOBAL DEĞİŞKENLER VE SABİTLER ---
// Audio
let audioCtx;
let currentOscillator = null;
const MORSE_TONE = 700;
let pressStartTime = 0;

// Zamanlama
const UNIT_DURATION_MS = 100;
const DIT_DURATION = UNIT_DURATION_MS;
const DAH_DURATION = UNIT_DURATION_MS * 3;
const SYMBOL_GAP = UNIT_DURATION_MS;
const DIT_DAH_THRESHOLD_MS = 150; // 'Vurma' alıştırması için eşik

// HTML Elemanları (Ekranlar)
let screenMenu, screenExercise, screenComplete;
let moduleListen, moduleTap; // Alıştırma modülleri

// HTML Elemanları (Genel)
let progressFill,
  btnBackToMenu,
  completeMessage,
  btnNextLesson,
  btnMenuAfterComplete;
let heartDisplaySpans = []; // Kalp <span> elemanlarını burada tutacağız

// HTML Elemanları (Menü)
let btnLesson1, btnLesson2;

// HTML Elemanları (Alıştırma 1: Dinle)
let listen_btnPlaySound,
  listen_inputGuess,
  listen_btnCheckAnswer,
  listen_pFeedback;

// HTML Elemanları (Alıştırma 2: Vur)
let tap_letterDisplay,
  tap_btnMorseKey,
  tap_userTapsDisplay,
  tap_btnCheckAnswer,
  tap_btnClear,
  tap_pFeedback;

// Ders Motoru Değişkenleri
let currentLessonId = null;
let lessonPlan = [];
let currentQuestionIndex = 0;
let totalQuestions = 0;
let lessonActive = false; // Dersin aktif olup olmadığını (can bitince false olur)
const MAX_HEARTS = 5;
let currentHearts = 5;

let userProgress = {
  unlockedLessons: ["lesson1"], // Başlangıçta sadece 'lesson1' açık
};

// --- 2. VERİ: MORS SÖZLÜĞÜ VE DERS PLANLARI ---

const MORSE_CODE = {
  E: ".",
  T: "-",
  I: "..",
  A: ".-",
  N: "-.",
  M: "--",
  S: "...",
  O: "---",
  R: ".-.",
  D: "-..",
};

const LESSON_DATA = {
  lesson1: {
    title: "Ders 1: Temel Harfler",
    questions: [
      { type: "listen", letter: "E" },
      { type: "listen", letter: "T" },
      { type: "tap", letter: "E" },
      { type: "tap", letter: "T" },
      { type: "listen", letter: "A" },
      { type: "tap", letter: "A" },
      { type: "listen", letter: "M" },
    ],
  },
  lesson2: {
    title: "Ders 2: Yeni Harfler",
    questions: [
      { type: "listen", letter: "S" },
      { type: "tap", letter: "S" },
      { type: "listen", letter: "O" },
      { type: "tap", letter: "O" },
      { type: "listen", letter: "R" },
      { type: "tap", letter: "R" },
    ],
  },
};

// YENİ EKLENEN YARDIMCI FONKSİYON
// Kodu harfe çevirir (örn: '.-' -> 'A')
function getLetterFromCode(code) {
  // MORSE_CODE sözlüğünde 'key' (harf) ve 'value' (kod) olarak döner
  for (const [letter, morseCode] of Object.entries(MORSE_CODE)) {
    if (morseCode === code) {
      return letter;
    }
  }
  return "??"; // Eşleşme bulunamazsa
}

// --- 3. SES MOTORU (AUDIO ENGINE) ---

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function playSequence(code) {
  const symbols = code.split("");
  for (const symbol of symbols) {
    if (symbol === ".") {
      playSound(DIT_DURATION);
      await sleep(DIT_DURATION);
    } else if (symbol === "-") {
      playSound(DAH_DURATION);
      await sleep(DAH_DURATION);
    }
    await sleep(SYMBOL_GAP);
  }
}

function startTone() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (currentOscillator) {
    currentOscillator.stop();
  }
  currentOscillator = audioCtx.createOscillator();
  currentOscillator.type = "sine";
  currentOscillator.frequency.value = MORSE_TONE;
  currentOscillator.connect(audioCtx.destination);
  currentOscillator.start(audioCtx.currentTime);
  pressStartTime = Date.now();
}

function stopTone() {
  if (!currentOscillator) {
    return;
  }
  currentOscillator.stop(audioCtx.currentTime);
  currentOscillator = null;
  const pressDuration = Date.now() - pressStartTime;
  const tappedSymbol = pressDuration < DIT_DAH_THRESHOLD_MS ? "." : "-";

  const currentTaps = tap_userTapsDisplay.textContent;
  tap_userTapsDisplay.textContent =
    currentTaps === "_" ? tappedSymbol : currentTaps + tappedSymbol;
}

// --- 4. VERİ YÖNETİMİ (localStorage) ---
function saveProgress() {
  localStorage.setItem("morseLingoProgress", JSON.stringify(userProgress));
  console.log("İlerleme kaydedildi:", userProgress);
}

function loadProgress() {
  const savedData = localStorage.getItem("morseLingoProgress");
  if (savedData) {
    userProgress = JSON.parse(savedData);
    console.log("İlerleme yüklendi:", userProgress);
  } else {
    console.log("Kayıtlı ilerleme bulunamadı, varsayılan kullanılıyor.");
  }
}

// --- 5. EKRAN YÖNETİMİ (ROUTER) ---
function showScreen(screenId) {
  screenMenu.classList.add("hidden");
  screenExercise.classList.add("hidden");
  screenComplete.classList.add("hidden");

  const activeScreen = document.getElementById(screenId);
  if (activeScreen) {
    activeScreen.classList.remove("hidden");
  }
}

// --- 6. ARAYÜZ GÜNCELLEME (UI RENDER) ---
function renderMenuState() {
  loadProgress();

  const btnLesson2 = document.getElementById("btnLesson2");

  if (userProgress.unlockedLessons.includes("lesson2")) {
    btnLesson2.classList.remove("locked");
  } else {
    btnLesson2.classList.add("locked");
  }
}

function updateProgress() {
  const percent = (currentQuestionIndex / totalQuestions) * 100;
  progressFill.style.width = `${percent}%`;
}

// --- 7. DERS MOTORU (LESSON ENGINE) ---
function startLesson(lessonId) {
  console.log(`${lessonId} dersi başlatılıyor...`);

  currentLessonId = lessonId;
  lessonPlan = LESSON_DATA[lessonId].questions;
  totalQuestions = lessonPlan.length;
  currentQuestionIndex = 0;

  // Canları ve ders durumunu sıfırla
  currentHearts = MAX_HEARTS;
  lessonActive = true;
  renderHearts(); // Kalp arayüzünü güncelle

  // 1. Alıştırma ekranını göster
  showScreen("screenExercise");

  // 2. İlerleme çubuğunu sıfırla ve ilk soruyu göster
  updateProgress();
  showQuestion();
}

function showQuestion() {
  const question = lessonPlan[currentQuestionIndex];

  listen_pFeedback.textContent = "";
  tap_pFeedback.textContent = "";

  if (question.type === "listen") {
    moduleListen.classList.remove("hidden");
    moduleTap.classList.add("hidden");

    listen_inputGuess.value = "";
    listen_inputGuess.focus();

    listen_btnPlaySound.disabled = true;
    listen_btnCheckAnswer.disabled = true;
    playSequence(MORSE_CODE[question.letter]).then(() => {
      if (lessonActive) {
        // Can bitmemişse butonları aç
        listen_btnPlaySound.disabled = false;
        listen_btnCheckAnswer.disabled = false;
      }
    });
  } else if (question.type === "tap") {
    moduleListen.classList.add("hidden");
    moduleTap.classList.remove("hidden");

    tap_letterDisplay.textContent = question.letter;
    tap_userTapsDisplay.textContent = "_";
  }
}

function handleAnswerCheck(type) {
  if (!lessonActive) return; // Can bittiyse kontrol etme

  const question = lessonPlan[currentQuestionIndex];
  let isCorrect = false;
  let details = {}; // Detayları tutmak için boş nesne

  if (type === "listen") {
    const userGuess = listen_inputGuess.value.toUpperCase();
    details = { userGuess: userGuess, correctLetter: question.letter }; // Detayları hazırla
    if (userGuess === question.letter) {
      isCorrect = true;
    }
  } else if (type === "tap") {
    const correctCode = MORSE_CODE[question.letter];
    const userTaps = tap_userTapsDisplay.textContent;
    details = {
      userTaps: userTaps,
      correctCode: correctCode,
      correctLetter: question.letter,
    }; // Detayları hazırla
    if (userTaps === correctCode) {
      isCorrect = true;
    }
  }

  showFeedback(isCorrect, type, details); // Detayları gönder
}

function showFeedback(isCorrect, type, details) {
  // 'details' parametresini ekle
  if (!lessonActive) return;

  const feedbackEl = type === "listen" ? listen_pFeedback : tap_pFeedback;

  if (isCorrect) {
    feedbackEl.textContent = "Doğru!";
    feedbackEl.className = "feedback-area feedback-correct";

    setTimeout(nextQuestion, 1000); // 1 saniye sonra sıradaki soru
  } else {
    // --- YANLIŞ CEVAP (DETAYLI GERİ BİLDİRİM) ---

    if (type === "listen") {
      // 'Dinle' alıştırması için daha iyi geri bildirim
      feedbackEl.textContent = `Yanlış! Doğru cevap '${details.correctLetter}' olacaktı.`;
    } else if (type === "tap") {
      // 'Vur' alıştırması için detaylı geri bildirim
      const userLetter = getLetterFromCode(details.userTaps);
      feedbackEl.textContent = `Yanlış! Sen '${details.userTaps}' (${userLetter}) vurdun. Doğrusu '${details.correctCode}' (${details.correctLetter}) olacaktı.`;
    }

    feedbackEl.className = "feedback-area feedback-wrong";

    loseLife(); // Can kaybet

    // Hatanın okunması için bekleme süresini artır
    if (lessonActive && type === "tap") {
      setTimeout(() => {
        if (lessonActive) {
          tap_userTapsDisplay.textContent = "_"; // Vuruşları temizle
          feedbackEl.textContent = ""; // Mesajı temizle
        }
      }, 3000); // Süreyi 1.5s'den 3s'ye çıkar
    } else if (lessonActive && type === "listen") {
      // Dinleme alıştırmasında da yanlışsa alanı temizle
      setTimeout(() => {
        if (lessonActive) {
          listen_inputGuess.value = ""; // Metin kutusunu temizle
          feedbackEl.textContent = ""; // Mesajı temizle
        }
      }, 3000);
    }
  }
}

function nextQuestion() {
  if (!lessonActive) return; // Can bittiyse devam etme

  currentQuestionIndex++;
  updateProgress();

  if (currentQuestionIndex < totalQuestions) {
    showQuestion();
  } else {
    completeLesson();
  }
}

function completeLesson() {
  lessonActive = false; // Dersi bitir, girdileri kapa
  console.log(`${currentLessonId} tamamlandı!`);

  if (
    currentLessonId === "lesson1" &&
    !userProgress.unlockedLessons.includes("lesson2")
  ) {
    userProgress.unlockedLessons.push("lesson2");
    completeMessage.textContent =
      "Ders 1 tamamlandı! Ders 2'nin kilidi açıldı!";
  } else {
    completeMessage.textContent = `${LESSON_DATA[currentLessonId].title} tamamlandı!`;
  }

  saveProgress();
  showScreen("screenComplete");
}

// --- 8. BAŞLATMA VE OLAY DİNLEYİCİLERİ (INIT) ---
window.addEventListener("DOMContentLoaded", init);

function init() {
  console.log("MorseLingo Uygulaması Başlatılıyor...");

  // Ekranları bul
  screenMenu = document.getElementById("screenMenu");
  screenExercise = document.getElementById("screenExercise");
  screenComplete = document.getElementById("screenComplete");

  // Alıştırma modülleri
  moduleListen = document.getElementById("exerciseListen");
  moduleTap = document.getElementById("exerciseTap");

  // Menü butonları
  btnLesson1 = document.getElementById("btnLesson1");
  btnLesson2 = document.getElementById("btnLesson2");

  // Alıştırma ekranı
  btnBackToMenu = document.getElementById("btnBackToMenu");
  progressFill = document.getElementById("progressFill");
  heartDisplaySpans = document.querySelectorAll("#heartDisplay .heart"); // Kalpleri bul

  // Tamamlandı ekranı
  completeMessage = document.getElementById("completeMessage");
  btnNextLesson = document.getElementById("btnNextLesson");
  btnMenuAfterComplete = document.getElementById("btnMenuAfterComplete");

  // 'Dinle' modülü elemanları
  listen_btnPlaySound = document.getElementById("listen_btnPlaySound");
  listen_inputGuess = document.getElementById("listen_inputGuess");
  listen_btnCheckAnswer = document.getElementById("listen_btnCheckAnswer");
  listen_pFeedback = document.getElementById("listen_pFeedback");

  // 'Vur' modülü elemanları
  tap_letterDisplay = document.getElementById("tap_letterToTap");
  tap_btnMorseKey = document.getElementById("tap_btnMorseKey");
  tap_userTapsDisplay = document.getElementById("tap_userTapsDisplay");
  tap_btnCheckAnswer = document.getElementById("tap_btnCheckAnswer");
  tap_btnClear = document.getElementById("tap_btnClear");
  tap_pFeedback = document.getElementById("tap_pFeedback");

  // --- Olay Dinleyicileri (Clicks, Taps) ---

  // Ana Menü
  btnLesson1.addEventListener("click", () => startLesson("lesson1"));
  btnLesson2.addEventListener("click", () => {
    if (!btnLesson2.classList.contains("locked")) {
      startLesson("lesson2");
    } else {
      alert("Bu ders kilitli! Önce Ders 1'i tamamlamalısın.");
    }
  });

  // Alıştırma Ekranı
  btnBackToMenu.addEventListener("click", () => {
    lessonActive = false; // Dersten çıkılıyor
    renderMenuState();
    showScreen("screenMenu");
  });

  // Tamamlandı Ekranı
  btnMenuAfterComplete.addEventListener("click", () => {
    renderMenuState();
    showScreen("screenMenu");
  });

  // 'Dinle' Modülü Olayları
  listen_btnPlaySound.addEventListener("click", () => {
    if (!lessonActive) return; // Can bittiyse çalışma
    const question = lessonPlan[currentQuestionIndex];
    playSequence(MORSE_CODE[question.letter]);
  });
  listen_btnCheckAnswer.addEventListener("click", () => {
    if (!lessonActive) return;
    handleAnswerCheck("listen");
  });

  // 'Vur' Modülü Olayları
  tap_btnMorseKey.addEventListener("mousedown", (e) => {
    if (!lessonActive) return;
    e.preventDefault();
    startTone();
  });
  tap_btnMorseKey.addEventListener("mouseup", (e) => {
    if (!lessonActive) return;
    e.preventDefault();
    stopTone();
  });
  tap_btnMorseKey.addEventListener("mouseleave", (e) => {
    if (!lessonActive) return;
    if (currentOscillator) stopTone();
  });
  tap_btnMorseKey.addEventListener(
    "touchstart",
    (e) => {
      if (!lessonActive) return;
      e.preventDefault();
      startTone();
    },
    { passive: false }
  );
  tap_btnMorseKey.addEventListener(
    "touchend",
    (e) => {
      if (!lessonActive) return;
      e.preventDefault();
      stopTone();
    },
    { passive: false }
  );

  tap_btnCheckAnswer.addEventListener("click", () => {
    if (!lessonActive) return;
    handleAnswerCheck("tap");
  });
  tap_btnClear.addEventListener("click", () => {
    if (!lessonActive) return;
    tap_userTapsDisplay.textContent = "_";
  });

  // --- UYGULAMAYI BAŞLAT ---
  renderMenuState(); // Kilit durumlarını yükle
  showScreen("screenMenu"); // Ana menüyü göster
  console.log("Uygulama hazır! (v3 - Can Sistemi Aktif)");
}

// --- 9. CAN SİSTEMİ FONKSİYONLARI ---

// Kalp arayüzünü güncelleyen fonksiyon
function renderHearts() {
  for (let i = 0; i < heartDisplaySpans.length; i++) {
    if (i < currentHearts) {
      heartDisplaySpans[i].classList.remove("lost");
    } else {
      heartDisplaySpans[i].classList.add("lost");
    }
  }
}

// Can kaybetme mantığı
function loseLife() {
  if (currentHearts <= 0) return;

  currentHearts--;
  console.log(`Can kaybedildi! Kalan: ${currentHearts}`);
  renderHearts();

  if (currentHearts <= 0) {
    failLesson();
  }
}

// Ders başarısız olma fonksiyonu
function failLesson() {
  console.log("Ders Başarısız! Canlar bitti.");
  lessonActive = false; // Tüm girdileri durdur

  const question = lessonPlan[currentQuestionIndex];
  const feedbackEl =
    question.type === "listen" ? listen_pFeedback : tap_pFeedback;

  feedbackEl.textContent = "Canların bitti! Tekrar dene.";
  feedbackEl.className = "feedback-area feedback-failed";

  setTimeout(() => {
    renderMenuState();
    showScreen("screenMenu");
  }, 2500);
}
