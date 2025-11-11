// --------- SCRIPT.JS (Son Hali: v6 - 'Sıradaki Ders' Butonu Düzeltildi) ---------

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
const SYMBOL_GAP = UNIT_DURATION_MS; // Semboller arası (dit ve dah arası)
const LETTER_GAP = UNIT_DURATION_MS * 3; // Harfler arası (bir kelime içinde)
const DIT_DAH_THRESHOLD_MS = 150;

// HTML Elemanları
let screenMenu, screenExercise, screenComplete;
let moduleListen, moduleTap;
let progressFill,
  btnBackToMenu,
  completeMessage,
  btnNextLesson,
  btnMenuAfterComplete;
let heartDisplaySpans = [];
let lessonListContainer, btnResetProgress;
let listen_instruction,
  listen_btnPlaySound,
  listen_input,
  listen_btnCheckAnswer,
  listen_pFeedback;
let tap_challenge,
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
let lessonActive = false;
const MAX_HEARTS = 5;
let currentHearts = 5;
let nextLessonIdToStart = null; // Gidilecek sıradaki dersi tutar

let userProgress = {
  unlockedLessons: ["lesson1"],
};

// --- 2. VERİ: MORS SÖZLÜĞÜ VE 20 DERSLİK PLAN ---

const MORSE_CODE = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
  0: "-----",
  1: ".----",
  2: "..---",
  3: "...--",
  4: "....-",
  5: ".....",
  6: "-....",
  7: "--...",
  8: "---..",
  9: "----.",
};

const LESSON_DATA = {
  // ID: { title: "...", content: "...", questions: [...] }
  lesson1: {
    title: "Ders 1: En Temeller",
    content: "E, T",
    questions: [
      { type: "listen", item: "E" },
      { type: "tap", item: "E" },
      { type: "listen", item: "T" },
      { type: "tap", item: "T" },
      { type: "listen", item: "E" },
      { type: "listen", item: "T" },
    ],
  },
  lesson2: {
    title: "Ders 2: Kısa Zıtlar",
    content: "I, M",
    questions: [
      { type: "listen", item: "I" },
      { type: "tap", item: "I" },
      { type: "listen", item: "M" },
      { type: "tap", item: "M" },
      { type: "listen", item: "T" },
      { type: "tap", item: "E" },
      { type: "listen", item: "M" },
    ],
  },
  lesson3: {
    title: "Ders 3: Uzun Zıtlar",
    content: "A, N",
    questions: [
      { type: "listen", item: "A" },
      { type: "tap", item: "N" },
      { type: "listen", item: "N" },
      { type: "tap", item: "A" },
      { type: "listen", item: "M" },
      { type: "tap", item: "I" },
      { type: "listen", item: "A" },
    ],
  },
  lesson4: {
    title: "Kelime Pratiği 1",
    content: "ME, IN, MAN, NET, EAT",
    questions: [
      { type: "listen", item: "IN" },
      { type: "tap", item: "IN" },
      { type: "listen", item: "EAT" },
      { type: "tap", item: "EAT" },
      { type: "listen", item: "MAN" },
      { type: "tap", item: "NET" },
      { type: "listen", item: "ME" },
    ],
  },
  lesson5: {
    title: "Ders 5: Sadece Noktalar/Çizgiler",
    content: "S, O",
    questions: [
      { type: "listen", item: "S" },
      { type: "tap", item: "S" },
      { type: "listen", item: "O" },
      { type: "tap", item: "O" },
      { type: "listen", item: "A" },
      { type: "tap", item: "S" },
      { type: "listen", item: "O" },
    ],
  },
  lesson6: {
    title: "Kelime Pratiği 2",
    content: "SO, SOS, SON, ON, NO, SOON",
    questions: [
      { type: "listen", item: "SOS" },
      { type: "tap", item: "SO" },
      { type: "listen", item: "ON" },
      { type: "tap", item: "SOS" },
      { type: "listen", item: "NO" },
      { type: "tap", item: "SOON" },
      { type: "listen", item: "SON" },
    ],
  },
  lesson7: {
    title: "Ders 7: Ayna Görüntüleri",
    content: "R, U, D, K",
    questions: [
      { type: "listen", item: "R" },
      { type: "tap", item: "U" },
      { type: "listen", item: "D" },
      { type: "tap", item: "K" },
      { type: "listen", item: "R" },
      { type: "tap", item: "D" },
      { type: "listen", item: "K" },
    ],
  },
  lesson8: {
    title: "Kelime Pratiği 3",
    content: "RUN, USE, RED, DARK, END",
    questions: [
      { type: "listen", item: "RUN" },
      { type: "tap", item: "RUN" },
      { type: "listen", item: "RED" },
      { type: "tap", item: "USE" },
      { type: "listen", item: "END" },
      { type: "tap", item: "DARK" },
    ],
  },
  lesson9: {
    title: "Ders 9: Başı Çizgili",
    content: "G, W, P, B",
    questions: [
      { type: "listen", item: "G" },
      { type: "tap", item: "W" },
      { type: "listen", item: "P" },
      { type: "tap", item: "B" },
      { type: "listen", item: "G" },
      { type: "tap", item: "P" },
    ],
  },
  lesson10: {
    title: "Kelime Pratiği 4",
    content: "GO, WE, BIG, UP, BED, WAR",
    questions: [
      { type: "listen", item: "GO" },
      { type: "tap", item: "WE" },
      { type: "listen", item: "UP" },
      { type: "tap", item: "BED" },
      { type: "listen", item: "WAR" },
      { type: "tap", item: "BIG" },
    ],
  },
  lesson11: {
    title: "Ders 11: Dört Vuruşlular",
    content: "H, V, F, L",
    questions: [
      { type: "listen", item: "H" },
      { type: "tap", item: "V" },
      { type: "listen", item: "F" },
      { type: "tap", item: "L" },
      { type: "listen", item: "H" },
      { type: "tap", item: "F" },
    ],
  },
  lesson12: {
    title: "Kelime Pratiği 5",
    content: "HAVE, FIVE, LIFE, FEEL",
    questions: [
      { type: "listen", item: "HAVE" },
      { type: "tap", item: "HAVE" },
      { type: "listen", item: "FIVE" },
      { type: "tap", item: "LIFE" },
      { type: "listen", item: "FEEL" },
      { type: "tap", item: "FEEL" },
    ],
  },
  lesson13: {
    title: "Ders 13: Geri Kalanlar 1",
    content: "J, Y",
    questions: [
      { type: "listen", item: "J" },
      { type: "tap", item: "J" },
      { type: "listen", item: "Y" },
      { type: "tap", item: "Y" },
      { type: "listen", item: "J" },
    ],
  },
  lesson14: {
    title: "Ders 14: Geri Kalanlar 2",
    content: "Q, Z",
    questions: [
      { type: "listen", item: "Q" },
      { type: "tap", item: "Q" },
      { type: "listen", item: "Z" },
      { type: "tap", item: "Z" },
      { type: "listen", item: "Q" },
    ],
  },
  lesson15: {
    title: "Ders 15: Geri Kalanlar 3",
    content: "X, C",
    questions: [
      { type: "listen", item: "X" },
      { type: "tap", item: "X" },
      { type: "listen", item: "C" },
      { type: "tap", item: "C" },
      { type: "listen", item: "X" },
    ],
  },
  lesson16: {
    title: "Kelime Pratiği 6 (Zor)",
    content: "YES, YOU, ZONE, QUIZ, FOX",
    questions: [
      { type: "listen", item: "YES" },
      { type: "tap", item: "YES" },
      { type: "listen", item: "ZONE" },
      { type: "tap", item: "FOX" },
      { type: "listen", item: "QUIZ" },
      { type: "tap", item: "QUIZ" },
    ],
  },
  lesson17: {
    title: "Ders 17: Rakamlar 1",
    content: "1, 2, 3, 4, 5",
    questions: [
      { type: "listen", item: "1" },
      { type: "tap", item: "2" },
      { type: "listen", item: "3" },
      { type: "tap", item: "4" },
      { type: "listen", item: "5" },
      { type: "tap", item: "1" },
    ],
  },
  lesson18: {
    title: "Ders 18: Rakamlar 2",
    content: "6, 7, 8, 9, 0",
    questions: [
      { type: "listen", item: "6" },
      { type: "tap", item: "7" },
      { type: "listen", item: "8" },
      { type: "tap", item: "9" },
      { type: "listen", item: "0" },
      { type: "tap", item: "6" },
    ],
  },
  lesson19: {
    title: "Kelime Pratiği 7 (Rakamlar)",
    content: "10, 25, 73, 198, 2024",
    questions: [
      { type: "listen", item: "10" },
      { type: "tap", item: "10" },
      { type: "listen", item: "25" },
      { type: "tap", item: "73" },
      { type: "listen", item: "198" },
      { type: "tap", item: "198" },
    ],
  },
  lesson20: {
    title: "Final Sınavı",
    content: "Tüm harf ve kelimelerle karışık",
    questions: [
      { type: "listen", item: "HELLO" },
      { type: "tap", item: "WORLD" },
      { type: "listen", item: "QUICK" },
      { type: "tap", item: "BROWN" },
      { type: "listen", item: "FOX" },
      { type: "tap", item: "JUMPS" },
      { type: "listen", item: "OVER" },
      { type: "tap", item: "LAZY" },
      { type: "listen", item: "DOG" },
      { type: "tap", item: "SOS" },
    ],
  },
};

// Kodu harfe çevirir (sadece tek harfler için)
function getLetterFromCode(code) {
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

async function playMorseItem(item) {
  const letters = item.split("");

  for (let i = 0; i < letters.length; i++) {
    const letter = letters[i];
    const code = MORSE_CODE[letter];
    if (!code) continue;

    const symbols = code.split("");

    for (let j = 0; j < symbols.length; j++) {
      const symbol = symbols[j];
      if (symbol === ".") {
        playSound(DIT_DURATION);
        await sleep(DIT_DURATION);
      } else if (symbol === "-") {
        playSound(DAH_DURATION);
        await sleep(DAH_DURATION);
      }
      if (j < symbols.length - 1) {
        await sleep(SYMBOL_GAP);
      }
    }

    if (i < letters.length - 1) {
      await sleep(LETTER_GAP);
    }
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
    saveProgress();
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

function renderLessonMenu() {
  loadProgress();

  lessonListContainer.innerHTML = ""; // Listeyi temizle

  const lessonKeys = Object.keys(LESSON_DATA);

  for (let i = 0; i < lessonKeys.length; i++) {
    const lessonId = lessonKeys[i];
    const lesson = LESSON_DATA[lessonId];
    const lessonNumber = i + 1;

    const button = document.createElement("button");
    button.id = lessonId;
    button.className = "lesson-button";

    const isLocked = !userProgress.unlockedLessons.includes(lessonId);
    if (isLocked) {
      button.classList.add("locked");
    }

    button.innerHTML = `
            <span class="lesson-number">${lessonNumber}</span>
            <div>
                <span class="lesson-title">${lesson.title}</span>
                <span class="lesson-content">${lesson.content}</span>
            </div>
        `;

    button.addEventListener("click", () => {
      if (isLocked) {
        alert("Bu ders kilitli! Önceki dersleri tamamlamalısın.");
      } else {
        startLesson(lessonId);
      }
    });

    lessonListContainer.appendChild(button);
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

  currentHearts = MAX_HEARTS;
  lessonActive = true;
  renderHearts();

  showScreen("screenExercise");
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

    listen_input.value = "";
    listen_input.focus();

    if (question.item.length > 1) {
      listen_input.placeholder = "Kelimeyi yaz";
      listen_instruction.textContent = "Duyduğun kelimeyi buraya yaz:";
    } else {
      listen_input.placeholder = "Harfi yaz";
      listen_instruction.textContent = "Duyduğun harfi buraya yaz:";
    }

    listen_btnPlaySound.disabled = true;
    listen_btnCheckAnswer.disabled = true;
    playMorseItem(question.item).then(() => {
      if (lessonActive) {
        listen_btnPlaySound.disabled = false;
        listen_btnCheckAnswer.disabled = false;
      }
    });
  } else if (question.type === "tap") {
    moduleListen.classList.add("hidden");
    moduleTap.classList.remove("hidden");

    tap_challenge.textContent = question.item;
    tap_userTapsDisplay.textContent = "_";
  }
}

function handleAnswerCheck(type) {
  if (!lessonActive) return;

  const question = lessonPlan[currentQuestionIndex];
  const correctItem = question.item;
  let isCorrect = false;
  let details = {};

  if (type === "listen") {
    const userGuess = listen_input.value.toUpperCase();
    details = { userGuess: userGuess, correctItem: correctItem };
    if (userGuess === correctItem) {
      isCorrect = true;
    }
  } else if (type === "tap") {
    let correctCode = "";
    const letters = correctItem.split("");
    for (const letter of letters) {
      correctCode += MORSE_CODE[letter];
    }

    const userTaps = tap_userTapsDisplay.textContent;
    details = {
      userTaps: userTaps,
      correctCode: correctCode,
      correctItem: correctItem,
    };
    if (userTaps === correctCode) {
      isCorrect = true;
    }
  }

  showFeedback(isCorrect, type, details);
}

function showFeedback(isCorrect, type, details) {
  if (!lessonActive) return;

  const feedbackEl = type === "listen" ? listen_pFeedback : tap_pFeedback;

  if (isCorrect) {
    feedbackEl.textContent = "Doğru!";
    feedbackEl.className = "feedback-area feedback-correct";
    setTimeout(nextQuestion, 1000);
  } else {
    // --- YANLIŞ CEVAP ---
    if (type === "listen") {
      feedbackEl.textContent = `Yanlış! Doğru cevap '${details.correctItem}' olacaktı.`;
    } else if (type === "tap") {
      if (details.correctItem.length > 1) {
        feedbackEl.textContent = `Yanlış! Sen '${details.userTaps}' vurdun. Doğrusu '${details.correctCode}' (${details.correctItem}) olacaktı.`;
      } else {
        const userLetter = getLetterFromCode(details.userTaps);
        feedbackEl.textContent = `Yanlış! Sen '${details.userTaps}' (${userLetter}) vurdun. Doğrusu '${details.correctCode}' (${details.correctItem}) olacaktı.`;
      }
    }

    feedbackEl.className = "feedback-area feedback-wrong";
    loseLife();

    const clearDelay = 3000;
    if (lessonActive && type === "tap") {
      setTimeout(() => {
        if (lessonActive) {
          tap_userTapsDisplay.textContent = "_";
          feedbackEl.textContent = "";
        }
      }, clearDelay);
    } else if (lessonActive && type === "listen") {
      setTimeout(() => {
        if (lessonActive) {
          listen_input.value = "";
          feedbackEl.textContent = "";
        }
      }, clearDelay);
    }
  }
}

function nextQuestion() {
  if (!lessonActive) return;

  currentQuestionIndex++;
  updateProgress();

  if (currentQuestionIndex < totalQuestions) {
    showQuestion();
  } else {
    completeLesson();
  }
}

// GÜNCELLENDİ: 'Sıradaki Derse Geç' butonunu yönetecek şekilde
function completeLesson() {
  lessonActive = false;
  console.log(`${currentLessonId} tamamlandı!`);

  const lessonKeys = Object.keys(LESSON_DATA);
  const currentLessonIndex = lessonKeys.indexOf(currentLessonId);

  // Sıradaki dersin ID'sini bul
  nextLessonIdToStart = lessonKeys[currentLessonIndex + 1];

  let completeText = `${LESSON_DATA[currentLessonId].title} tamamlandı!`;

  // Eğer bir sonraki ders varsa ('nextLessonIdToStart' tanımsız değilse)
  if (nextLessonIdToStart) {
    // Ve bu dersin kilidi zaten açık değilse
    if (!userProgress.unlockedLessons.includes(nextLessonIdToStart)) {
      userProgress.unlockedLessons.push(nextLessonIdToStart);
      const nextLessonNumber = currentLessonIndex + 2;
      completeText = `Harika! Ders ${nextLessonNumber}'nin kilidi açıldı!`;
    }
    // 'Sıradaki Derse Geç' butonunu göster
    btnNextLesson.classList.remove("hidden");
  } else {
    // Bu son dersti
    completeText = "Tebrikler! Tüm dersleri tamamladın!";
    btnNextLesson.classList.add("hidden"); // Butonu gizle
  }

  completeMessage.textContent = completeText;
  saveProgress();
  showScreen("screenComplete");
}

// --- 8. BAŞLATMA VE OLAY DİNLEYİCİLERİ (INIT) ---
window.addEventListener("DOMContentLoaded", init);

function init() {
  console.log("MorseLingo Uygulaması Başlatılıyor (v6 - Buton Düzeltildi)");

  // Ekranlar
  screenMenu = document.getElementById("screenMenu");
  screenExercise = document.getElementById("screenExercise");
  screenComplete = document.getElementById("screenComplete");

  // Modüller
  moduleListen = document.getElementById("exerciseListen");
  moduleTap = document.getElementById("exerciseTap");

  // Menü
  lessonListContainer = document.getElementById("lessonList");
  btnResetProgress = document.getElementById("btnResetProgress");

  // Alıştırma Ekranı
  btnBackToMenu = document.getElementById("btnBackToMenu");
  progressFill = document.getElementById("progressFill");
  heartDisplaySpans = document.querySelectorAll("#heartDisplay .heart");

  // Tamamlandı Ekranı
  completeMessage = document.getElementById("completeMessage");
  btnNextLesson = document.getElementById("btnNextLesson"); // Butonu bul
  btnMenuAfterComplete = document.getElementById("btnMenuAfterComplete");

  // 'Dinle' Modülü
  listen_instruction = document.getElementById("listen_instruction");
  listen_btnPlaySound = document.getElementById("listen_btnPlaySound");
  listen_input = document.getElementById("listen_input");
  listen_btnCheckAnswer = document.getElementById("listen_btnCheckAnswer");
  listen_pFeedback = document.getElementById("listen_pFeedback");

  // 'Vur' Modülü
  tap_challenge = document.getElementById("tap_challenge");
  tap_btnMorseKey = document.getElementById("tap_btnMorseKey");
  tap_userTapsDisplay = document.getElementById("tap_userTapsDisplay");
  tap_btnCheckAnswer = document.getElementById("tap_btnCheckAnswer");
  tap_btnClear = document.getElementById("tap_btnClear");
  tap_pFeedback = document.getElementById("tap_pFeedback");

  // --- Olay Dinleyicileri ---

  // Ana Menü
  btnResetProgress.addEventListener("click", () => {
    if (confirm("Emin misin? Tüm ilerlemen (açılan kilitler) silinecek!")) {
      resetProgress();
    }
  });

  // Alıştırma Ekranı
  btnBackToMenu.addEventListener("click", () => {
    lessonActive = false;
    renderLessonMenu();
    showScreen("screenMenu");
  });

  // Tamamlandı Ekranı
  btnMenuAfterComplete.addEventListener("click", () => {
    renderLessonMenu();
    showScreen("screenMenu");
  });

  // YENİ EKLENEN OLAY DİNLEYİCİSİ
  btnNextLesson.addEventListener("click", () => {
    if (nextLessonIdToStart) {
      // Kaydedilen sıradaki ders ID'si ile dersi başlat
      startLesson(nextLessonIdToStart);
    } else {
      // Hata durumu: Ana menüye dön
      renderLessonMenu();
      showScreen("screenMenu");
    }
  });

  // 'Dinle' Modülü
  listen_btnPlaySound.addEventListener("click", () => {
    if (!lessonActive) return;
    const question = lessonPlan[currentQuestionIndex];
    playMorseItem(question.item);
  });
  listen_btnCheckAnswer.addEventListener("click", () => {
    if (!lessonActive) return;
    handleAnswerCheck("listen");
  });
  listen_input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      if (!lessonActive) return;
      handleAnswerCheck("listen");
    }
  });

  // 'Vur' Modülü
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
  renderLessonMenu(); // Menü listesini oluştur
  showScreen("screenMenu"); // Ana menüyü göster
  console.log("Uygulama hazır! (v6 - Buton Düzeltildi)");
}

// --- 9. CAN SİSTEMİ FONKSİYONLARI ---

function renderHearts() {
  for (let i = 0; i < heartDisplaySpans.length; i++) {
    if (i < currentHearts) {
      heartDisplaySpans[i].classList.remove("lost");
    } else {
      heartDisplaySpans[i].classList.add("lost");
    }
  }
}

function loseLife() {
  if (currentHearts <= 0) return;
  currentHearts--;
  console.log(`Can kaybedildi! Kalan: ${currentHearts}`);
  renderHearts();
  if (currentHearts <= 0) {
    failLesson();
  }
}

function failLesson() {
  console.log("Ders Başarısız! Canlar bitti.");
  lessonActive = false;

  const question = lessonPlan[currentQuestionIndex];
  const feedbackEl =
    question.type === "listen" ? listen_pFeedback : tap_pFeedback;
  feedbackEl.textContent = "Canların bitti! Tekrar dene.";
  feedbackEl.className = "feedback-area feedback-failed";

  setTimeout(() => {
    renderLessonMenu();
    showScreen("screenMenu");
  }, 2500);
}

// --- 10. İLERLEME SIFIRLAMA FONKSİYONU ---

function resetProgress() {
  console.log("İlerleme sıfırlanıyor...");

  localStorage.removeItem("morseLingoProgress");

  userProgress = {
    unlockedLessons: ["lesson1"],
  };

  saveProgress();
  alert("İlerleme sıfırlandı.");
  window.location.reload();
}
