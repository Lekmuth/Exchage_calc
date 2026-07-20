import { useMemo } from 'react';

export function useCalculator({
  operation,
  newItems,
  scrapItems,
  buybackRate,
  buybackAdjust,
  rounding,
  excessTreatment,
  globalSettings
}) {
  return useMemo(() => {
    let newWeight = 0;
    let workCostTotal = 0;
    let metalCostTotal = 0;
    
    const newItemBreakdownData = [];
    
    newItems.forEach((item) => {
      const weight = parseFloat(item.weight) || 0;
      const rateTotal = parseFloat(item.rateTotal) || 0;
      const rateWork = parseFloat(item.rateWork) || 0;
      const discountWork = parseFloat(item.discountWork) || 0;
      
      const effectiveRateWork = Math.max(0, rateWork - discountWork);
      const effectiveRateMetal = Math.max(0, rateTotal - rateWork);
      const effectiveRateTotal = effectiveRateMetal + effectiveRateWork;
      
      newWeight += weight;
      
      if (weight > 0) {
        const itemWorkCost = weight * effectiveRateWork;
        const itemMetalCost = weight * effectiveRateMetal;
        
        workCostTotal += itemWorkCost;
        metalCostTotal += itemMetalCost;
        
        newItemBreakdownData.push({
          id: item.id,
          desc: item.desc || 'Новий виріб',
          weight,
          effectiveRateWork,
          effectiveRateMetal,
          effectiveRateTotal,
          itemWorkCost,
          itemMetalCost
        });
      }
    });

    newWeight = Math.round(newWeight * 100) / 100;

    const effectiveRateMetal = newWeight > 0 ? metalCostTotal / newWeight : 0;
    const effectiveRateWork = newWeight > 0 ? workCostTotal / newWeight : 0;
    const effectiveRateTotal = effectiveRateMetal + effectiveRateWork;

    const effectiveBuybackRate = Math.max(0, (parseFloat(buybackRate) || 0) + (parseFloat(buybackAdjust) || 0));
    const isExchange = operation === 'exchange';

    let totalGrossWeight = 0;
    let totalCleanWeight585 = 0;
    const scrapBreakdownData = [];

    if (isExchange) {
      scrapItems.forEach(item => {
        const gross = parseFloat(item.weight) || 0;
        const purity = parseFloat(item.purity) || 585;
        const loss = parseFloat(item.loss) || 0;
        
        if (gross > 0) {
          totalGrossWeight += gross;
          const cleanWeight = gross * (1 - loss / 100) * (purity / 585);
          totalCleanWeight585 += cleanWeight;
          
          scrapBreakdownData.push({
            id: item.id,
            desc: item.desc,
            gross,
            purity,
            loss,
            clean: Math.round(cleanWeight * 100) / 100
          });
        }
      });
      totalGrossWeight = Math.round(totalGrossWeight * 100) / 100;
      totalCleanWeight585 = Math.round(totalCleanWeight585 * 100) / 100;
    }

    let rawFinalToPay = 0;
    let hasScrap = totalGrossWeight > 0;
    const exchangeLoss = hasScrap ? (globalSettings?.exchangeLoss ?? 10.0) : 0.0;
    
    let requiredWeight = 0;
    let missingWeight = 0;
    let excessWeight = 0;
    let workCost = Math.round(workCostTotal);
    let metalCostToPay = 0;
    let caseType = 'purchase'; 

    if (!isExchange || newWeight === 0) {
      rawFinalToPay = Math.round(workCostTotal + metalCostTotal);
      caseType = 'purchase';
    } else {
      requiredWeight = Math.round((newWeight * (1 + exchangeLoss / 100)) * 100) / 100;
      missingWeight = Math.round((requiredWeight - totalCleanWeight585) * 100) / 100;
      
      if (missingWeight > 0) {
        metalCostToPay = Math.round(missingWeight * effectiveRateMetal);
        rawFinalToPay = workCost + metalCostToPay;
        caseType = 'exchange-missing';
      } else {
        excessWeight = Math.round(Math.abs(missingWeight) * 100) / 100;
        caseType = 'exchange-excess';
        
        if (excessTreatment === 'return') {
          rawFinalToPay = workCost;
        } else if (excessTreatment === 'buyout') {
          const buyoutValue = Math.round(excessWeight * effectiveBuybackRate);
          rawFinalToPay = workCost - buyoutValue;
        } else {
          rawFinalToPay = workCost;
        }
      }
    }

    let finalToPay = rawFinalToPay;
    const roundStep = parseFloat(rounding);
    if (roundStep > 0 && finalToPay > 0) {
      finalToPay = Math.round(finalToPay / roundStep) * roundStep;
    }

    return {
      operation,
      caseType,
      newWeight,
      workCostTotal,
      metalCostTotal,
      effectiveRateMetal,
      effectiveRateWork,
      effectiveRateTotal,
      newItemBreakdownData,
      totalGrossWeight,
      totalCleanWeight585,
      scrapBreakdownData,
      exchangeLoss,
      requiredWeight,
      missingWeight,
      excessWeight,
      workCost,
      metalCostToPay,
      rawFinalToPay,
      finalToPay,
      effectiveBuybackRate,
      excessTreatment
    };

  }, [
    operation, newItems, scrapItems, buybackRate, buybackAdjust, 
    rounding, excessTreatment, globalSettings
  ]);
}
