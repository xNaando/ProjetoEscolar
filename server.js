const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

// Configuração do CORS e middleware para JSON
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Rota para servir o arquivo HTML principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota de proxy para a API do OpenRouter
app.post('/api/generate-question', async (req, res) => {
  try {
    const { tema, nivel } = req.body;
    
    console.log(`Gerando pergunta sobre "${tema}" com nível ${nivel}`);
    
    const openRouterPayload = {
      model: 'anthropic/claude-3-5-haiku',
      messages: [
        {
          role: 'user',
          content: `Você é um gerador de perguntas de quiz. 
          Crie uma pergunta de múltipla escolha sobre o tema "${tema}" com nível de dificuldade ${nivel} (em uma escala de 1 a 100, onde 1 é muito fácil e 100 é extremamente difícil).
          
          Forneça a pergunta e exatamente 4 alternativas, sendo apenas 1 correta.
          
          Responda no seguinte formato JSON:
          {
              "pergunta": "Texto da pergunta aqui",
              "alternativas": [
                  "Alternativa A",
                  "Alternativa B",
                  "Alternativa C",
                  "Alternativa D"
              ],
              "indiceCorreta": 0 // índice da alternativa correta (0 a 3)
          }
          
          Não inclua nenhum texto adicional além do JSON.`
        }
      ]
    };
    
    console.log('Enviando requisição para OpenRouter...');
    
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', openRouterPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || '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'}`,
        'HTTP-Referer': 'https://quiz-educacional.vercel.app',
        'X-Title': 'Quiz Educacional'
      }
    });

    console.log('Resposta recebida com sucesso!');
    
    // Criar um objeto de pergunta diretamente se a resposta não estiver no formato esperado
    if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
      console.error('Formato de resposta inesperado:', response.data);
      return res.status(500).json({ 
        error: 'Formato de resposta inesperado', 
        mockQuestion: true,
        pergunta: {
          pergunta: `Pergunta sobre ${tema} (nível ${nivel})`,
          alternativas: [
            `Opção 1 sobre ${tema}`,
            `Opção 2 sobre ${tema}`,
            `Opção 3 sobre ${tema}`,
            `Opção 4 sobre ${tema}`
          ],
          indiceCorreta: Math.floor(Math.random() * 4)
        }
      });
    }
    
    res.json(response.data);
  } catch (error) {
    console.error('Erro na API:', error);
    console.error('Detalhes do erro:', error.response?.data || error.message);
    
    // Enviar uma pergunta de fallback em caso de erro
    res.status(500).json({ 
      error: 'Erro ao gerar pergunta', 
      details: error.response?.data || error.message,
      mockQuestion: true,
      pergunta: {
        pergunta: `Pergunta sobre ${req.body.tema || 'conhecimentos gerais'} (nível ${req.body.nivel || 1})`,
        alternativas: [
          `Opção 1`,
          `Opção 2`,
          `Opção 3`,
          `Opção 4`
        ],
        indiceCorreta: Math.floor(Math.random() * 4)
      }
    });
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
