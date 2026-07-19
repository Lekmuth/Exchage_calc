// ==========================================================================
// Calculator: Pure calculation logic and receipt text generation
// ==========================================================================
import { state } from './constants.js';

export function formatNumber(num, decimals = 2) {
  return Number(num).toLocaleString('uk-UA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function calculate() {
  // 1. Get New Items weights and descriptions
  let newWeight = 0;
  const newItemBreakdownData = [];
  const newItemRows = document.querySelectorAll('#new-item-rows tr');
  
  newItemRows.forEach(row => {
    const descInput = row.querySelector('.new-item-desc-input').value;
    const weightInput = parseFloat(row.querySelector('.new-item-weight-input').value) || 0;
    newWeight += weightInput;
    if (weightInput > 0) {
      newItemBreakdownData.push({
        desc: descInput || 'Новий виріб',
        weight: weightInput
      });
    }
  });

  // Round newWeight to 2 decimals
  newWeight = Math.round(newWeight * 100) / 100;

  // Get rates and discounts
  const rateMetal = parseFloat(document.getElementById('rate-metal').value) || 0;
  const rateWork = parseFloat(document.getElementById('rate-work').value) || 0;
  
  const metalDiscount = parseFloat(document.getElementById('metal-discount-val').value) || 0;
  const discount = parseFloat(document.getElementById('discount-val').value) || 0; // work discount
  
  const effectiveRateMetal = Math.max(0, rateMetal - metalDiscount);
  const effectiveRateWork = Math.max(0, rateWork - discount);
  const effectiveRateTotal = effectiveRateMetal + effectiveRateWork;

  // Update rates in UI
  document.getElementById('rate-total').value = effectiveRateTotal;
  document.getElementById('gold-price-val').innerText = formatNumber(effectiveRateMetal, 0);
  document.getElementById('work-price-val').innerText = formatNumber(effectiveRateWork, 0);

  // Buyback rate and adjustments
  const baseBuybackRate = parseFloat(document.getElementById('buyback-rate-input').value) || 0;
  const buybackAdjust = parseFloat(document.getElementById('buyback-adjust-val').value) || 0;
  const effectiveBuybackRate = Math.max(0, baseBuybackRate + buybackAdjust);

  // Check operation type
  const opType = document.querySelector('input[name="op-type"]:checked').value;
  const isExchange = opType === 'exchange';

  // State elements to hide/show
  const excessOptionsBox = document.getElementById('excess-metal-options');
  const resultsBreakdownList = document.getElementById('results-breakdown-list');
  const balanceAlert = document.getElementById('balance-alert');

  // Scrap logic values
  let totalGrossWeight = 0;
  let totalCleanWeight585 = 0;
  const scrapBreakdownData = [];

  // If Exchange, process the scrap gold table
  if (isExchange) {
    const rows = document.querySelectorAll('#scrap-rows tr');
    
    rows.forEach(row => {
      const rowId = row.id.replace('scrap-row-', '');
      const descInput = row.querySelector('.scrap-desc-input').value;
      const weightInput = parseFloat(row.querySelector('.scrap-weight-input').value) || 0;
      const sampleSelect = row.querySelector('.scrap-sample-select').value;
      const customSampleInput = parseFloat(row.querySelector('.scrap-custom-sample-input').value);
      const lossInput = parseFloat(row.querySelector('.scrap-loss-input').value) || 0;

      let sampleVal = 585;
      if (sampleSelect === 'custom') {
        sampleVal = customSampleInput || 585;
      } else {
        sampleVal = parseFloat(sampleSelect);
      }

      // Convert clean weight (rounded to 2 decimals)
      const cleanWeight = Math.round(weightInput * (1 - lossInput / 100) * (sampleVal / 585) * 100) / 100;
      
      // Update cell in table
      document.getElementById(`clean-weight-row-${rowId}`).innerText = `${formatNumber(cleanWeight, 2)} г`;

      const formulaEl = document.getElementById(`clean-formula-row-${rowId}`);
      if (formulaEl) {
        if (weightInput > 0) {
          const weightMultiplier = (1 - lossInput / 100);
          const hasLoss = lossInput > 0;
          const hasSampleDiff = sampleVal !== 585;
          let formulaText = "";
          
          if (hasLoss && hasSampleDiff) {
            formulaText = `${formatNumber(weightInput, 2)} × ${formatNumber(weightMultiplier, 2)} × (${sampleVal}/585)`;
          } else if (hasLoss) {
            formulaText = `${formatNumber(weightInput, 2)} × ${formatNumber(weightMultiplier, 2)}`;
          } else if (hasSampleDiff) {
            formulaText = `${formatNumber(weightInput, 2)} × (${sampleVal}/585)`;
          } else {
            formulaText = `${formatNumber(weightInput, 2)} × (585/585)`;
          }
          
          formulaEl.innerText = formulaText;
          formulaEl.style.display = 'block';
        } else {
          formulaEl.style.display = 'none';
        }
      }

      totalGrossWeight += weightInput;
      totalCleanWeight585 += cleanWeight;

      if (weightInput > 0) {
        scrapBreakdownData.push({
          desc: descInput || `Метал ${sampleVal}°`,
          gross: weightInput,
          sample: sampleVal,
          loss: lossInput,
          clean: cleanWeight
        });
      }
    });

    // Round total weights to 2 decimals
    totalGrossWeight = Math.round(totalGrossWeight * 100) / 100;
    totalCleanWeight585 = Math.round(totalCleanWeight585 * 100) / 100;

    // Update scrap summary in footer
    document.getElementById('total-gross-weight').innerText = `${formatNumber(totalGrossWeight, 2)} г`;
    document.getElementById('total-clean-weight').innerText = `${formatNumber(totalCleanWeight585, 2)} г`;
  }

  // 2. Compute Financial Outputs (Raw before rounding)
  let rawFinalToPay = 0;
  let receiptText = '';
  
  // Set default buyback rate in excess box description
  document.getElementById('buyback-rate-sub').innerText = effectiveBuybackRate;

  resultsBreakdownList.innerHTML = '';
  excessOptionsBox.style.display = 'none';

  const catName = state.activeCategoryId === 'custom' ? 'Своя ціна' : (state.categories.find(c => c.id === state.activeCategoryId)?.name || '');
  
  if (!isExchange || newWeight === 0) {
    // Simple Purchase Option
    rawFinalToPay = Math.round(newWeight * effectiveRateTotal);
    
    let breakdownHtml = '';
    newItemBreakdownData.forEach((item, idx) => {
      breakdownHtml += `
        <div class="breakdown-row">
          <span>Новий виріб #${idx+1} (${item.desc})</span>
          <span>${formatNumber(item.weight, 2)} г × ${formatNumber(effectiveRateTotal, 0)} грн/г</span>
        </div>
      `;
    });

    if (metalDiscount > 0) {
      breakdownHtml += `
        <div class="breakdown-row">
          <span>Знижка на метал</span>
          <span>-${formatNumber(metalDiscount, 0)} грн/г</span>
        </div>
      `;
    }
    if (discount > 0) {
      breakdownHtml += `
        <div class="breakdown-row">
          <span>Знижка на роботу</span>
          <span>-${formatNumber(discount, 0)} грн/г</span>
        </div>
      `;
    }

    breakdownHtml += `
      <div class="breakdown-row">
        <span>Вартість без заокруглення</span>
        <span>${formatNumber(rawFinalToPay, 0)} грн</span>
      </div>
    `;

    resultsBreakdownList.innerHTML = breakdownHtml;

    balanceAlert.className = 'balance-status-alert alert-info';
    balanceAlert.innerHTML = `<span>ℹ️ Розраховано за прямою купівлею без обміну металу.</span>`;

  } else {
    // Exchange Option (Metals are compared)
    const hasScrap = totalGrossWeight > 0;
    const exchangeLoss = hasScrap ? (state.settings.exchangeLoss !== undefined ? state.settings.exchangeLoss : 10.0) : 0.0;
    const requiredWeight = Math.round((newWeight * (1 + exchangeLoss / 100)) * 100) / 100;
    const workCost = Math.round(newWeight * effectiveRateWork);
    const missingWeight = Math.round((requiredWeight - totalCleanWeight585) * 100) / 100;
    
    let breakdownHtml = '';
    newItemBreakdownData.forEach((item, idx) => {
      breakdownHtml += `
        <div class="breakdown-row">
          <span>Новий виріб #${idx+1} (${item.desc})</span>
          <span>${formatNumber(item.weight, 2)} г</span>
        </div>
      `;
    });

    breakdownHtml += `
      <div class="breakdown-row">
        <span>Загальна вага нових виробів</span>
        <span>${formatNumber(newWeight, 2)} г</span>
      </div>
      <div class="breakdown-row">
        <span>Необхідно металу (+${formatNumber(exchangeLoss, 1)}% втрат)</span>
        <span style="font-weight: 600;">${formatNumber(requiredWeight, 2)} г</span>
      </div>
      <div class="breakdown-row">
        <span>Прийнято брухту (чистий 585)</span>
        <span>${formatNumber(totalCleanWeight585, 2)} г</span>
      </div>
    `;

    if (missingWeight > 0) {
      // Case A: Customer brought LESS gold than required
      const metalCostToPay = Math.round(missingWeight * effectiveRateMetal);
      rawFinalToPay = workCost + metalCostToPay;
      
      breakdownHtml += `
        <div class="breakdown-row">
          <span>Нестача золота до сплати</span>
          <span style="color: var(--crimson-text); font-weight:700;">+ ${formatNumber(missingWeight, 2)} г</span>
        </div>
        <div class="breakdown-row">
          <span>Вартість доплати за золото</span>
          <span>${formatNumber(missingWeight, 2)} г × ${formatNumber(effectiveRateMetal, 0)} грн/г = ${formatNumber(metalCostToPay, 0)} грн</span>
        </div>
        <div class="breakdown-row">
          <span>Вартість роботи (зі знижкою)</span>
          <span>${formatNumber(newWeight, 2)} г × ${formatNumber(effectiveRateWork, 0)} грн/г = ${formatNumber(workCost, 0)} грн</span>
        </div>
      `;

      if (metalDiscount > 0) {
        breakdownHtml += `
          <div class="breakdown-row">
            <span>Знижка на метал</span>
            <span>-${formatNumber(metalDiscount, 0)} грн/г (еф. ціна: ${formatNumber(effectiveRateMetal, 0)} грн/г)</span>
          </div>
        `;
      }
      if (discount > 0) {
        breakdownHtml += `
          <div class="breakdown-row">
            <span>Знижка на роботу</span>
            <span>-${formatNumber(discount, 0)} грн/г (еф. ціна: ${formatNumber(effectiveRateWork, 0)} грн/г)</span>
          </div>
        `;
      }

      resultsBreakdownList.innerHTML = breakdownHtml;

      balanceAlert.className = 'balance-status-alert alert-danger';
      balanceAlert.innerHTML = `<span>⚠️ Не вистачає <strong>${formatNumber(missingWeight, 2)} г</strong> металу. Клієнт доплачує за метал та роботу.</span>`;
      
    } else {
      // Case B: Customer brought MORE gold than required (Excess)
      const excessWeight = Math.round(Math.abs(missingWeight) * 100) / 100;
      
      // Update excess titles
      document.getElementById('excess-val-title').innerText = formatNumber(excessWeight, 2);
      document.querySelectorAll('.excess-val-sub').forEach(el => el.innerText = formatNumber(excessWeight, 2));
      excessOptionsBox.style.display = 'block';

      // Get excess gold treatment
      const excessTreatment = document.querySelector('input[name="excess-treatment"]:checked').value;

      if (excessTreatment === 'return') {
        // Return option: Customer only pays for work, receives excess metal
        rawFinalToPay = workCost;

        breakdownHtml += `
          <div class="breakdown-row">
            <span>Надлишок металу (повертається)</span>
            <span style="color: var(--emerald-text); font-weight:700;">- ${formatNumber(excessWeight, 2)} г</span>
          </div>
          <div class="breakdown-row">
            <span>Вартість роботи (до сплати)</span>
            <span>${formatNumber(newWeight, 2)} г × ${formatNumber(effectiveRateWork, 0)} грн/г = ${formatNumber(workCost, 0)} грн</span>
          </div>
        `;

        if (discount > 0) {
          breakdownHtml += `
            <div class="breakdown-row">
              <span>Знижка на роботу</span>
              <span>-${formatNumber(discount, 0)} грн/г (еф. ціна: ${formatNumber(effectiveRateWork, 0)} грн/г)</span>
            </div>
          `;
        }

        resultsBreakdownList.innerHTML = breakdownHtml;

        balanceAlert.className = 'balance-status-alert alert-success';
        balanceAlert.innerHTML = `<span>✅ Надлишок золота <strong>${formatNumber(excessWeight, 2)} г</strong> повертається клієнту у вигляді брухту. Клієнт сплачує лише за роботу.</span>`;

      } else {
        // Buyback option: Store buys back the excess metal
        const buybackPayout = Math.round(excessWeight * effectiveBuybackRate);
        rawFinalToPay = workCost - buybackPayout;
        
        breakdownHtml += `
          <div class="breakdown-row">
            <span>Надлишок металу (на викуп)</span>
            <span style="color: var(--emerald-text); font-weight:700;">- ${formatNumber(excessWeight, 2)} г</span>
          </div>
          <div class="breakdown-row">
            <span>Вартість роботи виробу</span>
            <span>${formatNumber(workCost, 0)} грн</span>
          </div>
        `;

        if (discount > 0) {
          breakdownHtml += `
            <div class="breakdown-row">
              <span>Знижка на роботу</span>
              <span>-${formatNumber(discount, 0)} грн/г (еф. ціна: ${formatNumber(effectiveRateWork, 0)} грн/г)</span>
            </div>
          `;
        }

        breakdownHtml += `
          <div class="breakdown-row">
            <span>Викуп надлишку магазином</span>
            <span style="color: var(--emerald-text); font-weight:600;">- ${formatNumber(buybackPayout, 0)} грн (${formatNumber(excessWeight, 2)} г × ${formatNumber(effectiveBuybackRate, 0)} грн/г)</span>
          </div>
        `;

        resultsBreakdownList.innerHTML = breakdownHtml;

        if (rawFinalToPay >= 0) {
          balanceAlert.className = 'balance-status-alert alert-success';
          balanceAlert.innerHTML = `<span>✅ Вартість викупу надлишку вираховано з роботи. Клієнт доплачує різницю.</span>`;
        } else {
          balanceAlert.className = 'balance-status-alert alert-success';
          balanceAlert.innerHTML = `<span>💸 Викуп металу перевищує ціну роботи. <strong>Магазин виплачує клієнту ${formatNumber(Math.abs(rawFinalToPay), 0)} грн</strong>.</span>`;
        }
      }
    }
  }

  // 3. Apply Rounding
  const roundingType = document.getElementById('rounding-select').value;
  let roundedFinalToPay = rawFinalToPay;
  
  if (newWeight > 0) {
    if (roundingType === '1') {
      roundedFinalToPay = Math.round(rawFinalToPay);
    } else if (roundingType === '10') {
      roundedFinalToPay = Math.round(rawFinalToPay / 10) * 10;
    } else if (roundingType === '50') {
      roundedFinalToPay = Math.round(rawFinalToPay / 50) * 50;
    } else if (roundingType === '100') {
      roundedFinalToPay = Math.round(rawFinalToPay / 100) * 100;
    }
  }

  const roundingDifference = roundedFinalToPay - rawFinalToPay;

  // Add rounding row if applicable
  if (Math.abs(roundingDifference) >= 0.01 && newWeight > 0) {
    resultsBreakdownList.innerHTML += `
      <div class="breakdown-row">
        <span>Заокруглення суми</span>
        <span style="color: var(--text-muted); font-weight: 600;">${roundingDifference > 0 ? '+' : ''}${formatNumber(roundingDifference, 0)} грн</span>
      </div>
    `;
  }

  // Update total payment screen display
  updateToPayDisplay(roundedFinalToPay);

  // 4. Generate Receipt Text for Client
  if (newWeight > 0) {
    const roundingStr = Math.abs(roundingDifference) >= 0.01 ? `Заокруглення: ${roundingDifference > 0 ? '+' : ''}${formatNumber(roundingDifference, 0)} грн\n` : '';
    
    // Construct new item details string for receipt
    let newItemDetailsStr = '';
    newItemBreakdownData.forEach((item, idx) => {
      newItemDetailsStr += ` - Виріб #${idx+1} (${item.desc}): ${formatNumber(item.weight, 2)} г\n`;
    });

    if (!isExchange) {
      let priceDetails = `${formatNumber(rateTotal, 0)} грн/г`;
      if (metalDiscount > 0 || discount > 0) {
        priceDetails = `Метал: ${formatNumber(effectiveRateMetal, 0)} грн/г, Робота: ${formatNumber(effectiveRateWork, 0)} грн/г ➔ Разом: ${formatNumber(effectiveRateTotal, 0)} грн/г`;
      }

      receiptText = 
`ЮВЕЛІРНИЙ МАГАЗИН - ПРОРАХУНОК КУПІВЛІ
----------------------------------------
Нові вироби:
${newItemDetailsStr}Категорія: ${catName}
Загальна вага виробів: ${formatNumber(newWeight, 2)} г
Ціна за грам: ${priceDetails}

${roundingStr}Всього до сплати: ${formatNumber(roundedFinalToPay, 0)} грн
----------------------------------------
Дякуємо за візит!`;

    } else {
      let scrapDetailsStr = '';
      scrapBreakdownData.forEach((item, idx) => {
        scrapDetailsStr += ` - Брухт #${idx+1} (${item.desc}): ${formatNumber(item.gross, 2)}г (проба ${item.sample}, угар ${item.loss}%) ➔ ${formatNumber(item.clean, 2)}г (екв. 585)\n`;
      });

      const exchangeLoss = state.settings.exchangeLoss !== undefined ? state.settings.exchangeLoss : 10.0;
      const requiredWeight = Math.round((newWeight * (1 + exchangeLoss / 100)) * 100) / 100;
      const missingWeight = Math.round((requiredWeight - totalCleanWeight585) * 100) / 100;
      
      let workDetailsText = `${formatNumber(rateWork, 0)} грн/г`;
      if (discount > 0) {
        workDetailsText = `${formatNumber(rateWork, 0)} грн/г (знижка: -${formatNumber(discount, 0)} грн/г) = ${formatNumber(effectiveRateWork, 0)} грн/г`;
      }

      let metalDetailsText = `${formatNumber(rateMetal, 0)} грн/г`;
      if (metalDiscount > 0) {
        metalDetailsText = `${formatNumber(rateMetal, 0)} грн/г (знижка: -${formatNumber(metalDiscount, 0)} грн/г) = ${formatNumber(effectiveRateMetal, 0)} грн/г`;
      }

      if (missingWeight > 0) {
        // Shortage receipt
        const workCost = Math.round(newWeight * effectiveRateWork);
        const metalCostToPay = Math.round(missingWeight * effectiveRateMetal);

        receiptText = 
`ЮВЕЛІРНИЙ МАГАЗИН - ОБМІН ЗОЛОТА
----------------------------------------
НОВІ ВИРОБИ:
Категорія: ${catName}
${newItemDetailsStr}Загальна вага виробів: ${formatNumber(newWeight, 2)} г
Втрати при обміні (${formatNumber(exchangeLoss, 1)}%): ${formatNumber(newWeight * exchangeLoss / 100, 2)} г
Необхідно металу: ${formatNumber(requiredWeight, 2)} г
Ціна металу за грам: ${metalDetailsText}
Робота за грам: ${workDetailsText}

ПРИЙНЯТИЙ БРУХТ (чистий екв. 585):
${scrapDetailsStr}Загалом чистого брухту: ${formatNumber(totalCleanWeight585, 2)} г

БАЛАНС МЕТАЛУ:
Нестача металу: ${formatNumber(missingWeight, 2)} г
Доплата за метал: ${formatNumber(missingWeight, 2)}г × ${formatNumber(effectiveRateMetal, 0)} грн = ${formatNumber(metalCostToPay, 0)} грн
Оплата роботи: ${formatNumber(newWeight, 2)}г × ${formatNumber(effectiveRateWork, 0)} грн = ${formatNumber(workCost, 0)} грн

Загальна сума: ${formatNumber(rawFinalToPay, 0)} грн
${roundingStr}
ДО СПЛАТИ КЛІЄНТОМ: ${formatNumber(roundedFinalToPay, 0)} грн
----------------------------------------
Дякуємо за візит!`;

      } else {
        // Excess receipt
        const excessWeight = Math.round(Math.abs(missingWeight) * 100) / 100;
        const excessTreatment = document.querySelector('input[name="excess-treatment"]:checked').value;
        const workCost = Math.round(newWeight * effectiveRateWork);

        if (excessTreatment === 'return') {
          receiptText = 
`ЮВЕЛІРНИЙ МАГАЗИН - ОБМІН ЗОЛОТА (НАДЛИШОК)
----------------------------------------
НОВІ ВИРОБИ:
Категорія: ${catName}
${newItemDetailsStr}Загальна вага виробів: ${formatNumber(newWeight, 2)} г
Втрати при обміні (${formatNumber(exchangeLoss, 1)}%): ${formatNumber(newWeight * exchangeLoss / 100, 2)} г
Необхідно металу: ${formatNumber(requiredWeight, 2)} г
Робота за грам: ${workDetailsText}

ПРИЙНЯТИЙ БРУХТ (чистий екв. 585):
${scrapDetailsStr}Загалом чистого брухту: ${formatNumber(totalCleanWeight585, 2)} г

БАЛАНС МЕТАЛУ:
Надлишок металу: ${formatNumber(excessWeight, 2)} г (ПОВЕРТАЄТЬСЯ КЛІЄНТУ)

РОЗРАХУНОК ВАРТОСТІ:
Оплата роботи: ${formatNumber(newWeight, 2)}г × ${formatNumber(effectiveRateWork, 0)} грн = ${formatNumber(workCost, 0)} грн

Загальна сума: ${formatNumber(rawFinalToPay, 0)} грн
${roundingStr}
ДО СПЛАТИ КЛІЄНТОМ: ${formatNumber(Math.abs(roundedFinalToPay), 0)} грн
Залишок металу на повернення: ${formatNumber(excessWeight, 2)} г (585 проба)
----------------------------------------
Дякуємо за візит!`;
        } else {
          const buybackPayout = Math.round(excessWeight * effectiveBuybackRate);
          const payoutWord = roundedFinalToPay >= 0 ? 'ДО СПЛАТИ КЛІЄНТОМ' : 'МАГАЗИН ПОВЕРТАЄ КЛІЄНТУ';

          receiptText = 
`ЮВЕЛІРНИЙ МАГАЗИН - ОБМІН З ВИКУПОМ НАДЛИШКУ
----------------------------------------
НОВІ ВИРОБИ:
Категорія: ${catName}
${newItemDetailsStr}Загальна вага виробів: ${formatNumber(newWeight, 2)} г
Втрати при обміні (${formatNumber(exchangeLoss, 1)}%): ${formatNumber(newWeight * exchangeLoss / 100, 2)} г
Необхідно металу: ${formatNumber(requiredWeight, 2)} г
Робота за грам: ${workDetailsText}

ПРИЙНЯТИЙ БРУХТ (чистий екв. 585):
${scrapDetailsStr}Загалом чистого брухту: ${formatNumber(totalCleanWeight585, 2)} г

БАЛАНС МЕТАЛУ:
Надлишок металу: ${formatNumber(excessWeight, 2)} г (ВИКУПЛЯЄТЬСЯ МАГАЗИНОМ)
Ціна викупу брухту: ${formatNumber(effectiveBuybackRate, 0)} грн/г

РОЗРАХУНОК ВАРТОСТІ:
Оплата роботи: ${formatNumber(newWeight, 2)}г × ${formatNumber(effectiveRateWork, 0)} грн = ${formatNumber(workCost, 0)} грн
Виплата за брухт: ${formatNumber(excessWeight, 2)}г × ${formatNumber(effectiveBuybackRate, 0)} грн = -${formatNumber(buybackPayout, 0)} грн

Загальна сума: ${formatNumber(rawFinalToPay, 0)} грн
${roundingStr}
${payoutWord}: ${formatNumber(Math.abs(roundedFinalToPay), 0)} грн
----------------------------------------
Дякуємо за візит!`;
        }
      }
    }
  }

  // Set the receipt textarea
  document.getElementById('receipt-text').value = receiptText.trim();
}

function updateToPayDisplay(val) {
  const el = document.getElementById('final-to-pay');
  if (val >= 0) {
    el.className = 'result-value';
    el.innerHTML = `${formatNumber(val, 0)} <span class="currency">грн</span>`;
  } else {
    el.className = 'result-value refund';
    el.innerHTML = `-${formatNumber(Math.abs(val), 0)} <span class="currency">грн</span>`;
    // Add subtitle indicating refund
    const label = document.querySelector('.result-label');
    label.innerText = "Сума до повернення клієнту:";
  }
  
  if (val >= 0) {
    document.querySelector('.result-label').innerText = "Сума до сплати клієнтом:";
  }
}
