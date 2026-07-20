"use client";
import React, { useState, useEffect } from 'react';
import NewItemCard from '../components/NewItemCard';
import ScrapRow from '../components/ScrapRow';
import ResultsPanel from '../components/ResultsPanel';
import SettingsDrawer from '../components/SettingsDrawer';
import { useCalculator } from '../hooks/useCalculator';
import { DEFAULT_CATEGORIES, DEFAULT_GLOBAL_SETTINGS } from '../utils/constants';

export default function Calculator() {
  const [isClient, setIsClient] = useState(false);
  
  const [operation, setOperation] = useState('exchange');
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [globalSettings, setGlobalSettings] = useState(DEFAULT_GLOBAL_SETTINGS);
  
  const [newItems, setNewItems] = useState([
    { id: 1, desc: '', weight: '', categoryId: 'cat1', rateTotal: 7000, rateWork: 2100, discountWork: 0 }
  ]);
  const [nextNewItemId, setNextNewItemId] = useState(2);
  
  const [scrapItems, setScrapItems] = useState([
    { id: 1, desc: '', weight: '', purity: 585, loss: 0 }
  ]);
  const [nextScrapId, setNextScrapId] = useState(2);
  
  const [buybackRate, setBuybackRate] = useState(2000);
  const [buybackAdjust, setBuybackAdjust] = useState(0);
  const [rounding, setRounding] = useState('0');
  const [excessTreatment, setExcessTreatment] = useState('return');
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Load state from localStorage on mount
    try {
      const savedSettings = localStorage.getItem('exchangeCalcSettings');
      if (savedSettings) setGlobalSettings(JSON.parse(savedSettings));
      
      const savedCategories = localStorage.getItem('exchangeCalcCategories');
      if (savedCategories) setCategories(JSON.parse(savedCategories));
    } catch (e) {
      console.error('Error loading state from localStorage', e);
    }
  }, []);

  // Save settings to localStorage when changed
  useEffect(() => {
    if (isClient) localStorage.setItem('exchangeCalcSettings', JSON.stringify(globalSettings));
  }, [globalSettings, isClient]);

  const updateSettings = (newSettings) => {
    setGlobalSettings({ ...globalSettings, ...newSettings });
  };

  const calcData = useCalculator({
    operation, newItems, scrapItems, buybackRate, buybackAdjust, 
    rounding, excessTreatment, globalSettings
  });

  const addNewItem = () => {
    const cat = categories[0] || { id: 'custom', total: 0, work: 0 };
    setNewItems([...newItems, {
      id: nextNewItemId,
      desc: '',
      weight: '',
      categoryId: cat.id,
      rateTotal: cat.total,
      rateWork: cat.work,
      discountWork: 0
    }]);
    setNextNewItemId(nextNewItemId + 1);
  };

  const updateNewItem = (id, updates) => {
    setNewItems(newItems.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeNewItem = (id) => {
    if (newItems.length > 1) {
      setNewItems(newItems.filter(item => item.id !== id));
    }
  };

  const addScrapItem = () => {
    setScrapItems([...scrapItems, {
      id: nextScrapId,
      desc: '',
      weight: '',
      purity: 585,
      loss: globalSettings.defaultLoss || 0
    }]);
    setNextScrapId(nextScrapId + 1);
  };

  const updateScrapItem = (id, updates) => {
    setScrapItems(scrapItems.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeScrapItem = (id) => {
    setScrapItems(scrapItems.filter(item => item.id !== id));
  };

  if (!isClient) return null; // Avoid hydration mismatch

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-area">
          <span className="logo-icon">✨</span>
          <div className="logo-text">
            <h1 id="app-title">{globalSettings.appTitle}</h1>
            <p id="app-subtitle">{globalSettings.appSubtitle}</p>
          </div>
        </div>
        <div className="header-controls">
          <button id="settings-toggle" className="icon-btn" title="Налаштування цін" aria-label="Налаштування цін" onClick={() => setIsSettingsOpen(true)}>
            ⚙️
          </button>
        </div>
      </header>

      <main className={`main-content ${operation === 'purchase' ? 'purchase-mode' : ''}`}>
        
        <section className="control-panel">
          
          {/* STEP 1: New Items */}
          <div className="card card-primary" id="new-item-section">
            <div className="card-header">
              <div className="header-left">
                <span className="step-badge">1</span>
                <h2>Нові вироби</h2>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addNewItem}>
                ➕ Додати виріб
              </button>
            </div>

            <div className="form-row" style={{ marginBottom: '1rem', marginTop: '1rem' }}>
              <div className="form-group col-6">
                <label>Операція:</label>
                <div className="segmented-control">
                  <input type="radio" id="op-purchase" name="op-type" value="purchase" 
                         checked={operation === 'purchase'} onChange={() => setOperation('purchase')} />
                  <label htmlFor="op-purchase">Купівля</label>
                  
                  <input type="radio" id="op-exchange" name="op-type" value="exchange" 
                         checked={operation === 'exchange'} onChange={() => setOperation('exchange')} />
                  <label htmlFor="op-exchange">Обмін</label>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Список нових виробів:</label>
              <div id="new-item-cards" className="new-item-cards-container">
                {newItems.map((item, index) => (
                  <NewItemCard 
                    key={item.id} 
                    item={item} 
                    index={index} 
                    categories={categories}
                    updateItem={updateNewItem}
                    removeItem={removeNewItem}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* STEP 2: Scrap Items */}
          {operation === 'exchange' && (
            <div className="card" id="scrap-section">
              <div className="card-header">
                <div className="header-left">
                  <span className="step-badge">2</span>
                  <h2>Брухт від клієнта</h2>
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addScrapItem}>
                  ➕ Додати метал
                </button>
              </div>

              <div className="form-row" style={{ marginBottom: '1rem', marginTop: '1rem' }}>
                <div className="form-group col-6">
                  <label>Ціна викупу брухту за грам:</label>
                  <div className="input-with-unit">
                    <input type="number" value={buybackRate} onChange={e => setBuybackRate(e.target.value)} step="50" min="0" />
                    <span className="unit">грн</span>
                  </div>
                </div>
              </div>

              <div className="scrap-table-container">
                <table className="scrap-table" id="scrap-table">
                  <thead>
                    <tr>
                      <th>Опис (опціонально)</th>
                      <th style={{ width: '100px' }}>Вага брутто, г</th>
                      <th style={{ width: '100px' }}>Проба</th>
                      <th style={{ width: '80px' }}>Угар, %</th>
                      <th style={{ width: '100px', textAlign: 'right' }}>Чиста вага (585), г</th>
                      <th style={{ width: '50px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {scrapItems.map((item, index) => (
                      <ScrapRow 
                        key={item.id}
                        item={item}
                        index={index}
                        updateItem={updateScrapItem}
                        removeItem={removeScrapItem}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              
              {calcData.caseType === 'exchange-excess' && (
                <div className="excess-options-box">
                  <h4>Є надлишок металу</h4>
                  <div className="segmented-control">
                    <input type="radio" id="excess-return" name="excess-treatment" value="return" 
                           checked={excessTreatment === 'return'} onChange={() => setExcessTreatment('return')} />
                    <label htmlFor="excess-return">Повернути</label>
                    <input type="radio" id="excess-buyout" name="excess-treatment" value="buyout" 
                           checked={excessTreatment === 'buyout'} onChange={() => setExcessTreatment('buyout')} />
                    <label htmlFor="excess-buyout">Викупити</label>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Results Panel */}
        <ResultsPanel calcData={calcData} setRounding={setRounding} />

      </main>

      <SettingsDrawer 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        globalSettings={globalSettings}
        updateSettings={updateSettings}
        categories={categories}
        setCategories={setCategories}
      />
    </div>
  );
}
