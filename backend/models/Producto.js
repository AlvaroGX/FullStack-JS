const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: [100, 'El nombre no puede superar 100 caracteres']
  },
  descripcion: {
    type: String,
    trim: true,
    maxlength: [500, 'La descripción no puede superar 500 caracteres']
  },
  categoria: {
    type: String,
    required: [true, 'La categoría es obligatoria'],
    trim: true
  },
  precio: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: [0, 'El precio no puede ser negativo']
  },
  precioOriginal: {
    type: Number,
    min: [0, 'El precio no puede ser negativo']
  },
  descuento: {
    type: Number,
    min: [0, 'El descuento no puede ser negativo'],
    max: [100, 'El descuento máximo es 100%'],
    default: 0
  },
  stock: {
    type: Number,
    required: [true, 'El stock es obligatorio'],
    min: [0, 'El stock no puede ser negativo'],
    default: 0
  },
  unidad: {
    type: String,
    default: 'unidad',
    trim: true
  },
  imagen: {
    type: String,
    default: 'https://via.placeholder.com/300'
  },
  imagenes: [{
    type: String
  }],
  destacado: {
    type: Boolean,
    default: false
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

productoSchema.pre('save', function(next) {
  if (this.descuento > 0 && !this.precioOriginal) {
    this.precioOriginal = this.precio;
    this.precio = this.precioOriginal * (1 - this.descuento / 100);
  }
  next();
});

module.exports = mongoose.model('Producto', productoSchema);
