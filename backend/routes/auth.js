const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

router.post('/registro', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    const existe = await Usuario.findOne({ email });
    if (existe) return res.status(400).json({ ok: false, mensaje: 'Email ya registrado' });

    const usuario = new Usuario({ nombre, email, password });
    await usuario.save();

    const token = jwt.sign({ id: usuario._id, email: usuario.email, rol: usuario.rol }, process.env.JWT_SECRET || 'secreto123', { expiresIn: '7d' });
    res.json({ ok: true, token, usuario: { id: usuario._id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error en registro', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(400).json({ ok: false, mensaje: 'Credenciales inválidas' });

    const valido = await usuario.validarPassword(password);
    if (!valido) return res.status(400).json({ ok: false, mensaje: 'Credenciales inválidas' });

    const token = jwt.sign({ id: usuario._id, email: usuario.email, rol: usuario.rol }, process.env.JWT_SECRET || 'secreto123', { expiresIn: '7d' });
    res.json({ ok: true, token, usuario: { id: usuario._id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error en login', error: error.message });
  }
});

router.get('/perfil', require('../middleware/auth'), async (req, res) => {
  const usuario = await Usuario.findById(req.usuario.id).select('-password');
  res.json({ ok: true, usuario });
});

module.exports = router;
