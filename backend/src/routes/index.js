const { Router } = require('express');
const validate = require('../middleware/validate');
const schemas = require('../validators/schemas');
const { createCurrencyController } = require('../controllers/currencyController');
const { createConversionController } = require('../controllers/conversionController');
const { createFavoriteController } = require('../controllers/favoriteController');
const { createTravelBudgetController } = require('../controllers/travelBudgetController');

function createApiRouter(services) {
  const router = Router();
  const currency = createCurrencyController(services);
  const conversion = createConversionController(services);
  const favorite = createFavoriteController(services);
  const travel = createTravelBudgetController(services);

  router.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

  router.get('/currencies', currency.listCurrencies);
  router.get('/rates/convert', validate({ query: schemas.convertQuery }), currency.quote);
  router.get('/trends', validate({ query: schemas.trendQuery }), currency.trend);

  router.post('/conversions', validate({ body: schemas.convertBody }), conversion.convert);
  router.get('/conversions', validate({ query: schemas.historyQuery }), conversion.listHistory);
  router.delete('/conversions', conversion.clearHistory);
  router.delete('/conversions/:id', validate({ params: schemas.idParam }), conversion.deleteHistoryItem);

  router.get('/favorites', favorite.list);
  router.post('/favorites', validate({ body: schemas.favoriteBody }), favorite.add);
  router.delete('/favorites/:id', validate({ params: schemas.idParam }), favorite.remove);

  router.post('/travel-budget', validate({ body: schemas.travelBudgetBody }), travel.calculate);

  return router;
}

module.exports = { createApiRouter };
