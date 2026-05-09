require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const { supabase } = require('./config/supabase');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/productos', require('./routes/productos'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/ordenes', require('./routes/ordenes'));
app.use('/api/config', require('./routes/config'));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    mensaje: 'Servidor funcionando correctamente (Supabase)',
    timestamp: new Date().toISOString()
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

async function iniciar() {
  try {
    const { error } = await supabase.from('usuarios').select('id').limit(1);
    if (error) {
      console.error('Error de conexion a Supabase:', error.message);
      console.error('Codigo:', error.code);
      process.exit(1);
    }

    console.log('Supabase conectado correctamente');

    const { data: adminExiste } = await supabase.from('usuarios').select('id').eq('rol', 'admin').maybeSingle();
    if (!adminExiste) {
      const hashed = await bcrypt.hash('admin123', 10);
      const { error: insertError } = await supabase.from('usuarios').insert({
        nombre: 'Administrador',
        email: 'admin@temu.com',
        password: hashed,
        rol: 'admin'
      });
      if (insertError) {
        console.error('Error al crear admin:', insertError.message);
      } else {
        console.log('Admin creado: admin@temu.com / admin123');
      }
    } else {
      console.log('Admin ya existe en la BD');
    }

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Error fatal:', err.message);
    process.exit(1);
  }
}

iniciar();

module.exports = app;
