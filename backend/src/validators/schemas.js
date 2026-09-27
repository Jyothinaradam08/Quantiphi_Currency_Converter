const { z } = require('zod');
const config = require('../config');

const currencyCode = (label) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, `${label} must be a 3-letter ISO 4217 code`);

const amount = z.coerce
  .number({ error: 'Amount must be a number' })
  .refine(Number.isFinite, 'Amount must be a finite number')
  .positive('Amount must be greater than zero')
  .max(config.business.maxAmount, `Amount must not exceed ${config.business.maxAmount}`);

const positiveId = z.coerce.number().int().positive('Id must be a positive integer');

const pair = {
  from: currencyCode('Source currency'),
  to: currencyCode('Target currency'),
};

const schemas = {
  idParam: z.object({ id: positiveId }),

  convertBody: z.object({ ...pair, amount }),
  convertQuery: z.object({ ...pair, amount }),

  historyQuery: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(10),
  }),

  trendQuery: z.object({
    ...pair,
    days: z.coerce.number().int().min(7).max(90).default(config.business.trendDays),
  }),

  favoriteBody: z.object(pair),

  travelBudgetBody: z.object({
    baseCurrency: currencyCode('Base currency'),
    amount,
    tripDays: z.coerce
      .number()
      .int('Trip length must be a whole number of days')
      .min(1, 'Trip length must be at least 1 day')
      .max(365, 'Trip length must not exceed 365 days')
      .optional()
      .nullable(),
  }),
};

module.exports = schemas;
