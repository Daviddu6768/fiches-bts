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

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Clé API non configurée côté serveur' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(500).json({ error: err.error?.message || `Erreur API (${response.status})` });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) return res.status(500).json({ error: 'Réponse vide de Gemini' });

    return res.status(200).json({ content: text });
  } catch (err) {
    console.error('Erreur:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
