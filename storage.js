// ==========================================================================
// Storage: Load, Save, Reset, Import/Export settings and categories
// ==========================================================================
import { DEFAULT_CATEGORIES, DEFAULT_GLOBAL_SETTINGS, state } from './constants.js';

// --- Supabase config ---
const SUPABASE_URL = 'https://eovjhbsidaudbpeuvpde.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvdmpoYnNpZGF1ZGJwZXV2cGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzODgxOTEsImV4cCI6MjA5MDk2NDE5MX0.JS3bAQq0JNrxz2lsrN0PhvMQdv9mZlUQIZnLcqxE_hQ';

function supabaseHeaders() {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  };
}

// Generate a random readable code like "VP-4X9K"
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let part1 = '', part2 = '';
  for (let i = 0; i < 2; i++) part1 += chars[Math.floor(Math.random() * chars.length)];
  for (let i = 0; i < 4; i++) part2 += chars[Math.floor(Math.random() * chars.length)];
  return `${part1}-${part2}`;
}

// Collect current settings from the drawer form
function collectPayloadFromDrawer() {
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

  return { categories: tempCategories, settings: tempSettings };
}

// Save settings to Supabase and return the short code
export async function savePresetToCloud() {
  const payload = collectPayloadFromDrawer();
  const code = generateCode();

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/aurum_settings_presets`, {
      method: 'POST',
      headers: supabaseHeaders(),
      body: JSON.stringify({ code, payload })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    return code;
  } catch (e) {
    console.error('Помилка збереження пресету:', e);
    throw e;
  }
}

// Load settings from Supabase by code
export async function loadPresetFromCloud(code) {
  const normalizedCode = code.trim().toUpperCase();

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/aurum_settings_presets?code=eq.${encodeURIComponent(normalizedCode)}&select=payload`,
    { headers: supabaseHeaders() }
  );

  if (!res.ok) throw new Error('Помилка мережі');

  const rows = await res.json();
  if (!rows || rows.length === 0) throw new Error('Код не знайдено або він застарів');

  return rows[0].payload; // { categories, settings }
}

// Apply imported payload to localStorage and state
export function applyImportedPayload(data) {
  if (!data || !data.categories || !data.settings) throw new Error('Невірний формат даних');
  localStorage.setItem('aurum_categories', JSON.stringify(data.categories));
  localStorage.setItem('aurum_settings', JSON.stringify(data.settings));
}

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

// Legacy URL import (kept for backward compatibility with old links)
export function checkUrlImport() {
  const urlParams = new URLSearchParams(window.location.search);
  const importData = urlParams.get('import');
  if (importData) {
    try {
      const jsonString = decodeURIComponent(escape(atob(importData)));
      const data = JSON.parse(jsonString);
      if (data && data.categories && data.settings) {
        applyImportedPayload(data);
        sessionStorage.setItem('aurum_import_success', '1');
      }
    } catch (e) {
      console.error('Помилка імпортування даних:', e);
      sessionStorage.setItem('aurum_import_error', '1');
    }
    window.location.href = window.location.origin + window.location.pathname;
  }
}

export function showImportResultToast() {
  if (sessionStorage.getItem('aurum_import_success')) {
    sessionStorage.removeItem('aurum_import_success');
    showToastMsg('✅ Налаштування від колеги успішно завантажено!');
  }
  if (sessionStorage.getItem('aurum_import_error')) {
    sessionStorage.removeItem('aurum_import_error');
    showToastMsg('❌ Помилка імпортування: невірний формат посилання.');
  }
}

// Internal toast helper (avoids circular import with ui.js)
export function showToastMsg(message, duration = 3500) {
  const toast = document.getElementById('toast');
  toast.innerText = message;
  toast.classList.add('show');
  setTimeout(() => { toast.classList.remove('show'); }, duration);
}
