const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { supabase, mapearId } = require('../config/supabase');

router.post('/registro', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    const { data: existe } = await supabase.from('usuarios').select('id').eq('email', email).maybeSingle();
    if (existe) return res.status(400).json({ ok: false, mensaje: 'Email ya registrado' });

    const hashed = await bcrypt.hash(password, 10);
    const { data: usuario, error } = await supabase.from('usuarios').insert({
      nombre, email, password: hashed
    }).select().single();

    if (error) throw error;

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET || 'secreto123',
      { expiresIn: '7d' }
    );
    res.json({
      ok: true, token,
      usuario: mapearId({ id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol })
    });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error en registro', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: usuario } = await supabase.from('usuarios').select('*').eq('email', email).maybeSingle();
    if (!usuario) return res.status(400).json({ ok: false, mensaje: 'Credenciales inválidas' });

    const valido = await bcrypt.compare(password, usuario.password);
    if (!valido) return res.status(400).json({ ok: false, mensaje: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET || 'secreto123',
      { expiresIn: '7d' }
    );
    res.json({
      ok: true, token,
      usuario: mapearId({ id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol })
    });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error en login', error: error.message });
  }
});

router.get('/perfil', require('../middleware/auth'), async (req, res) => {
  const { data: usuario } = await supabase.from('usuarios').select('id, nombre, email, rol, created_at').eq('id', req.usuario.id).maybeSingle();
  res.json({ ok: true, usuario: mapearId(usuario) });
});

module.exports = router;
