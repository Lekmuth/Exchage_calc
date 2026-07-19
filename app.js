// ==========================================================================
// App Entry Point — Ювелірний Калькулятор Обміну
// ==========================================================================
import { state } from './constants.js';
import { checkUrlImport, loadSettingsAndCategories, showImportResultToast } from './storage.js';
import { calculate } from './calculator.js';
import { loadTheme, initCategoryButtons, initEventListeners, selectCategory, addNewItemRow, addScrapRow } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  checkUrlImport();
  loadTheme();
  loadSettingsAndCategories();
  initCategoryButtons();
  initEventListeners();
  
  // Set default state
  selectCategory(state.activeCategoryId);
  addNewItemRow(); // Start with one new item row
  addScrapRow(); // Start with one row
  
  calculate();
  showImportResultToast();

  // Register service worker for PWA offline capabilities
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('Service worker registered successfully', reg))
        .catch(err => console.error('Service worker registration failed', err));
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }
});
