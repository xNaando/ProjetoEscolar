import express from 'express';
import { OpenAI } from 'openai';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

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
    'X-Title': 'Quiz Educacional',
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || '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'}`
  },
});

// Função para gerar perguntas usando Cohere
async function generateQuestion(theme, difficulty) {
  const API_KEY = process.env.COHERE_API_KEY;
  const API_URL = 'https://api.cohere.ai/v1/generate';
  
  const response = await axios.post(API_URL, {
    model: 'command',
    prompt: `Você é um professor especialista criando um quiz educacional.
    Crie uma pergunta interessante e educativa sobre ${theme} com nível de dificuldade ${difficulty} (1-10).
    A pergunta deve ser clara, objetiva e ter apenas uma resposta correta.
    
    Regras:
    - A pergunta deve ser adequada para o nível de dificuldade
    - As opções devem ser plausíveis e bem escritas
    - A resposta correta deve ser inequívoca
    - Use linguagem apropriada para ambiente educacional
    
    Retorne apenas um objeto JSON com o seguinte formato:
    {
      "pergunta": "sua pergunta educativa aqui",
      "opcoes": ["opção 1", "opção 2", "opção 3", "opção 4"],
      "resposta": 0
    }
    
    Onde:
    - pergunta: deve ser clara e direta
    - opcoes: array com 4 alternativas plausíveis
    - resposta: índice (0-3) da opção correta`,
    max_tokens: 500,
    temperature: 0.7,
    k: 0,
    stop_sequences: [],
    return_likelihoods: 'NONE'
  }, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Cohere-Version': '2022-12-06'
    }
  });

  return response.data.generations[0].text;
}

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

    const questionText = await generateQuestion(theme, difficulty);
    
    // Processar resposta
    let jsonResponse;
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = questionText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Formato de resposta inválido');
      }
      
      // Verificar e corrigir a estrutura
      if (!jsonResponse.pergunta || !Array.isArray(jsonResponse.opcoes) || jsonResponse.resposta === undefined) {
        throw new Error('Formato de resposta inválido');
      }
      
      // Garantir que temos 4 opções
      if (jsonResponse.opcoes.length < 4) {
        while (jsonResponse.opcoes.length < 4) {
          jsonResponse.opcoes.push("Opção adicional " + (jsonResponse.opcoes.length + 1));
        }
      }
      
    } catch (error) {
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
    
    return res.json({
      success: true,
      data: jsonResponse
    });

  } catch (error) {
    console.error('Erro ao processar a requisição:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao processar a requisição'
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
