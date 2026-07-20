import React, { useState } from 'react';
import { formatNumber } from '../utils/formatNumber';

export default function ResultsPanel({ calcData, setRounding }) {
  const {
    caseType,
    newItemBreakdownData,
    newWeight,
    exchangeLoss,
    requiredWeight,
    totalCleanWeight585,
    missingWeight,
    excessWeight,
    workCost,
    metalCostToPay,
    rawFinalToPay,
    finalToPay,
    effectiveRateMetal
  } = calcData;

  const isExchange = calcData.operation === 'exchange';
  const [viewMode, setViewMode] = useState('table');

  const generateReceiptText = () => {
    let text = `АурумОбмін - Деталі розрахунку\n`;
    text += `--------------------------------\n`;
    text += `Нові вироби:\n`;
    newItemBreakdownData.forEach((item, idx) => {
      text += `${idx + 1}. ${item.desc || 'Виріб'} - ${formatNumber(item.weight)} г `;
      if (isExchange) {
        text += `(Робота: ${formatNumber(item.effectiveRateWork, 0)} грн/г)\n`;
      } else {
        text += `× ${formatNumber(item.effectiveRateTotal, 0)} грн/г\n`;
      }
    });

    if (isExchange) {
      text += `\nЗагальна вага нових: ${formatNumber(newWeight)} г\n`;
      text += `Необхідно металу (+${formatNumber(exchangeLoss, 1)}% втрат): ${formatNumber(requiredWeight)} г\n`;
      text += `Прийнято брухту (чистий 585): ${formatNumber(totalCleanWeight585)} г\n`;
      text += `--------------------------------\n`;
      
      if (caseType === 'exchange-missing') {
        text += `Нестача золота: +${formatNumber(missingWeight)} г\n`;
        text += `Доплата за золото: ${formatNumber(metalCostToPay, 0)} грн\n`;
        text += `Вартість роботи: ${formatNumber(workCost, 0)} грн\n`;
      } else if (caseType === 'exchange-excess') {
        text += `Надлишок металу: -${formatNumber(excessWeight)} г (повертається)\n`;
        text += `Вартість роботи: ${formatNumber(workCost, 0)} грн\n`;
      }
    } else {
      text += `--------------------------------\n`;
      text += `Вартість без заокруглення: ${formatNumber(rawFinalToPay, 0)} грн\n`;
    }

    text += `--------------------------------\n`;
    text += `ВСЬОГО ДО СПЛАТИ: ${formatNumber(finalToPay, 0)} грн\n`;
    return text;
  };

  const copyReceipt = () => {
    navigator.clipboard.writeText(generateReceiptText())
      .then(() => alert('📋 Текст чека успішно скопійовано!'))
      .catch(() => alert('❌ Помилка копіювання.'));
  };

  return (
    <section className="results-panel">
      <div className="card card-results">
        <div className="card-header" style={{ display: 'block' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>📊 Результат розрахунку</h2>
            <button className="icon-btn" title="Копіювати чек" onClick={copyReceipt} style={{ fontSize: '1.2rem', padding: '0.3rem' }}>
              📋
            </button>
          </div>
          
          <div className="tabs-container">
            <button className={`tab-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>
              📊 Таблиця
            </button>
            <button className={`tab-btn ${viewMode === 'text' ? 'active' : ''}`} onClick={() => setViewMode('text')}>
              📝 Текст
            </button>
          </div>
        </div>
        
        <div className="card-body">
          {viewMode === 'table' ? (
            <div className="results-breakdown" id="results-breakdown-list">
            {newItemBreakdownData.map((item, idx) => (
              <div className="breakdown-row" key={idx}>
                <span>Новий виріб #{idx + 1} ({item.desc})</span>
                {isExchange ? (
                  <span>{formatNumber(item.weight)} г (Робота: {formatNumber(item.effectiveRateWork, 0)} грн/г)</span>
                ) : (
                  <span>{formatNumber(item.weight)} г × {formatNumber(item.effectiveRateTotal, 0)} грн/г</span>
                )}
              </div>
            ))}

            {isExchange && (
              <>
                <div className="breakdown-row">
                  <span>Загальна вага нових виробів</span>
                  <span>{formatNumber(newWeight)} г</span>
                </div>
                <div className="breakdown-row">
                  <span>Необхідно металу (+{formatNumber(exchangeLoss, 1)}% втрат)</span>
                  <span style={{ fontWeight: 600 }}>{formatNumber(requiredWeight)} г</span>
                </div>
                <div className="breakdown-row">
                  <span>Прийнято брухту (чистий 585)</span>
                  <span>{formatNumber(totalCleanWeight585)} г</span>
                </div>

                {caseType === 'exchange-missing' && (
                  <>
                    <div className="breakdown-row">
                      <span>Нестача золота до сплати</span>
                      <span style={{ color: 'var(--crimson-text)', fontWeight: 700 }}>+ {formatNumber(missingWeight)} г</span>
                    </div>
                    <div className="breakdown-row">
                      <span>Вартість доплати за золото</span>
                      <span>{formatNumber(missingWeight)} г × {formatNumber(effectiveRateMetal, 0)} грн/г = {formatNumber(metalCostToPay, 0)} грн</span>
                    </div>
                    <div className="breakdown-row">
                      <span>Вартість роботи (зі знижками)</span>
                      <span>{formatNumber(workCost, 0)} грн</span>
                    </div>
                  </>
                )}

                {caseType === 'exchange-excess' && (
                  <>
                    <div className="breakdown-row">
                      <span>Надлишок металу (повертається)</span>
                      <span style={{ color: 'var(--emerald-text)', fontWeight: 700 }}>- {formatNumber(excessWeight)} г</span>
                    </div>
                    <div className="breakdown-row">
                      <span>Вартість роботи (до сплати)</span>
                      <span>{formatNumber(workCost, 0)} грн</span>
                    </div>
                  </>
                )}
              </>
            )}

            {!isExchange && (
              <div className="breakdown-row">
                <span>Вартість без заокруглення</span>
                <span>{formatNumber(rawFinalToPay, 0)} грн</span>
              </div>
            )}
          </div>
          ) : (
            <div className="text-receipt-container">
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{generateReceiptText()}</pre>
            </div>
          )}

          <div className="results-total-box" id="results-total-box">
            <span className="final-price-label">Всього до сплати:</span>
            <span className="final-price-value" id="final-to-pay">{formatNumber(finalToPay, 0)} <small>грн</small></span>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Заокруглення суми:</label>
            <select id="rounding-select" defaultValue="0" onChange={(e) => setRounding(e.target.value)}>
              <option value="0">Без заокруглення</option>
              <option value="10">До десятків (напр. 1540)</option>
              <option value="50">До п'ятдесяти (напр. 1550)</option>
              <option value="100">До сотень (напр. 1500)</option>
            </select>
          </div>

          <div id="balance-alert" className={`balance-status-alert ${
            caseType === 'purchase' ? 'alert-info' :
            caseType === 'exchange-missing' ? 'alert-danger' : 'alert-success'
          }`}>
            <span>
              {caseType === 'purchase' ? 'ℹ️ Розраховано за прямою купівлею без обміну металу.' :
               caseType === 'exchange-missing' ? `⚠️ Не вистачає ${formatNumber(missingWeight)} г металу. Клієнт доплачує за метал та роботу.` :
               `✅ Вистачає металу. Надлишок: ${formatNumber(excessWeight)} г.`}
            </span>
          </div>

        </div>
      </div>
    </section>
  );
}
