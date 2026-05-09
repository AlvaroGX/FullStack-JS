const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { supabase, mapearId } = require('../config/supabase');

router.post('/', auth, async (req, res) => {
  try {
    const { productos, total, direccionEnvio, metodoPago } = req.body;

    for (const item of productos) {
      const { data: producto } = await supabase.from('productos').select('id, nombre, stock').eq('id', item.producto).maybeSingle();
      if (!producto || producto.stock < item.cantidad) {
        return res.status(400).json({
          ok: false,
          mensaje: `Stock insuficiente para ${producto?.nombre || 'producto'}`
        });
      }
      const nuevoStock = producto.stock - item.cantidad;
      await supabase.from('productos').update({ stock: nuevoStock }).eq('id', item.producto);
    }

    const { data: orden, error } = await supabase.from('ordenes').insert({
      usuario_id: req.usuario.id,
      total,
      direccion_envio: direccionEnvio,
      metodo_pago: metodoPago
    }).select().single();

    if (error) throw error;

    const ordenProductos = productos.map(p => ({
      orden_id: orden.id,
      producto_id: p.producto,
      cantidad: p.cantidad,
      precio: p.precio
    }));

    const { error: detError } = await supabase.from('orden_productos').insert(ordenProductos);
    if (detError) throw detError;

    res.json({ ok: true, mensaje: 'Orden creada exitosamente', orden: mapearId(orden) });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al procesar orden', error: error.message });
  }
});

router.get('/mis-ordenes', auth, async (req, res) => {
  try {
    const { data: ordenes, error } = await supabase
      .from('ordenes')
      .select('*, orden_productos(*)')
      .eq('usuario_id', req.usuario.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const resultado = await Promise.all((ordenes || []).map(async (o) => {
      const detalles = await Promise.all((o.orden_productos || []).map(async (op) => {
        const { data: prod } = await supabase.from('productos').select('*').eq('id', op.producto_id).maybeSingle();
        return { ...op, producto: prod ? mapearId(prod) : null };
      }));
      return mapearId({ ...o, productos: detalles });
    }));

    res.json({ ok: true, ordenes: resultado });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener órdenes' });
  }
});

router.get('/', auth, auth.admin, async (req, res) => {
  try {
    const { data: ordenes, error } = await supabase
      .from('ordenes')
      .select('*, orden_productos(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const resultado = await Promise.all((ordenes || []).map(async (o) => {
      const { data: usr } = await supabase.from('usuarios').select('id, nombre, email').eq('id', o.usuario_id).maybeSingle();
      const detalles = await Promise.all((o.orden_productos || []).map(async (op) => {
        const { data: prod } = await supabase.from('productos').select('*').eq('id', op.producto_id).maybeSingle();
        return { ...op, producto: prod ? mapearId(prod) : null };
      }));
      return mapearId({ ...o, usuario: mapearId(usr), productos: detalles });
    }));

    res.json({ ok: true, ordenes: resultado });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener órdenes' });
  }
});

router.put('/:id/estado', auth, auth.admin, async (req, res) => {
  try {
    const { estado, estadoPago } = req.body;
    const updateData = { estado };

    if (estadoPago) {
      updateData.estado_pago = estadoPago;
      if (estadoPago === 'pagado') {
        updateData.fecha_pago = new Date().toISOString();
      }
    }

    const { data: orden, error } = await supabase.from('ordenes').update(updateData).eq('id', req.params.id).select().maybeSingle();
    if (error) throw error;

    res.json({ ok: true, mensaje: 'Estado actualizado', orden: mapearId(orden) });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar' });
  }
});

module.exports = router;
