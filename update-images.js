const mongoose = require('mongoose');

// Conectar a MongoDB
mongoose.connect('mongodb://AlvaroGX:xxxx@ac-jqbpwty-shard-00-00.0h3ngw1.mongodb.net:27017,ac-jqbpwty-shard-00-01.0h3ngw1.mongodb.net:27017,ac-jqbpwty-shard-00-02.0h3ngw1.mongodb.net:27017/?ssl=true&replicaSet=atlas-ce95jx-shard-0&authSource=admin&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Imágenes de ejemplo por categoría
const imagenesPorCategoria = {
  'Electrónica': [
    'https://images.unsplash.com/photo-1523275335684-37898f4cb0e5?w=300',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
    'https://images.unsplash.com/photo-1542291026-7eec264c27b0?w=300'
  ],
  'Hogar': [
    'https://images.unsplash.com/photo-1484101401324-7f0a46e3734?w=300',
    'https://images.unsplash.com/photo-1556909114-f6e7cfb32f54?w=300'
  ],
  'Moda': [
    'https://images.unsplash.com/photo-1523381212494-609b892b5b5c?w=300',
    'https://images.unsplash.com/photo-1552374190-9b59c56ba33b?w=300'
  ],
  'Deportes': [
    'https://images.unsplash.com/photo-1517649763968-4b0f0d4c80d2?w=300',
    'https://images.unsplash.com/photo-1530549387582-68371f6f5a6d?w=300'
  ],
  'Juguetes': [
    'https://images.unsplash.com/photo-1558066168-31d849dc1904?w=300',
    'https://images.unsplash.com/photo-1513475382585-d06e34f0c119?w=300'
  ]
};

async function actualizarImagenes() {
  try {
    const Producto = mongoose.model('Producto', new mongoose.Schema({ 
      nombre: String,
      categoria: String,
      imagen: String
    }));
    
    const productos = await Producto.find({});
    console.log(`Encontrados ${productos.length} productos`);
    
    for (const p of productos) {
      if (!p.imagen || p.imagen.includes('unsplash.com') === false) {
        const imagenesCat = imagenesPorCategoria[p.categoria] || imagenesPorCategoria['Electrónica'];
        const randomImg = imagenesCat[Math.floor(Math.random() * imagenesCat.length)];
        
        await Producto.findByIdAndUpdate(p._id, { imagen: randomImg });
        console.log(`✓ ${p.nombre} → ${randomImg}`);
      }
    }
    
    console.log('✅ Imágenes actualizadas');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

actualizarImagenes();
