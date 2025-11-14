// auth.js
// Tüm Firebase Authentication mantığını yönetir.

import * as ui from "./ui.js";
import {
  auth,
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
 * @param {object} elements - ui.initDOMElements() tarafından döndürülen nesne
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
 * @param {Event} e - Form gönderme olayı
 */
export async function handleEmailRegister(e) {
  if (e) e.preventDefault();

  const email = domElements.register.inputEmail.value;
  const password = domElements.register.inputPassword.value;
  const confirm = domElements.register.inputPasswordConfirm.value;

  if (password !== confirm) {
    handleAuthError({ code: "auth/password-mismatch" }, "register");
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Kayıt başarılı! Lütfen şimdi giriş yapın.");

    // Başarılı kayıttan sonra giriş ekranına yönlendir ve formu temizle
    ui.showScreen(domElements, "screenLogin");
    domElements.loginForm.reset();
    domElements.registerForm.reset();
    domElements.login.inputEmail.value = email; // E-postayı hazır getir
    domElements.login.inputPassword.focus(); // Şifreye odaklan
    ui.showAuthError(domElements, "register", ""); // Hata mesajını temizle
  } catch (error) {
    handleAuthError(error, "register");
  }
}

/**
 * E-posta ile girişi yönetir.
 * @param {Event} e - Form gönderme olayı
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
 * @param {Error} error - Firebase'den gelen hata nesnesi
 * @param {string} screen - 'login' veya 'register'
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
    case "auth/password-mismatch": // Özel hata kodumuz
      message = "Hata: Şifreler eşleşmiyor!";
      break;
  }

  ui.showAuthError(domElements, screen, message);
}

/**
 * Kullanıcı oturum durumundaki değişiklikleri dinler.
 * @param {function} onLogin - Kullanıcı giriş yaptığında çalışacak callback
 * @param {function} onLogout - Kullanıcı çıkış yaptığında çalışacak callback
 */
export function listenForAuthChanges(onLogin, onLogout) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await onLogin(user); // main.js'deki onUserLogin fonksiyonu
    } else {
      onLogout(); // main.js'deki onUserLogout fonksiyonu
    }
  });
}
