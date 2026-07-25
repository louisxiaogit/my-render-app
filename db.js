const { Pool } = require('pg');

// Deep module: hides the Pool, SSL config, and connection lifecycle behind a
// small interface. Callers ask for data; they never touch a client directly.
function createDb(connectionString) {
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false, // Render's managed PostgreSQL requires this
    },
  });

  return {
    // pool.query() checks a connection out and returns it automatically, even
    // when the query throws — no manual connect()/release() to leak.
    getItems: async () => {
      const result = await pool.query('SELECT * FROM items');
      return result.rows;
    },
    close: () => pool.end(),
  };
}

module.exports = { createDb };
