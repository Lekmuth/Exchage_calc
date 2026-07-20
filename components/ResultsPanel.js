import React from 'react';
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

  return (
    <section className="results-panel">
      <div className="card card-results">
        <div className="card-header">
          <h2>📊 Результат розрахунку</h2>
          <button id="copy-receipt-btn" className="icon-btn" title="Копіювати чек" style={{ fontSize: '1.2rem', padding: '0.3rem' }}>
            📋
          </button>
        </div>
        
        <div className="card-body">
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

          <div className="final-price-box">
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
