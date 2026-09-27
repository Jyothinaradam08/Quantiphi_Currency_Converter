function createTravelBudgetController({ travelBudgetService }) {
  return {
    async calculate(req, res) {
      res.json(await travelBudgetService.calculate(req.validated.body));
    },
  };
}

module.exports = { createTravelBudgetController };
