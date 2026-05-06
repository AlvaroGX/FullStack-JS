require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares ──────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend y uploads
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Rutas API ────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/productos', require('./routes/productos'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/ordenes', require('./routes/ordenes'));

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    mensaje: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'conectada' : 'desconectada'
  });
});

// Ruta principal y SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Conexión a MongoDB ───────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ ERROR: La variable MONGODB_URI no está definida en .env');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB Atlas conectado correctamente');
    
    // Crear admin por defecto si no existe
    const Usuario = require('./models/Usuario');
    const adminExiste = await Usuario.findOne({ rol: 'admin' });
    if (!adminExiste) {
      await Usuario.create({
        nombre: 'Administrador',
        email: 'admin@temu.com',
        password: 'admin123',
        rol: 'admin'
      });
      console.log('✅ Admin creado: admin@temu.com / admin123');
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Error al conectar con MongoDB:', err.message);
    process.exit(1);
  });

mongoose.connection.on('error', err => {
  console.error('❌ Error de MongoDB:', err.message);
});

module.exports = app;
