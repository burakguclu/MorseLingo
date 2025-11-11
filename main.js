// main.js
// Uygulamanın ana beyni (Controller)

import * as config from "./config.js";
import * as audio from "./audio.js";
import * as ui from "./ui.js";

// --- 1. UYGULAMA DURUMU (STATE) ---
let MORSE_DATA = {};
let LESSON_DATA_MAP = {};
let domElements = {}; // Tüm HTML elemanları

let userProgress = {
  unlockedLessons: ["lesson1"],
};

let currentLesson = {
  id: null,
  plan: [],
  questionIndex: 0,
  totalQuestions: 0,
  isActive: false,
  hearts: config.MAX_HEARTS,
};

let nextLessonIdToStart = null;
let pressStartTime = 0; // 'Vur' modu için
let letterGapTimer = null;
let currentTappedSymbol = "";
let committedTappedSymbols = [];

// --- 2. VERİ YÖNETİMİ (İlerleme) ---

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

function resetProgress() {
  console.log("İlerleme sıfırlanıyor...");
  localStorage.removeItem("morseLingoProgress");
  userProgress = { unlockedLessons: ["lesson1"] };
  saveProgress();
  alert("İlerleme sıfırlandı.");
  window.location.reload();
}

// --- 3. DERS MANTIĞI (LESSON ENGINE) ---

function startLesson(lessonId) {
  console.log(`${lessonId} dersi başlatılıyor...`);

  currentLesson = {
    id: lessonId,
    plan: LESSON_DATA_MAP[lessonId].questions,
    questionIndex: 0,
    totalQuestions: LESSON_DATA_MAP[lessonId].questions.length,
    isActive: true,
    hearts: config.MAX_HEARTS,
  };

  ui.renderHearts(domElements, currentLesson.hearts);
  ui.showScreen(domElements, "screenExercise");
  ui.updateProgress(domElements, 0);

  showQuestion();
}

// ****** DÜZELTME BURADA ******
function showQuestion() {
  if (!currentLesson.isActive) return;

  const question = currentLesson.plan[currentLesson.questionIndex];

  // Geri bildirimleri temizle
  // HATA BURADAYDI: 'domElements.listen' yerine 'domElements' gönderilmeliydi.
  ui.showFeedback(domElements, true, "", "listen"); // DÜZELTİLDİ
  ui.showFeedback(domElements, true, "", "tap"); // DÜZELTİLDİ
  // ****** DÜZELTME SONU ******

  if (question.type === "listen") {
    ui.setupListenUI(domElements, question.item);

    // Sesi çal
    audio.playMorseItem(question.item, MORSE_DATA).then(() => {
      if (currentLesson.isActive) {
        domElements.listen.btnPlaySound.disabled = false;
        domElements.listen.btnCheckAnswer.disabled = false;
      }
    });
  } else if (question.type === "tap") {
    ui.setupTapUI(domElements, question.item);
    // 'Vur' modu değişkenlerini sıfırla
    currentTappedSymbol = "";
    committedTappedSymbols = [];
    if (letterGapTimer) {
      clearTimeout(letterGapTimer);
      letterGapTimer = null;
    }
  }
}

function handleAnswerCheck() {
  if (!currentLesson.isActive) return;

  const question = currentLesson.plan[currentLesson.questionIndex];
  const correctItem = question.item;
  const type = question.type;

  let isCorrect = false;
  let details = {};
  let feedbackMessage = "";

  if (type === "listen") {
    const userGuess = domElements.listen.input.value.toUpperCase();
    isCorrect = userGuess === correctItem;
    feedbackMessage = isCorrect
      ? "Doğru!"
      : `Yanlış! Doğru cevap '${correctItem}' olacaktı.`;
  } else if (type === "tap") {
    // Bekleyen harf varsa onayla
    if (letterGapTimer) {
      clearTimeout(letterGapTimer);
      commitCurrentSymbol();
    }

    // Doğru kodu hesapla
    let correctCode = correctItem
      .split("")
      .map((letter) => MORSE_DATA[letter])
      .join("");
    const userTaps = committedTappedSymbols.join("");

    isCorrect = userTaps === correctCode;

    if (isCorrect) {
      feedbackMessage = "Doğru!";
    } else {
      const userLetter =
        correctItem.length === 1 ? getLetterFromCode(userTaps) : "??";
      feedbackMessage = `Yanlış! Sen '${userTaps}' (${userLetter}) vurdun. Doğrusu '${correctCode}' (${correctItem}) olacaktı.`;
    }
  }

  // Geri bildirimi göster
  ui.showFeedback(domElements, isCorrect, feedbackMessage, type);

  // Sonucu işle
  if (isCorrect) {
    setTimeout(nextQuestion, config.FEEDBACK_CORRECT_DELAY);
  } else {
    loseLife(type);
  }
}

function nextQuestion() {
  if (!currentLesson.isActive) return;

  currentLesson.questionIndex++;
  ui.updateProgress(
    domElements,
    (currentLesson.questionIndex / currentLesson.totalQuestions) * 100
  );

  if (currentLesson.questionIndex < currentLesson.totalQuestions) {
    showQuestion();
  } else {
    completeLesson();
  }
}

function completeLesson() {
  currentLesson.isActive = false;
  audio.stopAllAudio();
  if (letterGapTimer) {
    clearTimeout(letterGapTimer);
    letterGapTimer = null;
  }

  console.log(`${currentLesson.id} tamamlandı!`);

  const lessonKeys = Object.keys(LESSON_DATA_MAP);
  const currentLessonIndex = lessonKeys.indexOf(currentLesson.id);
  nextLessonIdToStart = lessonKeys[currentLessonIndex + 1]; // Bir sonraki dersin ID'si

  let completeText = `${LESSON_DATA_MAP[currentLesson.id].title} tamamlandı!`;
  let hasNextLesson = false;

  if (nextLessonIdToStart) {
    hasNextLesson = true;
    if (!userProgress.unlockedLessons.includes(nextLessonIdToStart)) {
      userProgress.unlockedLessons.push(nextLessonIdToStart);
      const nextLessonNumber = currentLessonIndex + 2;
      completeText = `Harika! Ders ${nextLessonNumber}'nin kilidi açıldı!`;
    }
  } else {
    completeText = "Tebrikler! Tüm dersleri tamamladın!";
  }

  saveProgress();
  ui.showCompleteScreen(domElements, completeText, hasNextLesson);
}

function loseLife(type) {
  if (currentLesson.hearts <= 0) return;

  currentLesson.hearts--;
  console.log(`Can kaybedildi! Kalan: ${currentLesson.hearts}`);
  ui.renderHearts(domElements, currentLesson.hearts);

  // Yanlış cevap sonrası arayüzü temizleme zamanlayıcıları
  const clearDelay = config.FEEDBACK_WRONG_DELAY;
  if (currentLesson.hearts > 0) {
    if (type === "tap") {
      setTimeout(() => {
        if (currentLesson.isActive) {
          ui.clearTapUI(domElements);
          currentTappedSymbol = "";
          committedTappedSymbols = [];
          ui.showFeedback(domElements, false, "", "tap");
        }
      }, clearDelay);
    } else if (type === "listen") {
      setTimeout(() => {
        if (currentLesson.isActive) {
          domElements.listen.input.value = "";
          ui.showFeedback(domElements, false, "", "listen");
        }
      }, clearDelay);
    }
  }

  // Canlar bittiyse dersi bitir
  if (currentLesson.hearts <= 0) {
    failLesson(type);
  }
}

function failLesson(type) {
  console.log("Ders Başarısız! Canlar bitti.");
  currentLesson.isActive = false;
  audio.stopAllAudio();
  if (letterGapTimer) {
    clearTimeout(letterGapTimer);
    letterGapTimer = null;
  }

  ui.showFailScreen(domElements, type);

  setTimeout(() => {
    ui.renderLessonMenu(
      domElements,
      LESSON_DATA_MAP,
      userProgress,
      onLessonSelect
    );
    ui.showScreen(domElements, "screenMenu");
  }, config.FAIL_LESSON_DELAY);
}

// --- 4. 'VUR' MODU ÖZEL MANTIĞI ---

// Kodu harfe çevirir (sadece tek harfler için)
function getLetterFromCode(code) {
  for (const [letter, morseCode] of Object.entries(MORSE_DATA)) {
    if (morseCode === code) {
      return letter;
    }
  }
  return "??";
}

// 'Vur' tuşuna basma
function handleTapDown(e) {
  if (!currentLesson.isActive) return;
  e.preventDefault();
  // Zamanlayıcıyı temizle (yeni vuruş geldi)
  if (letterGapTimer) {
    clearTimeout(letterGapTimer);
    letterGapTimer = null;
  }
  pressStartTime = audio.startTone();
}

// 'Vur' tuşunu bırakma
function handleTapUp(e) {
  if (!currentLesson.isActive) return;
  e.preventDefault();
  const symbol = audio.stopTone(pressStartTime);
  if (symbol) {
    currentTappedSymbol += symbol;
    domElements.tap.currentTapsDisplay.textContent = currentTappedSymbol;
  }
  // Harfi bitirme zamanlayıcısını başlat
  letterGapTimer = setTimeout(commitCurrentSymbol, config.COMMIT_LETTER_GAP_MS);
}

// 'Vur' tuşundan fareyi çekme
function handleTapLeave(e) {
  if (!currentLesson.isActive) return;
  if (pressStartTime === 0) return; // Zaten basılı değilse
  e.preventDefault();
  const symbol = audio.stopTone(pressStartTime);
  if (symbol) {
    currentTappedSymbol += symbol;
    domElements.tap.currentTapsDisplay.textContent = currentTappedSymbol;
  }
  letterGapTimer = setTimeout(commitCurrentSymbol, config.COMMIT_LETTER_GAP_MS);
  pressStartTime = 0; // 'mouseleave' olduğu için 'mouseup' tetiklenmeyecek, sıfırla
}

// Vurulan harfi onayla (zamanlayıcı doldu)
function commitCurrentSymbol() {
  if (currentTappedSymbol === "") return;
  committedTappedSymbols.push(currentTappedSymbol);
  domElements.tap.committedWordDisplay.textContent =
    committedTappedSymbols.join(" ");
  currentTappedSymbol = "";
  domElements.tap.currentTapsDisplay.textContent = "_";
  letterGapTimer = null;
  console.log("Harf tamamlandı, dizi:", committedTappedSymbols);
}

// 'Temizle' butonu
function handleTapClear() {
  if (!currentLesson.isActive) return;
  currentTappedSymbol = "";
  committedTappedSymbols = [];
  ui.clearTapUI(domElements);
  if (letterGapTimer) {
    clearTimeout(letterGapTimer);
    letterGapTimer = null;
  }
}

// --- 5. BAĞLAMA VE BAŞLATMA ---

// Menüden ders seçildiğinde ne olacağı (UI'dan gelen geri bildirim)
function onLessonSelect(lessonId, isLocked) {
  if (isLocked) {
    alert("Bu ders kilitli! Önceki dersleri tamamlamalısın.");
  } else {
    startLesson(lessonId);
  }
}

// Olay dinleyicilerini (event listeners) bağla
function bindEventListeners() {
  domElements.btnResetProgress.addEventListener("click", () => {
    if (confirm("Emin misin? Tüm ilerlemen (açılan kilitler) silinecek!")) {
      resetProgress();
    }
  });

  domElements.btnBackToMenu.addEventListener("click", () => {
    currentLesson.isActive = false;
    audio.stopAllAudio();
    if (letterGapTimer) {
      clearTimeout(letterGapTimer);
      letterGapTimer = null;
    }
    ui.renderLessonMenu(
      domElements,
      LESSON_DATA_MAP,
      userProgress,
      onLessonSelect
    );
    ui.showScreen(domElements, "screenMenu");
  });

  domElements.btnMenuAfterComplete.addEventListener("click", () => {
    ui.renderLessonMenu(
      domElements,
      LESSON_DATA_MAP,
      userProgress,
      onLessonSelect
    );
    ui.showScreen(domElements, "screenMenu");
  });

  domElements.btnNextLesson.addEventListener("click", () => {
    if (nextLessonIdToStart) {
      startLesson(nextLessonIdToStart);
    } else {
      ui.renderLessonMenu(
        domElements,
        LESSON_DATA_MAP,
        userProgress,
        onLessonSelect
      );
      ui.showScreen(domElements, "screenMenu");
    }
  });

  // 'Dinle' Modülü
  domElements.listen.btnPlaySound.addEventListener("click", () => {
    if (!currentLesson.isActive) return;
    const question = currentLesson.plan[currentLesson.questionIndex];
    audio.playMorseItem(question.item, MORSE_DATA);
  });
  domElements.listen.btnCheckAnswer.addEventListener(
    "click",
    handleAnswerCheck
  );
  domElements.listen.input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleAnswerCheck();
  });

  // 'Vur' Modülü
  domElements.tap.btnMorseKey.addEventListener("mousedown", handleTapDown);
  domElements.tap.btnMorseKey.addEventListener("mouseup", handleTapUp);
  domElements.tap.btnMorseKey.addEventListener("mouseleave", handleTapLeave);
  domElements.tap.btnMorseKey.addEventListener("touchstart", handleTapDown, {
    passive: false,
  });
  domElements.tap.btnMorseKey.addEventListener("touchend", handleTapUp, {
    passive: false,
  });
  domElements.tap.btnCheckAnswer.addEventListener("click", handleAnswerCheck);
  domElements.tap.btnClear.addEventListener("click", handleTapClear);
}

// Uygulamayı Başlat
async function init() {
  console.log("MorseLingo Uygulaması Başlatılıyor (v8.1 - Hata Düzeltildi)");

  // 1. JSON verisini çek
  try {
    const response = await fetch("./data.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    MORSE_DATA = data.MORSE_CODE;
    LESSON_DATA_MAP = data.LESSON_DATA;
  } catch (e) {
    console.error(
      "Veri yüklenemedi! 'data.json' dosyasının olduğundan ve sunucunun çalıştığından emin olun.",
      e
    );
    document.body.innerHTML =
      "<h1>Hata: Veri yüklenemedi. Lütfen 'data.json' dosyasını kontrol edin ve yerel sunucu kullandığınızdan emin olun.</h1>";
    return;
  }

  // 2. DOM elemanlarını bul
  domElements = ui.initDOMElements();

  // 3. Olay dinleyicilerini bağla
  bindEventListeners();

  // 4. İlerlemeyi yükle
  loadProgress();

  // 5. İlk menüyü çiz ve göster
  ui.renderLessonMenu(
    domElements,
    LESSON_DATA_MAP,
    userProgress,
    onLessonSelect
  );
  ui.showScreen(domElements, "screenMenu");

  console.log("Uygulama hazır!");
}

// Uygulamayı çalıştır
init();
