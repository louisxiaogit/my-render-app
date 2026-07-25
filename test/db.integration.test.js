const { test } = require('node:test');
const assert = require('node:assert');
const { createDb } = require('../db');

// Integration test against a real PostgreSQL database (e.g. your Render
// instance). Skipped automatically when DATABASE_URL is not set, so the unit
// suite still runs offline. To run it:  DATABASE_URL=... npm test
const skip = process.env.DATABASE_URL ? false : 'DATABASE_URL not set';

test('createDb().getItems() reads rows from the real database', { skip }, async () => {
  const db = createDb(process.env.DATABASE_URL);
  try {
    const items = await db.getItems();
    assert.ok(Array.isArray(items));
  } finally {
    await db.close();
  }
});
