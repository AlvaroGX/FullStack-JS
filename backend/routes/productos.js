const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');
const upload = require('../middleware/upload');

// GET /api/productos - Listar todos los productos
router.get('/', async (req, res) => {
  try {
    const { categoria, buscar, orden, activo } = req.query;
    let filtro = {};

    if (activo === 'true') filtro.activo = true;
    if (categoria) filtro.categoria = categoria;
    if (buscar) filtro.nombre = { $regex: buscar, $options: 'i' };

    let sortObj = { createdAt: -1 };
    if (orden === 'nombre') sortObj = { nombre: 1 };
    if (orden === 'precio') sortObj = { precio: 1 };
    if (orden === '-precio') sortObj = { precio: -1 };
    if (orden === 'descuento') sortObj = { descuento: -1 };
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

// POST /api/productos - Crear producto (admin)
router.post('/', upload.single('imagen'), async (req, res) => {
  try {
    const imagen = req.file ? `/uploads/${req.file.filename}` : (req.body.imagen || 'https://via.placeholder.com/300');
    const producto = new Producto({
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
      categoria: req.body.categoria,
      precio: req.body.precio,
      descuento: req.body.descuento || 0,
      stock: req.body.stock,
      unidad: req.body.unidad || 'unidad',
      imagen: imagen,
      imagenes: req.body.imagenes || [],
      destacado: req.body.destacado || false,
      activo: req.body.activo !== false
    });
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

// PUT /api/productos/:id - Actualizar producto (admin)
router.put('/:id', upload.single('imagen'), async (req, res) => {
  try {
    const updateData = {};
    if (req.body.nombre !== undefined) updateData.nombre = req.body.nombre;
    if (req.body.descripcion !== undefined) updateData.descripcion = req.body.descripcion;
    if (req.body.categoria !== undefined) updateData.categoria = req.body.categoria;
    if (req.body.precio !== undefined) updateData.precio = req.body.precio;
    if (req.body.descuento !== undefined) updateData.descuento = req.body.descuento;
    if (req.body.stock !== undefined) updateData.stock = req.body.stock;
    if (req.body.unidad !== undefined) updateData.unidad = req.body.unidad;
    if (req.file) updateData.imagen = `/uploads/${req.file.filename}`;
    else if (req.body.imagen !== undefined) updateData.imagen = req.body.imagen;
    if (req.body.imagenes !== undefined) updateData.imagenes = req.body.imagenes;
    if (req.body.destacado !== undefined) updateData.destacado = req.body.destacado;
    if (req.body.activo !== undefined) updateData.activo = req.body.activo;

    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      updateData,
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
