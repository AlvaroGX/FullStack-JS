const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { supabase, subirImagen, mapearId } = require('../config/supabase');

router.get('/', async (req, res) => {
  try {
    const { categoria, buscar, orden, activo } = req.query;
    let query = supabase.from('productos').select('*');

    if (activo === 'true') query = query.eq('activo', true);
    if (categoria) query = query.eq('categoria', categoria);
    if (buscar) query = query.ilike('nombre', `%${buscar}%`);

    if (orden === 'nombre') query = query.order('nombre', { ascending: true });
    else if (orden === 'precio') query = query.order('precio', { ascending: true });
    else if (orden === '-precio') query = query.order('precio', { ascending: false });
    else if (orden === 'descuento') query = query.order('descuento', { ascending: false });
    else if (orden === 'stock') query = query.order('stock', { ascending: true });
    else query = query.order('created_at', { ascending: false });

    const { data: productos, error } = await query;
    if (error) throw error;

    res.json({ ok: true, total: productos.length, productos: mapearId(productos) });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener productos', error: error.message });
  }
});

router.get('/stats/resumen', async (req, res) => {
  try {
    const { count: totalProductos } = await supabase.from('productos').select('*', { count: 'exact', head: true });
    const { count: stockBajo } = await supabase.from('productos').select('*', { count: 'exact', head: true }).lte('stock', 5);
    const { count: sinStock } = await supabase.from('productos').select('*', { count: 'exact', head: true }).eq('stock', 0);
    const { data: cats } = await supabase.from('productos').select('categoria');
    const categorias = [...new Set((cats || []).map(c => c.categoria))];

    const { data: all } = await supabase.from('productos').select('precio, stock');
    const valorInventario = (all || []).reduce((sum, p) => sum + (Number(p.precio) * p.stock), 0);

    res.json({
      ok: true,
      stats: { totalProductos, stockBajo, sinStock, categorias: categorias.length, valorInventario }
    });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener estadísticas', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data: producto, error } = await supabase.from('productos').select('*').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!producto) return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
    res.json({ ok: true, producto: mapearId(producto) });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener producto', error: error.message });
  }
});

router.post('/', upload.single('imagen'), async (req, res) => {
  try {
    let imagen = req.body.imagen || req.body.imagenUrl || 'https://via.placeholder.com/300';

    if (req.file) {
      imagen = await subirImagen(req.file.buffer, req.file.originalname, req.file.mimetype);
    }

    let descuento = Number(req.body.descuento) || 0;
    let precio = Number(req.body.precio);
    let precioOriginal = null;

    if (descuento > 0) {
      precioOriginal = precio;
      precio = precioOriginal * (1 - descuento / 100);
    }

    const { data: producto, error } = await supabase.from('productos').insert({
      nombre: req.body.nombre,
      descripcion: req.body.descripcion || null,
      categoria: req.body.categoria,
      precio,
      precio_original: precioOriginal,
      descuento,
      stock: Number(req.body.stock) || 0,
      unidad: req.body.unidad || 'unidad',
      imagen,
      imagenes: req.body.imagenes ? (Array.isArray(req.body.imagenes) ? req.body.imagenes : [req.body.imagenes]) : [],
      destacado: req.body.destacado === 'true' || req.body.destacado === true,
      activo: req.body.activo !== 'false' && req.body.activo !== false
    }).select().single();

    if (error) {
      if (error.message.includes('violates')) {
        return res.status(400).json({ ok: false, mensaje: 'Datos inválidos', errores: [error.message] });
      }
      throw error;
    }

    res.status(201).json({ ok: true, mensaje: 'Producto creado exitosamente', producto: mapearId(producto) });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al crear producto', error: error.message });
  }
});

router.put('/:id', upload.single('imagen'), async (req, res) => {
  try {
    const updateData = {};
    if (req.body.nombre !== undefined) updateData.nombre = req.body.nombre;
    if (req.body.descripcion !== undefined) updateData.descripcion = req.body.descripcion;
    if (req.body.categoria !== undefined) updateData.categoria = req.body.categoria;

    if (req.body.descuento !== undefined || req.body.precio !== undefined) {
      let descuento = req.body.descuento !== undefined ? Number(req.body.descuento) : undefined;
      let precio = req.body.precio !== undefined ? Number(req.body.precio) : undefined;

      if (descuento !== undefined) updateData.descuento = descuento;
      if (precio !== undefined) updateData.precio = precio;

      if (descuento !== undefined && descuento > 0) {
        const { data: actual } = await supabase.from('productos').select('precio, precio_original').eq('id', req.params.id).maybeSingle();
        const basePrecio = precio !== undefined ? precio : Number(actual?.precio || 0);
        const original = actual?.precio_original || basePrecio;
        updateData.precio_original = original;
        updateData.precio = original * (1 - descuento / 100);
      }
    }

    if (req.body.stock !== undefined) updateData.stock = Number(req.body.stock);
    if (req.body.unidad !== undefined) updateData.unidad = req.body.unidad;

    if (req.file) {
      updateData.imagen = await subirImagen(req.file.buffer, req.file.originalname, req.file.mimetype);
    } else if (req.body.imagen !== undefined) {
      updateData.imagen = req.body.imagen;
    }

    if (req.body.imagenes !== undefined) updateData.imagenes = Array.isArray(req.body.imagenes) ? req.body.imagenes : [req.body.imagenes];
    if (req.body.destacado !== undefined) updateData.destacado = req.body.destacado === 'true' || req.body.destacado === true;
    if (req.body.activo !== undefined) updateData.activo = req.body.activo !== 'false' && req.body.activo !== false;

    const { data: producto, error } = await supabase.from('productos').update(updateData).eq('id', req.params.id).select().maybeSingle();
    if (error) {
      if (error.message.includes('violates')) {
        return res.status(400).json({ ok: false, mensaje: 'Datos inválidos', errores: [error.message] });
      }
      throw error;
    }
    if (!producto) return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });

    res.json({ ok: true, mensaje: 'Producto actualizado', producto: mapearId(producto) });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar producto', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('productos').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true, mensaje: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar producto', error: error.message });
  }
});

module.exports = router;
