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

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// ── Rutas API ────────────────────────────────────────────
app.use('/api/productos', require('./routes/productos'));
app.use('/api/chat', require('./routes/chat'));


// Ruta de salud (útil para el host)
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    mensaje: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'conectada' : 'desconectada'
  });
});

// Cualquier otra ruta sirve el frontend (SPA)

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
  .then(() => {
    console.log('✅ MongoDB Atlas conectado correctamente');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Error al conectar con MongoDB:', err.message);
    process.exit(1);
  });

// Manejo de errores de conexión después de iniciado
mongoose.connection.on('error', err => {
  console.error('❌ Error de MongoDB:', err.message);
});


module.exports = app;
