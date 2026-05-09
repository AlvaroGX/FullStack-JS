const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { supabase, subirImagen } = require('../config/supabase');

router.get('/:clave', async (req, res) => {
  try {
    const { data: config, error } = await supabase.from('config').select('*').eq('clave', req.params.clave).maybeSingle();
    if (error) throw error;
    if (!config) return res.json({ ok: true, valor: null });
    res.json({ ok: true, valor: config.valor, descripcion: config.descripcion });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener configuración' });
  }
});

router.put('/:clave', auth, auth.admin, upload.single('imagen'), async (req, res) => {
  try {
    const { valor, descripcion } = req.body;
    let nuevoValor = valor;

    if (req.file) {
      nuevoValor = await subirImagen(req.file.buffer, req.file.originalname, req.file.mimetype);
    }

    const upsertData = {
      clave: req.params.clave,
      valor: nuevoValor || '',
      descripcion: descripcion || ''
    };

    const { data: existente } = await supabase.from('config').select('clave').eq('clave', req.params.clave).maybeSingle();

    let error;
    if (existente) {
      ({ error } = await supabase.from('config').update(upsertData).eq('clave', req.params.clave));
    } else {
      ({ error } = await supabase.from('config').insert(upsertData));
    }

    if (error) throw error;

    res.json({ ok: true, mensaje: 'Configuración actualizada' });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar configuración' });
  }
});

module.exports = router;
