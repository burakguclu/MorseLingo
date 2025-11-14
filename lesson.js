// lesson.js
// Aktif bir dersin tüm durumunu ve mantığını yönetir.

import * as config from "./config.js";
import * as audio from "./audio.js";
import * as ui from "./ui.js";
import * as store from "./store.js";
import { resetTapState, getCommittedTaps } from "./tap-input.js";

let domElements;
let MORSE_DATA;
let LESSON_DATA_MAP;

// Aktif dersin durumu
let currentLesson = {
  id: null,
  plan: [],
  questionIndex: 0,
  totalQuestions: 0,
  isActive: false,
  hearts: config.MAX_HEARTS,
};
let nextLessonIdToStart = null;

/**
 * Lesson modülünü başlatır ve DOM/veri'yi alır.
 * @param {object} elements
 * @param {object} morseData
 * @param {object} lessonData
 */
export function initLesson(elements, morseData, lessonData) {
  domElements = elements;
  MORSE_DATA = morseData;
  LESSON_DATA_MAP = lessonData;
}

/**
 * Dersi başlatır.
 * @param {string} lessonId - Başlatılacak dersin ID'si
 */
export function startLesson(lessonId) {
  currentLesson = {
    id: lessonId,
    plan: LESSON_DATA_MAP[lessonId].questions,
    questionIndex: 0,
    totalQuestions: LESSON_DATA_MAP[lessonId].questions.length,
    isActive: true,
    hearts: config.MAX_HEARTS,
  };

  ui.renderHearts(domElements, currentLesson.hearts, config.MAX_HEARTS);
  ui.showScreen(domElements, "screenExercise");
  ui.updateProgress(domElements, 0);
  showQuestion();
}

/**
 * Sıradaki soruyu gösterir.
 */
function showQuestion() {
  if (!currentLesson.isActive) return;
  const question = currentLesson.plan[currentLesson.questionIndex];

  ui.showFeedback(domElements, true, "", "listen");
  ui.showFeedback(domElements, true, "", "tap");

  if (question.type === "listen") {
    ui.setupListenUI(domElements, question.item);
    audio.playMorseItem(question.item, MORSE_DATA).then(() => {
      if (currentLesson.isActive) {
        ui.setExerciseControlsDisabled(domElements, "listen", false);
      }
    });
  } else if (question.type === "tap") {
    resetTapState(); // 'Vur' modülü durumunu sıfırla
    ui.setupTapUI(domElements, question.item);
  }
}

/**
 * Kullanıcının cevabını kontrol eder.
 * @param {Event} e - Olay
 */
export async function handleAnswerCheck(e) {
  if (e) e.preventDefault();
  if (!currentLesson.isActive) return;

  const question = currentLesson.plan[currentLesson.questionIndex];
  const type = question.type;

  // Cevap işlenirken butonları devre dışı bırak
  ui.setExerciseControlsDisabled(domElements, type, true);

  const correctItem = question.item;
  let isCorrect = false;
  let feedbackMessage = "";

  if (type === "listen") {
    const userGuess = domElements.listen.input.value.toUpperCase();
    isCorrect = userGuess === correctItem;
    feedbackMessage = isCorrect
      ? "Doğru!"
      : `Yanlış! Doğru cevap '${correctItem}' olacaktı.`;
  } else if (type === "tap") {
    const userTaps = getCommittedTaps(); // 'tap-input' modülünden onayla ve al
    let correctCode = correctItem
      .split("")
      .map((letter) => MORSE_DATA[letter])
      .join("");
    isCorrect = userTaps === correctCode;

    if (isCorrect) {
      feedbackMessage = "Doğru!";
    } else {
      const userLetter =
        correctItem.length === 1 ? getLetterFromCode(userTaps) : "??";
      feedbackMessage = `Yanlış! Sen '${userTaps}' (${userLetter}) vurdun. Doğrusu '${correctCode}' (${correctItem}) olacaktı.`;
    }
  }

  ui.showFeedback(domElements, isCorrect, feedbackMessage, type);

  if (isCorrect) {
    await store.addXP(config.XP_PER_ANSWER);
    setTimeout(nextQuestion, config.FEEDBACK_CORRECT_DELAY);
  } else {
    loseLife(type);
  }
}

/**
 * Sıradaki soruya geçer.
 */
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

/**
 * Dersi başarıyla tamamlar.
 */
async function completeLesson() {
  currentLesson.isActive = false;
  audio.stopAllAudio();
  resetTapState();

  const lessonKeys = Object.keys(LESSON_DATA_MAP);
  const currentLessonIndex = lessonKeys.indexOf(currentLesson.id);
  nextLessonIdToStart = lessonKeys[currentLessonIndex + 1];

  let completeText = `${LESSON_DATA_MAP[currentLesson.id].title} tamamlandı!`;
  let hasNextLesson = false;

  const totalXPGained = config.XP_PER_LESSON_COMPLETE;
  const xpMessage = `+${totalXPGained} XP kazandın!`;
  await store.addXP(totalXPGained);

  let userProgress = store.getUserProgress();

  if (nextLessonIdToStart) {
    hasNextLesson = true;
    if (!userProgress.unlockedLessons.includes(nextLessonIdToStart)) {
      userProgress.unlockedLessons.push(nextLessonIdToStart);
      const nextLessonNumber = currentLessonIndex + 2;
      completeText = `Harika! Ders ${nextLessonNumber}'nin kilidi açıldı!`;
      await store.saveProgress({
        unlockedLessons: userProgress.unlockedLessons,
      });
    }
  } else {
    completeText = "Tebrikler! Tüm dersleri tamamladın!";
  }

  ui.showCompleteScreen(domElements, completeText, xpMessage, hasNextLesson);
}

/**
 * Can kaybeder.
 * @param {string} type - 'listen' veya 'tap'
 */
function loseLife(type) {
  if (currentLesson.hearts <= 0) return;
  currentLesson.hearts--;
  ui.renderHearts(domElements, currentLesson.hearts, config.MAX_HEARTS);

  const clearDelay = config.FEEDBACK_WRONG_DELAY;
  if (currentLesson.hearts > 0) {
    // Hata sonrası butonları tekrar etkinleştir
    if (type === "tap") {
      setTimeout(() => {
        if (currentLesson.isActive) {
          ui.clearTapUI(domElements);
          resetTapState();
          ui.showFeedback(domElements, false, "", "tap");
          ui.setExerciseControlsDisabled(domElements, "tap", false);
        }
      }, clearDelay);
    } else if (type === "listen") {
      setTimeout(() => {
        if (currentLesson.isActive) {
          domElements.listen.input.value = "";
          ui.showFeedback(domElements, false, "", "listen");
          ui.setExerciseControlsDisabled(domElements, "listen", false);
          domElements.listen.input.focus();
        }
      }, clearDelay);
    }
  }

  if (currentLesson.hearts <= 0) {
    failLesson(type);
  }
}

/**
 * Derste başarısız olur.
 * @param {string} type - 'listen' veya 'tap'
 */
function failLesson(type) {
  currentLesson.isActive = false;
  audio.stopAllAudio();
  resetTapState();

  ui.showFailScreen(domElements, type);

  setTimeout(() => {
    let userProgress = store.getUserProgress();
    ui.renderLessonMenu(
      domElements,
      LESSON_DATA_MAP,
      userProgress,
      onLessonSelect
    );
    ui.showScreen(domElements, "screenMenu");
  }, config.FAIL_LESSON_DELAY);
}

/**
 * 'onLessonSelect' callback'i (main.js'den gelir)
 */
function onLessonSelect(lessonId, isLocked) {
  if (isLocked) {
    alert("Bu ders kilitli! Önceki dersleri tamamlamalısın.");
  } else {
    startLesson(lessonId);
  }
}

/**
 * Dışarıdan 'Menüye Dön' çağrıldığında dersi durdurur.
 */
export function exitLesson() {
  currentLesson.isActive = false;
  audio.stopAllAudio();
  resetTapState();
  let userProgress = store.getUserProgress();
  ui.renderLessonMenu(
    domElements,
    LESSON_DATA_MAP,
    userProgress,
    onLessonSelect
  );
  ui.showScreen(domElements, "screenMenu");
}

/**
 * 'Sıradaki Derse Geç' butonuna basıldığında çalışır.
 */
export function startNextLesson() {
  if (nextLessonIdToStart) {
    startLesson(nextLessonIdToStart);
  } else {
    // Hata durumu, ana menüye dön
    let userProgress = store.getUserProgress();
    ui.renderLessonMenu(
      domElements,
      LESSON_DATA_MAP,
      userProgress,
      onLessonSelect
    );
    ui.showScreen(domElements, "screenMenu");
  }
}

/**
 * Kodu harfe çevirir (sadece 'tap' geri bildirimi için).
 */
function getLetterFromCode(code) {
  for (const [letter, morseCode] of Object.entries(MORSE_DATA)) {
    if (morseCode === code) return letter;
  }
  return "??";
}
