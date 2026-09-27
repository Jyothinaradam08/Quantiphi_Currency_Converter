import { http } from './httpClient'

export const currencyApi = {
  getCurrencies: () => http.get('/currencies'),

  getQuote: ({ from, to, amount }, signal) =>
    http.get('/rates/convert', { query: { from, to, amount }, signal }),

  getTrend: ({ from, to, days }, signal) => http.get('/trends', { query: { from, to, days }, signal }),

  convert: ({ from, to, amount }) => http.post('/conversions', { from, to, amount }),
  getHistory: (limit = 10) => http.get('/conversions', { query: { limit } }),
  deleteHistoryItem: (id) => http.delete(`/conversions/${id}`),
  clearHistory: () => http.delete('/conversions'),

  getFavorites: () => http.get('/favorites'),
  addFavorite: ({ from, to }) => http.post('/favorites', { from, to }),
  removeFavorite: (id) => http.delete(`/favorites/${id}`),

  calculateTravelBudget: ({ baseCurrency, amount, tripDays }) =>
    http.post('/travel-budget', { baseCurrency, amount, tripDays: tripDays || undefined }),
}
