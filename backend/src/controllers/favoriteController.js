function createFavoriteController({ favoriteService }) {
  return {
    async list(_req, res) {
      res.json({ items: await favoriteService.list() });
    },

    async add(req, res) {
      res.status(201).json(await favoriteService.add(req.validated.body));
    },

    remove(req, res) {
      favoriteService.remove(req.validated.params.id);
      res.status(204).end();
    },
  };
}

module.exports = { createFavoriteController };
