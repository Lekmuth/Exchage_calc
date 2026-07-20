export function formatNumber(num, decimals = 2) {
  if (isNaN(num)) return '0';
  return Number(num).toLocaleString('uk-UA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
}
