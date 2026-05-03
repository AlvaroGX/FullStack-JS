const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');

// GET /api/productos - Listar todos los productos
router.get('/', async (req, res) => {
  try {
    const { categoria, buscar, orden } = req.query;
    let filtro = {};

    // Filtro por categoría
    if (categoria) filtro.categoria = categoria;

    // Búsqueda por nombre
    if (buscar) filtro.nombre = { $regex: buscar, $options: 'i' };

    // Ordenamiento
    let sortObj = { createdAt: -1 }; // Por defecto: más reciente primero
    if (orden === 'nombre') sortObj = { nombre: 1 };
    if (orden === 'precio') sortObj = { precio: 1 };
    if (orden === 'stock') sortObj = { stock: 1 };

    const productos = await Producto.find(filtro).sort(sortObj);
    res.json({ ok: true, total: productos.length, productos });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener productos', error: error.message });
  }
});

// GET /api/productos/:id - Obtener un producto
router.get('/:id', async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
    res.json({ ok: true, producto });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener producto', error: error.message });
  }
});

// POST /api/productos - Crear producto
router.post('/', async (req, res) => {
  try {
    const producto = new Producto(req.body);
    const nuevo = await producto.save();
    res.status(201).json({ ok: true, mensaje: 'Producto creado exitosamente', producto: nuevo });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ ok: false, mensaje: 'Datos inválidos', errores: mensajes });
    }
    res.status(500).json({ ok: false, mensaje: 'Error al crear producto', error: error.message });
  }
});

// PUT /api/productos/:id - Actualizar producto
router.put('/:id', async (req, res) => {
  try {
    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!producto) return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
    res.json({ ok: true, mensaje: 'Producto actualizado', producto });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ ok: false, mensaje: 'Datos inválidos', errores: mensajes });
    }
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar producto', error: error.message });
  }
});

// DELETE /api/productos/:id - Eliminar producto
router.delete('/:id', async (req, res) => {
  try {
    const producto = await Producto.findByIdAndDelete(req.params.id);
    if (!producto) return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
    res.json({ ok: true, mensaje: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar producto', error: error.message });
  }
});

// GET /api/productos/stats/resumen - Estadísticas del inventario
router.get('/stats/resumen', async (req, res) => {
  try {
    const totalProductos = await Producto.countDocuments();
    const stockBajo = await Producto.countDocuments({ stock: { $lte: 5 } });
    const sinStock = await Producto.countDocuments({ stock: 0 });
    const categorias = await Producto.distinct('categoria');
    const valorInventario = await Producto.aggregate([
      { $group: { _id: null, total: { $sum: { $multiply: ['$precio', '$stock'] } } } }
    ]);

    res.json({
      ok: true,
      stats: {
        totalProductos,
        stockBajo,
        sinStock,
        categorias: categorias.length,
        valorInventario: valorInventario[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener estadísticas', error: error.message });
  }
});

module.exports = router;
