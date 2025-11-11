// ui.js
// Tüm DOM manipülasyonlarını yönetir.

/**
 * Tüm HTML elemanlarını bir nesne içinde toplar.
 */
export function initDOMElements() {
  return {
    // Ekranlar
    screenMenu: document.getElementById("screenMenu"),
    screenExercise: document.getElementById("screenExercise"),
    screenComplete: document.getElementById("screenComplete"),

    // Modüller
    moduleListen: document.getElementById("exerciseListen"),
    moduleTap: document.getElementById("exerciseTap"),

    // Menü
    lessonListContainer: document.getElementById("lessonList"),
    btnResetProgress: document.getElementById("btnResetProgress"),

    // Alıştırma Ekranı
    btnBackToMenu: document.getElementById("btnBackToMenu"),
    progressFill: document.getElementById("progressFill"),
    heartDisplaySpans: document.querySelectorAll("#heartDisplay .heart"),

    // Tamamlandı Ekranı
    completeMessage: document.getElementById("completeMessage"),
    btnNextLesson: document.getElementById("btnNextLesson"),
    btnMenuAfterComplete: document.getElementById("btnMenuAfterComplete"),

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
  };
}

/**
 * İstenen ekranı gösterir, diğerlerini gizler.
 */
export function showScreen(elements, screenId) {
  elements.screenMenu.classList.add("hidden");
  elements.screenExercise.classList.add("hidden");
  elements.screenComplete.classList.add("hidden");

  const activeScreen = elements[screenId]; // örn: elements['screenMenu']
  if (activeScreen) {
    activeScreen.classList.remove("hidden");
  }
}

/**
 * Ders listesini 'LESSON_DATA'ya göre dinamik olarak çizer.
 */
export function renderLessonMenu(
  elements,
  LESSON_DATA,
  userProgress,
  onLessonSelectCallback
) {
  const container = elements.lessonListContainer;
  container.innerHTML = ""; // Listeyi temizle

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

    // Tıklama olayını ana mantığa (main.js) geri bildir
    button.addEventListener("click", () => {
      onLessonSelectCallback(lessonId, isLocked);
    });

    container.appendChild(button);
  }
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
export function renderHearts(elements, currentHearts) {
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
export function setupListenUI(elements, questionItem) {
  elements.moduleListen.classList.remove("hidden");
  elements.moduleTap.classList.add("hidden");

  elements.listen.input.value = "";
  elements.listen.input.focus();

  if (questionItem.length > 1) {
    elements.listen.input.placeholder = "Kelimeyi yaz";
    elements.listen.instruction.textContent = "Duyduğun kelimeyi buraya yaz:";
  } else {
    elements.listen.input.placeholder = "Harfi yaz";
    elements.listen.instruction.textContent = "Duyduğun harfi buraya yaz:";
  }

  elements.listen.btnPlaySound.disabled = true;
  elements.listen.btnCheckAnswer.disabled = true;
}

/**
 * 'Vur' modülü arayüzünü soruya göre hazırlar.
 */
export function setupTapUI(elements, questionItem) {
  elements.moduleListen.classList.add("hidden");
  elements.moduleTap.classList.remove("hidden");

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
  const feedbackEl =
    type === "listen" ? elements.listen.feedback : elements.tap.feedback;

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
  const feedbackEl =
    type === "listen" ? elements.listen.feedback : elements.tap.feedback;
  feedbackEl.textContent = "Canların bitti! Tekrar dene.";
  feedbackEl.className = "feedback-area feedback-failed";
}

/**
 * Tamamlandı ekranını gösterir.
 */
export function showCompleteScreen(elements, message, hasNextLesson) {
  elements.completeMessage.textContent = message;
  if (hasNextLesson) {
    elements.btnNextLesson.classList.remove("hidden");
  } else {
    elements.btnNextLesson.classList.add("hidden");
  }
  showScreen(elements, "screenComplete");
}
