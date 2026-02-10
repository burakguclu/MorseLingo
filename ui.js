// ui.js
// Tüm DOM manipülasyonlarını yönetir.

/**
 * Tüm HTML elemanlarını bir nesne içinde toplar.
 */
export function initDOMElements(maxHearts) {
  // Canları dinamik olarak oluştur
  const heartContainer = document.getElementById("heartDisplay");
  heartContainer.innerHTML = "";
  for (let i = 0; i < maxHearts; i++) {
    const heart = document.createElement("span");
    heart.className = "heart";
    heart.textContent = "❤️";
    heartContainer.appendChild(heart);
  }

  return {
    // Ekranlar
    screenLogin: document.getElementById("screenLogin"),
    screenRegister: document.getElementById("screenRegister"),
    screenMenu: document.getElementById("screenMenu"),
    screenExercise: document.getElementById("screenExercise"),
    screenComplete: document.getElementById("screenComplete"),
    screenLeaderboard: document.getElementById("screenLeaderboard"),

    // Formlar
    loginForm: document.getElementById("loginForm"),
    registerForm: document.getElementById("registerForm"),

    // Modüller
    moduleListen: document.getElementById("exerciseListen"),
    moduleTap: document.getElementById("exerciseTap"),
    moduleFlashcard: document.getElementById("exerciseFlashcard"),
    moduleMcq: document.getElementById("exerciseMcq"),
    moduleReverse: document.getElementById("exerciseReverse"),

    // Kullanıcı Profili (Header)
    userProfile: document.getElementById("userProfile"),
    userEmailDisplay: document.getElementById("userEmailDisplay"),
    userXpDisplay: document.getElementById("userXpDisplay"),
    userStreakDisplay: document.getElementById("userStreakDisplay"),
    btnLogout: document.getElementById("btnLogout"),

    // Giriş Ekranı
    login: {
      inputEmail: document.getElementById("loginEmail"),
      inputPassword: document.getElementById("loginPassword"),
      btnLoginEmail: document.getElementById("btnLoginEmail"),
      btnLoginGoogle: document.getElementById("btnLoginGoogle"),
      authError: document.getElementById("loginAuthError"),
      linkToRegister: document.getElementById("linkToRegister"),
    },

    // Kayıt Ekranı
    register: {
      // YENİ
      inputUsername: document.getElementById("registerUsername"),
      inputEmail: document.getElementById("registerEmail"),
      inputPassword: document.getElementById("registerPassword"),
      inputPasswordConfirm: document.getElementById("registerPasswordConfirm"),
      btnRegisterEmail: document.getElementById("btnRegisterEmail"),
      authError: document.getElementById("registerAuthError"),
      linkToLogin: document.getElementById("linkToLogin"),
    },

    // Menü
    lessonListContainer: document.getElementById("lessonList"),
    btnResetProgress: document.getElementById("btnResetProgress"),
    btnLeaderboard: document.getElementById("btnLeaderboard"), // YENİ

    // Alıştırma
    btnBackToMenu: document.getElementById("btnBackToMenu"),
    progressFill: document.getElementById("progressFill"),
    heartDisplaySpans: document.querySelectorAll("#heartDisplay .heart"),

    // Tamamlandı
    completeMessage: document.getElementById("completeMessage"),
    xpGainedMessage: document.getElementById("xpGainedMessage"),
    btnNextLesson: document.getElementById("btnNextLesson"),
    btnMenuAfterComplete: document.getElementById("btnMenuAfterComplete"),

    // Lider Tablosu
    leaderboard: {
      list: document.getElementById("leaderboardList"),
      loading: document.getElementById("leaderboardLoading"),
      btnBack: document.getElementById("btnBackFromLeaderboard"),
    },

    // 'Dinle' Modülü
    listen: {
      instruction: document.getElementById("listen_instruction"),
      btnPlaySound: document.getElementById("listen_btnPlaySound"),
      input: document.getElementById("listen_input"),
      btnCheckAnswer: document.getElementById("listen_btnCheckAnswer"),
      feedback: document.getElementById("listen_pFeedback"),
    },

    // 'Vur' Modülü
    tap: {
      challenge: document.getElementById("tap_challenge"),
      btnMorseKey: document.getElementById("tap_btnMorseKey"),
      currentTapsDisplay: document.getElementById("tap_currentTapsDisplay"),
      committedWordDisplay: document.getElementById("tap_committedWordDisplay"),
      btnCheckAnswer: document.getElementById("tap_btnCheckAnswer"),
      btnClear: document.getElementById("tap_btnClear"),
      feedback: document.getElementById("tap_pFeedback"),
    },

    // Flashcard Modülü
    flashcard: {
      letter: document.getElementById("flashcard_letter"),
      code: document.getElementById("flashcard_code"),
      visual: document.getElementById("flashcard_visual"),
      btnPlaySound: document.getElementById("flashcard_btnPlaySound"),
      btnContinue: document.getElementById("flashcard_btnContinue"),
    },

    // Çoktan Seçmeli Modülü
    mcq: {
      instruction: document.getElementById("mcq_instruction"),
      btnPlaySound: document.getElementById("mcq_btnPlaySound"),
      options: document.getElementById("mcq_options"),
      feedback: document.getElementById("mcq_pFeedback"),
    },

    // Ters (Mors→Harf) Modülü
    reverse: {
      code: document.getElementById("reverse_code"),
      visual: document.getElementById("reverse_visual"),
      options: document.getElementById("reverse_options"),
      feedback: document.getElementById("reverse_pFeedback"),
    },
  };
}

/**
 * İstenen ekranı gösterir, diğerlerini gizler.
 */
export function showScreen(elements, screenId) {
  elements.screenLogin.classList.add("hidden");
  elements.screenRegister.classList.add("hidden");
  elements.screenMenu.classList.add("hidden");
  elements.screenExercise.classList.add("hidden");
  elements.screenComplete.classList.add("hidden");
  elements.screenLeaderboard.classList.add("hidden");

  const activeScreen = elements[screenId];
  if (activeScreen) {
    activeScreen.classList.remove("hidden");
  }
}

/**
 * Giriş/Kayıt ekranında hata mesajı gösterir.
 */
export function showAuthError(elements, screen, message) {
  const errorEl =
    screen === "login" ? elements.login.authError : elements.register.authError;
  errorEl.textContent = message;

  setTimeout(() => {
    if (errorEl.textContent === message) {
      errorEl.textContent = "";
    }
  }, 3000);
}

/**
 * Kullanıcı giriş/çıkışına göre arayüzü günceller.
 */
export function showUserUI(elements, user, progress) {
  if (user) {
    elements.userProfile.classList.remove("hidden");
    elements.userEmailDisplay.textContent = user.email;
    if (progress) {
      updateXP(elements, progress.xp || 0);
      updateStreak(elements, progress.streak || 0);
    }
  } else {
    elements.userProfile.classList.add("hidden");
  }
}

/**
 * Ders listesini 'LESSON_DATA'ya ve kullanıcının ilerlemesine göre çizer.
 */
export function renderLessonMenu(
  elements,
  LESSON_DATA,
  userProgress,
  onLessonSelectCallback,
) {
  // ... (fonksiyonun içeriği değişmedi) ...
  const container = elements.lessonListContainer;
  container.innerHTML = "";

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
      onLessonSelectCallback(lessonId, isLocked);
    });

    container.appendChild(button);
  }
}

/**
 * Lider tablosu listesini çizer.
 * DÜZELTME: 'user.username' kullanır
 */
export function renderLeaderboard(elements, leaderboardData) {
  const listEl = elements.leaderboard.list;
  listEl.innerHTML = "";

  if (leaderboardData.length === 0) {
    listEl.innerHTML = "<li>Henüz kimse puan almamış. İlk sen ol!</li>";
    return;
  }

  leaderboardData.forEach((user, index) => {
    const li = document.createElement("li");

    li.innerHTML = `
            <span class="rank">${index + 1}.</span>
            <span class="name">${user.username}</span>
            <span class="xp">${user.xp} XP</span>
        `;
    listEl.appendChild(li);
  });
}

/**
 * XP göstergesini günceller.
 */
export function updateXP(elements, xp) {
  elements.userXpDisplay.textContent = `${xp} XP`;
}

/**
 * Seri göstergesini günceller.
 */
export function updateStreak(elements, streak) {
  elements.userStreakDisplay.textContent = `🔥 ${streak}`;
}

/**
 * İlerleme çubuğunu günceller.
 */
export function updateProgress(elements, percent) {
  elements.progressFill.style.width = `${percent}%`;
}

/**
 * Kalp göstergesini günceller.
 */
export function renderHearts(elements, currentHearts, maxHearts) {
  // ... (fonksiyonun içeriği değişmedi) ...
  if (elements.heartDisplaySpans.length !== maxHearts) {
    const heartContainer = document.getElementById("heartDisplay");
    heartContainer.innerHTML = "";
    for (let i = 0; i < maxHearts; i++) {
      const heart = document.createElement("span");
      heart.className = "heart";
      heart.textContent = "❤️";
      heartContainer.appendChild(heart);
    }
    elements.heartDisplaySpans = document.querySelectorAll(
      "#heartDisplay .heart",
    );
  }

  elements.heartDisplaySpans.forEach((span, index) => {
    if (index < currentHearts) {
      span.classList.remove("lost");
    } else {
      span.classList.add("lost");
    }
  });
}

/**
 * 'Dinle' modülü arayüzünü soruya göre hazırlar.
 */
function hideAllModules(elements) {
  elements.moduleListen.classList.add("hidden");
  elements.moduleTap.classList.add("hidden");
  elements.moduleFlashcard.classList.add("hidden");
  elements.moduleMcq.classList.add("hidden");
  elements.moduleReverse.classList.add("hidden");
}

export function setupListenUI(elements, questionItem) {
  // ... (fonksiyonun içeriği değişmedi) ...
  hideAllModules(elements);
  elements.moduleListen.classList.remove("hidden");

  elements.listen.input.value = "";
  elements.listen.input.focus();

  elements.listen.input.disabled = false;
  elements.listen.btnPlaySound.disabled = true;
  elements.listen.btnCheckAnswer.disabled = true;

  if (questionItem.length > 1) {
    elements.listen.input.placeholder = "Kelimeyi yaz";
    elements.listen.instruction.textContent = "Duyduğun kelimeyi buraya yaz:";
  } else {
    elements.listen.input.placeholder = "Harfi yaz";
    elements.listen.instruction.textContent = "Duyduğun harfi buraya yaz:";
  }
}

/**
 * Flashcard modülünü hazırlar — öğrenme kartı gösterir.
 */
export function setupFlashcardUI(elements, item, morseCode) {
  hideAllModules(elements);
  elements.moduleFlashcard.classList.remove("hidden");

  elements.flashcard.letter.textContent = item;
  elements.flashcard.code.textContent = morseCode;

  // Görsel dit/dah gösterimi
  elements.flashcard.visual.innerHTML = "";
  for (const ch of morseCode) {
    const span = document.createElement("span");
    if (ch === ".") {
      span.className = "dit";
    } else if (ch === "-") {
      span.className = "dah";
    }
    elements.flashcard.visual.appendChild(span);
  }
}

/**
 * Çoktan seçmeli modülünü hazırlar.
 * @param {object} elements
 * @param {string[]} choices - 4 seçenek
 * @param {string} correctItem - doğru cevap
 * @param {function} onSelect - seçim callback(selectedItem)
 */
export function setupMcqUI(elements, choices, correctItem, onSelect) {
  hideAllModules(elements);
  elements.moduleMcq.classList.remove("hidden");

  elements.mcq.options.innerHTML = "";
  elements.mcq.feedback.textContent = "";
  elements.mcq.feedback.className = "feedback-area";
  elements.mcq.btnPlaySound.disabled = true;

  choices.forEach((choice) => {
    const btn = document.createElement("button");
    btn.className = "mcq-option";
    btn.textContent = choice;
    btn.addEventListener("click", () => {
      onSelect(choice);
    });
    elements.mcq.options.appendChild(btn);
  });
}

/**
 * MCQ seçim sonucunu gösterir (butonları kilitler, doğru/yanlışı işaretler).
 */
export function showMcqResult(elements, selectedItem, correctItem, isCorrect) {
  const buttons = elements.mcq.options.querySelectorAll(".mcq-option");
  buttons.forEach((btn) => {
    btn.disabled = true;
    if (btn.textContent === correctItem) {
      btn.classList.add("reveal-correct");
    }
    if (btn.textContent === selectedItem && !isCorrect) {
      btn.classList.add("selected-wrong");
    }
    if (btn.textContent === selectedItem && isCorrect) {
      btn.classList.add("selected-correct");
    }
  });
}

/**
 * Ters (Mors→Harf) modülünü hazırlar.
 * @param {object} elements
 * @param {string} morseCode - gösterilecek mors kodu
 * @param {string[]} choices - 4 seçenek
 * @param {function} onSelect - seçim callback(selectedItem)
 */
export function setupReverseUI(elements, morseCode, choices, onSelect) {
  hideAllModules(elements);
  elements.moduleReverse.classList.remove("hidden");

  elements.reverse.code.textContent = morseCode;
  elements.reverse.options.innerHTML = "";
  elements.reverse.feedback.textContent = "";
  elements.reverse.feedback.className = "feedback-area";

  // Görsel dit/dah
  elements.reverse.visual.innerHTML = "";
  for (const ch of morseCode) {
    const span = document.createElement("span");
    if (ch === ".") span.className = "dit";
    else if (ch === "-") span.className = "dah";
    elements.reverse.visual.appendChild(span);
  }

  choices.forEach((choice) => {
    const btn = document.createElement("button");
    btn.className = "mcq-option";
    btn.textContent = choice;
    btn.addEventListener("click", () => {
      onSelect(choice);
    });
    elements.reverse.options.appendChild(btn);
  });
}

/**
 * Reverse seçim sonucunu gösterir.
 */
export function showReverseResult(
  elements,
  selectedItem,
  correctItem,
  isCorrect,
) {
  const buttons = elements.reverse.options.querySelectorAll(".mcq-option");
  buttons.forEach((btn) => {
    btn.disabled = true;
    if (btn.textContent === correctItem) {
      btn.classList.add("reveal-correct");
    }
    if (btn.textContent === selectedItem && !isCorrect) {
      btn.classList.add("selected-wrong");
    }
    if (btn.textContent === selectedItem && isCorrect) {
      btn.classList.add("selected-correct");
    }
  });
}

/**
 * 'Vur' modülü arayüzünü soruya göre hazırlar.
 */
export function setupTapUI(elements, questionItem) {
  // ... (fonksiyonun içeriği değişmedi) ...
  hideAllModules(elements);
  elements.moduleTap.classList.remove("hidden");

  elements.tap.btnCheckAnswer.disabled = false;
  elements.tap.btnClear.disabled = false;
  elements.tap.btnMorseKey.disabled = false;

  elements.tap.challenge.textContent = questionItem;
  clearTapUI(elements);
}

/**
 * 'Vur' modülü vuruş ekranını temizler.
 */
export function clearTapUI(elements) {
  elements.tap.currentTapsDisplay.textContent = "_";
  elements.tap.committedWordDisplay.textContent = "_";
}

/**
 * Doğru/Yanlış geri bildirim mesajını gösterir.
 */
export function showFeedback(elements, isCorrect, message, type) {
  let feedbackEl;
  if (type === "listen") feedbackEl = elements.listen.feedback;
  else if (type === "tap") feedbackEl = elements.tap.feedback;
  else if (type === "mcq") feedbackEl = elements.mcq.feedback;
  else if (type === "reverse") feedbackEl = elements.reverse.feedback;
  else return;

  feedbackEl.textContent = message;
  if (isCorrect) {
    feedbackEl.className = "feedback-area feedback-correct";
  } else {
    feedbackEl.className = "feedback-area feedback-wrong";
  }
}

/**
 * Başarısız ders ekranını gösterir.
 */
export function showFailScreen(elements, type) {
  let feedbackEl;
  if (type === "listen") feedbackEl = elements.listen.feedback;
  else if (type === "tap") feedbackEl = elements.tap.feedback;
  else if (type === "mcq") feedbackEl = elements.mcq.feedback;
  else if (type === "reverse") feedbackEl = elements.reverse.feedback;
  else return;
  feedbackEl.textContent = "Canların bitti! Tekrar dene.";
  feedbackEl.className = "feedback-area feedback-failed";
}

/**
 * Tamamlandı ekranını gösterir.
 */
export function showCompleteScreen(
  elements,
  message,
  xpMessage,
  hasNextLesson,
) {
  // ... (fonksiyonun içeriği değişmedi) ...
  elements.completeMessage.textContent = message;
  elements.xpGainedMessage.textContent = xpMessage;
  if (hasNextLesson) {
    elements.btnNextLesson.classList.remove("hidden");
  } else {
    elements.btnNextLesson.classList.add("hidden");
  }
  showScreen(elements, "screenComplete");
}

/**
 * Alıştırma butonlarını kilitleyen fonksiyon.
 */
export function setExerciseControlsDisabled(elements, type, disabled) {
  // ... (fonksiyonun içeriği değişmedi) ...
  if (type === "listen") {
    elements.listen.btnCheckAnswer.disabled = disabled;
    elements.listen.btnPlaySound.disabled = disabled;
    elements.listen.input.disabled = disabled;
  } else if (type === "tap") {
    elements.tap.btnCheckAnswer.disabled = disabled;
    elements.tap.btnClear.disabled = disabled;
    elements.tap.btnMorseKey.disabled = disabled;
  }
}

/**
 * Bir alıştırma modülüne animasyon sınıfı ekler.
 */
export function triggerAnimation(elements, type, animationClass) {
  let element;
  if (type === "listen") element = elements.moduleListen;
  else if (type === "tap") element = elements.moduleTap;
  else if (type === "mcq") element = elements.moduleMcq;
  else if (type === "reverse") element = elements.moduleReverse;
  else return;

  element.classList.remove(animationClass);
  void element.offsetWidth;
  element.classList.add(animationClass);

  setTimeout(() => {
    element.classList.remove(animationClass);
  }, 400);
}

/**
 * Ekranda konfeti patlaması başlatır.
 */
export function triggerConfetti() {
  // ... (fonksiyonun içeriği değişmedi) ...
  if (typeof confetti !== "function") {
    return;
  }
  confetti({
    particleCount: 150,
    spread: 90,
    origin: { y: 0.6 },
  });
  confetti({
    particleCount: 50,
    angle: 60,
    spread: 55,
    origin: { x: 0, y: 0.8 },
  });
  confetti({
    particleCount: 50,
    angle: 120,
    spread: 55,
    origin: { x: 1, y: 0.8 },
  });
}
