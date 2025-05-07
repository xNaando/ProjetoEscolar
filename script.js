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
    try {
        const theme = document.getElementById('theme').value;
        const difficulty = document.getElementById('difficulty').value;
        
        // Mostrar mensagem de carregamento
        document.getElementById('question-container').innerHTML = '<p>Gerando pergunta, por favor aguarde...</p>';
        
        console.log('Enviando requisição para gerar pergunta...');
        console.log('Tema:', theme);
        console.log('Dificuldade:', difficulty);
        
        const response = await fetch('/api/generate-questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ theme, difficulty }),
        });
        
        console.log('Status da resposta:', response.status);
        
        // Se a resposta não for bem-sucedida, lançar um erro
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Resposta de erro completa:', errorText);
            throw new Error(`Erro do servidor: ${response.status} ${response.statusText}`);
        }
        
        // Tentar fazer o parse do JSON com tratamento de erro melhorado
        let data;
        try {
            const textResponse = await response.text();
            console.log('Resposta em texto:', textResponse);
            
            // Tentar fazer o parse do JSON
            data = JSON.parse(textResponse);
        } catch (parseError) {
            console.error('Erro ao fazer parse da resposta:', parseError);
            throw new Error(`Erro ao processar resposta: ${parseError.message}`);
        }
        
        // Verificar se a resposta tem o formato esperado
        if (!data.success || !data.data) {
            console.error('Formato de resposta inválido:', data);
            throw new Error('Formato de resposta inválido');
        }
        
        const questionData = data.data;
        displayQuestion(questionData);
        
    } catch (error) {
        console.error('Erro ao gerar pergunta:', error);
        
        // Exibir mensagem de erro amigável para o usuário
        document.getElementById('question-container').innerHTML = `
            <div class="error-message">
                <h3>Erro ao gerar pergunta</h3>
                <p>${error.message}</p>
                <button onclick="startQuiz()">Tentar novamente</button>
            </div>
        `;
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
