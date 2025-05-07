// Elementos da interface
const setupSection = document.getElementById('setup-section');
const quizSection = document.getElementById('quiz-section');
const startBtn = document.getElementById('start-btn');
const temaInput = document.getElementById('tema');
const nivelDisplay = document.getElementById('nivel');
const currentLevelDisplay = document.getElementById('current-level');
const currentTemaDisplay = document.getElementById('current-tema');
const questionText = document.getElementById('question-text');
const optionBtns = [
    document.getElementById('option0'),
    document.getElementById('option1'),
    document.getElementById('option2'),
    document.getElementById('option3')
];
const loadingElement = document.getElementById('loading');
const questionContent = document.getElementById('question-content');
const feedbackElement = document.getElementById('feedback');
const feedbackText = document.getElementById('feedback-text');
const nextBtn = document.getElementById('next-btn');

// Configuração da API
const API_URL = '/api/generate-questions';

// Estado do jogo
let currentLevel = 1;
let currentTema = '';
let currentQuestion = null;
let correctAnswerIndex = null;

// Inicializar o jogo
startBtn.addEventListener('click', startQuiz);
nextBtn.addEventListener('click', generateQuestion);

// Configurar os botões de opção
optionBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => checkAnswer(index));
});

// Função para iniciar o quiz
function startQuiz() {
    currentTema = temaInput.value.trim();
    
    if (!currentTema) {
        alert('Por favor, insira um tema para o quiz.');
        return;
    }
    
    currentLevel = 1;
    updateLevelDisplay();
    currentTemaDisplay.textContent = currentTema;
    
    setupSection.style.display = 'none';
    quizSection.style.display = 'block';
    
    generateQuestion();
}

// Função para atualizar o nível exibido
function updateLevelDisplay() {
    currentLevelDisplay.textContent = currentLevel;
    nivelDisplay.textContent = currentLevel;
}

// Função para gerar uma nova pergunta
async function generateQuestion() {
    // Se for a primeira pergunta ou se o jogador acertou a anterior
    if (currentQuestion === null || currentQuestion.feedback === 'correct') {
        // Aumentar o nível
        currentLevel = Math.min(currentLevel + 1, 10);
        updateLevelDisplay();
    }
    
    // Mostrar loading
    loadingElement.style.display = 'block';
    questionContent.style.display = 'none';
    feedbackElement.style.display = 'none';
    nextBtn.disabled = true;
    
    try {
        // Fazer a requisição para a API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                theme: currentTema,
                difficulty: currentLevel
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erro na resposta da API:', errorData);
            throw new Error(errorData.error || 'Erro ao gerar pergunta');
        }
        
        const result = await response.json();
        console.log('Dados recebidos:', result);
        
        // Verificar se a resposta contém os dados necessários
        if (!result.success || !result.data) {
            console.error('Formato de resposta inválido:', result);
            throw new Error('Formato de resposta inválido da API');
        }
        
        const data = result.data;
        
        if (!data.pergunta || !data.opcoes || !Array.isArray(data.opcoes) || 
            data.resposta === undefined || data.opcoes[data.resposta] === undefined) {
            console.error('Formato de pergunta inválido:', data);
            throw new Error('Formato de pergunta inválido retornado pela API');
        }
        
        // Atualizar a pergunta atual
        currentQuestion = {
            pergunta: data.pergunta,
            alternativas: data.opcoes,
            respostaCorreta: data.resposta,
            feedback: ''
        };
        
        // Exibir a pergunta e opções
        questionText.textContent = currentQuestion.pergunta;
        
        // Atualizar os botões de opção
        optionBtns.forEach((btn, index) => {
            if (index < currentQuestion.alternativas.length) {
                btn.textContent = currentQuestion.alternativas[index];
                btn.dataset.index = index;
                btn.disabled = false;
                btn.classList.remove('correct', 'incorrect');
                btn.style.display = 'block';
            } else {
                btn.style.display = 'none';
            }
        });
        
        // Definir o índice da resposta correta
        correctAnswerIndex = currentQuestion.respostaCorreta;
        
        // Esconder loading e mostrar conteúdo
        loadingElement.style.display = 'none';
        questionContent.style.display = 'block';
        
    } catch (error) {
        console.error('Erro ao gerar pergunta:', error);
        questionText.textContent = 'Erro ao gerar pergunta. Tente novamente.';
        loadingElement.style.display = 'none';
        questionContent.style.display = 'block';
    }
}

// Função para verificar a resposta
function checkAnswer(selectedIndex) {
    // Desabilitar todos os botões
    optionBtns.forEach(btn => {
        btn.disabled = true;
    });
    
    // Destacar a resposta correta e a selecionada
    optionBtns[correctAnswerIndex].classList.add('correct');
    
    if (selectedIndex !== correctAnswerIndex) {
        optionBtns[selectedIndex].classList.add('incorrect');
    }
    
    // Exibir feedback
    feedbackElement.style.display = 'block';
    
    if (selectedIndex === correctAnswerIndex) {
        // Resposta correta
        feedbackText.textContent = 'Correto! Você avançou para o próximo nível.';
        feedbackText.className = 'correct';
        currentLevel++;
    } else {
        // Resposta incorreta
        feedbackText.textContent = 'Incorreto! Você voltou para o nível 1.';
        feedbackText.className = 'incorrect';
        currentLevel = 1;
    }
    
    updateLevelDisplay();
}

// Inicializar o nível
updateLevelDisplay();
