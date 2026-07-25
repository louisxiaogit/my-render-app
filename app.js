const express = require('express');
const path = require('path');

// Deep module: takes its db dependency instead of creating one, so the whole
// HTTP surface can be tested with a fake db and never listens on a port here.
function createApp({ db }) {
  const app = express();

  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/api/items', async (req, res) => {
    const limit = parsePositiveInt(req.query.limit, 50);
    const offset = parseNonNegativeInt(req.query.offset, 0);
    if (limit === null || limit > 100 || offset === null) {
      return res.status(400).json({ error: 'Invalid pagination parameters' });
    }

    try {
      const items = await db.getItems({ limit, offset });
      res.json(items);
    } catch (err) {
      console.error('Error fetching items:', err);
      // Don't leak internal error details (connection strings, SQL) to clients.
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  return app;
}

// Returns the parsed integer if the value is a positive integer (or the
// default when the value is absent), otherwise null to signal invalid input.
function parsePositiveInt(value, fallback) {
  if (value === undefined) return fallback;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function parseNonNegativeInt(value, fallback) {
  if (value === undefined) return fallback;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

module.exports = { createApp };
