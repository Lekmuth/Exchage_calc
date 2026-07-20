import React, { useState } from 'react';

export default function ScrapRow({ item, index, updateItem, removeItem }) {
  const [expanded, setExpanded] = useState(true);
  const cleanWeight = item.weight * (1 - item.loss / 100) * (item.purity / 585);

  return (
    <div className={`item-card ${expanded ? 'expanded' : ''}`} style={{ marginBottom: '0.5rem' }}>
      <div className="item-card-header" onClick={() => setExpanded(!expanded)} style={{ padding: '0.75rem' }}>
        <div className="item-card-summary">
          <div className="item-card-title" style={{ fontSize: '0.95rem' }}>
            {item.desc || `Брухт #${index + 1}`}
          </div>
          <div className="item-card-meta" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {item.weight || 0} г • Проба: {item.purity || 585} • Угар: {item.loss || 0}%
          </div>
        </div>
        <div className="item-card-price" style={{ fontSize: '0.95rem', marginRight: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'normal', lineHeight: '1' }}>Чиста (585)</span>
          <span style={{ lineHeight: '1' }}>{(Math.round(cleanWeight * 100) / 100).toFixed(2)} г</span>
        </div>
        <div className="item-card-toggle">{expanded ? '▲' : '▼'}</div>
      </div>

      {expanded && (
        <div className="item-card-body" style={{ padding: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
        <input 
          type="text" 
          value={item.desc}
          onChange={e => updateItem(item.id, { desc: e.target.value })}
          placeholder="Опис брухту..."
          style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem', marginRight: '0.5rem' }}
        />
        <button type="button" onClick={() => removeItem(item.id)} title="Видалити" style={{ background: 'none', border: 'none', color: 'var(--crimson-primary)', cursor: 'pointer', fontSize: '1.2rem' }}>
          🗑
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Вага брутто, г:</label>
          <input 
            type="number" 
            value={item.weight || ''}
            onChange={e => updateItem(item.id, { weight: parseFloat(e.target.value) || 0 })}
            min="0" step="0.01"
            style={{ padding: '0.4rem', fontSize: '0.9rem', width: '100%' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Проба:</label>
          <input 
            type="number" 
            value={item.purity || ''}
            onChange={e => updateItem(item.id, { purity: parseFloat(e.target.value) || 0 })}
            min="0" step="1"
            style={{ padding: '0.4rem', fontSize: '0.9rem', width: '100%' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Угар, %:</label>
          <input 
            type="number" 
            value={item.loss || ''}
            onChange={e => updateItem(item.id, { loss: parseFloat(e.target.value) || 0 })}
            min="0" step="0.1"
            style={{ padding: '0.4rem', fontSize: '0.9rem', width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Чиста вага (585):</label>
          <div style={{ fontWeight: 700, color: 'var(--gold-primary)', fontSize: '1.1rem' }}>
            {(Math.round(cleanWeight * 100) / 100).toFixed(2)} г
          </div>
        </div>
        </div>
        </div>
      )}
    </div>
  );
}
