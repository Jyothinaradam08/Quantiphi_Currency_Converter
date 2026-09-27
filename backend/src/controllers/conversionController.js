function createConversionController({ conversionService }) {
  return {
    async convert(req, res) {
      res.status(201).json(await conversionService.convertAndRecord(req.validated.body));
    },

    listHistory(req, res) {
      res.json({ items: conversionService.listHistory(req.validated.query.limit) });
    },

    deleteHistoryItem(req, res) {
      conversionService.deleteHistoryItem(req.validated.params.id);
      res.status(204).end();
    },

    clearHistory(_req, res) {
      res.json(conversionService.clearHistory());
    },
  };
}

module.exports = { createConversionController };
