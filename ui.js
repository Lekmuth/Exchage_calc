// ==========================================================================
// UI: Theme, Category Buttons, Scrap Rows, Event Listeners, Settings Drawer
// ==========================================================================
import { DEFAULT_CATEGORIES, DEFAULT_GLOBAL_SETTINGS, state } from './constants.js';
import { loadSettingsAndCategories, saveSettingsAndCategories, shareSettingsLink } from './storage.js';
import { calculate, formatNumber } from './calculator.js';

// ---------- Theme ----------
export function loadTheme() {
  const theme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeToggleUI(theme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeToggleUI(newTheme);
}

function updateThemeToggleUI(theme) {
  const darkIcon = document.querySelector('.theme-icon-dark');
  const lightIcon = document.querySelector('.theme-icon-light');
  if (theme === 'light') {
    darkIcon.style.display = 'none';
    lightIcon.style.display = 'inline-block';
  } else {
    darkIcon.style.display = 'inline-block';
    lightIcon.style.display = 'none';
  }
}

// ---------- Category Buttons ----------
export function initCategoryButtons() {
  const container = document.getElementById('category-buttons');
  container.innerHTML = '';
  
  state.categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `category-btn ${cat.id === state.activeCategoryId ? 'active' : ''}`;
    btn.id = `btn-cat-${cat.id}`;
    btn.innerHTML = `
      <span class="cat-name">${cat.name}</span>
      <span class="cat-prices">${cat.total}/${cat.work}</span>
    `;
    btn.addEventListener('click', () => selectCategory(cat.id));
    container.appendChild(btn);
  });

  // Add custom button
  const customBtn = document.createElement('button');
  customBtn.type = 'button';
  customBtn.className = `category-btn ${state.activeCategoryId === 'custom' ? 'active' : ''}`;
  customBtn.id = `btn-cat-custom`;
  customBtn.innerHTML = `
    <span class="cat-name">Своя ціна</span>
    <span class="cat-prices">ручне введення</span>
  `;
  customBtn.addEventListener('click', () => selectCategory('custom'));
  container.appendChild(customBtn);
}

export function selectCategory(id) {
  state.activeCategoryId = id;
  
  // Highlight active button
  document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`btn-cat-${id}`);
  if (activeBtn) activeBtn.classList.add('active');

  const rateMetalInput = document.getElementById('rate-metal');
  const rateWorkInput = document.getElementById('rate-work');
  const rateTotalInput = document.getElementById('rate-total');

  if (id === 'custom') {
    rateMetalInput.readOnly = false;
    rateWorkInput.readOnly = false;
    rateMetalInput.focus();
  } else {
    const cat = state.categories.find(c => c.id === id);
    if (cat) {
      rateMetalInput.value = cat.total - cat.work;
      rateWorkInput.value = cat.work;
      rateTotalInput.value = cat.total;
      rateMetalInput.readOnly = false;
      rateWorkInput.readOnly = false;
    }
  }
  
  calculate();
}

// ---------- Settings Drawer ----------
export function populateSettingsDrawerList() {
  const container = document.getElementById('categories-edit-list');
  container.innerHTML = '';

  state.categories.forEach(cat => {
    const row = document.createElement('div');
    row.className = 'cat-edit-row';
    row.setAttribute('data-cat-id', cat.id);
    row.innerHTML = `
      <button type="button" class="delete-category-btn" title="Видалити категорію">&times;</button>
      <div class="form-group" style="margin-bottom: 0.65rem;">
        <label style="font-size: 0.75rem;">Назва категорії:</label>
        <input type="text" class="cfg-cat-name" data-id="${cat.id}" value="${cat.name}">
      </div>
      <div class="cat-edit-inputs">
        <div class="form-group col-6" style="margin-bottom: 0;">
          <label style="font-size: 0.75rem;">Загальна ціна, грн/г:</label>
          <input type="number" class="cfg-cat-total" data-id="${cat.id}" value="${cat.total}" step="50">
        </div>
        <div class="form-group col-6" style="margin-bottom: 0;">
          <label style="font-size: 0.75rem;">Ціна роботи, грн/г:</label>
          <input type="number" class="cfg-cat-work" data-id="${cat.id}" value="${cat.work}" step="50">
        </div>
      </div>
    `;
    // Delete category handler
    row.querySelector('.delete-category-btn').addEventListener('click', () => {
      if (state.categories.length <= 1) {
        showToast('Потрібна хоча б одна категорія!');
        return;
      }
      row.remove();
    });
    container.appendChild(row);
  });
}

function addCategoryToDrawer() {
  const container = document.getElementById('categories-edit-list');
  const newId = 'cat' + Date.now();
  
  const row = document.createElement('div');
  row.className = 'cat-edit-row';
  row.setAttribute('data-cat-id', newId);
  row.innerHTML = `
    <button type="button" class="delete-category-btn" title="Видалити категорію">&times;</button>
    <div class="form-group" style="margin-bottom: 0.65rem;">
      <label style="font-size: 0.75rem;">Назва категорії:</label>
      <input type="text" class="cfg-cat-name" data-id="${newId}" value="" placeholder="напр. Стандарт 585">
    </div>
    <div class="cat-edit-inputs">
      <div class="form-group col-6" style="margin-bottom: 0;">
        <label style="font-size: 0.75rem;">Загальна ціна, грн/г:</label>
        <input type="number" class="cfg-cat-total" data-id="${newId}" value="7000" step="50">
      </div>
      <div class="form-group col-6" style="margin-bottom: 0;">
        <label style="font-size: 0.75rem;">Ціна роботи, грн/г:</label>
        <input type="number" class="cfg-cat-work" data-id="${newId}" value="2100" step="50">
      </div>
    </div>
  `;
  row.querySelector('.delete-category-btn').addEventListener('click', () => {
    const allRows = container.querySelectorAll('.cat-edit-row');
    if (allRows.length <= 1) {
      showToast('Потрібна хоча б одна категорія!');
      return;
    }
    row.remove();
  });
  container.appendChild(row);
  row.querySelector('.cfg-cat-name').focus();
}

export function saveAndApplySettings() {
  // Update general settings
  state.settings.buybackRate = parseFloat(document.getElementById('cfg-buyback-rate').value) || 0;
  state.settings.defaultLoss = parseFloat(document.getElementById('cfg-default-loss').value) || 0;
  state.settings.exchangeLoss = parseFloat(document.getElementById('cfg-exchange-loss').value) || 0;
  state.settings.appTitle = document.getElementById('cfg-app-title').value || 'Ювелірний Калькулятор';
  state.settings.appSubtitle = document.getElementById('cfg-app-subtitle').value || 'Калькулятор обміну золота';
  
  document.getElementById('app-title').innerText = state.settings.appTitle;
  document.getElementById('app-subtitle').innerText = state.settings.appSubtitle;
  document.getElementById('buyback-rate-input').value = state.settings.buybackRate;

  // Rebuild categories from all visible rows in the drawer
  const rows = document.querySelectorAll('#categories-edit-list .cat-edit-row');
  const newCategories = [];
  rows.forEach(row => {
    const id = row.getAttribute('data-cat-id');
    const nameInput = row.querySelector('.cfg-cat-name');
    const totalInput = row.querySelector('.cfg-cat-total');
    const workInput = row.querySelector('.cfg-cat-work');
    
    const name = nameInput ? nameInput.value.trim() : '';
    if (name) {
      newCategories.push({
        id: id,
        name: name,
        total: totalInput ? parseFloat(totalInput.value) || 0 : 0,
        work: workInput ? parseFloat(workInput.value) || 0 : 0
      });
    }
  });

  if (newCategories.length > 0) {
    state.categories = newCategories;
  }

  saveSettingsAndCategories();
  initCategoryButtons();
  
  // Re-select active category to update main view inputs if they were changed
  if (!state.categories.find(c => c.id === state.activeCategoryId)) {
    state.activeCategoryId = state.categories[0].id;
  }
  selectCategory(state.activeCategoryId);
  
  document.getElementById('settings-drawer-overlay').classList.remove('open');
  showToast('Налаштування успішно збережено!');
  calculate();
}

let resetTimer = null;
export function resetSettingsToDefault() {
  const btn = document.getElementById('reset-settings-btn');
  
  // First click — ask for confirmation via button text
  if (!btn.dataset.confirming) {
    btn.dataset.confirming = 'true';
    btn.textContent = '⚠️ Точно скинути?';
    btn.style.background = 'var(--crimson-primary)';
    btn.style.color = '#fff';
    
    // Auto-revert after 3 seconds
    resetTimer = setTimeout(() => {
      delete btn.dataset.confirming;
      btn.textContent = 'Скинути до початкових';
      btn.style.background = '';
      btn.style.color = '';
    }, 3000);
    return;
  }
  
  // Second click — confirmed
  clearTimeout(resetTimer);
  delete btn.dataset.confirming;
  btn.textContent = 'Скинути до початкових';
  btn.style.background = '';
  btn.style.color = '';
  
  state.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
  state.settings = JSON.parse(JSON.stringify(DEFAULT_GLOBAL_SETTINGS));
  saveSettingsAndCategories();
  
  // Refresh UI inputs
  document.getElementById('cfg-buyback-rate').value = state.settings.buybackRate;
  document.getElementById('buyback-rate-input').value = state.settings.buybackRate;
  document.getElementById('cfg-default-loss').value = state.settings.defaultLoss;
  document.getElementById('cfg-exchange-loss').value = state.settings.exchangeLoss;
  document.getElementById('cfg-app-title').value = state.settings.appTitle;
  document.getElementById('cfg-app-subtitle').value = state.settings.appSubtitle;
  document.getElementById('app-title').innerText = state.settings.appTitle;
  document.getElementById('app-subtitle').innerText = state.settings.appSubtitle;
  
  initCategoryButtons();
  state.activeCategoryId = state.categories[0].id;
  selectCategory(state.activeCategoryId);
  populateSettingsDrawerList();
  
  // Update all loss cells in table to new default
  document.querySelectorAll('.scrap-loss-input').forEach(input => {
    input.value = state.settings.defaultLoss;
  });
  
  showToast('Налаштування скинуто до початкових!');
  calculate();
}

// ---------- New Item Rows ----------
export function addNewItemRow(description = '', weight = '') {
  const rowId = state.nextNewItemRowId++;
  const tbody = document.getElementById('new-item-rows');
  
  const tr = document.createElement('tr');
  tr.id = `new-item-row-${rowId}`;
  tr.innerHTML = `
    <td>
      <input type="text" class="new-item-desc-input" placeholder="Кільце, сережки..." value="${description}">
    </td>
    <td>
      <div class="input-with-unit" style="padding-right: 0;">
        <input type="number" class="new-item-weight-input" data-row-id="${rowId}" step="0.01" min="0" placeholder="0.00" value="${weight}" style="padding-right: 1.5rem;">
        <span class="unit" style="right: 0.5rem; font-size: 0.8rem;">г</span>
      </div>
    </td>
    <td style="text-align: center;">
      <button type="button" class="delete-btn" data-delete-row="${rowId}">🗑️</button>
    </td>
  `;
  
  tbody.appendChild(tr);

  // Hook up delete button
  tr.querySelector(`[data-delete-row="${rowId}"]`).addEventListener('click', () => deleteNewItemRow(rowId));

  // Hook up live calculation listeners for this row
  const rowElements = tr.querySelectorAll('input');
  rowElements.forEach(el => {
    el.addEventListener('input', calculate);
  });
}

export function deleteNewItemRow(rowId) {
  const row = document.getElementById(`new-item-row-${rowId}`);
  if (row) {
    row.remove();
    
    // If no rows remain, add a fresh empty one
    const tbody = document.getElementById('new-item-rows');
    if (tbody.children.length === 0) {
      addNewItemRow();
    }
    calculate();
  }
}

// ---------- Scrap Rows ----------
export function addScrapRow(description = '', weight = '', sample = '585', loss = null) {
  const rowId = state.nextRowId++;
  const tbody = document.getElementById('scrap-rows');
  
  const lossValue = loss !== null ? loss : state.settings.defaultLoss;
  
  const tr = document.createElement('tr');
  tr.id = `scrap-row-${rowId}`;
  tr.innerHTML = `
    <td>
      <input type="text" class="scrap-desc-input" placeholder="Кільце, ланцюжок..." value="${description}">
    </td>
    <td>
      <div class="input-with-unit" style="padding-right: 0;">
        <input type="number" class="scrap-weight-input" data-row-id="${rowId}" step="0.01" min="0" placeholder="0.00" value="${weight}" style="padding-right: 1.5rem;">
        <span class="unit" style="right: 0.5rem; font-size: 0.8rem;">г</span>
      </div>
    </td>
    <td>
      <select class="scrap-sample-select" data-row-id="${rowId}">
        <option value="585" ${sample === '585' ? 'selected' : ''}>585 / 583</option>
        <option value="750" ${sample === '750' ? 'selected' : ''}>750</option>
        <option value="375" ${sample === '375' ? 'selected' : ''}>375</option>
        <option value="999" ${sample === '999' ? 'selected' : ''}>999 (чисте)</option>
        <option value="custom" ${['585', '750', '375', '999'].includes(sample) ? '' : 'selected'}>Своя проба</option>
      </select>
      <input type="number" class="scrap-custom-sample-input" data-row-id="${rowId}" min="100" max="1000" placeholder="Проба" style="display: ${['585', '750', '375', '999'].includes(sample) ? 'none' : 'block'}; margin-top: 4px;" value="${['585', '750', '375', '999'].includes(sample) ? '' : sample}">
    </td>
    <td>
      <div class="input-with-unit" style="padding-right: 0;">
        <input type="number" class="scrap-loss-input" data-row-id="${rowId}" step="0.1" min="0" max="100" value="${lossValue}" style="padding-right: 1.5rem;">
        <span class="unit" style="right: 0.5rem; font-size: 0.8rem;">%</span>
      </div>
    </td>
    <td class="clean-weight-cell" style="text-align: right; vertical-align: middle;">
      <div id="clean-weight-row-${rowId}" style="font-weight: 600;">0.00 г</div>
      <div id="clean-formula-row-${rowId}" class="clean-formula-text" style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px; white-space: nowrap; display: none;"></div>
    </td>
    <td style="text-align: center;">
      <button type="button" class="delete-btn" data-delete-row="${rowId}">🗑️</button>
    </td>
  `;
  
  tbody.appendChild(tr);

  // Hook up delete button
  tr.querySelector(`[data-delete-row="${rowId}"]`).addEventListener('click', () => deleteScrapRow(rowId));

  // Hook up live calculation listeners for this row
  const rowElements = tr.querySelectorAll('input, select');
  rowElements.forEach(el => {
    el.addEventListener('input', () => {
      // Toggle custom sample input visibility if "Custom" option is selected
      if (el.classList.contains('scrap-sample-select')) {
        const customInput = tr.querySelector('.scrap-custom-sample-input');
        if (el.value === 'custom') {
          customInput.style.display = 'block';
          customInput.focus();
        } else {
          customInput.style.display = 'none';
        }
      }
      calculate();
    });
  });
}

function deleteScrapRow(rowId) {
  const row = document.getElementById(`scrap-row-${rowId}`);
  if (row) {
    row.remove();
    
    // If no rows remain, add a fresh empty one
    const tbody = document.getElementById('scrap-rows');
    if (tbody.children.length === 0) {
      addScrapRow();
    }
    calculate();
  }
}

// ---------- Utilities ----------
export function showToast(message) {
  const toast = document.getElementById('toast');
  toast.innerText = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function copyReceiptToClipboard() {
  const textarea = document.getElementById('receipt-text');
  if (!textarea.value) {
    showToast('Немає розрахунку для копіювання!');
    return;
  }
  
  textarea.select();
  textarea.setSelectionRange(0, 99999); // For mobile devices
  
  navigator.clipboard.writeText(textarea.value)
    .then(() => {
      showToast('Розрахунок скопійовано в буфер обміну! 📋');
    })
    .catch(err => {
      console.error('Error copying text: ', err);
      showToast('Помилка копіювання.');
    });
}

function shareViaMessenger() {
  const text = document.getElementById('receipt-text').value;
  if (!text) {
    showToast('Немає розрахунку для відправки!');
    return;
  }

  const encodedText = encodeURIComponent(text);
  
  if (navigator.share) {
    navigator.share({
      title: 'Розрахунок ювелірного обміну',
      text: text
    })
    .catch(err => {
      console.log('Web Share cancelled or failed:', err);
      window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
    });
  } else {
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
  }
}

// ---------- Event Listeners Setup ----------
export function initEventListeners() {
  // Theme Toggle
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  // Settings Drawer Toggles
  const drawerOverlay = document.getElementById('settings-drawer-overlay');
  
  document.getElementById('settings-toggle').addEventListener('click', () => {
    populateSettingsDrawerList();
    drawerOverlay.classList.add('open');
  });

  document.getElementById('close-settings').addEventListener('click', () => {
    drawerOverlay.classList.remove('open');
  });

  drawerOverlay.addEventListener('click', (e) => {
    if (e.target === drawerOverlay) {
      drawerOverlay.classList.remove('open');
    }
  });

  // Reset and Save in Settings
  document.getElementById('reset-settings-btn').addEventListener('click', resetSettingsToDefault);
  document.getElementById('save-settings-btn').addEventListener('click', saveAndApplySettings);
  document.getElementById('share-settings-btn').addEventListener('click', shareSettingsLink);
  document.getElementById('add-category-btn').addEventListener('click', addCategoryToDrawer);

  // Add New Item Row
  document.getElementById('add-new-item-row').addEventListener('click', () => {
    addNewItemRow();
    calculate();
  });

  // Rate & Price Input listeners
  document.getElementById('rate-metal').addEventListener('input', calculate);
  document.getElementById('rate-work').addEventListener('input', calculate);
  document.getElementById('buyback-rate-input').addEventListener('input', calculate);

  // Metal Discount Chips Listeners
  const metalChips = document.querySelectorAll('#metal-discount-chips .chip');
  const metalDiscountVal = document.getElementById('metal-discount-val');

  metalChips.forEach(chip => {
    chip.addEventListener('click', () => {
      metalChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      if (chip.id === 'custom-metal-discount-btn') {
        metalDiscountVal.style.display = 'block';
        metalDiscountVal.focus();
      } else {
        metalDiscountVal.style.display = 'none';
        metalDiscountVal.value = chip.getAttribute('data-val');
        calculate();
      }
    });
  });

  metalDiscountVal.addEventListener('input', calculate);

  // Work Discount Chips Listeners
  const discountChips = document.querySelectorAll('#discount-chips .chip');
  const discountValInput = document.getElementById('discount-val');

  discountChips.forEach(chip => {
    chip.addEventListener('click', () => {
      discountChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      if (chip.id === 'custom-discount-btn') {
        discountValInput.style.display = 'block';
        discountValInput.focus();
      } else {
        discountValInput.style.display = 'none';
        discountValInput.value = chip.getAttribute('data-val');
        calculate();
      }
    });
  });

  discountValInput.addEventListener('input', calculate);

  // Buyback Adjustment Chips Listeners
  const buybackChips = document.querySelectorAll('#buyback-chips .chip');
  const buybackAdjustVal = document.getElementById('buyback-adjust-val');

  buybackChips.forEach(chip => {
    chip.addEventListener('click', () => {
      buybackChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      if (chip.id === 'custom-buyback-btn') {
        buybackAdjustVal.style.display = 'block';
        buybackAdjustVal.focus();
      } else {
        buybackAdjustVal.style.display = 'none';
        buybackAdjustVal.value = chip.getAttribute('data-val');
        calculate();
      }
    });
  });

  buybackAdjustVal.addEventListener('input', calculate);

  // Rounding Select Listener
  document.getElementById('rounding-select').addEventListener('change', calculate);

  // Operation Type Radios
  document.querySelectorAll('input[name="op-type"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const isExchange = e.target.value === 'exchange';
      const scrapSection = document.getElementById('scrap-section');
      
      if (isExchange) {
        scrapSection.style.display = 'block';
      } else {
        scrapSection.style.display = 'none';
      }
      calculate();
    });
  });

  // Excess Treatment Options
  document.querySelectorAll('input[name="excess-treatment"]').forEach(radio => {
    radio.addEventListener('change', calculate);
  });

  // Scrap Row Add Button
  document.getElementById('add-scrap-row').addEventListener('click', () => {
    addScrapRow();
    calculate();
  });

  // Copy and Share Receipt Buttons
  document.getElementById('copy-receipt-btn').addEventListener('click', copyReceiptToClipboard);
  document.getElementById('share-whatsapp-btn').addEventListener('click', shareViaMessenger);
}
