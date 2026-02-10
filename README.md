# 📡 MorseLingo

Mors alfabesini interaktif ve oyunlaştırılmış derslerle öğreten bir web uygulaması.

**[🔗 Canlı Demo](https://morselingo.web.app)**

---

## 🎯 Özellikler

- **20 kademeli ders** — Temel harflerden (E, T) başlayarak tüm alfabe ve rakamları kapsar
- **İki alıştırma modu:**
  - 🎧 **Dinle & Yaz** — Mors sesini dinleyip ilgili harfi/kelimeyi yazma
  - 🔘 **Vur** — Mors tuşuyla doğru ritmi vurma
- **Oyunlaştırma** — XP sistemi, günlük seri (streak), lider tablosu
- **Firebase entegrasyonu** — E-posta/Google ile giriş, bulut tabanlı ilerleme kaydetme
- **Mobil uyumlu** — Responsive tasarım, dokunmatik mors tuşu desteği
- **Ses efektleri** — Doğru/yanlış cevap sesleri, ders tamamlama efektleri

## 🛠️ Kullanılan Teknolojiler

| Teknoloji                 | Kullanım                           |
| ------------------------- | ---------------------------------- |
| HTML5 / CSS3 / Vanilla JS | Frontend (framework'süz)           |
| Web Audio API             | Mors sesi üretimi                  |
| Firebase Auth             | Kullanıcı kimlik doğrulama         |
| Firebase Firestore        | Kullanıcı verileri & lider tablosu |
| Firebase Hosting          | Deploy & barındırma                |
| Canvas Confetti           | Ders tamamlama animasyonu          |

## 📁 Proje Yapısı

```
MorseLingo/
├── index.html              # Ana HTML dosyası
├── main.js                 # Uygulama orkestratörü
├── config.js               # Sabit ayarlar (zamanlama, XP, vb.)
├── data.json               # Mors kodu ve ders verileri
├── ui.js                   # DOM manipülasyonları
├── lesson.js               # Ders mantığı
├── audio.js                # Web Audio API yönetimi
├── tap-input.js            # Mors tuşu giriş sistemi
├── auth.js                 # Firebase Auth işlemleri
├── store.js                # Firestore veri yönetimi
├── firebase.js             # Firebase başlatma
├── firebaseConfig.js       # Firebase yapılandırması (gitignore'da)
├── firestore.rules         # Firestore güvenlik kuralları
├── css/
│   ├── 1-main.css          # Temel stiller
│   ├── 2-auth.css          # Giriş/Kayıt stili
│   ├── 3-menu.css          # Ders menüsü stili
│   ├── 4-exercise.css      # Alıştırma stili
│   ├── 5-tap-module.css    # Mors tuşu stili
│   ├── 6-mobile.css        # Responsive (mobil) stiller
│   ├── 7-animations.css    # Animasyonlar
│   └── 8-leaderboard.css   # Lider tablosu stili
└── sounds/
    ├── correct.mp3
    ├── wrong.mp3
    ├── complete.mp3
    └── failed.mp3
```

## 🚀 Kurulum

### Gereksinimler

- Bir Firebase projesi ([Firebase Console](https://console.firebase.google.com/))
- Node.js (Firebase CLI için)

### Adımlar

1. **Repo'yu klonlayın:**

   ```bash
   git clone https://github.com/burakguclu/MorseLingo.git
   cd MorseLingo
   ```

2. **Firebase yapılandırmasını ayarlayın:**

   ```bash
   cp firebaseConfig.example.js firebaseConfig.js
   ```

   `firebaseConfig.js` dosyasını kendi Firebase proje bilgilerinizle doldurun.

3. **Firebase CLI kurun (opsiyonel, deploy için):**

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy
   ```

4. **Lokal geliştirme:**
   Herhangi bir statik dosya sunucusu kullanabilirsiniz:
   ```bash
   npx serve .
   ```
   veya VS Code "Live Server" eklentisiyle doğrudan `index.html`'i açın.

## 🎓 Ders Programı

| #   | Ders                     | İçerik                          |
| --- | ------------------------ | ------------------------------- |
| 1   | En Temeller              | E, T                            |
| 2   | Kısa Zıtlar              | I, M                            |
| 3   | Uzun Zıtlar              | A, N                            |
| 4   | Kelime Pratiği 1         | ME, IN, MAN, NET, EAT           |
| 5   | Sadece Noktalar/Çizgiler | S, O                            |
| 6   | Kelime Pratiği 2         | SO, SOS, SON, ON, NO, SOON      |
| 7   | Ayna Görüntüleri         | R, U, D, K                      |
| 8   | Kelime Pratiği 3         | RUN, USE, RED, DARK, END        |
| 9   | Başı Çizgili             | G, W, P, B                      |
| 10  | Kelime Pratiği 4         | GO, WE, BIG, UP, BED, WAR       |
| 11  | Dört Vuruşlular          | H, V, F, L                      |
| 12  | Kelime Pratiği 5         | HAVE, FIVE, LIFE, FEEL          |
| 13  | Geri Kalanlar 1          | J, Y                            |
| 14  | Geri Kalanlar 2          | Q, Z                            |
| 15  | Geri Kalanlar 3          | X, C                            |
| 16  | Kelime Pratiği 6 (Zor)   | YES, YOU, ZONE, QUIZ, FOX       |
| 17  | Rakamlar 1               | 1, 2, 3, 4, 5                   |
| 18  | Rakamlar 2               | 6, 7, 8, 9, 0                   |
| 19  | Kelime Pratiği 7         | 10, 25, 73, 198, 2024           |
| 20  | Final Sınavı             | Tüm harf ve kelimelerle karışık |

## 📄 Lisans

MIT License — Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👤 Geliştirici

**Burak Güçlü** — [@burakguclu](https://github.com/burakguclu)
