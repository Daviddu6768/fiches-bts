const { GoogleGenerativeAI } = require('@google/generative-ai');

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
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return res.status(200).json({ content: text });
  } catch (err) {
    console.error('Erreur Gemini:', err.message);
    return res.status(500).json({ error: 'Erreur lors de la génération de la fiche' });
  }
};
