import React, { useState, useEffect } from 'react';

export default function SettingsDrawer({ isOpen, onClose, globalSettings, updateSettings, categories, setCategories }) {
  const [exchangeLoss, setExchangeLoss] = useState(globalSettings.exchangeLoss);
  const [localCategories, setLocalCategories] = useState([...categories]);
  const [storeCode, setStoreCode] = useState('');

  useEffect(() => {
    if (isOpen) {
      setExchangeLoss(globalSettings.exchangeLoss);
      setLocalCategories([...categories]);
    }
  }, [isOpen, globalSettings.exchangeLoss, categories]);

  const handleSave = () => {
    updateSettings({
      exchangeLoss: parseFloat(exchangeLoss) || 10
    });
    setCategories(localCategories);
    localStorage.setItem('exchangeCalcCategories', JSON.stringify(localCategories));
    onClose();
  };

  const addCategory = () => {
    const newId = `cat_${Date.now()}`;
    setLocalCategories([...localCategories, { id: newId, name: 'Нова категорія', total: 0, work: 0 }]);
  };

  const handleLoadProfile = () => {
    if (!storeCode.trim()) return;
    try {
      let decoded = storeCode.trim();
      if (!decoded.startsWith('{') && !decoded.startsWith('[')) {
        try {
          decoded = decodeURIComponent(escape(atob(decoded)));
        } catch (err) {
          // ignore atob error
        }
      }
      const data = JSON.parse(decoded);
      
      if (data.exchangeLoss !== undefined) setExchangeLoss(data.exchangeLoss);
      if (data.categories && Array.isArray(data.categories)) setLocalCategories(data.categories);
      if (data.appTitle || data.appSubtitle) {
        updateSettings({
          appTitle: data.appTitle || globalSettings.appTitle,
          appSubtitle: data.appSubtitle || globalSettings.appSubtitle
        });
      }
      
      alert('Профіль магазину успішно завантажено!');
      setStoreCode('');
    } catch (e) {
      alert('Помилка! Невірний код профілю.');
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
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Завантаження профілю</h3>
            <div className="form-group">
              <label>Код профілю магазину:</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  value={storeCode} 
                  onChange={e => setStoreCode(e.target.value)} 
                  placeholder="Вставте код сюди..." 
                />
                <button type="button" className="btn btn-secondary" onClick={handleLoadProfile}>
                  Завантажити
                </button>
              </div>
              <small className="help-text">Код автоматично оновить назву, втрати та категорії.</small>
            </div>
          </div>

          <div className="settings-section" style={{ marginBottom: '2rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Базові налаштування</h3>
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
