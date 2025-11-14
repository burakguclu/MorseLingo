// auth.js
// Tüm Firebase Authentication mantığını yönetir.

import * as ui from "./ui.js";
import {
  auth,
  db,
  doc,
  setDoc,
  serverTimestamp, // Firestore fonksiyonları eklendi
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "./firebase.js";

let domElements;

/**
 * Auth modülünü başlatır ve DOM elementlerini alır.
 */
export function initAuth(elements) {
  domElements = elements;
}

/**
 * Google ile girişi yönetir.
 */
export function handleGoogleLogin() {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider).catch((error) =>
    handleAuthError(error, "login")
  );
}

/**
 * E-posta ile kaydı yönetir.
 * DÜZELTME: Kullanıcı adı eklendi.
 */
export async function handleEmailRegister(e) {
  if (e) e.preventDefault();

  // YENİ: Kullanıcı adı alanı okundu
  const username = domElements.register.inputUsername.value.trim();
  const email = domElements.register.inputEmail.value;
  const password = domElements.register.inputPassword.value;
  const confirm = domElements.register.inputPasswordConfirm.value;

  // YENİ: Kullanıcı adı doğrulaması
  if (username.length < 3) {
    handleAuthError({ code: "auth/username-too-short" }, "register");
    return;
  }
  if (password !== confirm) {
    handleAuthError({ code: "auth/password-mismatch" }, "register");
    return;
  }

  try {
    // 1. Auth kullanıcısını oluştur
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // 2. Auth kullanıcısı oluşur oluşmaz, Firestore belgesini de oluştur
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      username: username, // Yeni kullanıcı adını kaydet
      email: user.email,
      unlockedLessons: ["lesson1"],
      xp: 0,
      streak: 1,
      lastLessonDate: serverTimestamp(),
    });

    // 3. Başarılı kayıttan sonra yönlendir
    alert("Kayıt başarılı! Lütfen şimdi giriş yapın.");
    ui.showScreen(domElements, "screenLogin");
    domElements.loginForm.reset();
    domElements.registerForm.reset();
    domElements.login.inputEmail.value = email;
    domElements.login.inputPassword.focus();
    ui.showAuthError(domElements, "register", "");
  } catch (error) {
    handleAuthError(error, "register");
  }
}

/**
 * E-posta ile girişi yönetir.
 */
export function handleEmailLogin(e) {
  if (e) e.preventDefault();
  const email = domElements.login.inputEmail.value;
  const password = domElements.login.inputPassword.value;
  signInWithEmailAndPassword(auth, email, password).catch((error) =>
    handleAuthError(error, "login")
  );
}

/**
 * Çıkış işlemini yönetir.
 */
export function handleLogout() {
  signOut(auth).catch((error) => handleAuthError(error, "login"));
}

/**
 * Firebase Auth hatalarını yakalar ve kullanıcıya anlamslı mesajlar gösterir.
 * DÜZELTME: Yeni hata kodları eklendi.
 */
export function handleAuthError(error, screen) {
  let message = "Bilinmeyen bir hata oluştu.";

  switch (error.code) {
    case "auth/invalid-email":
      message = "Lütfen geçerli bir e-posta adresi girin.";
      break;
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-login-credentials":
      message = "E-posta veya şifre hatalı. Lütfen tekrar deneyin.";
      break;
    case "auth/email-already-in-use":
      message = "Bu e-posta adresi zaten kullanımda.";
      break;
    case "auth/weak-password":
      message = "Şifre çok zayıf. En az 6 karakter olmalı.";
      break;
    case "auth/password-mismatch": // Özel
      message = "Hata: Şifreler eşleşmiyor!";
      break;
    case "auth/username-too-short": // Özel
      message = "Kullanıcı adı en az 3 karakter olmalı.";
      break;
  }

  ui.showAuthError(domElements, screen, message);
}

/**
 * Kullanıcı oturum durumundaki değişiklikleri dinler.
 */
export function listenForAuthChanges(onLogin, onLogout) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await onLogin(user);
    } else {
      onLogout();
    }
  });
}
