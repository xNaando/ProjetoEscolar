export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Método não permitido' });
        return;
    }

    const API_KEY = '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'; // sua chave real aqui

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao se comunicar com OpenRouter.', details: err.message });
    }
} 