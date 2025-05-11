// backend.mjs
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = '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'; // sua chave real aqui

app.post('/chat', async (req, res) => {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao se comunicar com OpenRouter.', details: err.message });
  }
});

app.listen(3000, () => {
  console.log('✅ Backend rodando em http://localhost:3000');
});
