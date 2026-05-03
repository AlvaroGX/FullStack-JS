const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

router.post('/', async (req, res) => {
  const { mensaje } = req.body;
  if (!mensaje) return res.status(400).json({ ok: false, mensaje: 'El mensaje es requerido' });

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: mensaje }] }]
      })
    });

    const data = await response.json();
    const respuesta = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta de IA';
    res.json({ ok: true, respuesta });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error con IA', error: error.message });
  }
});

module.exports = router;
