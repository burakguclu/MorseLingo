// --------- YENİ SCRIPT.JS (Bölüm 2: TAM DERS MOTORU) ---------

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
  // Buraya alfabe eklenebilir
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

// --- 3. SES MOTORU (AUDIO ENGINE) ---
// (Önceki adımlardan birleştirilmiş ses motoru)

// 'Dinle' modülü için (Alıştırma 1'den)
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

// 'Vur' modülü için (Alıştırma 2'den)
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

  // Vurma ekranındaki vuruşları güncelle
  const currentTaps = tap_userTapsDisplay.textContent;
  tap_userTapsDisplay.textContent =
    currentTaps === "_" ? tappedSymbol : currentTaps + tappedSymbol;
}

// --- 4. VERİ YÖNETİMİ (localStorage) ---
function saveProgress() {
  // 'morseLingoProgress' adıyla not defterine (localStorage) kaydet
  localStorage.setItem("morseLingoProgress", JSON.stringify(userProgress));
  console.log("İlerleme kaydedildi:", userProgress);
}

function loadProgress() {
  // Kayıtlı notu (progress) bulmaya çalış
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
  // Tüm ekranları gizle
  screenMenu.classList.add("hidden");
  screenExercise.classList.add("hidden");
  screenComplete.classList.add("hidden");

  // İstenen ekranı göster
  const activeScreen = document.getElementById(screenId);
  if (activeScreen) {
    activeScreen.classList.remove("hidden");
  }
}

// --- 6. ARAYÜZ GÜNCELLEME (UI RENDER) ---
function renderMenuState() {
  // Hafızadan ilerlemeyi yükle
  loadProgress();

  // 'Ders 2' butonunu bul
  const btnLesson2 = document.getElementById("btnLesson2");

  // Eğer 'lesson2' kilidi açılmışsa
  if (userProgress.unlockedLessons.includes("lesson2")) {
    btnLesson2.classList.remove("locked");
  } else {
    btnLesson2.classList.add("locked");
  }
  // Buraya 'btnLesson3' vb. için kontroller eklenebilir
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

  // 1. Alıştırma ekranını göster
  showScreen("screenExercise");

  // 2. İlerleme çubuğunu sıfırla ve ilk soruyu göster
  updateProgress();
  showQuestion();
}

function showQuestion() {
  // 1. Mevcut soruyu plandan al
  const question = lessonPlan[currentQuestionIndex];

  // 2. Geri bildirim alanlarını temizle
  listen_pFeedback.textContent = "";
  tap_pFeedback.textContent = "";

  // 3. Soru tipine göre doğru modülü göster
  if (question.type === "listen") {
    moduleListen.classList.remove("hidden");
    moduleTap.classList.add("hidden");

    // 'Dinle' modülünü hazırla
    listen_inputGuess.value = "";
    listen_inputGuess.focus();

    // Sesi otomatik çal
    // Butonları geçici olarak kilitle (ses çalarken basılmasın)
    listen_btnPlaySound.disabled = true;
    listen_btnCheckAnswer.disabled = true;
    playSequence(MORSE_CODE[question.letter]).then(() => {
      listen_btnPlaySound.disabled = false;
      listen_btnCheckAnswer.disabled = false;
    });
  } else if (question.type === "tap") {
    moduleListen.classList.add("hidden");
    moduleTap.classList.remove("hidden");

    // 'Vur' modülünü hazırla
    tap_letterDisplay.textContent = question.letter;
    tap_userTapsDisplay.textContent = "_"; // Vuruşları sıfırla
  }
}

// Kullanıcı bir cevabı kontrol ettiğinde bu fonksiyon çalışır
function handleAnswerCheck(type) {
  const question = lessonPlan[currentQuestionIndex];
  let isCorrect = false;

  if (type === "listen") {
    const userGuess = listen_inputGuess.value.toUpperCase();
    if (userGuess === question.letter) {
      isCorrect = true;
    }
  } else if (type === "tap") {
    const correctCode = MORSE_CODE[question.letter];
    const userTaps = tap_userTapsDisplay.textContent;
    if (userTaps === correctCode) {
      isCorrect = true;
    }
  }

  // Geri bildirimi ver
  showFeedback(isCorrect, type);
}

function showFeedback(isCorrect, type) {
  const feedbackEl = type === "listen" ? listen_pFeedback : tap_pFeedback;

  if (isCorrect) {
    feedbackEl.textContent = "Doğru!";
    feedbackEl.className = "feedback-area feedback-correct";

    // Doğruysa, 1 saniye bekle ve sıradaki soruya geç
    setTimeout(nextQuestion, 1000);
  } else {
    feedbackEl.textContent = "Yanlış! Tekrar dene.";
    feedbackEl.className = "feedback-area feedback-wrong";

    // 'Vur' modülündeyse, yanlışsa vuruşları temizle
    if (type === "tap") {
      setTimeout(() => {
        tap_userTapsDisplay.textContent = "_";
        feedbackEl.textContent = "";
      }, 1500);
    }
  }
}

function nextQuestion() {
  currentQuestionIndex++; // Soru indeksini artır
  updateProgress(); // İlerleme çubuğunu güncelle

  if (currentQuestionIndex < totalQuestions) {
    // Hâlâ soru varsa, sıradakini göster
    showQuestion();
  } else {
    // Ders bittiyse
    completeLesson();
  }
}

function completeLesson() {
  console.log(`${currentLessonId} tamamlandı!`);

  // 1. 'lesson2'nin kilidini aç (eğer 'lesson1' bittiyse)
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

  // 2. İlerlemeyi tarayıcıya kaydet
  saveProgress();

  // 3. "Tamamlandı" ekranını göster
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

  // Alıştırma modüllerini bul
  moduleListen = document.getElementById("exerciseListen");
  moduleTap = document.getElementById("exerciseTap");

  // Menü butonları
  btnLesson1 = document.getElementById("btnLesson1");
  btnLesson2 = document.getElementById("btnLesson2");

  // Alıştırma ekranı butonları
  btnBackToMenu = document.getElementById("btnBackToMenu");
  progressFill = document.getElementById("progressFill");

  // Tamamlandı ekranı butonları
  completeMessage = document.getElementById("completeMessage");
  btnNextLesson = document.getElementById("btnNextLesson"); // (Bu butona henüz işlev atamadık, şimdilik duruyor)
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
    // Menüye dönmeden önce ana menünün durumunu güncelle (kilitleri kontrol et)
    renderMenuState();
    showScreen("screenMenu");
  });

  // Tamamlandı Ekranı
  btnMenuAfterComplete.addEventListener("click", () => {
    // Menüye dönmeden önce ana menünün durumunu güncelle (kilitleri kontrol et)
    renderMenuState();
    showScreen("screenMenu");
  });

  // 'Dinle' Modülü Olayları
  listen_btnPlaySound.addEventListener("click", () => {
    const question = lessonPlan[currentQuestionIndex];
    playSequence(MORSE_CODE[question.letter]);
  });
  listen_btnCheckAnswer.addEventListener("click", () =>
    handleAnswerCheck("listen")
  );

  // 'Vur' Modülü Olayları
  tap_btnMorseKey.addEventListener("mousedown", startTone);
  tap_btnMorseKey.addEventListener("mouseup", stopTone);
  tap_btnMorseKey.addEventListener("mouseleave", () => {
    if (currentOscillator) stopTone();
  });
  // Dokunmatik cihazlar için
  tap_btnMorseKey.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      startTone();
    },
    { passive: false }
  );
  tap_btnMorseKey.addEventListener(
    "touchend",
    (e) => {
      e.preventDefault();
      stopTone();
    },
    { passive: false }
  );

  tap_btnCheckAnswer.addEventListener("click", () => handleAnswerCheck("tap"));
  tap_btnClear.addEventListener("click", () => {
    tap_userTapsDisplay.textContent = "_";
  });

  // --- UYGULAMAYI BAŞLAT ---
  // Başlangıçta Ana Menüyü göster
  renderMenuState(); // Kilit durumlarını yükle
  showScreen("screenMenu"); // Ana menüyü göster
  console.log("Uygulama hazır!");
}
