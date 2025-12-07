import express from 'express';

const app = express();
const PORT = 3001;

app.use(express.json());

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello World!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
