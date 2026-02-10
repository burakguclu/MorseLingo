// settings.js
// Ayarlar modalı: ses seviyesi, frekans, karanlık mod yönetimi.

const SETTINGS_KEY = "morselingo_settings";

const ONBOARDING_SLIDES = [
  {
    icon: "📡",
    title: "MorseLingo'ya Hoş Geldin!",
    text: "Mors alfabesini interaktif derslerle öğren. Dinle, yaz, vur ve XP kazan!",
  },
  {
    icon: "🎧",
    title: "Dinle ve Yaz",
    text: 'Mors kodunu dinle, doğru harfi yaz. "İpucu" butonu ile yardım alabilirsin.',
  },
  {
    icon: "🔘",
    title: "Mors Tuşu ile Vur",
    text: "Dijital mors tuşuna basılı tutarak kısa (dit) ve uzun (dah) sinyaller üret.",
  },
  {
    icon: "🏆",
    title: "XP Kazan, Seri Yap!",
    text: "Her doğru cevap XP kazandırır. Günlük pratik yaparak serinı artır!",
  },
];

let settings = {
  volume: 80,
  frequency: 700,
  darkMode: false,
};

let currentSlide = 0;
let onFrequencyChange = null;
let onVolumeChange = null;

/**
 * Ayarları localStorage'dan yükler.
 */
function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      settings = { ...settings, ...JSON.parse(saved) };
    }
  } catch {
    // Varsayılan ayarlarla devam et
  }
}

/**
 * Ayarları localStorage'a kaydeder.
 */
function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Sessizce geç
  }
}

/**
 * Karanlık modu uygular/kaldırır.
 */
function applyDarkMode(enabled) {
  if (enabled) {
    document.documentElement.setAttribute("data-theme", "dark");
    document.querySelector('meta[name="theme-color"]').content = "#1e293b";
  } else {
    document.documentElement.removeAttribute("data-theme");
    document.querySelector('meta[name="theme-color"]').content = "#4F46E5";
  }
}

/**
 * Ayarları başlatır ve event listener'ları bağlar.
 */
export function initSettings(callbacks) {
  onFrequencyChange = callbacks.onFrequencyChange || null;
  onVolumeChange = callbacks.onVolumeChange || null;

  loadSettings();

  // Dark mode'u hemen uygula
  applyDarkMode(settings.darkMode);

  // DOM elemanları
  const modal = document.getElementById("settingsModal");
  const btnOpen = document.getElementById("btnSettings");
  const btnClose = document.getElementById("btnCloseSettings");
  const volumeSlider = document.getElementById("volumeSlider");
  const volumeValue = document.getElementById("volumeValue");
  const freqSlider = document.getElementById("frequencySlider");
  const freqValue = document.getElementById("frequencyValue");
  const darkToggle = document.getElementById("darkModeToggle");

  // Ayarları UI'a yansıt
  volumeSlider.value = settings.volume;
  volumeValue.textContent = `${settings.volume}%`;
  freqSlider.value = settings.frequency;
  freqValue.textContent = `${settings.frequency} Hz`;
  darkToggle.checked = settings.darkMode;

  // Sesi başlangıçta ayarla
  if (onVolumeChange) onVolumeChange(settings.volume);
  if (onFrequencyChange) onFrequencyChange(settings.frequency);

  // Modal aç/kapa
  btnOpen.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });

  btnClose.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });

  // Volume slider
  volumeSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    settings.volume = val;
    volumeValue.textContent = `${val}%`;
    saveSettings();
    if (onVolumeChange) onVolumeChange(val);
  });

  // Frequency slider
  freqSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    settings.frequency = val;
    freqValue.textContent = `${val} Hz`;
    saveSettings();
    if (onFrequencyChange) onFrequencyChange(val);
  });

  // Dark mode toggle
  darkToggle.addEventListener("change", (e) => {
    settings.darkMode = e.target.checked;
    applyDarkMode(settings.darkMode);
    saveSettings();
  });
}

/**
 * Mevcut ayarları döndürür.
 */
export function getSettings() {
  return { ...settings };
}

// --- ONBOARDING ---

/**
 * Onboarding'i gösterir (ilk kullanıcı deneyimi).
 */
export function showOnboarding() {
  if (localStorage.getItem("morselingo_onboarded")) return;

  currentSlide = 0;
  const modal = document.getElementById("onboardingModal");
  const dotsEl = document.getElementById("onboardingDots");

  // Dot'ları oluştur
  dotsEl.innerHTML = "";
  ONBOARDING_SLIDES.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.className = `onboarding-dot${i === 0 ? " active" : ""}`;
    dotsEl.appendChild(dot);
  });

  renderSlide();
  modal.classList.remove("hidden");

  // Event listeners
  const btnNext = document.getElementById("btnOnboardingNext");
  const btnSkip = document.getElementById("btnOnboardingSkip");

  const nextHandler = () => {
    currentSlide++;
    if (currentSlide >= ONBOARDING_SLIDES.length) {
      closeOnboarding();
      btnNext.removeEventListener("click", nextHandler);
      btnSkip.removeEventListener("click", skipHandler);
      return;
    }
    renderSlide();
  };

  const skipHandler = () => {
    closeOnboarding();
    btnNext.removeEventListener("click", nextHandler);
    btnSkip.removeEventListener("click", skipHandler);
  };

  btnNext.addEventListener("click", nextHandler);
  btnSkip.addEventListener("click", skipHandler);
}

function renderSlide() {
  const slide = ONBOARDING_SLIDES[currentSlide];
  document.getElementById("onboardingIcon").textContent = slide.icon;
  document.getElementById("onboardingTitle").textContent = slide.title;
  document.getElementById("onboardingText").textContent = slide.text;

  const dots = document.querySelectorAll(".onboarding-dot");
  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === currentSlide);
  });

  const btnNext = document.getElementById("btnOnboardingNext");
  if (currentSlide === ONBOARDING_SLIDES.length - 1) {
    btnNext.textContent = "Başla! 🚀";
  } else {
    btnNext.textContent = "Devam →";
  }
}

function closeOnboarding() {
  document.getElementById("onboardingModal").classList.add("hidden");
  localStorage.setItem("morselingo_onboarded", "true");
}
