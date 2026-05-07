const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const Config = require('../models/Config');

// Obtener configuración (público)
router.get('/:clave', async (req, res) => {
  try {
    const config = await Config.findOne({ clave: req.params.clave });
    if (!config) return res.json({ ok: true, valor: null });
    res.json({ ok: true, valor: config.valor, descripcion: config.descripcion });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener configuración' });
  }
});

// Actualizar configuración (solo admin)
router.put('/:clave', auth, auth.admin, upload.single('imagen'), async (req, res) => {
  try {
    const { valor, descripcion } = req.body;
    let nuevoValor = valor;
    
    if (req.file) {
      nuevoValor = `/uploads/${req.file.filename}`;
    }
    
    const config = await Config.findOneAndUpdate(
      { clave: req.params.clave },
      { 
        clave: req.params.clave,
        valor: nuevoValor || '',
        descripcion: descripcion || ''
      },
      { upsert: true, new: true }
    );
    
    res.json({ ok: true, mensaje: 'Configuración actualizada', config });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar configuración' });
  }
});

module.exports = router;
