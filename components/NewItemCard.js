import React, { useState } from 'react';

export default function NewItemCard({ item, index, categories, updateItem, removeItem }) {
  const [expanded, setExpanded] = useState(index === 0);

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
        <div className="item-card-body">
          <div className="form-row">
            <div className="form-group col-12">
              <label>Опис виробу:</label>
              <input 
                type="text" 
                value={item.desc}
                onChange={e => updateItem(item.id, { desc: e.target.value })}
                placeholder="Наприклад: Каблучка з діамантом"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group col-6">
              <label>Вага, г:</label>
              <input 
                type="number" 
                value={item.weight || ''}
                onChange={e => updateItem(item.id, { weight: parseFloat(e.target.value) || 0 })}
                min="0" step="0.01" 
              />
            </div>
            <div className="form-group col-6">
              <label>Категорія:</label>
              <select value={item.categoryId} onChange={handleCategoryChange}>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value="custom">Своя ціна...</option>
              </select>
            </div>
          </div>

          <div className="form-row rates-row">
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
              <input 
                type="number" 
                value={item.discountWork || ''}
                onChange={e => updateItem(item.id, { discountWork: parseFloat(e.target.value) || 0 })}
                className="discount-input"
              />
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
