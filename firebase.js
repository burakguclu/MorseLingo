// firebase.js
// Firebase'i başlatır ve hizmetleri dışa aktarır.

// YENİ İÇE AKTARMA YÖNTEMİ (v9 MODÜLER)
// Script'leri CDN'den (internet) değil, 'node_modules' paketinden
// alır gibi davranacağız, ancak 'import' URL'leri tarayıcı tarafından
// doğrudan Firebase sunucularından alınacak.
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { firebaseConfig } from "./firebaseConfig.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Hizmetleri al ve dışa aktar
export const auth = getAuth(app);
export const db = getFirestore(app);

// Diğer gerekli fonksiyonları ve sabitleri de dışa aktar
export {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
};
