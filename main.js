// main.js
// Uygulamanın ana beyni (Orkestra Şefi)

import * as config from "./config.js";
import * as ui from "./ui.js";
import * as audio from "./audio.js";
import * as auth from "./auth.js";
import * as store from "./store.js";
import * as lesson from "./lesson.js";
import * as tapInput from "./tap-input.js";
import { initToast, showToast } from "./toast.js";
import { initSettings, showOnboarding, getSettings } from "./settings.js";

// --- 1. UYGULAMA DURUMU (STATE) ---
let MORSE_DATA = {};
let LESSON_DATA_MAP = {};
let CATEGORIES_DATA = [];
let domElements = {};

// --- 2. AUTH GERİ BİLDİRİMLERİ (Callbacks) ---

async function onUserLogin(user) {
  store.setCurrentUser(user);
  await store.loadProgress();

  let userProgress = store.getUserProgress();
  ui.showUserUI(domElements, user, userProgress);
  ui.renderLessonMenu(
    domElements,
    LESSON_DATA_MAP,
    CATEGORIES_DATA,
    userProgress,
    onLessonSelect,
  );
  updateMenuProgressUI(userProgress);
  updateReviewCardUI();
  ui.showScreen(domElements, "screenMenu");

  showToast(`Hoş geldin, ${userProgress.username || "Kullanıcı"}!`, "success");

  // Günlük tekrar önerisi — zayıf harfler varsa
  const weakLetters = store.getWeakLetters(3);
  if (weakLetters.length >= 2) {
    const letterList = weakLetters.map((w) => w.letter).join(", ");
    setTimeout(() => {
      showToast(
        `📝 Günlük tekrar: ${letterList} harflerini tekrar et!`,
        "warning",
      );
    }, 2500);
  }

  // İlk kullanıcı için onboarding
  showOnboarding();
}

function onUserLogout() {
  store.setCurrentUser(null);
  // DÜZELTME: getNewUserProgress parametreleri
  let userProgress = store.getNewUserProgress(null, null);

  ui.showUserUI(domElements, null, userProgress);
  ui.showScreen(domElements, "screenLogin");
}

function onLessonSelect(lessonId, isLocked) {
  if (isLocked) {
    showToast("Bu ders kilitli! Önceki dersleri tamamlamalısın.", "warning");
  } else {
    lesson.startLesson(lessonId);
  }
}

/**
 * Tekrar kartını günceller (zayıf harfleri gösterir).
 */
function updateReviewCardUI() {
  const weakLetters = store.getWeakLetters(6);
  ui.renderReviewCard(domElements, weakLetters, MORSE_DATA);
}

/**
 * Menü ilerleme çubuğunu günceller.
 */
function updateMenuProgressUI(userProgress) {
  const totalLessons = Object.keys(LESSON_DATA_MAP).length;
  // Kilidi açılmış ders sayısından 1 çıkar (lesson1 zaten açık başlar)
  // Aslında completedCount = unlocked - 1 (mevcut başladığın hariç) ama
  // daha doğrusu: tamamlanmış = unlocked.length - 1 (eğer unlocked > totalLessons ise totalLessons)
  const completedCount = Math.min(
    userProgress.unlockedLessons.length - 1,
    totalLessons,
  );
  ui.updateMenuProgress(domElements, Math.max(0, completedCount), totalLessons);
}

// --- 3. OLAY DİNLEYİCİLERİNİ BAĞLAMA ---

function bindEventListeners() {
  // Giriş/Kayıt Linkleri
  domElements.login.linkToRegister.addEventListener("click", () => {
    ui.showScreen(domElements, "screenRegister");
    ui.showAuthError(domElements, "login", "");
    domElements.loginForm.reset();
    domElements.registerForm.reset();
  });
  domElements.register.linkToLogin.addEventListener("click", () => {
    ui.showScreen(domElements, "screenLogin");
    ui.showAuthError(domElements, "register", "");
    domElements.registerForm.reset();
    domElements.loginForm.reset();
  });

  // Auth Formları ve Butonları
  domElements.loginForm.addEventListener("submit", auth.handleEmailLogin);
  domElements.registerForm.addEventListener("submit", auth.handleEmailRegister);
  domElements.login.btnLoginGoogle.addEventListener(
    "click",
    auth.handleGoogleLogin,
  );
  domElements.btnLogout.addEventListener("click", auth.handleLogout);

  // Menü Butonları
  domElements.btnResetProgress.addEventListener("click", async () => {
    await store.resetProgress();
    let userProgress = store.getUserProgress();
    ui.renderLessonMenu(
      domElements,
      LESSON_DATA_MAP,
      CATEGORIES_DATA,
      userProgress,
      onLessonSelect,
    );
    updateMenuProgressUI(userProgress);
    updateReviewCardUI();
  });

  // Tekrar Dersi Butonu
  domElements.btnStartReview.addEventListener("click", () => {
    lesson.startReviewLesson();
  });

  // Ders Girişi "Derse Başla" Butonu
  domElements.btnStartExercise.addEventListener("click", () => {
    lesson.beginExercise();
  });

  // Lider Tablosu Butonu (Menü'de)
  domElements.btnLeaderboard.addEventListener("click", async () => {
    domElements.leaderboard.list.innerHTML =
      '<li id="leaderboardLoading">Yükleniyor...</li>';
    ui.showScreen(domElements, "screenLeaderboard");
    const data = await store.fetchLeaderboard();
    ui.renderLeaderboard(domElements, data);
  });

  // Lider Tablosu Geri Butonu
  domElements.leaderboard.btnBack.addEventListener("click", () => {
    ui.showScreen(domElements, "screenMenu");
  });

  // Alıştırma Butonları
  domElements.btnBackToMenu.addEventListener("click", lesson.exitLesson);

  // Tamamlandı Ekranı Butonları
  domElements.btnMenuAfterComplete.addEventListener("click", lesson.exitLesson);
  domElements.btnNextLesson.addEventListener("click", lesson.startNextLesson);

  // 'Dinle' Modülü Olayları
  domElements.listen.btnPlaySound.addEventListener(
    "click",
    lesson.handlePlaySound,
  );
  domElements.listen.btnCheckAnswer.addEventListener(
    "click",
    lesson.handleAnswerCheck,
  );
  domElements.listen.input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") lesson.handleAnswerCheck(e);
  });

  // 'Vur' Modülü Olayları
  domElements.tap.btnMorseKey.addEventListener(
    "mousedown",
    tapInput.handleTapDown,
  );
  domElements.tap.btnMorseKey.addEventListener("mouseup", tapInput.handleTapUp);
  domElements.tap.btnMorseKey.addEventListener(
    "mouseleave",
    tapInput.handleTapLeave,
  );
  domElements.tap.btnMorseKey.addEventListener(
    "touchstart",
    tapInput.handleTapDown,
    { passive: false },
  );
  domElements.tap.btnMorseKey.addEventListener(
    "touchend",
    tapInput.handleTapUp,
    { passive: false },
  );
  domElements.tap.btnCheckAnswer.addEventListener(
    "click",
    lesson.handleAnswerCheck,
  );
  domElements.tap.btnClear.addEventListener("click", tapInput.handleTapClear);

  // Flashcard Modülü Olayları
  domElements.flashcard.btnPlaySound.addEventListener(
    "click",
    lesson.handlePlaySound,
  );
  domElements.flashcard.btnContinue.addEventListener(
    "click",
    lesson.handleFlashcardContinue,
  );

  // Çoktan Seçmeli (MCQ) Modülü Olayları
  domElements.mcq.btnPlaySound.addEventListener(
    "click",
    lesson.handlePlaySound,
  );

  // İpucu & Mors Tablosu Olayları
  domElements.btnHint.addEventListener("click", lesson.handleHintRequest);
  domElements.btnMorseTable.addEventListener(
    "click",
    lesson.handleMorseTableOpen,
  );
  domElements.btnCloseMorseTable.addEventListener(
    "click",
    lesson.handleMorseTableClose,
  );
  // Modal dışına tıklayınca kapat
  domElements.morseTableModal.addEventListener("click", (e) => {
    if (e.target === domElements.morseTableModal) {
      lesson.handleMorseTableClose();
    }
  });
}

// --- 4. UYGULAMAYI BAŞLATMA ---

async function init() {
  // 0. Toast sistemini başlat
  initToast();

  // 1. DOM elemanlarını bul
  domElements = ui.initDOMElements(config.MAX_HEARTS);

  // 2. Ses efektlerini DOM'a bağla
  audio.initAudioEffects();

  // 3. JSON verisini çek
  try {
    const response = await fetch("./data.json");
    if (!response.ok) throw new Error(`HTTP hatası! ${response.status}`);
    const data = await response.json();
    MORSE_DATA = data.MORSE_CODE;
    LESSON_DATA_MAP = data.LESSON_DATA;
    CATEGORIES_DATA = data.CATEGORIES || [];
  } catch (e) {
    console.error("Veri yüklenemedi!", e);
    hideLoadingScreen();
    document.body.innerHTML = "<h1>Hata: data.json yüklenemedi.</h1>";
    return;
  }

  // 4. Modülleri DOM ve Veri ile başlat
  auth.initAuth(domElements);
  store.initStore(domElements);
  lesson.initLesson(
    domElements,
    MORSE_DATA,
    LESSON_DATA_MAP,
    CATEGORIES_DATA,
    () => {
      updateReviewCardUI();
      const userProgress = store.getUserProgress();
      updateMenuProgressUI(userProgress);
    },
  );
  tapInput.initTapInput(domElements);

  // 5. Ayarları başlat (volume, frequency, dark mode)
  initSettings({
    onVolumeChange: (vol) => audio.setVolume(vol),
    onFrequencyChange: (freq) => audio.setFrequency(freq),
  });

  // 6. Olay dinleyicilerini bağla
  bindEventListeners();

  // 7. Auth durumunu dinlemeye başla
  auth.listenForAuthChanges(onUserLogin, onUserLogout);

  // 8. Loading ekranını gizle
  hideLoadingScreen();
}

function hideLoadingScreen() {
  const loadingScreen = document.getElementById("loadingScreen");
  if (loadingScreen) {
    loadingScreen.classList.add("fade-out");
    setTimeout(() => {
      loadingScreen.remove();
    }, 400);
  }
}

// Uygulamayı çalıştır
init();
