// store.js
// Tüm Firebase Firestore (veritabanı) mantığını yönetir.

import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "./firebase.js";
import * as ui from "./ui.js";

let domElements;
let currentUser;
let userProgress = {
  unlockedLessons: ["lesson1"],
  xp: 0,
  streak: 0,
  lastLessonDate: null,
};

/**
 * Store modülünü başlatır ve DOM elementlerini/kullanıcıyı alır.
 * @param {object} elements - ui.initDOMElements() tarafından döndürülen nesne
 */
export function initStore(elements) {
  domElements = elements;
}

/**
 * Mevcut kullanıcıyı ayarlar.
 * @param {object} user - Firebase'den gelen kullanıcı nesnesi
 */
export function setCurrentUser(user) {
  currentUser = user;
}

/**
 * Mevcut kullanıcı ilerlemesini döndürür.
 */
export function getUserProgress() {
  return userProgress;
}

/**
 * Yeni kullanıcı için varsayılan ilerleme nesnesini döndürür.
 */
export function getNewUserProgress() {
  userProgress = {
    unlockedLessons: ["lesson1"],
    xp: 0,
    streak: 1,
    lastLessonDate: serverTimestamp(),
  };
  return userProgress;
}

/**
 * Kullanıcının ilerleme verisini Firestore'dan yükler.
 */
export async function loadProgress() {
  if (!currentUser) return;

  const userRef = doc(db, "users", currentUser.uid);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    userProgress = docSnap.data();
    await checkStreak(userRef);
  } else {
    userProgress = getNewUserProgress();
    await setDoc(userRef, userProgress);
  }

  // UI'ı yüklenen veriyle güncelle
  ui.showUserUI(domElements, currentUser, userProgress);
}

/**
 * Kullanıcının ilerlemesini Firestore'a kaydeder (kısmi güncelleme).
 * @param {object} dataToUpdate - Güncellenecek veri (örn: { xp: 100 })
 */
export async function saveProgress(dataToUpdate) {
  if (!currentUser) return;
  const userRef = doc(db, "users", currentUser.uid);
  try {
    await updateDoc(userRef, dataToUpdate);
  } catch (e) {
    console.error("İlerleme kaydedilemedi:", e);
  }
}

/**
 * Kullanıcının günlük serisini kontrol eder ve günceller.
 * @param {DocumentReference} userRef - Kullanıcının Firestore'daki döküman referansı
 */
async function checkStreak(userRef) {
  if (!userProgress.lastLessonDate) {
    const updateData = { streak: 1, lastLessonDate: serverTimestamp() };
    userProgress.streak = 1;
    await saveProgress(updateData);
    ui.updateStreak(domElements, 1);
    return;
  }

  const lastDate = userProgress.lastLessonDate.toDate();
  const today = new Date();
  const lastLessonDay = new Date(
    lastDate.getFullYear(),
    lastDate.getMonth(),
    lastDate.getDate()
  );
  const todayDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const diffTime = todayDay - lastLessonDay;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let updateData = {};
  if (diffDays === 1) {
    userProgress.streak += 1;
    updateData = {
      streak: userProgress.streak,
      lastLessonDate: serverTimestamp(),
    };
  } else if (diffDays > 1) {
    userProgress.streak = 1;
    updateData = { streak: 1, lastLessonDate: serverTimestamp() };
  } else {
    ui.updateStreak(domElements, userProgress.streak);
    return;
  }

  await saveProgress(updateData);
  ui.updateStreak(domElements, userProgress.streak);
}

/**
 * Kullanıcının XP puanına ekleme yapar ve kaydeder.
 * @param {number} amount - Eklenecek XP miktarı
 */
export async function addXP(amount) {
  if (!currentUser) return;
  const newXP = (userProgress.xp || 0) + amount;
  userProgress.xp = newXP;
  ui.updateXP(domElements, newXP);
  await saveProgress({ xp: newXP });
}

/**
 * İlerlemeyi sıfırlar (Sadece kilidi açılmış dersleri).
 */
export async function resetProgress() {
  if (!currentUser) return;
  if (
    confirm(
      "Emin misin? Sadece ders ilerlemen (açılan kilitler) sıfırlanacak. XP ve Serin korunacak."
    )
  ) {
    userProgress.unlockedLessons = ["lesson1"];
    await saveProgress({ unlockedLessons: ["lesson1"] });
    alert("Ders ilerlemesi sıfırlandı.");
    // 'main.js' renderLessonMenu'yü çağıracak
  }
}
