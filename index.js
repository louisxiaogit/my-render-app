const { createApp } = require('./app');
const { createDb } = require('./db');

// Composition root: build the concrete adapters and wire them together. This
// is the only file that both creates dependencies and binds a port.
const port = process.env.PORT || 3000;
const db = createDb(process.env.DATABASE_URL);
const app = createApp({ db });

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Graceful shutdown so Render redeploys don't cut off in-flight requests.
function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await db.close();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
