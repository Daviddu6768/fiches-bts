module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { prompt } = req.body || {};

  if (!prompt || typeof prompt !== 'string' || prompt.length > 6000) {
    return res.status(400).json({ error: 'Prompt invalide ou trop long' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'Clé API non configurée côté serveur' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(500).json({ error: err.error?.message || `Erreur API (${response.status})` });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) return res.status(500).json({ error: 'Réponse vide' });

    return res.status(200).json({ content: text });
  } catch (err) {
    console.error('Erreur Groq:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
