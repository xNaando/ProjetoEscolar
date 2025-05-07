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
  apiKey: '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',
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
          content: 'Você é um assistente de quiz que gera perguntas educacionais. Sempre retorne a resposta em formato JSON válido com as seguintes chaves: "pergunta", "opcoes" (array com 4 opções) e "resposta" (índice da opção correta, 0-3).'
        },
        {
          role: 'user',
          content: `Crie uma pergunta sobre ${theme} com nível de dificuldade ${difficulty} (1-10, onde 1 é muito fácil e 10 é muito difícil). A resposta deve ser em formato JSON com as seguintes chaves: "pergunta", "opcoes" (array com 4 opções) e "resposta" (índice da opção correta, 0-3).`
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
      // Tentar fazer parse diretamente, já que response_format: { type: 'json_object' } deve garantir JSON válido
      jsonResponse = JSON.parse(content);
      
      // Verificar se o JSON tem a estrutura esperada
      if (!jsonResponse.pergunta || !Array.isArray(jsonResponse.opcoes) || jsonResponse.resposta === undefined) {
        throw new Error('Formato de resposta inválido');
      }
      
      // Garantir que temos 4 opções
      if (jsonResponse.opcoes.length < 4) {
        while (jsonResponse.opcoes.length < 4) {
          jsonResponse.opcoes.push("Opção adicional " + (jsonResponse.opcoes.length + 1));
        }
      }
      
      // Garantir que o índice da resposta é válido
      if (jsonResponse.resposta < 0 || jsonResponse.resposta >= jsonResponse.opcoes.length) {
        jsonResponse.resposta = 0;
      }
      
    } catch (parseError) {
      console.error('Erro ao fazer parse da resposta JSON:', parseError);
      console.error('Conteúdo recebido:', content);
      
      // Tentar extrair JSON da string caso não seja um JSON puro
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonResponse = JSON.parse(jsonMatch[0]);
          
          // Verificar e corrigir a estrutura
          if (!jsonResponse.pergunta || !Array.isArray(jsonResponse.opcoes) || jsonResponse.resposta === undefined) {
            throw new Error('Formato de resposta inválido após extração');
          }
        } else {
          throw new Error('Não foi possível extrair JSON da resposta');
        }
      } catch (extractError) {
        // Se falhar completamente, criar uma resposta de fallback
        jsonResponse = {
          pergunta: "Não foi possível gerar uma pergunta sobre " + theme,
          opcoes: [
            "Tentar novamente",
            "Escolher outro tema",
            "Diminuir a dificuldade",
            "Verificar a conexão"
          ],
          resposta: 0
        };
      }
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

// Middleware para rotas não encontradas
app.use((req, res) => {
  console.log(`Rota não encontrada: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    path: req.url
  });
});

// Rota de teste
app.get('/api/teste', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando corretamente!'
  });
});

// Iniciar o servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${port}`);
  console.log(`Acesse: http://localhost:${port}`);
  console.log(`API OpenRouter configurada com a chave: ${openai.apiKey.substring(0, 10)}...`);
});
