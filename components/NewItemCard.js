import React, { useState, useRef } from 'react';

const DESC_CHIPS = ['Каблучка', 'Обручка', 'Сережки', 'Ланцюжок', 'Підвіс', 'Хрестик', 'Браслет', 'Інше'];
const DISCOUNT_CHIPS = [0, 100, 200, 300, 400, 500];

export default function NewItemCard({ item, index, categories, updateItem, removeItem }) {
  const [expanded, setExpanded] = useState(index === 0);
  const [showCustomDiscount, setShowCustomDiscount] = useState(false);
  const descInputRef = useRef(null);

  const handleCategoryChange = (e) => {
    const catId = e.target.value;
    const cat = categories.find(c => c.id === catId);
    if (cat) {
      updateItem(item.id, {
        categoryId: catId,
        rateTotal: cat.total,
        rateWork: cat.work
      });
    } else {
      updateItem(item.id, { categoryId: 'custom' });
    }
  };

  const handleDescChipClick = (chip) => {
    if (chip === 'Інше') {
      descInputRef.current?.focus();
      return;
    }
    const currentDesc = (item.desc || '').trim();
    if (currentDesc.includes(chip)) {
      // Видаляємо чип, якщо він вже є в тексті
      const newDesc = currentDesc.replace(chip, '').replace(/\s{2,}/g, ' ').trim();
      updateItem(item.id, { desc: newDesc });
    } else {
      // Додаємо чип
      updateItem(item.id, { desc: currentDesc ? `${currentDesc} ${chip}` : chip });
    }
  };

  const handleDiscountChipClick = (val) => {
    if (val === 'custom') {
      setShowCustomDiscount(true);
    } else {
      setShowCustomDiscount(false);
      updateItem(item.id, { discountWork: val });
    }
  };

  const effectiveRateWork = Math.max(0, item.rateWork - item.discountWork);
  const effectiveRateMetal = Math.max(0, item.rateTotal - item.rateWork);
  const totalPrice = item.weight * (effectiveRateWork + effectiveRateMetal);

  const catName = item.categoryId === 'custom' ? 'Своя ціна' : (categories.find(c => c.id === item.categoryId)?.name || '');

  return (
    <div className={`item-card ${expanded ? 'expanded' : ''}`}>
      <div className="item-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="item-card-summary">
          <div className="item-card-title">{item.desc || `Новий виріб #${index + 1}`}</div>
          <div className="item-card-meta">
            <span>{item.weight || 0} г</span>
            {catName && <span className="cat-badge">{catName}</span>}
          </div>
        </div>
        <div className="item-card-price">{Math.round(totalPrice)} грн</div>
        <div className="item-card-toggle">{expanded ? '▲' : '▼'}</div>
      </div>

      {expanded && (
        <div className="item-card-body" style={{ padding: '0.75rem' }}>
          <div className="form-row" style={{ marginBottom: '0.5rem' }}>
            <div className="form-group col-12" style={{ marginBottom: '0.5rem' }}>
              <label style={{ marginBottom: '0.2rem' }}>Опис виробу:</label>
              <input 
                type="text" 
                ref={descInputRef}
                value={item.desc}
                onChange={e => updateItem(item.id, { desc: e.target.value })}
                placeholder="Наприклад: Каблучка з діамантом"
                style={{ padding: '0.4rem', fontSize: '0.9rem' }}
              />
              <div className="chips-grid">
                {DESC_CHIPS.map(chip => {
                  const isActive = chip !== 'Інше' && (item.desc || '').includes(chip);
                  return (
                    <button 
                      key={chip} 
                      type="button" 
                      className={`chip-btn ${isActive ? 'active' : ''}`}
                      onClick={() => handleDescChipClick(chip)}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="form-row" style={{ marginBottom: '0.5rem' }}>
            <div className="form-group col-6" style={{ marginBottom: '0.5rem' }}>
              <label style={{ marginBottom: '0.2rem' }}>Вага, г:</label>
              <input 
                type="number" 
                value={item.weight || ''}
                onChange={e => updateItem(item.id, { weight: parseFloat(e.target.value) || 0 })}
                min="0" step="0.01" 
                style={{ padding: '0.4rem', fontSize: '0.9rem' }}
              />
            </div>
            <div className="form-group col-6" style={{ marginBottom: '0.5rem' }}>
              <label style={{ marginBottom: '0.2rem' }}>Категорія:</label>
              <select value={item.categoryId} onChange={handleCategoryChange} style={{ padding: '0.4rem', fontSize: '0.9rem' }}>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value="custom">Своя ціна...</option>
              </select>
            </div>
          </div>

          <div className="form-row rates-row" style={{ marginBottom: '0' }}>
            <div className="form-group col-4">
              <label>Загальна, грн/г:</label>
              <input 
                type="number" 
                value={item.rateTotal || ''}
                onChange={e => updateItem(item.id, { rateTotal: parseFloat(e.target.value) || 0, categoryId: 'custom' })}
              />
            </div>
            <div className="form-group col-4">
              <label>Робота, грн/г:</label>
              <input 
                type="number" 
                value={item.rateWork || ''}
                onChange={e => updateItem(item.id, { rateWork: parseFloat(e.target.value) || 0, categoryId: 'custom' })}
              />
            </div>
            <div className="form-group col-4">
              <label>Знижка, грн/г:</label>
              {!showCustomDiscount ? (
                <div className="chips-container" style={{ flexWrap: 'wrap', overflow: 'visible' }}>
                  {DISCOUNT_CHIPS.map(val => (
                    <button 
                      key={val} 
                      type="button" 
                      className={`chip-btn chip-discount ${item.discountWork === val ? 'active' : ''}`}
                      onClick={() => handleDiscountChipClick(val)}
                      style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem' }}
                    >
                      {val === 0 ? '0' : `-${val}`}
                    </button>
                  ))}
                  <button 
                    type="button" 
                    className="chip-btn chip-discount"
                    onClick={() => handleDiscountChipClick('custom')}
                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem' }}
                  >
                    Інша
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="number" 
                    value={item.discountWork || ''}
                    onChange={e => updateItem(item.id, { discountWork: parseFloat(e.target.value) || 0 })}
                    className="discount-input"
                    autoFocus
                  />
                  <button type="button" className="icon-btn" onClick={() => setShowCustomDiscount(false)} title="Назад до швидких знижок">🔙</button>
                </div>
              )}
            </div>
          </div>
          <div className="card-actions-right" style={{ marginTop: '0.5rem', textAlign: 'right' }}>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(item.id)}>
              🗑 Видалити
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
