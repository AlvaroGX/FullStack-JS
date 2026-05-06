const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Usuario = require('../models/Usuario');

// Obtener todos los usuarios (solo admin)
router.get('/', auth, auth.admin, async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-password').sort({ createdAt: -1 });
    res.json({ ok: true, usuarios });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener usuarios' });
  }
});

// Cambiar rol de usuario (solo admin)
router.put('/:id/rol', auth, auth.admin, async (req, res) => {
  try {
    const { rol } = req.body;
    const usuario = await Usuario.findByIdAndUpdate(req.params.id, { rol }, { new: true }).select('-password');
    res.json({ ok: true, mensaje: 'Rol actualizado', usuario });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar rol' });
  }
});

// Eliminar usuario (solo admin)
router.delete('/:id', auth, auth.admin, async (req, res) => {
  try {
    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ ok: true, mensaje: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar usuario' });
  }
});

module.exports = router;
