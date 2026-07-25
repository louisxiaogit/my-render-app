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
    // ORDER BY id keeps pagination stable; parameterized LIMIT/OFFSET avoid
    // any string interpolation into the SQL.
    getItems: async ({ limit = 50, offset = 0 } = {}) => {
      const result = await pool.query(
        'SELECT id, name FROM items ORDER BY id LIMIT $1 OFFSET $2',
        [limit, offset],
      );
      return result.rows;
    },
    close: () => pool.end(),
  };
}

module.exports = { createDb };
