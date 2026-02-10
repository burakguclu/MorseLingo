# MorseLingo - Geliştirme & Deploy TODO Listesi

> Bu dosya, projenin deploy'a hazır hale getirilmesi, kod kalitesinin artırılması ve ders içeriklerinin iyileştirilmesi için yapılacak tüm işleri içerir.

---

## 🔴 BÖLÜM A: GÜVENLİK & KRİTİK

- [x] **A1.** Firebase API anahtarlarını `.gitignore` ile koruma altına al
  - `firebaseConfig.js` dosyasındaki API anahtarları doğrudan GitHub'da açık durumda
  - `.gitignore` dosyası oluştur
  - `firebaseConfig.js` dosyasını `.gitignore`'a ekle
  - Örnek bir `firebaseConfig.example.js` dosyası oluştur

- [x] **A2.** Firebase Security Rules kontrolü
  - Firestore Security Rules dokümanı oluştur (`firestore.rules`)
  - Kullanıcılar sadece kendi verilerini okuyup yazabilmeli
  - Lider tablosu herkes tarafından okunabilmeli

---

## 🟠 BÖLÜM B: DEPLOY'A HAZIRLIK

- [x] **B1.** `README.md` oluştur
  - Proje açıklaması, kurulum talimatları, kullanılan teknolojiler
  - Ekran görüntüleri, canlı demo linki alanı
  - Firebase kurulum adımları

- [x] **B2.** `package.json` oluştur
  - Proje meta bilgileri (isim, versiyon, açıklama, lisans)
  - Deploy script'leri (Firebase Hosting için)

- [x] **B3.** Firebase Hosting konfigürasyonu
  - `firebase.json` dosyası oluştur
  - `.firebaserc` dosyası oluştur
  - SPA (Single Page App) yönlendirme ayarını ekle

- [x] **B4.** SEO & Meta tag'ler
  - `<meta name="description">` ekle
  - `<meta name="theme-color">` ekle
  - Open Graph (og:title, og:description, og:image) tag'leri ekle
  - `<link rel="icon">` favicon ekle
  - `<meta name="robots">` ekle
  - `lang="tr"` zaten var ✅

- [x] **B5.** PWA (Progressive Web App) desteği
  - `manifest.json` oluştur (uygulama adı, ikonlar, tema rengi)
  - Temel bir `service-worker.js` oluştur (offline desteği)
  - `index.html`'e manifest ve service worker bağlantısı ekle

---

## 🟡 BÖLÜM C: KOD KALİTESİ & PERFORMANS

- [x] **C1.** HTML semantik iyileştirmeler
  - `<main>` etiketi zaten var ✅
  - `<header>` etiketi zaten var ✅
  - `<footer>` etiketi ekle (telif hakkı / versiyon bilgisi)
  - `aria-label` erişilebilirlik etiketleri ekle
  - Form alanlarına `<label>` ekle

- [x] **C2.** CSS optimizasyonu
  - 8 ayrı CSS dosyasını tek bir minified dosyada birleştir (veya en azından import sırasını belgele)
  - CSS değişkenleri (custom properties) kullan - renk ve spacing tutarlılığı
  - Tekrarlanan stil kalıplarını birleştir

- [x] **C3.** JavaScript hata yönetimi
  - `audio.js`: AudioContext tarayıcı desteği kontrolü ekle
  - `store.js`: Firestore hata durumlarında kullanıcı bilgilendirme ekle
  - `lesson.js`: Geçersiz ders ID'si kontrolü ekle
  - Network hatalarında retry mekanizması düşün

- [x] **C4.** Erişilebilirlik (Accessibility / a11y)
  - Tüm butonlara `aria-label` ekle
  - Klavye navigasyonu kontrolü yap
  - Renk kontrastı kontrolü yap
  - Ekran okuyucu uyumluluğu

---

## 🟢 BÖLÜM D: DERS İÇERİKLERİ İYİLEŞTİRME

- [x] **D1.** Ders yapısını pedagojik olarak yeniden düzenle

- [x] **D2.** Yeni ders tipleri ekle
  - **"Çoktan seçmeli" (multiple-choice):** Ses çalar, 4 seçenekten doğru harfi seçtir
  - **"Eşleştirme" (matching):** Harf-mors kod eşleştirmesi
  - **"Mors→Harf" ters alıştırma:** Mors kodu yazılı gösterilir, harfi yazması istenir

- [x] **D3.** İpucu/Yardım sistemi
  - Her soruda "İpucu Göster" butonu ekle
  - İpucu: İlgili harfin mors kodunu göster
  - Mors alfabesi referans tablosu (her zaman erişilebilir bir butonla)

- [ ] **D4.** Tekrar/Spaced Repetition sistemi
  - Yanlış yapılan soruları takip et
  - "Tekrar Dersi" otomatik oluştur (en çok hata yapılan harflerden)
  - Günlük pratik önerisi

- [ ] **D5.** Ders içi ilerleme göstergeleri
  - Her dersin "content" alanında mors kodlarını da göster
  - Dersten önce kısa bir "Bu derste öğreneceklerin" özeti göster
  - Ders sonunda "Bu derste öğrendiklerin" özet kartı

---

## 🔵 BÖLÜM E: UX / KULLANICI DENEYİMİ

- [x] **E1.** Loading/Splash ekranı
  - Uygulama yüklenirken bir loading animasyonu göster
  - Firebase bağlantısı kurulana kadar bekle

- [x] **E2.** Ses seviyesi kontrolü
  - Mors sesi frekansı (700Hz) kullanıcı tarafından ayarlanabilir olmalı
  - Ses açma/kapama butonu

- [x] **E3.** Dark mode desteği
  - CSS değişkenleri üzerinden kolay geçiş
  - Kullanıcı tercihini localStorage'da sakla

- [x] **E4.** Bildirim / Toast mesajları
  - `alert()` çağrılarını modern toast bildirimlerine dönüştür
  - XP kazanımı, seri bildirimi gibi durumlar için

- [x] **E5.** Onboarding / İlk kullanıcı deneyimi
  - İlk girişte kısa bir "Nasıl kullanılır?" rehberi göster
  - Mors alfabesi nedir? kısa bir tanıtım

---

## İŞ SIRASI (Önerilen uygulama sırası)

1. ~~A1 → Güvenlik önce~~ ✅
2. ~~A2 → Güvenlik kuralları~~ ✅
3. ~~B1 → README~~ ✅
4. ~~B2 → package.json~~ ✅
5. ~~B3 → Firebase Hosting config~~ ✅
6. ~~B4 → SEO & Meta~~ ✅
7. ~~B5 → PWA desteği~~ ✅
8. ~~C1 → HTML iyileştirmeler~~ ✅
9. ~~C2 → CSS optimizasyonu~~ ✅
10. ~~C3 → JS hata yönetimi~~ ✅
11. ~~C4 → Erişilebilirlik~~ ✅
12. D1 → Ders flashcard'ları
13. D2 → Yeni ders tipleri
14. D3 → İpucu sistemi
15. D4 → Tekrar sistemi
16. D5 → Ders özet kartları
17. E1-E5 → UX iyileştirmeleri
