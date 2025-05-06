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
const API_URL = 'http://localhost:3000/api/generate-question';

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
    // Esconder feedback e mostrar loading
    feedbackElement.style.display = 'none';
    loadingElement.style.display = 'flex';
    questionContent.style.display = 'none';
    
    try {
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tema: currentTema,
                nivel: currentLevel
            })
        });
        
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Verificar se recebemos uma pergunta de fallback devido a erro
        if (data.mockQuestion && data.pergunta) {
            currentQuestion = data.pergunta;
            console.log('Usando pergunta de fallback devido a erro na API');
        } else if (data.choices && data.choices[0] && data.choices[0].message) {
            // Resposta normal da API
            const content = data.choices[0].message.content;
            
            // Extrair o JSON da resposta
            let jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Formato de resposta inválido');
            }
            
            try {
                currentQuestion = JSON.parse(jsonMatch[0]);
            } catch (jsonError) {
                console.error('Erro ao analisar JSON:', jsonError);
                throw new Error('Erro ao processar resposta da API');
            }
        } else {
            throw new Error('Formato de resposta inesperado');
        }
        
        // Exibir a pergunta e as alternativas
        questionText.textContent = currentQuestion.pergunta;
        currentQuestion.alternativas.forEach((alt, index) => {
            optionBtns[index].textContent = alt;
            optionBtns[index].className = 'option-btn'; // Resetar classes
        });
        
        correctAnswerIndex = currentQuestion.indiceCorreta;
        
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
