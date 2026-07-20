// ==========================================================================
// Constants & Initial Data Defaults
// ==========================================================================
export const DEFAULT_CATEGORIES = [
  { id: 'cat1', name: 'Категорія 1', total: 7000, work: 2100 }
];

export const DEFAULT_GLOBAL_SETTINGS = {
  buybackRate: 2000, // UAH/g for scrap purchase
  defaultLoss: 0.0,  // 0% default metal loss on scrap
  exchangeLoss: 10.0, // 10% default metal loss on new item
  appTitle: 'Ювелірний Калькулятор',
  appSubtitle: 'Калькулятор обміну золота'
};

// Shared application state
export const state = {
  categories: [],
  settings: {},
  activeCategoryId: 'cat1',
  nextRowId: 1,
  nextNewItemRowId: 1
};
