function createCurrencyController({ rateService, conversionService, trendService }) {
  return {
    async listCurrencies(_req, res) {
      res.json(await rateService.listCurrencies());
    },

    async quote(req, res) {
      res.json(await conversionService.quote(req.validated.query));
    },

    async trend(req, res) {
      res.json(await trendService.getTrend(req.validated.query));
    },
  };
}

module.exports = { createCurrencyController };
