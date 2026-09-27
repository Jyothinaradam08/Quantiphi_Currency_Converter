const config = require('./config');
const { createContainer } = require('./container');
const { createApp } = require('./app');

const { db, services } = createContainer();
const app = createApp({ services });

const server = app.listen(config.port, () => {
  console.log(`Currency API listening on http://localhost:${config.port}`);
  console.log(`SQLite database: ${config.db.path}`);
  console.log(
    `Rates provider: ExchangeRate-API (${config.exchangeRateApi.key ? 'authenticated' : 'open access'})`
  );
});

function shutdown(signal) {
  console.log(`\n${signal} received, shutting down...`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
