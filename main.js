// main.js
// Uygulamanın ana beyni (Orkestra Şefi)

// Config ve modülleri içe aktar
import * as config from "./config.js";
import * as ui from "./ui.js";
import * as audio from "./audio.js"; // (Şu an doğrudan kullanılmıyor ama ileride gerekebilir)
import * as auth from "./auth.js";
import * as store from "./store.js";
import * as lesson from "./lesson.js";
import * as tapInput from "./tap-input.js";

// --- 1. UYGULAMA DURUMU (STATE) ---
let MORSE_DATA = {};
let LESSON_DATA_MAP = {};
let domElements = {};

// --- 2. AUTH GERİ BİLDİRİMLERİ (Callbacks) ---

/**
 * Kullanıcı giriş yaptığında çalışır (auth.js tarafından tetiklenir).
 * @param {object} user - Firebase kullanıcı nesnesi
 */
async function onUserLogin(user) {
  store.setCurrentUser(user);
  await store.loadProgress();

  let userProgress = store.getUserProgress();
  ui.showUserUI(domElements, user, userProgress);
  ui.renderLessonMenu(
    domElements,
    LESSON_DATA_MAP,
    userProgress,
    onLessonSelect
  );
  ui.showScreen(domElements, "screenMenu");
}

/**
 * Kullanıcı çıkış yaptığında çalışır (auth.js tarafından tetiklenir).
 */
function onUserLogout() {
  store.setCurrentUser(null);
  let userProgress = store.getNewUserProgress(); // Varsayılan ilerlemeyi al

  ui.showUserUI(domElements, null, userProgress); // Profili gizle
  ui.showScreen(domElements, "screenLogin");
}

/**
 * Menüden ders seçildiğinde çalışır (ui.js tarafından tetiklenir).
 * @param {string} lessonId
 * @param {boolean} isLocked
 */
function onLessonSelect(lessonId, isLocked) {
  if (isLocked) {
    alert("Bu ders kilitli! Önceki dersleri tamamlamalısın.");
  } else {
    lesson.startLesson(lessonId);
  }
}

// --- 3. OLAY DİNLEYİCİLERİNİ BAĞLAMA ---

function bindEventListeners() {
  // Giriş/Kayıt Linkleri (BUG 4 DÜZELTMESİ)
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
    auth.handleGoogleLogin
  );
  domElements.btnLogout.addEventListener("click", auth.handleLogout);

  // Menü Butonları
  domElements.btnResetProgress.addEventListener("click", async () => {
    await store.resetProgress();
    // Menüyü yeniden çiz
    let userProgress = store.getUserProgress();
    ui.renderLessonMenu(
      domElements,
      LESSON_DATA_MAP,
      userProgress,
      onLessonSelect
    );
  });

  // Alıştırma Butonları
  domElements.btnBackToMenu.addEventListener("click", lesson.exitLesson);

  // Tamamlandı Ekranı Butonları
  domElements.btnMenuAfterComplete.addEventListener("click", lesson.exitLesson);
  domElements.btnNextLesson.addEventListener("click", lesson.startNextLesson);

  // 'Dinle' Modülü Olayları
  domElements.listen.btnPlaySound.addEventListener("click", () => {
    // 'lesson.js' state tutmadığı için MORSE_DATA'yı dışarıdan almalı
    const q = lesson.getCurrentLessonQuestion(); // (Bu fonksiyonu eklemeliyiz)
    // Düzeltme: lesson.js'in state tutması daha iyi.
    // Bu yüzden 'playMorseItem'ı lesson.js'in içine taşıyalım.
    // Şimdilik basit tutalım:
    lesson.handlePlaySound(MORSE_DATA);
  });
  domElements.listen.btnCheckAnswer.addEventListener(
    "click",
    lesson.handleAnswerCheck
  );
  domElements.listen.input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") lesson.handleAnswerCheck(e);
  });

  // 'Vur' Modülü Olayları
  domElements.tap.btnMorseKey.addEventListener(
    "mousedown",
    tapInput.handleTapDown
  );
  domElements.tap.btnMorseKey.addEventListener("mouseup", tapInput.handleTapUp);
  domElements.tap.btnMorseKey.addEventListener(
    "mouseleave",
    tapInput.handleTapLeave
  );
  domElements.tap.btnMorseKey.addEventListener(
    "touchstart",
    tapInput.handleTapDown,
    { passive: false }
  );
  domElements.tap.btnMorseKey.addEventListener(
    "touchend",
    tapInput.handleTapUp,
    { passive: false }
  );
  domElements.tap.btnCheckAnswer.addEventListener(
    "click",
    lesson.handleAnswerCheck
  );
  domElements.tap.btnClear.addEventListener("click", tapInput.handleTapClear);
}

// --- 4. UYGULAMAYI BAŞLATMA ---

async function init() {
  // 1. DOM elemanlarını bul
  domElements = ui.initDOMElements(config.MAX_HEARTS);

  // 2. JSON verisini çek
  try {
    const response = await fetch("./data.json");
    if (!response.ok) throw new Error(`HTTP hatası! ${response.status}`);
    const data = await response.json();
    MORSE_DATA = data.MORSE_CODE;
    LESSON_DATA_MAP = data.LESSON_DATA;
  } catch (e) {
    console.error("Veri yüklenemedi!", e);
    document.body.innerHTML = "<h1>Hata: data.json yüklenemedi.</h1>";
    return;
  }

  // 3. Modülleri DOM ve Veri ile başlat
  auth.initAuth(domElements);
  store.initStore(domElements);
  lesson.initLesson(domElements, MORSE_DATA, LESSON_DATA_MAP);
  tapInput.initTapInput(domElements);

  // 4. Olay dinleyicilerini bağla
  bindEventListeners();

  // 5. Auth durumunu dinlemeye başla (Bu, uygulamayı tetikler)
  auth.listenForAuthChanges(onUserLogin, onUserLogout);
}

// Uygulamayı çalıştır
init();
