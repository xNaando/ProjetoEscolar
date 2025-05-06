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

// Rota alternativa para gerar perguntas localmente (sem API)
app.post('/api/local-question', (req, res) => {
  const { tema, nivel } = req.body;
  console.log(`Gerando pergunta LOCAL sobre "${tema}" com nível ${nivel}`);
  
  // Gerar uma pergunta local baseada no tema
  const perguntaLocal = gerarPerguntaLocal(tema, nivel);
  
  res.json({
    mockQuestion: true,
    pergunta: perguntaLocal
  });
});

// Rota de proxy para a API do OpenRouter
app.post('/api/generate-question', async (req, res) => {
  try {
    const { tema, nivel } = req.body;
    
    // Usar perguntas locais para evitar problemas com a API
    // Remova ou comente esta linha quando a API estiver funcionando
    return res.redirect(307, '/api/local-question');
    
    console.log(`Gerando pergunta sobre "${tema}" com nível ${nivel}`);
    console.log('API Key:', process.env.OPENROUTER_API_KEY || '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'.substring(0, 10) + '...');
    
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
    console.log('Payload:', JSON.stringify(openRouterPayload));
    
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', openRouterPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || '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'}`,
        'HTTP-Referer': 'https://quiz-educacional.vercel.app',
        'X-Title': 'Quiz Educacional'
      }
    });

    console.log('Resposta recebida com sucesso!');
    console.log('Resposta:', JSON.stringify(response.data));
    
    // Criar um objeto de pergunta diretamente se a resposta não estiver no formato esperado
    if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
      console.error('Formato de resposta inesperado:', response.data);
      return res.status(200).json({ 
        error: 'Formato de resposta inesperado', 
        mockQuestion: true,
        pergunta: gerarPerguntaLocal(tema, nivel)
      });
    }
    
    res.json(response.data);
  } catch (error) {
    console.error('Erro na API:', error);
    console.error('Detalhes do erro:', error.response?.data || error.message);
    
    // Enviar uma pergunta de fallback em caso de erro
    res.status(200).json({ 
      error: 'Erro ao gerar pergunta', 
      details: error.response?.data || error.message,
      mockQuestion: true,
      pergunta: gerarPerguntaLocal(req.body.tema || 'conhecimentos gerais', req.body.nivel || 1)
    });
  }
});

// Função para gerar perguntas localmente
function gerarPerguntaLocal(tema, nivel) {
  const temaLowerCase = tema.toLowerCase();
  
  // Perguntas de exemplo baseadas em temas comuns
  if (temaLowerCase.includes('história') || temaLowerCase.includes('historia')) {
    return gerarPerguntaHistoria(nivel);
  } else if (temaLowerCase.includes('ciência') || temaLowerCase.includes('ciencia')) {
    return gerarPerguntaCiencia(nivel);
  } else if (temaLowerCase.includes('geografia')) {
    return gerarPerguntaGeografia(nivel);
  } else if (temaLowerCase.includes('matemática') || temaLowerCase.includes('matematica')) {
    return gerarPerguntaMatematica(nivel);
  } else {
    return gerarPerguntaGeral(nivel, tema);
  }
}

// Funções para gerar perguntas por tema
function gerarPerguntaHistoria(nivel) {
  const perguntas = [
    {
      pergunta: "Quem foi o primeiro presidente do Brasil?",
      alternativas: [
        "Deodoro da Fonseca",
        "Getúlio Vargas",
        "Dom Pedro I",
        "Juscelino Kubitschek"
      ],
      indiceCorreta: 0
    },
    {
      pergunta: "Em que ano ocorreu a Independência do Brasil?",
      alternativas: [
        "1808",
        "1822",
        "1889",
        "1500"
      ],
      indiceCorreta: 1
    },
    {
      pergunta: "Qual evento marcou o início da Primeira Guerra Mundial?",
      alternativas: [
        "Bombardeio de Pearl Harbor",
        "Queda do Muro de Berlim",
        "Assassinato do arquiduque Francisco Ferdinando",
        "Lançamento da bomba atômica em Hiroshima"
      ],
      indiceCorreta: 2
    }
  ];
  
  return perguntas[nivel % perguntas.length];
}

function gerarPerguntaCiencia(nivel) {
  const perguntas = [
    {
      pergunta: "Qual é o elemento químico mais abundante no universo?",
      alternativas: [
        "Oxigênio",
        "Carbono",
        "Hidrogênio",
        "Hélio"
      ],
      indiceCorreta: 2
    },
    {
      pergunta: "Qual é a unidade básica da hereditariedade?",
      alternativas: [
        "Célula",
        "Gene",
        "Cromossomo",
        "DNA"
      ],
      indiceCorreta: 1
    },
    {
      pergunta: "Qual é a velocidade da luz no vácuo?",
      alternativas: [
        "300.000 km/s",
        "150.000 km/s",
        "299.792 km/s",
        "200.000 km/s"
      ],
      indiceCorreta: 2
    }
  ];
  
  return perguntas[nivel % perguntas.length];
}

function gerarPerguntaGeografia(nivel) {
  const perguntas = [
    {
      pergunta: "Qual é o maior país do mundo em área territorial?",
      alternativas: [
        "China",
        "Estados Unidos",
        "Brasil",
        "Rússia"
      ],
      indiceCorreta: 3
    },
    {
      pergunta: "Qual é o rio mais extenso do mundo?",
      alternativas: [
        "Amazonas",
        "Nilo",
        "Mississipi",
        "Yangtzé"
      ],
      indiceCorreta: 0
    },
    {
      pergunta: "Qual é a capital da Austrália?",
      alternativas: [
        "Sydney",
        "Melbourne",
        "Canberra",
        "Brisbane"
      ],
      indiceCorreta: 2
    }
  ];
  
  return perguntas[nivel % perguntas.length];
}

function gerarPerguntaMatematica(nivel) {
  const perguntas = [
    {
      pergunta: "Quanto é 7 x 8?",
      alternativas: [
        "54",
        "56",
        "64",
        "48"
      ],
      indiceCorreta: 1
    },
    {
      pergunta: "Qual é o valor de π (pi) arredondado para duas casas decimais?",
      alternativas: [
        "3,12",
        "3,14",
        "3,16",
        "3,18"
      ],
      indiceCorreta: 1
    },
    {
      pergunta: "Qual é a fórmula da área de um círculo?",
      alternativas: [
        "A = πr²",
        "A = 2πr",
        "A = πd",
        "A = πr³"
      ],
      indiceCorreta: 0
    }
  ];
  
  return perguntas[nivel % perguntas.length];
}

function gerarPerguntaGeral(nivel, tema) {
  const perguntas = [
    {
      pergunta: `Pergunta sobre ${tema} (nível ${nivel}): Qual destas opções está mais relacionada com ${tema}?`,
      alternativas: [
        `Aspecto 1 de ${tema}`,
        `Aspecto 2 de ${tema}`,
        `Aspecto 3 de ${tema}`,
        `Aspecto 4 de ${tema}`
      ],
      indiceCorreta: Math.floor(Math.random() * 4)
    },
    {
      pergunta: `Sobre ${tema}, qual das seguintes afirmações é verdadeira?`,
      alternativas: [
        `${tema} tem origem no século XX`,
        `${tema} está relacionado com ciência`,
        `${tema} influenciou a cultura moderna`,
        `${tema} é estudado em universidades`
      ],
      indiceCorreta: Math.floor(Math.random() * 4)
    },
    {
      pergunta: `No contexto de ${tema}, o que significa o termo principal?`,
      alternativas: [
        `É um conceito fundamental`,
        `É uma técnica específica`,
        `É um personagem histórico`,
        `É um evento importante`
      ],
      indiceCorreta: Math.floor(Math.random() * 4)
    }
  ];
  
  return perguntas[nivel % perguntas.length];
}

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
