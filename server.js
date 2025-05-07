const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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
    
    console.log(`Gerando pergunta sobre "${tema}" com nível ${nivel}`);
    
    const openRouterPayload = {
      model: 'openai/gpt-3.5-turbo',
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
    
    // Usando a chave API diretamente para garantir que funcione
    // Usando a chave API diretamente para garantir que funcione
    const apiKey = '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';
    
    console.log('Usando chave API fixa para garantir funcionamento');
    console.log('Tamanho da API key:', apiKey.length);
    
    // Verificando se a chave API começa com 'sk-'
    if (!apiKey.startsWith('sk-')) {
      console.error('Formato inválido da chave API');
      throw new Error('Formato inválido da chave API');
    }
    
    // Montando os headers exatamente conforme a documentação oficial do OpenRouter
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://projeto-escolar-eight.vercel.app',
      'X-Title': 'Quiz Educacional',
      'X-API-KEY': apiKey  // Algumas APIs aceitam isso como alternativa
    };
    
    console.log('Headers da requisição:', {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer [OCULTO]',
      'HTTP-Referer': 'https://projeto-escolar-eight.vercel.app',
      'X-Title': 'Quiz Educacional',
      'X-API-KEY': '[OCULTO]'
    });
    
    console.log('Enviando requisição para URL:', 'https://openrouter.ai/api/v1/chat/completions');
    console.log('Payload:', JSON.stringify(openRouterPayload).substring(0, 200) + '...');
    
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', openRouterPayload, { headers });
    
    console.log('Status da resposta:', response.status);
    console.log('Headers da resposta:', JSON.stringify(response.headers));
    console.log('Resposta recebida com sucesso!');
    console.log('Dados da resposta:', JSON.stringify(response.data).substring(0, 200) + '...');
    
    // Retornar a resposta da API
    return res.json(response.data);

  } catch (error) {
    console.error('Erro na API:', error.message);
    
    // Registrar mais detalhes do erro
    if (error.response) {
      // A requisição foi feita e o servidor respondeu com um status de erro
      console.error('Dados do erro:', JSON.stringify(error.response.data));
      console.error('Status do erro:', error.response.status);
      console.error('Headers do erro:', JSON.stringify(error.response.headers));
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('Sem resposta recebida:', error.request);
    } else {
      // Algo aconteceu na configuração da requisição que causou o erro
      console.error('Erro de configuração:', error.message);
    }
    
    // Retornar o erro para o cliente com mais detalhes
    res.status(500).json({ 
      error: 'Erro ao gerar pergunta', 
      details: error.message,
      statusCode: error.response ? error.response.status : null,
      responseData: error.response ? error.response.data : null
    });
  }
});

// Todas as perguntas serão geradas pela API do OpenRouter

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
