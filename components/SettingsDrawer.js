import React, { useState, useEffect } from 'react';
import { loadPresetFromCloud, savePresetToCloud } from '../utils/cloudStorage';

export default function SettingsDrawer({ isOpen, onClose, globalSettings, updateSettings, categories, setCategories, buybackRate, setBuybackRate }) {
  const [exchangeLoss, setExchangeLoss] = useState(globalSettings.exchangeLoss);
  const [localBuybackRate, setLocalBuybackRate] = useState(buybackRate || 2000);
  const [localCategories, setLocalCategories] = useState([...categories]);
  const [storeCode, setStoreCode] = useState('');

  useEffect(() => {
    if (isOpen) {
      setExchangeLoss(globalSettings.exchangeLoss);
      setLocalBuybackRate(buybackRate);
      setLocalCategories([...categories]);
    }
  }, [isOpen, globalSettings.exchangeLoss, categories, buybackRate]);

  const handleSave = () => {
    updateSettings({
      exchangeLoss: parseFloat(exchangeLoss) || 10,
      buybackRate: parseFloat(localBuybackRate) || 0
    });
    setBuybackRate(parseFloat(localBuybackRate) || 0);
    setCategories(localCategories);
    localStorage.setItem('exchangeCalcCategories', JSON.stringify(localCategories));
    onClose();
  };

  const addCategory = () => {
    const newId = `cat_${Date.now()}`;
    setLocalCategories([...localCategories, { id: newId, name: 'Нова категорія', total: 0, work: 0 }]);
  };

  const handleLoadProfile = async () => {
    if (!storeCode.trim()) return;
    try {
      let data;
      const codeStr = storeCode.trim();
      
      // If it looks like JSON or base64 JSON
      if (codeStr.startsWith('{') || codeStr.startsWith('[')) {
        data = JSON.parse(codeStr);
      } else if (codeStr.length > 20) {
        // Probable base64
        data = JSON.parse(decodeURIComponent(escape(atob(codeStr))));
      } else {
        // Fetch from Supabase
        data = await loadPresetFromCloud(codeStr);
      }
      
      if (data.settings && data.categories) {
        if (data.settings.exchangeLoss !== undefined) setExchangeLoss(data.settings.exchangeLoss);
        if (data.settings.buybackRate !== undefined) setLocalBuybackRate(data.settings.buybackRate);
        setLocalCategories(data.categories);
        updateSettings({
          appTitle: data.settings.appTitle || globalSettings.appTitle,
          appSubtitle: data.settings.appSubtitle || globalSettings.appSubtitle
        });
      } else {
        // Legacy payload format fallback
        if (data.exchangeLoss !== undefined) setExchangeLoss(data.exchangeLoss);
        if (data.buybackRate !== undefined) setLocalBuybackRate(data.buybackRate);
        if (data.categories && Array.isArray(data.categories)) setLocalCategories(data.categories);
        if (data.appTitle || data.appSubtitle) {
          updateSettings({
            appTitle: data.appTitle || globalSettings.appTitle,
            appSubtitle: data.appSubtitle || globalSettings.appSubtitle
          });
        }
      }
      
      alert('Профіль магазину успішно завантажено! Натисніть "Зберегти всі зміни" внизу.');
      setStoreCode('');
    } catch (e) {
      alert(`Помилка! ${e.message || 'Невірний код профілю.'}`);
    }
  };

  const handleShareProfile = async () => {
    try {
      const payload = {
        categories: localCategories,
        settings: {
          ...globalSettings,
          exchangeLoss: parseFloat(exchangeLoss) || 10,
          buybackRate: parseFloat(localBuybackRate) || 0
        }
      };
      const code = await savePresetToCloud(payload);
      setStoreCode(code);
      navigator.clipboard.writeText(code).catch(() => {});
      alert(`✅ Ваш код: ${code}\nЙого вже скопійовано в буфер обміну! Надішліть цей код колегам.`);
    } catch (e) {
      alert('❌ Помилка генерації коду. Перевірте інтернет.');
    }
  };

  const updateCategory = (id, key, value) => {
    setLocalCategories(localCategories.map(cat => 
      cat.id === id ? { ...cat, [key]: value } : cat
    ));
  };

  const deleteCategory = (id) => {
    setLocalCategories(localCategories.filter(cat => cat.id !== id));
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay active" onClick={onClose}>
      <div className="settings-drawer active" onClick={e => e.stopPropagation()} style={{ width: '450px', maxWidth: '90vw' }}>
        <div className="settings-header">
          <h2>Налаштування</h2>
          <button className="close-drawer-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="settings-body" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 140px)' }}>
          <div className="settings-section" style={{ marginBottom: '2rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Синхронізація (Supabase Cloud)</h3>
            <div className="form-group">
              <label>Код профілю магазину:</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  value={storeCode} 
                  onChange={e => setStoreCode(e.target.value)} 
                  placeholder="Наприклад: TW-53RA" 
                  style={{ textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}
                />
                <button type="button" className="btn btn-secondary" onClick={handleLoadProfile}>
                  Завантажити
                </button>
              </div>
              <small className="help-text" style={{ marginBottom: '0.5rem', display: 'block' }}>
                Введіть отриманий код, щоб автоматично оновити ціни та категорії.
              </small>
              <button type="button" className="btn btn-secondary" onClick={handleShareProfile} style={{ width: '100%' }}>
                ☁️ Згенерувати мій код (Поділитися налаштуваннями)
              </button>
            </div>
          </div>

          <div className="settings-section" style={{ marginBottom: '2rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Базові налаштування</h3>
            
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Базова ціна викупу брухту (грн/г):</label>
              <input 
                type="number" 
                value={localBuybackRate} 
                onChange={e => setLocalBuybackRate(e.target.value)} 
                step="50" min="0" 
              />
              <small className="help-text">Застосовується до нових чеків за замовчуванням.</small>
            </div>

            <div className="form-group">
              <label>Відсоток втрат при обміні на нові вироби (%):</label>
              <input 
                type="number" 
                value={exchangeLoss} 
                onChange={e => setExchangeLoss(e.target.value)} 
                step="1" min="0" 
              />
              <small className="help-text">Додається до ваги нових виробів при розрахунку необхідного металу.</small>
            </div>
          </div>

          <div className="settings-section">
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Категорії виробів (шпаргалка)</h3>
            
            {localCategories.map((cat, index) => (
              <div key={cat.id} style={{ background: 'var(--input-bg)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label>Назва категорії:</label>
                  <input 
                    type="text" 
                    value={cat.name} 
                    onChange={e => updateCategory(cat.id, 'name', e.target.value)} 
                  />
                </div>
                <div className="form-row" style={{ marginBottom: '0' }}>
                  <div className="form-group col-6">
                    <label>Загальна ціна (грн/г):</label>
                    <input 
                      type="number" 
                      value={cat.total} 
                      onChange={e => updateCategory(cat.id, 'total', parseFloat(e.target.value) || 0)} 
                    />
                  </div>
                  <div className="form-group col-6">
                    <label>Робота (грн/г):</label>
                    <input 
                      type="number" 
                      value={cat.work} 
                      onChange={e => updateCategory(cat.id, 'work', parseFloat(e.target.value) || 0)} 
                    />
                  </div>
                </div>
                <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteCategory(cat.id)}>🗑 Видалити</button>
                </div>
              </div>
            ))}
            
            <button className="btn btn-secondary" onClick={addCategory} style={{ width: '100%', marginBottom: '1rem' }}>
              ➕ Додати категорію
            </button>
          </div>
        </div>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
          <button className="btn btn-primary" onClick={handleSave} style={{ width: '100%' }}>
            Зберегти всі зміни
          </button>
        </div>
      </div>
    </div>
  );
}
