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

let currentLesson = {
  id: null,
  plan: [],
  questionIndex: 0,
  totalQuestions: 0,
  isActive: false,
  hearts: config.MAX_HEARTS,
};
let nextLessonIdToStart = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Lesson modülünü başlatır ve DOM/veri'yi alır.
 */
export function initLesson(elements, morseData, lessonData) {
  domElements = elements;
  MORSE_DATA = morseData;
  LESSON_DATA_MAP = lessonData;
}

/**
 * Dersi başlatır.
 */
export function startLesson(lessonId) {
  if (!LESSON_DATA_MAP[lessonId]) {
    console.error("Geçersiz ders ID:", lessonId);
    alert("Bu ders bulunamadı.");
    return;
  }

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
 * Verilen doğru cevap hariç rastgele 3 yanlış seçenek üretir.
 */
function generateMcqChoices(correctItem, allItems) {
  const choices = [correctItem];
  const pool = allItems.filter((item) => item !== correctItem);
  // Shuffle pool
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  for (let i = 0; i < 3 && i < pool.length; i++) {
    choices.push(pool[i]);
  }
  // Shuffle choices
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}

/**
 * Sıradaki soruyu gösterir.
 */
function showQuestion() {
  if (!currentLesson.isActive) return;
  const question = currentLesson.plan[currentLesson.questionIndex];

  ui.showFeedback(domElements, true, "", "listen");
  ui.showFeedback(domElements, true, "", "tap");
  ui.showFeedback(domElements, true, "", "mcq");
  ui.showFeedback(domElements, true, "", "reverse");

  if (question.type === "flashcard") {
    const morseCode = MORSE_DATA[question.item] || "";
    ui.setupFlashcardUI(domElements, question.item, morseCode);
    audio.playMorseItem(question.item, MORSE_DATA);
  } else if (question.type === "listen") {
    ui.setupListenUI(domElements, question.item);
    audio.playMorseItem(question.item, MORSE_DATA).then(() => {
      if (currentLesson.isActive) {
        ui.setExerciseControlsDisabled(domElements, "listen", false);
        domElements.listen.input.focus();
      }
    });
  } else if (question.type === "tap") {
    resetTapState();
    ui.setupTapUI(domElements, question.item);
  } else if (question.type === "mcq") {
    const allLetters = Object.keys(MORSE_DATA);
    const choices = generateMcqChoices(question.item, allLetters);
    ui.setupMcqUI(domElements, choices, question.item, handleMcqSelect);
    audio.playMorseItem(question.item, MORSE_DATA).then(() => {
      if (currentLesson.isActive) {
        domElements.mcq.btnPlaySound.disabled = false;
      }
    });
  } else if (question.type === "reverse") {
    const morseCode = MORSE_DATA[question.item] || "";
    const allLetters = Object.keys(MORSE_DATA);
    const choices = generateMcqChoices(question.item, allLetters);
    ui.setupReverseUI(domElements, morseCode, choices, handleReverseSelect);
  }
}

/**
 * Flashcard "Devam Et" butonuna basıldığında çağrılır.
 */
export function handleFlashcardContinue() {
  if (!currentLesson.isActive) return;
  nextQuestion();
}

/**
 * Çoktan seçmeli bir seçenek tıklandığında çağrılır.
 */
async function handleMcqSelect(selectedItem) {
  if (!currentLesson.isActive) return;
  const question = currentLesson.plan[currentLesson.questionIndex];
  const correctItem = question.item;
  const isCorrect = selectedItem === correctItem;

  const feedbackMessage = isCorrect
    ? "Doğru!"
    : `Yanlış! Doğru cevap '${correctItem}' idi.`;

  ui.showMcqResult(domElements, selectedItem, correctItem, isCorrect);
  ui.showFeedback(domElements, isCorrect, feedbackMessage, "mcq");

  if (isCorrect) {
    audio.playEffect("correct");
    ui.triggerAnimation(domElements, "mcq", "animate-correct");
    await store.addXP(config.XP_PER_ANSWER);
    setTimeout(nextQuestion, config.FEEDBACK_CORRECT_DELAY);
  } else {
    audio.playEffect("wrong");
    ui.triggerAnimation(domElements, "mcq", "animate-wrong");
    loseLife("mcq");
  }
}

/**
 * Ters (Mors→Harf) bir seçenek tıklandığında çağrılır.
 */
async function handleReverseSelect(selectedItem) {
  if (!currentLesson.isActive) return;
  const question = currentLesson.plan[currentLesson.questionIndex];
  const correctItem = question.item;
  const isCorrect = selectedItem === correctItem;

  const feedbackMessage = isCorrect
    ? "Doğru!"
    : `Yanlış! Doğru cevap '${correctItem}' idi.`;

  ui.showReverseResult(domElements, selectedItem, correctItem, isCorrect);
  ui.showFeedback(domElements, isCorrect, feedbackMessage, "reverse");

  if (isCorrect) {
    audio.playEffect("correct");
    ui.triggerAnimation(domElements, "reverse", "animate-correct");
    await store.addXP(config.XP_PER_ANSWER);
    setTimeout(nextQuestion, config.FEEDBACK_CORRECT_DELAY);
  } else {
    audio.playEffect("wrong");
    ui.triggerAnimation(domElements, "reverse", "animate-wrong");
    loseLife("reverse");
  }
}

/**
 * Kullanıcının cevabını kontrol eder.
 */
export async function handleAnswerCheck(e) {
  if (e) e.preventDefault();
  if (!currentLesson.isActive) return;

  const question = currentLesson.plan[currentLesson.questionIndex];
  const type = question.type;

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
    const userTaps = getCommittedTaps();
    let correctCode = correctItem
      .split("")
      .map((letter) => MORSE_DATA[letter])
      .join("");
    isCorrect = userTaps === correctCode;

    if (isCorrect) {
      feedbackMessage = "Doğru!";
    } else {
      const userLetter = getLetterFromCode(userTaps);
      feedbackMessage = `Yanlış! Sen '${userTaps}' (${userLetter}) vurdun. Doğrusu '${correctCode}' (${correctItem}) olacaktı.`;
    }
  }

  ui.showFeedback(domElements, isCorrect, feedbackMessage, type);

  if (isCorrect) {
    audio.playEffect("correct");
    ui.triggerAnimation(domElements, type, "animate-correct");
    await store.addXP(config.XP_PER_ANSWER);
    setTimeout(nextQuestion, config.FEEDBACK_CORRECT_DELAY);
  } else {
    audio.playEffect("wrong");
    ui.triggerAnimation(domElements, type, "animate-wrong");
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
    (currentLesson.questionIndex / currentLesson.totalQuestions) * 100,
  );

  if (currentLesson.questionIndex < currentLesson.totalQuestions) {
    showQuestion();
  } else {
    completeLesson();
  }
}

/**
 * Dersi başarıyla tamamlar.
 * DÜZELTME: 'complete' sesini çalar (İstek 1)
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
  ui.triggerConfetti();

  // 'correct' yerine 'complete' sesini çal
  audio.playEffect("complete");
}

/**
 * Can kaybeder.
 * DÜZELTME: 'Vur' modu için daha kısa gecikme kullanır (İstek 2)
 */
async function loseLife(type) {
  if (currentLesson.hearts <= 0) return;
  currentLesson.hearts--;
  ui.renderHearts(domElements, currentLesson.hearts, config.MAX_HEARTS);

  if (currentLesson.hearts > 0) {
    if (type === "tap") {
      // İSTEK 2: 'Vur' modu için daha kısa gecikme
      const clearDelay = config.FEEDBACK_WRONG_DELAY_TAP; // 1500ms
      setTimeout(() => {
        if (currentLesson.isActive) {
          ui.clearTapUI(domElements);
          resetTapState();
          ui.showFeedback(domElements, false, "", "tap");
          ui.setExerciseControlsDisabled(domElements, "tap", false);
        }
      }, clearDelay);
    } else if (type === "listen") {
      // İSTEK 3: Akış (buzz -> 0.5s bekle -> sesi çal)
      ui.showFeedback(domElements, false, "Yanlış! Tekrar dinle...", "listen");

      await sleep(500); // Sesten sonraki 0.5sn bekleme
      if (!currentLesson.isActive) return;

      const question = currentLesson.plan[currentLesson.questionIndex];
      await audio.playMorseItem(question.item, MORSE_DATA);

      if (currentLesson.isActive) {
        domElements.listen.input.value = "";
        ui.showFeedback(domElements, false, "", "listen");
        ui.setExerciseControlsDisabled(domElements, "listen", false);
        domElements.listen.input.focus();
      }
    } else if (type === "mcq" || type === "reverse") {
      // Sonuç 1.5sn gösterilir, sonra soru tekrar gösterilir
      setTimeout(() => {
        if (currentLesson.isActive) {
          showQuestion();
        }
      }, config.FEEDBACK_WRONG_DELAY_TAP);
    }
  }

  if (currentLesson.hearts <= 0) {
    failLesson(type);
  }
}

/**
 * Derste başarısız olur.
 * DÜZELTME: 'failed' sesini çalar (İstek 1)
 */
function failLesson(type) {
  currentLesson.isActive = false;
  audio.stopAllAudio();
  resetTapState();

  ui.showFailScreen(domElements, type);
  // 'wrong' yerine 'failed' sesini çal
  audio.playEffect("failed");

  setTimeout(() => {
    let userProgress = store.getUserProgress();
    ui.renderLessonMenu(
      domElements,
      LESSON_DATA_MAP,
      userProgress,
      onLessonSelect,
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
    onLessonSelect,
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
    let userProgress = store.getUserProgress();
    ui.renderLessonMenu(
      domElements,
      LESSON_DATA_MAP,
      userProgress,
      onLessonSelect,
    );
    ui.showScreen(domElements, "screenMenu");
  }
}

/**
 * 'Sesi Tekrar Çal' butonuna basıldığında çalışır.
 */
export function handlePlaySound() {
  if (!currentLesson.isActive) return;
  const question = currentLesson.plan[currentLesson.questionIndex];
  if (question.type === "listen") {
    ui.setExerciseControlsDisabled(domElements, "listen", true);
    audio.playMorseItem(question.item, MORSE_DATA).then(() => {
      if (currentLesson.isActive) {
        ui.setExerciseControlsDisabled(domElements, "listen", false);
        domElements.listen.input.focus();
      }
    });
  } else if (question.type === "flashcard" || question.type === "mcq") {
    audio.playMorseItem(question.item, MORSE_DATA);
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
