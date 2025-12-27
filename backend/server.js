const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || 'student123';

app.use(cors());
app.use(express.json());

// Serve Frontend (Local Convenience)
app.use(express.static(path.join(__dirname, '../frontend')));

// API key middleware
app.use((req, res, next) => {
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
});

// Database Connection & Schema Setup
let query;

if (process.env.DATABASE_URL) {
  // PostgreSQL (Render / Production)
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  query = (text, params, cb) => pool.query(text, params, cb);
  
  pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT,
      status TEXT
    )
  `);
} else {
  // SQLite (Local Development)
  const sqlite3 = require('sqlite3').verbose();
  const db = new sqlite3.Database('./tasks.db');
  
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      status TEXT
    )
  `);

  query = (text, params, cb) => {
    // Adapt PostgreSQL syntax ($1, RETURNING) to SQLite (?, this.lastID)
    const sql = text.replace(/\$\d+/g, '?').replace(/RETURNING\s+id/i, '');
    
    if (text.trim().match(/^SELECT/i)) {
      db.all(sql, params, (err, rows) => cb(err, { rows }));
    } else if (text.trim().match(/^INSERT/i)) {
      db.run(sql, params, function(err) {
        cb(err, { rows: [{ id: this.lastID }] });
      });
    } else {
      db.run(sql, params, function(err) {
        cb(err, { rows: [] });
      });
    }
  };
}

// Routes
app.get('/tasks', (req, res) => {
  query('SELECT * FROM tasks', [], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result.rows);
  });
});

app.post('/tasks', (req, res) => {
  const { title } = req.body;
  query(
    'INSERT INTO tasks (title, status) VALUES ($1, $2) RETURNING id',
    [title, 'pending'],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.rows[0].id });
    }
  );
});

app.put('/tasks/:id', (req, res) => {
  const { status } = req.body;
  query(
    'UPDATE tasks SET status = $1 WHERE id = $2',
    [status, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Updated' });
    }
  );
});

app.delete('/tasks/:id', (req, res) => {
  query(
    'DELETE FROM tasks WHERE id = $1',
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Deleted' });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
