const { test } = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../app');

// Start the app on an ephemeral port with an injected fake db, so these tests
// exercise the real HTTP interface without touching a database or the network.
function startApp(db) {
  const app = createApp({ db });
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      resolve({ server, url: `http://127.0.0.1:${port}` });
    });
  });
}

test('GET /api/items returns the items from the db as JSON', async () => {
  const fakeItems = [
    { id: 1, name: 'AAPL' },
    { id: 2, name: 'GOOG' },
  ];
  const db = { getItems: async () => fakeItems };
  const { server, url } = await startApp(db);
  try {
    const res = await fetch(`${url}/api/items`);
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(await res.json(), fakeItems);
  } finally {
    server.close();
  }
});

test('GET /api/items forwards limit and offset to the db', async () => {
  let received;
  const db = {
    getItems: async (opts) => {
      received = opts;
      return [];
    },
  };
  const { server, url } = await startApp(db);
  try {
    const res = await fetch(`${url}/api/items?limit=10&offset=20`);
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(received, { limit: 10, offset: 20 });
  } finally {
    server.close();
  }
});

test('GET /api/items defaults to limit 50 and offset 0 when not given', async () => {
  let received;
  const db = {
    getItems: async (opts) => {
      received = opts;
      return [];
    },
  };
  const { server, url } = await startApp(db);
  try {
    await fetch(`${url}/api/items`);
    assert.deepStrictEqual(received, { limit: 50, offset: 0 });
  } finally {
    server.close();
  }
});

test('GET /api/items rejects invalid pagination params with 400', async () => {
  let called = false;
  const db = {
    getItems: async () => {
      called = true;
      return [];
    },
  };
  const { server, url } = await startApp(db);
  try {
    for (const qs of ['limit=abc', 'limit=-1', 'limit=0', 'limit=101', 'offset=-5']) {
      const res = await fetch(`${url}/api/items?${qs}`);
      assert.strictEqual(res.status, 400, `expected 400 for ?${qs}`);
    }
    assert.strictEqual(called, false, 'db should not be queried on bad input');
  } finally {
    server.close();
  }
});

test('GET /api/items returns 500 without leaking internals when the db fails', async () => {
  const db = {
    getItems: async () => {
      throw new Error('secret connection string');
    },
  };
  const { server, url } = await startApp(db);
  try {
    const res = await fetch(`${url}/api/items`);
    assert.strictEqual(res.status, 500);
    const body = await res.json();
    assert.deepStrictEqual(body, { error: 'Internal Server Error' });
    assert.ok(!JSON.stringify(body).includes('secret'));
  } finally {
    server.close();
  }
});
