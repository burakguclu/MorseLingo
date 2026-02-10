// lesson.js
// Aktif bir dersin tüm durumunu ve mantığını yönetir.

import * as config from "./config.js";
import * as audio from "./audio.js";
import * as ui from "./ui.js";
import * as store from "./store.js";
import { resetTapState, getCommittedTaps } from "./tap-input.js";
import { showToast } from "./toast.js";

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
let onMenuReturnCallback = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Lesson modülünü başlatır ve DOM/veri'yi alır.
 */
export function initLesson(elements, morseData, lessonData, onMenuReturn) {
  domElements = elements;
  MORSE_DATA = morseData;
  LESSON_DATA_MAP = lessonData;
  onMenuReturnCallback = onMenuReturn || null;
}

/**
 * Dersi başlatır.
 */
export function startLesson(lessonId) {
  if (!LESSON_DATA_MAP[lessonId]) {
    console.error("Geçersiz ders ID:", lessonId);
    showToast("Bu ders bulunamadı.", "error");
    return;
  }

  currentLesson = {
    id: lessonId,
    plan: LESSON_DATA_MAP[lessonId].questions,
    questionIndex: 0,
    totalQuestions: LESSON_DATA_MAP[lessonId].questions.length,
    isActive: false,
    hearts: config.MAX_HEARTS,
  };

  ui.renderHearts(domElements, currentLesson.hearts, config.MAX_HEARTS);
  ui.showScreen(domElements, "screenExercise");
  ui.showLessonIntro(domElements, LESSON_DATA_MAP[lessonId], MORSE_DATA);
}

/**
 * Ders girişinden "Derse Başla" butonuna basıldığında çağrılır.
 */
export function beginExercise() {
  ui.hideLessonIntro(domElements);
  currentLesson.isActive = true;
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

  // Soru sayacını güncelle
  ui.updateQuestionCounter(
    domElements,
    currentLesson.questionIndex + 1,
    currentLesson.totalQuestions,
  );

  ui.showFeedback(domElements, true, "", "listen");
  ui.showFeedback(domElements, true, "", "tap");
  ui.showFeedback(domElements, true, "", "mcq");
  ui.showFeedback(domElements, true, "", "reverse");

  if (question.type === "flashcard") {
    ui.setHintVisibility(domElements, false);
    const morseCode = MORSE_DATA[question.item] || "";
    ui.setupFlashcardUI(domElements, question.item, morseCode);
    audio.playMorseItem(question.item, MORSE_DATA);
  } else if (question.type === "listen") {
    ui.setHintVisibility(domElements, true);
    ui.setupListenUI(domElements, question.item);
    audio.playMorseItem(question.item, MORSE_DATA).then(() => {
      if (currentLesson.isActive) {
        ui.setExerciseControlsDisabled(domElements, "listen", false);
        domElements.listen.input.focus();
      }
    });
  } else if (question.type === "tap") {
    ui.setHintVisibility(domElements, true);
    resetTapState();
    ui.setupTapUI(domElements, question.item);
  } else if (question.type === "mcq") {
    ui.setHintVisibility(domElements, true);
    const allLetters = Object.keys(MORSE_DATA);
    const choices = generateMcqChoices(question.item, allLetters);
    ui.setupMcqUI(domElements, choices, question.item, handleMcqSelect);
    audio.playMorseItem(question.item, MORSE_DATA).then(() => {
      if (currentLesson.isActive) {
        domElements.mcq.btnPlaySound.disabled = false;
      }
    });
  } else if (question.type === "reverse") {
    ui.setHintVisibility(domElements, true);
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
    store.recordWrongAnswer(correctItem);
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
    store.recordWrongAnswer(correctItem);
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
    store.recordWrongAnswer(correctItem);
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
 * Tekrar dersi oluşturur — en çok yanlış yapılan harflerden otomatik ders planı yapar.
 * @returns {boolean} Ders başladıysa true, yeterli veri yoksa false
 */
export function startReviewLesson() {
  const weakLetters = store.getWeakLetters(6);
  if (weakLetters.length < 2) {
    showToast(
      "Henüz yeterli tekrar verisi yok. Birkaç ders tamamla!",
      "warning",
    );
    return false;
  }

  const letters = weakLetters.map((w) => w.letter);
  const questions = [];

  // Her zayıf harf için karışık soru tipleri
  letters.forEach((letter) => {
    questions.push({ type: "flashcard", item: letter });
  });
  letters.forEach((letter) => {
    questions.push({ type: "mcq", item: letter });
  });
  letters.forEach((letter) => {
    questions.push({ type: "listen", item: letter });
  });
  // İlk 4 harf için reverse & tap
  letters.slice(0, 4).forEach((letter) => {
    questions.push({ type: "reverse", item: letter });
  });
  letters.slice(0, 4).forEach((letter) => {
    questions.push({ type: "tap", item: letter });
  });

  // Plan'ı karıştır (flashcardlar hariç — onlar başta kalsın)
  const flashcards = questions.filter((q) => q.type === "flashcard");
  const rest = questions.filter((q) => q.type !== "flashcard");
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  const plan = [...flashcards, ...rest];

  currentLesson = {
    id: "review",
    plan: plan,
    questionIndex: 0,
    totalQuestions: plan.length,
    isActive: true,
    hearts: config.MAX_HEARTS,
  };

  ui.renderHearts(domElements, currentLesson.hearts, config.MAX_HEARTS);
  ui.showScreen(domElements, "screenExercise");
  ui.hideLessonIntro(domElements);
  ui.updateProgress(domElements, 0);
  showQuestion();
  return true;
}

/**
 * Tekrar dersi tamamlandığında completeLesson'daki kilit açma mantığını atlar.
 */

/**
 * Dersi başarıyla tamamlar.
 * DÜZELTME: 'complete' sesini çalar (İstek 1)
 */
async function completeLesson() {
  currentLesson.isActive = false;
  audio.stopAllAudio();
  resetTapState();

  // Tekrar dersi ise kilit açma mantığını atla
  if (currentLesson.id === "review") {
    const totalXPGained = config.XP_PER_LESSON_COMPLETE;
    const xpMessage = `+${totalXPGained} XP kazandın!`;
    await store.addXP(totalXPGained);

    ui.showCompleteScreen(
      domElements,
      "Tekrar dersi tamamlandı! Harika iş!",
      xpMessage,
      false,
      currentLesson.hearts,
    );

    // Öğrenilen harfler özeti
    const learnedItems = [
      ...new Set(
        currentLesson.plan.map((q) => q.item).filter((i) => i.length === 1),
      ),
    ];
    ui.showCompleteSummary(domElements, learnedItems, MORSE_DATA);

    ui.triggerConfetti();
    audio.playEffect("complete");
    return;
  }

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

  ui.showCompleteScreen(
    domElements,
    completeText,
    xpMessage,
    hasNextLesson,
    currentLesson.hearts,
  );

  // Öğrenilen harfler özeti
  const learnedItems = [
    ...new Set(
      currentLesson.plan.map((q) => q.item).filter((i) => i.length === 1),
    ),
  ];
  ui.showCompleteSummary(domElements, learnedItems, MORSE_DATA);

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
    if (onMenuReturnCallback) onMenuReturnCallback();
  }, config.FAIL_LESSON_DELAY);
}

/**
 * 'onLessonSelect' callback'i (main.js'den gelir)
 */
function onLessonSelect(lessonId, isLocked) {
  if (isLocked) {
    showToast("Bu ders kilitli! Önceki dersleri tamamlamalısın.", "warning");
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
  if (onMenuReturnCallback) onMenuReturnCallback();
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
    if (onMenuReturnCallback) onMenuReturnCallback();
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

/**
 * 'İpucu Göster' butonuna basıldığında çalışır.
 */
export function handleHintRequest() {
  if (!currentLesson.isActive) return;
  const question = currentLesson.plan[currentLesson.questionIndex];
  if (question.type === "flashcard") return; // flashcard'da ipucu gerekmez
  const morseCode = MORSE_DATA[question.item] || "";
  ui.showHint(domElements, question.item, morseCode);
}

/**
 * 'Mors Tablosu' butonuna basıldığında çalışır.
 */
export function handleMorseTableOpen() {
  ui.openMorseTable(domElements, MORSE_DATA);
}

/**
 * Mors Tablosu kapatılmak istendiğinde çalışır.
 */
export function handleMorseTableClose() {
  ui.closeMorseTable(domElements);
}
