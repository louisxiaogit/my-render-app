const express = require('express');
const path = require('path');

// Deep module: takes its db dependency instead of creating one, so the whole
// HTTP surface can be tested with a fake db and never listens on a port here.
function createApp({ db }) {
  const app = express();

  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/api/items', async (req, res) => {
    try {
      const items = await db.getItems();
      res.json(items);
    } catch (err) {
      console.error('Error fetching items:', err);
      // Don't leak internal error details (connection strings, SQL) to clients.
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  return app;
}

module.exports = { createApp };
