export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Método não permitido' });
        return;
    }

    const API_KEY = process.env.OPENROUTER_API_KEY;

    if (!API_KEY) {

        res.status(500).json({ error: 'API_KEY não configurada no ambiente.' });

        return;
    }

    // LOG: mostrar o que está sendo enviado
    console.log('Enviando para OpenRouter:', {
        url: 'https://openrouter.ai/api/v1/chat/completions',
        headers: {
            Authorization: `Bearer ${API_KEY}`,
            'HTTP-Referer': 'https://projeto-escolar-eight.vercel.app/',
            'X-Title': 'Impulso Escolar',
            'Content-Type': 'application/json'
        },
        body: req.body
    });

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                'HTTP-Referer': 'https://projeto-escolar-eight.vercel.app/',
                'X-Title': 'Impulso Escolar',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        // LOG: mostrar a resposta recebida
        console.log('Resposta da OpenRouter:', data);
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao se comunicar com OpenRouter.', details: err.message });
    }
} 