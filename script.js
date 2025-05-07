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
const questionContainer = document.getElementById('question-container');

// Configuração da API
const API_URL = '/api/generate-questions';

// Estado do jogo
let currentLevel = 1;
let currentTema = '';
let currentQuestion = null;
let correctAnswerIndex = null;

// Verificar se todos os elementos foram encontrados
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar o jogo
    if (startBtn) {
        startBtn.addEventListener('click', startQuiz);
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', generateQuestion);
    }
    
    // Configurar os botões de opção
    optionBtns.forEach((btn, index) => {
        if (btn) {
            btn.addEventListener('click', () => checkAnswer(index));
        }
    });
    
    // Inicializar o nível
    updateLevelDisplay();
});

// Função para iniciar o quiz
function startQuiz() {
    if (!temaInput) {
        console.error('Elemento temaInput não encontrado');
        return;
    }
    
    currentTema = temaInput.value.trim();
    
    if (!currentTema) {
        alert('Por favor, insira um tema para o quiz.');
        return;
    }
    
    currentLevel = 1;
    updateLevelDisplay();
    
    if (currentTemaDisplay) {
        currentTemaDisplay.textContent = currentTema;
    }
    
    if (setupSection) {
        setupSection.style.display = 'none';
    }
    
    if (quizSection) {
        quizSection.style.display = 'block';
    }
    
    generateQuestion();
}

// Função para atualizar o nível exibido
function updateLevelDisplay() {
    if (currentLevelDisplay) {
        currentLevelDisplay.textContent = currentLevel;
    }
    
    if (nivelDisplay) {
        nivelDisplay.textContent = currentLevel;
    }
}

// Função para gerar uma nova pergunta
async function generateQuestion() {
    try {
        // Mostrar carregamento
        if (loadingElement) {
            loadingElement.style.display = 'block';
        }
        
        if (questionContent) {
            questionContent.style.display = 'none';
        }
        
        if (feedbackElement) {
            feedbackElement.style.display = 'none';
        }
        
        // Resetar estilos dos botões
        optionBtns.forEach(btn => {
            if (btn) {
                btn.disabled = false;
                btn.className = 'option-btn';
            }
        });
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                theme: currentTema,
                difficulty: currentLevel
            }),
        });
        
        console.log('Status da resposta:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Resposta de erro completa:', errorText);
            throw new Error(`Erro do servidor: ${response.status} ${response.statusText}`);
        }
        
        let data;
        try {
            const textResponse = await response.text();
            console.log('Resposta em texto:', textResponse);
            data = JSON.parse(textResponse);
        } catch (parseError) {
            console.error('Erro ao fazer parse da resposta:', parseError);
            throw new Error(`Erro ao processar resposta: ${parseError.message}`);
        }
        
        if (!data.success || !data.data) {
            console.error('Formato de resposta inválido:', data);
            throw new Error('Formato de resposta inválido');
        }
        
        // Exibir a pergunta
        currentQuestion = data.data;
        correctAnswerIndex = currentQuestion.resposta;
        
        if (questionText) {
            questionText.textContent = currentQuestion.pergunta;
        }
        
        optionBtns.forEach((btn, index) => {
            if (btn) {
                btn.textContent = currentQuestion.opcoes[index];
            }
        });
        
        // Esconder carregamento e mostrar conteúdo
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        if (questionContent) {
            questionContent.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Erro ao gerar pergunta:', error);
        
        // Esconder carregamento
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        // Exibir mensagem de erro
        if (questionContainer) {
            questionContainer.innerHTML = `
                <div class="error-message">
                    <h3>Erro ao gerar pergunta</h3>
                    <p>${error.message}</p>
                    <button onclick="startQuiz()">Tentar novamente</button>
                </div>
            `;
        }
    }
}

// Função para verificar a resposta
function checkAnswer(selectedIndex) {
    // Desabilitar todos os botões
    optionBtns.forEach(btn => {
        if (btn) {
            btn.disabled = true;
        }
    });
    
    // Destacar a resposta correta e a selecionada
    if (optionBtns[correctAnswerIndex]) {
        optionBtns[correctAnswerIndex].classList.add('correct');
    }
    
    if (selectedIndex !== correctAnswerIndex && optionBtns[selectedIndex]) {
        optionBtns[selectedIndex].classList.add('incorrect');
    }
    
    // Exibir feedback
    if (feedbackElement) {
        feedbackElement.style.display = 'block';
    }
    
    if (feedbackText) {
        if (selectedIndex === correctAnswerIndex) {
            // Resposta correta
            feedbackText.textContent = 'Correto! Você avançou para o próximo nível.';
            feedbackText.className = 'correct';
            currentLevel++;
            updateLevelDisplay();
        } else {
            // Resposta incorreta
            feedbackText.textContent = 'Incorreto. Tente novamente.';
            feedbackText.className = 'incorrect';
        }
    }
}

// Função para exibir a pergunta
function displayQuestion(questionData) {
    if (!questionData) {
        console.error('Dados da pergunta não fornecidos');
        return;
    }
    
    currentQuestion = questionData;
    correctAnswerIndex = currentQuestion.resposta;
    
    if (questionText) {
        questionText.textContent = currentQuestion.pergunta;
    }
    
    optionBtns.forEach((btn, index) => {
        if (btn && currentQuestion.opcoes[index]) {
            btn.textContent = currentQuestion.opcoes[index];
            btn.disabled = false;
            btn.className = 'option-btn';
        }
    });
    
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    
    if (questionContent) {
        questionContent.style.display = 'block';
    }
    
    if (feedbackElement) {
        feedbackElement.style.display = 'none';
    }
}
