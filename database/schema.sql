-- SQLite (Local Development)
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    status TEXT
);

-- PostgreSQL (Render / Production)
-- CREATE TABLE IF NOT EXISTS tasks (
--     id SERIAL PRIMARY KEY,
--     title TEXT,
--     status TEXT
-- );
