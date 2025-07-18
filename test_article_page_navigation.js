// Test script to verify ArticlePage data binding from different navigation sources
console.log('Testing ArticlePage data binding from Main vs RatePage...');

// Simulate store with sample data
const mockStore = {
  mainData: [
    { nm_id: 12345, total_price: 1000, discount_percent: 10, is_cancel: false, supplier_article: 'SUP123', oblast: 'Moscow' },
    { nm_id: 67890, total_price: 2000, discount_percent: 15, is_cancel: true, supplier_article: 'SUP456', oblast: 'SPB' },
    { nm_id: 11111, total_price: 500, discount_percent: 5, is_cancel: false, supplier_article: 'SUP789', oblast: 'Kazan' }
  ],
  mainDataPrev: [
    { nm_id: 12345, total_price: 800, discount_percent: 8, is_cancel: false },
    { nm_id: 67890, total_price: 1800, discount_percent: 12, is_cancel: false },
    { nm_id: 11111, total_price: 450, discount_percent: 4, is_cancel: false }
  ],
  loading: false,
  error: null,
  combineDataByArticle: function(category) {
    return this.mainData.map(item => ({
      nm_id: item.nm_id,
      mainSum: item[category] || 0,
      prevSum: this.mainDataPrev.find(prev => prev.nm_id === item.nm_id)?.[category] || 0,
      difference: '+10%'
    }));
  }
};

// Simulate selectedArticleData computed property logic
function getSelectedArticleData(selectedArticleValue, storeMainData) {
  if (!selectedArticleValue) return null;

  const articleRecord = storeMainData.find(
    (item) =>
      item.nm_id === selectedArticleValue ||
      item.nm_id === Number(selectedArticleValue) ||
      String(item.nm_id) === String(selectedArticleValue),
  );

  return articleRecord || null;
}

// Test 1: Navigation from Main page (article ID as string from URL params)
console.log('\n🧪 Test 1: Navigation from Main page');
const articleIdFromMain = '12345'; // URL param is always string
console.log('Article ID from Main (string):', articleIdFromMain, 'Type:', typeof articleIdFromMain);

const selectedDataFromMain = getSelectedArticleData(articleIdFromMain, mockStore.mainData);
console.log('Selected Article Data from Main:', selectedDataFromMain);

if (selectedDataFromMain) {
  console.log('✅ Data binding successful from Main page');
} else {
  console.log('❌ Data binding failed from Main page');
}

// Test 2: Navigation from RatePage (article ID might be number from row object)
console.log('\n🧪 Test 2: Navigation from RatePage');
const articleIdFromRate = 12345; // From row.nm_id which might be number
console.log('Article ID from Rate (number):', articleIdFromRate, 'Type:', typeof articleIdFromRate);

const selectedDataFromRate = getSelectedArticleData(articleIdFromRate, mockStore.mainData);
console.log('Selected Article Data from Rate:', selectedDataFromRate);

if (selectedDataFromRate) {
  console.log('✅ Data binding successful from RatePage');
} else {
  console.log('❌ Data binding failed from RatePage');
}

// Test 3: Edge case - article not found
console.log('\n🧪 Test 3: Article not found');
const nonExistentArticle = '99999';
const selectedDataNotFound = getSelectedArticleData(nonExistentArticle, mockStore.mainData);
console.log('Selected Article Data (not found):', selectedDataNotFound);

if (!selectedDataNotFound) {
  console.log('✅ Correctly returns null for non-existent article');
} else {
  console.log('❌ Should return null for non-existent article');
}

console.log('\n🎉 ArticlePage data binding tests completed!');
