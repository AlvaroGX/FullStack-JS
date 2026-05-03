const express = require('express');
const router = express.Router();

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
    
    if (data.error) {
      console.error('Gemini Error:', data.error);
      return res.status(500).json({ ok: false, mensaje: 'Error de Gemini', detalle: data.error.message });
    }

    const respuesta = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!respuesta) {
      console.error('Respuesta Gemini inesperada:', data);
      return res.status(500).json({ ok: false, mensaje: 'Respuesta vacía de IA' });
    }

    res.json({ ok: true, respuesta });
  } catch (error) {
    console.error('Error en chat:', error);
    res.status(500).json({ ok: false, mensaje: 'Error con IA', error: error.message });
  }
});

module.exports = router;
