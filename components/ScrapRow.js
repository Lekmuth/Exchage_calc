import React from 'react';

export default function ScrapRow({ item, index, updateItem, removeItem }) {
  const cleanWeight = item.weight * (1 - item.loss / 100) * (item.purity / 585);

  return (
    <tr>
      <td>
        <input 
          type="text" 
          value={item.desc}
          onChange={e => updateItem(item.id, { desc: e.target.value })}
          placeholder="Лопи, кільце..."
          className="scrap-desc-input"
        />
      </td>
      <td>
        <input 
          type="number" 
          value={item.weight || ''}
          onChange={e => updateItem(item.id, { weight: parseFloat(e.target.value) || 0 })}
          min="0" step="0.01"
        />
      </td>
      <td>
        <input 
          type="number" 
          value={item.purity || ''}
          onChange={e => updateItem(item.id, { purity: parseFloat(e.target.value) || 0 })}
          min="0" step="1"
        />
      </td>
      <td>
        <input 
          type="number" 
          value={item.loss || ''}
          onChange={e => updateItem(item.id, { loss: parseFloat(e.target.value) || 0 })}
          min="0" step="0.1"
        />
      </td>
      <td style={{ textAlign: 'right', fontWeight: 600 }}>
        {(Math.round(cleanWeight * 100) / 100).toFixed(2)}
      </td>
      <td style={{ textAlign: 'center' }}>
        <button type="button" className="btn-icon text-danger" onClick={() => removeItem(item.id)} title="Видалити">
          🗑
        </button>
      </td>
    </tr>
  );
}
