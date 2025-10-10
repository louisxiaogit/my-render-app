const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;

// 提供靜態檔案 (例如 public/index.html)
app.use(express.static('public'));

// 連接到 PostgreSQL 資料庫
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Render 的 PostgreSQL 需要這個設定
  }
});

// 測試資料庫連接
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  client.query('SELECT NOW()', (err, result) => {
    release();
    if (err) {
      return console.error('Error executing query', err.stack);
    }
    console.log('Database connected:', result.rows[0].now);
  });
});

// 根路徑現在會由 public/index.html 提供，所以這個可以移除或修改
// app.get('/', (req, res) => {
//   res.send('Hello from Render with Database!');
// });

// 新增一個 API 端點來獲取資料庫中的 items
app.get('/api/items', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM items');
    client.release();
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching items:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});