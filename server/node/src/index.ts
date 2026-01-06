import express from 'express';
import { getDatabase } from './db';

const db = getDatabase();

const app = express();
const PORT = 3001;

app.use(express.json());

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello World!' });
});

app.get('/api/db', (req, res) => {
  const result = db.prepare('SELECT 1 + 2 AS test').get();
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
