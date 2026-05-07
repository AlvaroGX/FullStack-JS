const mongoose = require('mongoose');

const ordenSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  productos: [{
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Producto',
      required: true
    },
    cantidad: {
      type: Number,
      required: true,
      min: 1
    },
    precio: {
      type: Number,
      required: true
    }
  }],
  total: {
    type: Number,
    required: true
  },
  direccionEnvio: {
    type: String,
    required: true
  },
  metodoPago: {
    type: String,
    enum: ['tarjeta', 'yape', 'plin', 'contraentrega'],
    required: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'procesando', 'pagado', 'enviado', 'entregado', 'cancelado'],
    default: 'pendiente'
  },
  estadoPago: {
    type: String,
    enum: ['pendiente', 'en_proceso', 'verificando', 'pagado', 'rechazado'],
    default: 'pendiente'
  },
  comprobantePago: {
    type: String
  },
  fechaPago: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Orden', ordenSchema);
