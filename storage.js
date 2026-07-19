// ==========================================================================
// Storage: Load, Save, Reset, Import/Export settings and categories
// ==========================================================================
import { DEFAULT_CATEGORIES, DEFAULT_GLOBAL_SETTINGS, state } from './constants.js';

export function loadSettingsAndCategories() {
  const storedCategories = localStorage.getItem('aurum_categories');
  const storedSettings = localStorage.getItem('aurum_settings');

  if (storedCategories) {
    state.categories = JSON.parse(storedCategories);
  } else {
    state.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
  }

  // Fallback activeCategoryId to first available if not found
  if (state.categories.length > 0 && !state.categories.find(c => c.id === state.activeCategoryId)) {
    state.activeCategoryId = state.categories[0].id;
  }

  if (storedSettings) {
    state.settings = JSON.parse(storedSettings);
    if (state.settings.exchangeLoss === undefined) {
      state.settings.exchangeLoss = DEFAULT_GLOBAL_SETTINGS.exchangeLoss;
      state.settings.defaultLoss = DEFAULT_GLOBAL_SETTINGS.defaultLoss;
    }
  } else {
    state.settings = JSON.parse(JSON.stringify(DEFAULT_GLOBAL_SETTINGS));
  }

  // Populate config fields in settings panel
  document.getElementById('cfg-buyback-rate').value = state.settings.buybackRate;
  document.getElementById('buyback-rate-input').value = state.settings.buybackRate;
  document.getElementById('cfg-default-loss').value = state.settings.defaultLoss;
  document.getElementById('cfg-exchange-loss').value = state.settings.exchangeLoss !== undefined ? state.settings.exchangeLoss : 10.0;
  
  const titleVal = state.settings.appTitle || 'АурумОбмін';
  const subtitleVal = state.settings.appSubtitle || 'Калькулятор ювелірного обміну';
  document.getElementById('cfg-app-title').value = titleVal;
  document.getElementById('cfg-app-subtitle').value = subtitleVal;
  document.getElementById('app-title').innerText = titleVal;
  document.getElementById('app-subtitle').innerText = subtitleVal;
}

export function saveSettingsAndCategories() {
  localStorage.setItem('aurum_categories', JSON.stringify(state.categories));
  localStorage.setItem('aurum_settings', JSON.stringify(state.settings));
}

export function checkUrlImport() {
  const urlParams = new URLSearchParams(window.location.search);
  const importData = urlParams.get('import');
  if (importData) {
    try {
      const jsonString = decodeURIComponent(escape(atob(importData)));
      const data = JSON.parse(jsonString);

      if (data && data.categories && data.settings) {
        localStorage.setItem('aurum_categories', JSON.stringify(data.categories));
        localStorage.setItem('aurum_settings', JSON.stringify(data.settings));
        // Store a flag so we can show toast after page reloads
        sessionStorage.setItem('aurum_import_success', '1');
      }
    } catch (e) {
      console.error("Помилка імпортування даних:", e);
      sessionStorage.setItem('aurum_import_error', '1');
    }
    // Remove the import query parameter and reload to normal URL
    window.location.href = window.location.origin + window.location.pathname;
  }
}

// Call after DOM is ready to show import result toast
export function showImportResultToast() {
  if (sessionStorage.getItem('aurum_import_success')) {
    sessionStorage.removeItem('aurum_import_success');
    showToastMsg("✅ Налаштування від колеги успішно імпортовано!");
  }
  if (sessionStorage.getItem('aurum_import_error')) {
    sessionStorage.removeItem('aurum_import_error');
    showToastMsg("❌ Помилка імпортування: невірний формат посилання.");
  }
}

export function shareSettingsLink() {
  try {
    const tempSettings = {
      buybackRate: parseFloat(document.getElementById('cfg-buyback-rate').value) || 0,
      defaultLoss: parseFloat(document.getElementById('cfg-default-loss').value) || 0,
      exchangeLoss: parseFloat(document.getElementById('cfg-exchange-loss').value) || 0,
      appTitle: document.getElementById('cfg-app-title').value || 'АурумОбмін',
      appSubtitle: document.getElementById('cfg-app-subtitle').value || 'Калькулятор ювелірного обміну'
    };

    const tempCategories = [];
    state.categories.forEach(cat => {
      const nameEl = document.querySelector(`.cfg-cat-name[data-id="${cat.id}"]`);
      const totalEl = document.querySelector(`.cfg-cat-total[data-id="${cat.id}"]`);
      const workEl = document.querySelector(`.cfg-cat-work[data-id="${cat.id}"]`);
      
      tempCategories.push({
        id: cat.id,
        name: nameEl ? nameEl.value : cat.name,
        total: totalEl ? parseFloat(totalEl.value) : cat.total,
        work: workEl ? parseFloat(workEl.value) : cat.work
      });
    });

    const payload = {
      categories: tempCategories,
      settings: tempSettings
    };

    const base64String = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    const shareUrl = window.location.origin + window.location.pathname + "?import=" + base64String;

    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        showToastMsg("📋 Посилання з цінами скопійовано! Надішліть його колегам.");
      })
      .catch(err => {
        console.error("Error copying to clipboard:", err);
        prompt("Скопіюйте це посилання та надішліть його колегам:", shareUrl);
      });
  } catch (e) {
    console.error("Error generating share link:", e);
    showToastMsg("❌ Помилка генерації посилання.");
  }
}

// Internal toast helper (avoids circular import with ui.js)
function showToastMsg(message) {
  const toast = document.getElementById('toast');
  toast.innerText = message;
  toast.classList.add('show');
  setTimeout(() => { toast.classList.remove('show'); }, 3000);
}
