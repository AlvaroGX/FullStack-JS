const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { supabase, mapearId } = require('../config/supabase');

router.get('/', auth, auth.admin, async (req, res) => {
  try {
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, rol, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ ok: true, usuarios: mapearId(usuarios) });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener usuarios' });
  }
});

router.put('/:id/rol', auth, auth.admin, async (req, res) => {
  try {
    const { rol } = req.body;
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .update({ rol })
      .eq('id', req.params.id)
      .select('id, nombre, email, rol, created_at')
      .maybeSingle();

    if (error) throw error;
    res.json({ ok: true, mensaje: 'Rol actualizado', usuario: mapearId(usuario) });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar rol' });
  }
});

router.delete('/:id', auth, auth.admin, async (req, res) => {
  try {
    const { error } = await supabase.from('usuarios').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true, mensaje: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar usuario' });
  }
});

module.exports = router;
