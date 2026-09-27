const AppError = require('../utils/AppError');
const { roundRate } = require('../utils/money');

function createFavoriteService({ favoriteRepository, rateService, maxFavorites }) {
  /** Returns favorites enriched with the current rate (null if temporarily unavailable). */
  async function list() {
    const favorites = favoriteRepository.list();
    return Promise.all(
      favorites.map(async (favorite) => {
        try {
          const { rate, meta } = await rateService.getRate(favorite.from, favorite.to);
          return { ...favorite, rate: roundRate(rate), stale: meta.stale };
        } catch {
          return { ...favorite, rate: null, stale: true };
        }
      })
    );
  }

  async function add({ from, to }) {
    if (from === to) {
      throw AppError.badRequest('Source and target currencies must be different');
    }
    await rateService.assertSupported(from, to);

    if (favoriteRepository.findByPair(from, to)) {
      throw AppError.conflict(`${from} → ${to} is already in your favorites`);
    }
    if (favoriteRepository.count() >= maxFavorites) {
      throw AppError.badRequest(`You can save at most ${maxFavorites} favorites`);
    }

    const favorite = favoriteRepository.create(from, to);
    const { rate } = await rateService.getRate(from, to);
    return { ...favorite, rate: roundRate(rate), stale: false };
  }

  function remove(id) {
    if (!favoriteRepository.deleteById(id)) {
      throw AppError.notFound('Favorite not found');
    }
  }

  return { list, add, remove };
}

module.exports = { createFavoriteService };
