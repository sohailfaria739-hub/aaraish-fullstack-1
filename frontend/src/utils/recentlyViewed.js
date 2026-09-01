const KEY = 'aaraish_recently_viewed';
const MAX = 8;

export function addRecentlyViewed(productId) {
  try {
    const current = JSON.parse(localStorage.getItem(KEY) || '[]');
    const next = [productId, ...current.filter((id) => id !== productId)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch (e) { /* localStorage unavailable */ }
}

export function getRecentlyViewed() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch (e) {
    return [];
  }
}
