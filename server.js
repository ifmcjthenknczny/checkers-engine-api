import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');
const GAME_HISTORY_FILE = path.join(DATA_DIR, 'game_history.json');

app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.use(express.json());
app.use(express.static(path.join(__dirname, 'app')));

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

app.post('/api/game-history/start', (_req, res) => {
  ensureDataDir();
  fs.writeFileSync(GAME_HISTORY_FILE, '[]', 'utf8');
  res.status(200).json({ ok: true });
});

app.post('/api/game-history/append', (req, res) => {
  const { entries } = req.body || {};
  if (!Array.isArray(entries)) {
    return res.status(400).json({ error: 'Expected { entries: [...] }' });
  }
  ensureDataDir();
  let existing = [];
  if (fs.existsSync(GAME_HISTORY_FILE)) {
    const raw = fs.readFileSync(GAME_HISTORY_FILE, 'utf8');
    try {
      existing = JSON.parse(raw);
    } catch {
      existing = [];
    }
  }
  const updated = [...existing, ...entries];
  fs.writeFileSync(GAME_HISTORY_FILE, JSON.stringify(updated, null, 2), 'utf8');
  res.status(200).json({ ok: true });
});

app.post('/api/game-history/end', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`API: http://localhost:${PORT}`);
  console.log(`Game history: ${GAME_HISTORY_FILE}`);
});
