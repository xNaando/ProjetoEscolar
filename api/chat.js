export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Método não permitido' });
        return;
    }

    const API_KEY = process.env.API_KEY;

    if (!API_KEY) {
        res.status(500).json({ error: 'API_KEY não configurada no ambiente.' });
        return;
    }

    // Agora o frontend envia o prompt em req.body.inputs
    const prompt = req.body.inputs;
    if (!prompt) {
        res.status(400).json({ error: 'Prompt não fornecido.' });
        return;
    }

    try {
        const response = await fetch('https://api-inference.huggingface.co/models/mrm8488/t5-base-finetuned-question-generation-ap', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inputs: prompt })
        });
        const data = await response.json();
        // O modelo retorna um array de objetos com 'generated_text'
        // Adaptar para o formato esperado pelo frontend
        if (Array.isArray(data) && data[0] && data[0].generated_text) {
            res.status(200).json({
                choices: [
                    { message: { content: data[0].generated_text } }
                ]
            });
        } else {
            res.status(200).json({
                choices: [
                    { message: { content: JSON.stringify(data) } }
                ]
            });
        }
    } catch (err) {
        res.status(500).json({ error: 'Erro ao se comunicar com Hugging Face.', details: err.message });
    }
} 