// --------- YENİ SCRIPT.JS (Bölüm 1: Yönlendirici) ---------

// Sayfa yüklendiğinde 'init' (başlatma) fonksiyonunu çalıştır
window.addEventListener("DOMContentLoaded", init);

// --- 1. TÜM HTML ELEMANLARINI TANIMLAMA ---
// Ekranlar
let screenMenu, screenExercise, screenComplete;
// Menü Butonları
let btnLesson1, btnLesson2;
// Alıştırma Ekranı Butonları
let btnBackToMenu;
// Alıştırma Modülleri (Dinle, Vur)
let moduleListen, moduleTap;

function init() {
  console.log("MorseLingo Uygulaması Başlatılıyor...");

  // Ekranları bul
  screenMenu = document.getElementById("screenMenu");
  screenExercise = document.getElementById("screenExercise");
  screenComplete = document.getElementById("screenComplete");

  // Alıştırma modüllerini bul
  moduleListen = document.getElementById("exerciseListen");
  moduleTap = document.getElementById("exerciseTap");

  // Menü butonlarını bul
  btnLesson1 = document.getElementById("btnLesson1");
  btnLesson2 = document.getElementById("btnLesson2");

  // Diğer butonlar
  btnBackToMenu = document.getElementById("btnBackToMenu");

  // --- 2. OLAY DİNLEYİCİLERİ (Tıklamalar) ---

  // Ders 1 Butonuna tıklanırsa:
  btnLesson1.addEventListener("click", () => {
    // 'lesson1' ID'si ile dersi başlat (bu fonksiyonu bir sonraki adımda yapacağız)
    startLesson("lesson1");
  });

  // Ders 2 Butonuna tıklanırsa (kilitli):
  btnLesson2.addEventListener("click", () => {
    if (btnLesson2.classList.contains("locked")) {
      alert("Bu ders kilitli! Önce Ders 1'i tamamlamalısın.");
    } else {
      startLesson("lesson2");
    }
  });

  // "Menüye Dön" butonuna tıklanırsa:
  btnBackToMenu.addEventListener("click", () => {
    showScreen("screenMenu");
  });

  console.log("Ekranlar ve butonlar yüklendi.");

  // Şimdilik, localStorage ve ders mantığı yerine sadece navigasyonu test ediyoruz.
  // Gerçek uygulamada burada 'renderMenu()' fonksiyonunu çağıracağız.
}

// --- 3. EKRAN GÖSTERME FONKSİYONU ---
// Bu fonksiyon, tüm ekranları gizler ve sadece istenen ID'li ekranı gösterir.
function showScreen(screenId) {
  console.log(`Ekran değiştiriliyor: ${screenId}`);

  // Tüm ekranları gizle
  screenMenu.classList.add("hidden");
  screenExercise.classList.add("hidden");
  screenComplete.classList.add("hidden");

  // Sadece istenen ekranı bul ve göster
  const activeScreen = document.getElementById(screenId);
  if (activeScreen) {
    activeScreen.classList.remove("hidden");
  }
}

// --- 4. DERS MANTIĞI (ŞİMDİLİK BOŞ) ---
// Bu, bir sonraki adımda dolduracağımız en önemli fonksiyon
function startLesson(lessonId) {
  console.log(`${lessonId} dersi başlatılıyor...`);

  // 1. Menü ekranını gizle, alıştırma ekranını göster
  showScreen("screenExercise");

  // 2. Alıştırma modüllerini hazırla (şimdilik sadece birini gösterelim)
  // Gerçekte burada bir ders motoru olacak
  moduleListen.classList.remove("hidden");
  moduleTap.classList.add("hidden");

  // 3. İlerleme çubuğunu sıfırla
  const progressFill = document.getElementById("progressFill");
  progressFill.style.width = "0%";

  // -- BURAYA DERS MOTORU GELECEK --
  alert("Ders başladı! (Motor henüz kodlanmadı)");
}
