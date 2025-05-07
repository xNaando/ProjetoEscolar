const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const https = require('https');

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

// Endpoint para verificar o status do servidor
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    message: 'Servidor funcionando corretamente'
  });
});

// Rota de proxy para a API do OpenRouter
app.post('/api/generate-question', async (req, res) => {
  try {
    const { tema, nivel } = req.body;
    
    // Usando apenas a API para gerar perguntas
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
              "indiceCorreta": 0
          }
          
          Não inclua nenhum texto adicional além do JSON.`
        }
      ]
    };
    
    console.log('Enviando requisição para OpenRouter...');
    
    // Chave de API do OpenRouter
    const apiKey = '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';
    
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', openRouterPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Quiz Educacional'
      }
    });
    
    console.log('Resposta recebida com sucesso!');
    
    // Retornar a resposta da API
    return res.json(response.data);

  } catch (error) {
    console.error('Erro na API:', error);
    
    // Retornar o erro para o cliente
    res.status(500).json({ 
      error: 'Erro ao gerar pergunta', 
      details: error.message
    });
  }
});

// Todas as perguntas serão geradas pela API do OpenRouter

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
