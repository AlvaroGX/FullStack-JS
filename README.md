# InventApp — HT-02 Fullstack con Node.js

Aplicación fullstack de **gestión de inventario** desarrollada con:
- **Backend**: Node.js + Express.js (entorno de ejecución JavaScript)
- **Base de datos**: MongoDB Atlas (gratuito en la nube)
- **Frontend**: HTML + CSS + JavaScript vanilla
- **Deploy**: Render.com (hosting gratuito)

---

## 📁 Estructura del proyecto

```
inventario-app/
├── backend/
│   ├── models/
│   │   └── Producto.js      # Modelo Mongoose
│   ├── routes/
│   │   └── productos.js     # Rutas CRUD de la API REST
│   └── server.js            # Servidor Express principal
├── frontend/
│   ├── css/
│   │   └── style.css        # Estilos de la interfaz
│   ├── js/
│   │   └── app.js           # Lógica del frontend
│   └── index.html           # Página principal
├── .env.example             # Variables de entorno de ejemplo
├── .gitignore
└── package.json
```

---

## 🚀 Instalación y uso local

### 1. Clonar o descargar el proyecto

```bash
git clone <tu-repo>
cd inventario-app
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar MongoDB Atlas (GRATIS)

1. Ve a [mongodb.com/atlas](https://www.mongodb.com/atlas) y crea una cuenta gratis
2. Crea un **Cluster gratuito** (M0 Sandbox)
3. En **Database Access** → crea un usuario con contraseña
4. En **Network Access** → agrega `0.0.0.0/0` (acceso desde cualquier IP)
5. En **Connect** → elige "Connect your application" → copia el URI

### 4. Crear el archivo `.env`

```bash
cp .env.example .env
```

Edita `.env` y pega tu URI de MongoDB:

```env
MONGODB_URI=mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/inventario?retryWrites=true&w=majority
PORT=3000
```

### 5. Ejecutar el servidor

```bash
# Desarrollo (con recarga automática)
npm run dev

# Producción
npm start
```

Abre el navegador en: **http://localhost:3000**

---

## 🌐 Deploy en Render.com (GRATUITO)

### 1. Subir el proyecto a GitHub

```bash
git init
git add .
git commit -m "HT-02: Fullstack inventario con Node.js"
git remote add origin https://github.com/tuusuario/inventario-app.git
git push -u origin main
```

### 2. Crear servicio en Render

1. Ve a [render.com](https://render.com) y crea cuenta gratis
2. **New** → **Web Service**
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Name**: inventario-app
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. En **Environment Variables** agrega:
   - `MONGODB_URI` → tu URI de Atlas
   - `NODE_ENV` → `production`
6. Click en **Create Web Service**

¡Listo! En 2-3 minutos tendrás tu app en una URL pública gratis.

---

## 📡 API REST — Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/productos` | Listar todos los productos |
| GET | `/api/productos/:id` | Obtener un producto |
| POST | `/api/productos` | Crear producto |
| PUT | `/api/productos/:id` | Actualizar producto |
| DELETE | `/api/productos/:id` | Eliminar producto |
| GET | `/api/productos/stats/resumen` | Estadísticas del inventario |
| GET | `/api/health` | Estado del servidor |

### Parámetros de búsqueda (GET /api/productos)
- `?buscar=laptop` — Búsqueda por nombre
- `?categoria=Electrónica` — Filtrar por categoría
- `?orden=nombre|precio|stock` — Ordenar resultados

### Ejemplo de producto (JSON)
```json
{
  "nombre": "Laptop Dell XPS",
  "categoria": "Electrónica",
  "descripcion": "Laptop de alto rendimiento",
  "precio": 3500.00,
  "stock": 15,
  "unidad": "unidad"
}
```

---

## 🛠 Tecnologías usadas (HT-02)

| Capa | Tecnología | Rol |
|------|-----------|-----|
| Entorno de ejecución | **Node.js** | Ejecuta JavaScript en el servidor |
| Framework backend | **Express.js** | API REST y servidor web |
| Base de datos | **MongoDB + Mongoose** | Almacenamiento de datos |
| Frontend | **HTML/CSS/JS** | Interfaz de usuario |
| Hosting | **Render.com** | Deploy gratuito |
| DB Cloud | **MongoDB Atlas** | BD gratuita en la nube |
