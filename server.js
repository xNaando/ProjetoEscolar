const express = require('express');
const { OpenAI } = require('openai');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configuração do CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para processar JSON
app.use(express.json());

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname)));

// Rota raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Inicializar o cliente OpenAI com configuração para OpenRouter
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || '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',
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://projeto-escolar-eight.vercel.app',
    'X-Title': 'Quiz Educacional'
  },
});

// Rota para gerar perguntas
app.post('/api/generate-questions', async (req, res) => {
  try {
    const { theme, difficulty } = req.body;
    
    if (!theme || !difficulty) {
      return res.status(400).json({ error: 'Tema e dificuldade são obrigatórios' });
    }

    console.log('Iniciando geração de perguntas...');
    console.log('Tema:', theme);
    console.log('Dificuldade:', difficulty);

    const completion = await openai.chat.completions.create({
      model: 'anthropic/claude-3-haiku-20240307',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente de quiz que gera perguntas educacionais. Sempre retorne a resposta em formato JSON válido.'
        },
        {
          role: 'user',
          content: `Crie uma pergunta sobre ${theme} com nível de dificuldade ${difficulty}. A resposta deve ser em formato JSON com as seguintes chaves: 'pergunta', 'opcoes' (array com 4 opções) e 'resposta' (índice da opção correta).`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });

    console.log('Resposta da API:', JSON.stringify(completion, null, 2));
    
    // Extrair o conteúdo da resposta
    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Resposta da API não contém conteúdo');
    }
    
    // Tentar fazer parse do JSON
    let jsonResponse;
    try {
      // Extrair o JSON da string de resposta
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Não foi possível extrair JSON da resposta');
      }
    } catch (parseError) {
      console.error('Erro ao fazer parse da resposta JSON:', parseError);
      console.error('Conteúdo recebido:', content);
      throw new Error('Erro ao processar a resposta da API');
    }
    
    // Retornar a resposta processada
    return res.json({
      success: true,
      data: jsonResponse
    });

  } catch (error) {
    console.error('Erro ao processar a requisição:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao processar a requisição',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
