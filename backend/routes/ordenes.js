const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Orden = require('../models/Orden');
const Producto = require('../models/Producto');

// Crear orden (checkout)
router.post('/', auth, async (req, res) => {
  try {
    const { productos, total, direccionEnvio, metodoPago } = req.body;

    // Verificar stock y actualizar
    for (const item of productos) {
      const producto = await Producto.findById(item.producto);
      if (!producto || producto.stock < item.cantidad) {
        return res.status(400).json({ 
          ok: false, 
          mensaje: `Stock insuficiente para ${producto?.nombre || 'producto'}` 
        });
      }
      producto.stock -= item.cantidad;
      await producto.save();
    }

    const orden = new Orden({
      usuario: req.usuario.id,
      productos: productos,
      total: total,
      direccionEnvio: direccionEnvio,
      metodoPago: metodoPago
    });

    await orden.save();
    res.json({ ok: true, mensaje: 'Orden creada exitosamente', orden });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al procesar orden', error: error.message });
  }
});

// Obtener mis órdenes
router.get('/mis-ordenes', auth, async (req, res) => {
  try {
    const ordenes = await Orden.find({ usuario: req.usuario.id })
      .populate('productos.producto')
      .sort({ createdAt: -1 });
    res.json({ ok: true, ordenes: ordenes });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener órdenes' });
  }
});

// Obtener todas las órdenes (admin)
router.get('/', auth, auth.admin, async (req, res) => {
  try {
    const ordenes = await Orden.find()
      .populate('usuario', 'nombre email')
      .populate('productos.producto')
      .sort({ createdAt: -1 });
    res.json({ ok: true, ordenes: ordenes });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener órdenes' });
  }
});

// Actualizar estado de orden (admin)
router.put('/:id/estado', auth, auth.admin, async (req, res) => {
  try {
    const { estado, estadoPago } = req.body;
    const updateData = { estado };
    
    if (estadoPago) {
      updateData.estadoPago = estadoPago;
      if (estadoPago === 'pagado') {
        updateData.fechaPago = new Date();
      }
    }
    
    const orden = await Orden.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    res.json({ ok: true, mensaje: 'Estado actualizado', orden });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al actualizar' });
  }
});

module.exports = router;
