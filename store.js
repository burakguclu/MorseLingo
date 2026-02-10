// store.js
// Tüm Firebase Firestore (veritabanı) mantığını yönetir.

import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "./firebase.js";
import * as ui from "./ui.js";
import { showToast } from "./toast.js";

let domElements;
let currentUser;
let userProgress = {
  unlockedLessons: ["lesson1"],
  xp: 0,
  streak: 0,
  lastLessonDate: null,
  username: "Ziyaretçi",
  email: "",
};

/**
 * Store modülünü başlatır.
 */
export function initStore(elements) {
  domElements = elements;
}

/**
 * Mevcut kullanıcıyı ayarlar.
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
 * DÜZELTME: Parametreler eklendi.
 */
export function getNewUserProgress(username, email) {
  userProgress = {
    username: username || "Bilinmeyen",
    email: email || "",
    unlockedLessons: ["lesson1"],
    xp: 0,
    streak: 1,
    lastLessonDate: serverTimestamp(),
  };
  return userProgress;
}

/**
 * Kullanıcının ilerleme verisini Firestore'dan yükler.
 * DÜZELTME: Google/eski kullanıcılar için 'username' oluşturur.
 */
export async function loadProgress() {
  if (!currentUser) return;

  try {
    const userRef = doc(db, "users", currentUser.uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      userProgress = docSnap.data();

      // YENİ: Eski (Google) kullanıcılar için 'username' alanı ekle
      if (!userProgress.username) {
        const defaultUsername = currentUser.email.split("@")[0];
        userProgress.username = defaultUsername;
        // E-postayı da kaydet (eğer o da eksikse)
        userProgress.email = currentUser.email;
        await saveProgress({
          username: defaultUsername,
          email: currentUser.email,
        });
      }

      await checkStreak(userRef);
    } else {
      // Bu artık SADECE Google ile ilk kez giriş yapan kullanıcılar için çalışır
      const defaultUsername = currentUser.email.split("@")[0];
      userProgress = getNewUserProgress(defaultUsername, currentUser.email);
      await setDoc(userRef, userProgress);
    }

    ui.showUserUI(domElements, currentUser, userProgress);
  } catch (e) {
    console.error("İlerleme yüklenemedi:", e);
    // Varsayılan ilerleme ile devam et
    userProgress = getNewUserProgress(
      currentUser.email ? currentUser.email.split("@")[0] : "Bilinmeyen",
      currentUser.email || "",
    );
    ui.showUserUI(domElements, currentUser, userProgress);
  }
}
/**
 * Kullanıcının ilerlemesini Firestore'a kaydeder (kısmi güncelleme).
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
    lastDate.getDate(),
  );
  const todayDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
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
 */
export async function addXP(amount) {
  if (!currentUser) return;
  const newXP = (userProgress.xp || 0) + amount;
  userProgress.xp = newXP;
  ui.updateXP(domElements, newXP);
  if (amount >= 50) {
    showToast(`+${amount} XP kazandın!`, "xp");
  }
  await saveProgress({ xp: newXP });
}

/**
 * İlerlemeyi sıfırlar (Sadece kilidi açılmış dersleri).
 */
export async function resetProgress() {
  if (!currentUser) return;
  if (
    confirm(
      "Emin misin? Sadece ders ilerlemen (açılan kilitler) sıfırlanacak. XP ve Serin korunacak.",
    )
  ) {
    userProgress.unlockedLessons = ["lesson1"];
    await saveProgress({ unlockedLessons: ["lesson1"] });
    showToast("Ders ilerlemesi sıfırlandı.", "warning");
  }
}

/**
 * En yüksek XP'ye sahip 10 kullanıcıyı Firestore'dan çeker.
 * DÜZELTME: 'username' çeker.
 */
export async function fetchLeaderboard() {
  const usersRef = collection(db, "users");
  const q = query(usersRef, orderBy("xp", "desc"), limit(10));

  try {
    const querySnapshot = await getDocs(q);
    const leaderboardData = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      leaderboardData.push({
        // 'username' kullan, yoksa e-postayı yedek olarak al
        username:
          data.username ||
          (data.email ? data.email.split("@")[0] : "Bilinmeyen"),
        xp: data.xp || 0,
      });
    });
    return leaderboardData;
  } catch (e) {
    console.error("Lider tablosu çekilemedi:", e);
    return [];
  }
}
