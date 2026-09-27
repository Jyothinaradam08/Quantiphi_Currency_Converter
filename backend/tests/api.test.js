const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { buildTestApp } = require('./helpers');

describe('Currency Converter API', () => {
  let ctx;

  beforeEach(() => {
    ctx = buildTestApp();
  });

  afterEach(() => {
    ctx.db.close();
  });

  describe('GET /api/currencies', () => {
    it('lists supported currencies with display names', async () => {
      const res = await request(ctx.app).get('/api/currencies').expect(200);
      const usd = res.body.currencies.find((c) => c.code === 'USD');
      assert.equal(usd.name, 'US Dollar');
      assert.ok(res.body.currencies.length >= 8);
    });
  });

  describe('POST /api/conversions', () => {
    it('converts server-side, rounds by currency and persists history', async () => {
      const res = await request(ctx.app)
        .post('/api/conversions')
        .send({ from: 'usd', to: 'JPY', amount: 12.345 })
        .expect(201);

      assert.equal(res.body.from, 'USD');
      assert.equal(res.body.rate, 150);
      // Amount is normalised to 12.35 USD first; JPY has 0 fraction digits.
      assert.equal(res.body.amount, 12.35);
      assert.equal(res.body.convertedAmount, 1853);
      assert.ok(res.body.formatted.convertedAmount.includes('1,853'));

      const history = await request(ctx.app).get('/api/conversions').expect(200);
      assert.equal(history.body.items.length, 1);
      assert.equal(history.body.items[0].to, 'JPY');
    });

    it('computes cross rates between non-USD currencies', async () => {
      const res = await request(ctx.app)
        .post('/api/conversions')
        .send({ from: 'EUR', to: 'GBP', amount: 90 })
        .expect(201);
      assert.equal(res.body.convertedAmount, 80);
    });

    it('rejects invalid input with a validation error', async () => {
      const res = await request(ctx.app)
        .post('/api/conversions')
        .send({ from: 'US', to: 'EUR', amount: -5 })
        .expect(400);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
      assert.equal(res.body.error.details.length, 2);
    });

    it('rejects unsupported currencies', async () => {
      const res = await request(ctx.app)
        .post('/api/conversions')
        .send({ from: 'USD', to: 'XYZ', amount: 5 })
        .expect(400);
      assert.match(res.body.error.message, /Unsupported currency/);
    });

    it('serves stale cached rates when the provider fails', async () => {
      await request(ctx.app).get('/api/currencies').expect(200);
      ctx.rateProvider.fail = true;
      // USD rates are cached and fresh, so conversion still works.
      await request(ctx.app)
        .post('/api/conversions')
        .send({ from: 'USD', to: 'EUR', amount: 1 })
        .expect(201);
    });
  });

  describe('history management', () => {
    it('deletes a single entry and clears all', async () => {
      const a = await request(ctx.app).post('/api/conversions').send({ from: 'USD', to: 'EUR', amount: 1 });
      await request(ctx.app).post('/api/conversions').send({ from: 'USD', to: 'GBP', amount: 1 });

      await request(ctx.app).delete(`/api/conversions/${a.body.id}`).expect(204);
      await request(ctx.app).delete('/api/conversions/9999').expect(404);

      const cleared = await request(ctx.app).delete('/api/conversions').expect(200);
      assert.equal(cleared.body.deleted, 1);
    });
  });

  describe('favorites', () => {
    it('adds, lists with live rate, prevents duplicates and removes', async () => {
      const created = await request(ctx.app)
        .post('/api/favorites')
        .send({ from: 'USD', to: 'INR' })
        .expect(201);
      assert.equal(created.body.rate, 83);

      await request(ctx.app).post('/api/favorites').send({ from: 'USD', to: 'INR' }).expect(409);
      await request(ctx.app).post('/api/favorites').send({ from: 'USD', to: 'USD' }).expect(400);

      await request(ctx.app).post('/api/conversions').send({ from: 'USD', to: 'INR', amount: 1 });
      const list = await request(ctx.app).get('/api/favorites').expect(200);
      assert.equal(list.body.items[0].usageCount, 1);

      await request(ctx.app).delete(`/api/favorites/${created.body.id}`).expect(204);
      await request(ctx.app).delete(`/api/favorites/${created.body.id}`).expect(404);
    });
  });

  describe('GET /api/trends', () => {
    it('returns points and computed statistics', async () => {
      const res = await request(ctx.app).get('/api/trends?from=USD&to=EUR').expect(200);
      assert.equal(res.body.available, true);
      assert.equal(res.body.days, 30);
      assert.equal(res.body.points.length, 4);
      assert.equal(res.body.stats.high.rate, 0.99);
      assert.equal(res.body.stats.low.rate, 0.85);
      assert.equal(res.body.stats.changePercent, 10);
      assert.equal(res.body.stats.direction, 'up');
    });

    it('falls back to local snapshots for pairs without provider history', async () => {
      const res = await request(ctx.app).get('/api/trends?from=VND&to=USD').expect(200);
      assert.equal(res.body.source, 'local snapshots (SQLite)');
      assert.equal(res.body.points.length, 1);
      assert.equal(res.body.stats, null);
      assert.match(res.body.message, /Limited history/);
    });

    it('rejects identical currencies', async () => {
      await request(ctx.app).get('/api/trends?from=USD&to=USD').expect(400);
    });
  });

  describe('POST /api/travel-budget', () => {
    it('returns 5 major currencies excluding the base, with daily budget', async () => {
      const res = await request(ctx.app)
        .post('/api/travel-budget')
        .send({ baseCurrency: 'EUR', amount: 900, tripDays: 3 })
        .expect(200);

      const codes = res.body.conversions.map((c) => c.currency);
      assert.deepEqual(codes, ['USD', 'GBP', 'JPY', 'CNY', 'AUD']);
      const usd = res.body.conversions[0];
      assert.equal(usd.convertedAmount, 1000);
      assert.equal(usd.dailyAmount, 333.33);
      assert.equal(res.body.dailyAmount, 300);
    });

    it('validates trip length', async () => {
      await request(ctx.app)
        .post('/api/travel-budget')
        .send({ baseCurrency: 'EUR', amount: 900, tripDays: 0 })
        .expect(400);
    });
  });

  it('returns 404 JSON for unknown routes and 400 for malformed JSON', async () => {
    await request(ctx.app).get('/api/nope').expect(404);
    await request(ctx.app)
      .post('/api/conversions')
      .set('Content-Type', 'application/json')
      .send('{bad json')
      .expect(400);
  });
});
