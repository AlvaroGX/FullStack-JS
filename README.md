# InventApp — Fullstack con Node.js + Supabase

Aplicación fullstack de **gestión de inventario (e-commerce)** desarrollada con:
- **Backend**: Node.js + Express.js
- **Base de datos**: Supabase (PostgreSQL)
- **Frontend**: HTML + CSS + JavaScript vanilla
- **Deploy**: Render.com

---

## Estructura del proyecto

```
inventario-app/
├── backend/
│   ├── config/
│   │   └── supabase.js        # Cliente Supabase
│   ├── middleware/
│   │   ├── auth.js            # JWT + rol admin
│   │   └── upload.js          # Multer (imágenes)
│   ├── routes/
│   │   ├── auth.js            # Login/registro/perfil
│   │   ├── productos.js       # CRUD productos + stats
│   │   ├── ordenes.js         # Órdenes de compra
│   │   ├── usuarios.js        # CRUD usuarios (admin)
│   │   ├── config.js          # Configuración dinámica
│   │   └── chat.js            # Chat con Gemini AI
│   ├── migration.sql          # Esquema para Supabase
│   └── server.js              # Servidor Express principal
├── frontend/
│   ├── css/style.css
│   ├── js/app.js
│   └── index.html
├── .env.example
├── .gitignore
└── package.json
```

---

## Instalación y uso local

### 1. Clonar e instalar dependencias

```bash
git clone <tu-repo>
cd inventario-app
npm install
```

### 2. Configurar Supabase (GRATIS)

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta gratis
2. Crea un **nuevo proyecto** (elige región cercana a ti)
3. Ve a **SQL Editor** → pega el contenido de `backend/migration.sql` → ejecuta
4. Ve a **Project Settings > API** → copia:
   - **URL** (Project URL)
   - **anon/public key** (API Key)

### 3. Crear el archivo `.env`

```bash
cp .env.example .env
```

Edita `.env` y pega tus credenciales de Supabase:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=eyJhbGciOiJI...tu-api-key...
JWT_SECRET=una_clave_secreta_segura
PORT=3000
```

### 4. Ejecutar el servidor

```bash
npm run dev   # Desarrollo (nodemon)
npm start     # Producción
```

Abre: **http://localhost:3000**

Credenciales admin por defecto: `admin@temu.com` / `admin123`

---

## API REST — Endpoints

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/login` | Iniciar sesión | No |
| POST | `/api/auth/registro` | Registrar usuario | No |
| GET | `/api/auth/perfil` | Perfil del usuario | JWT |
| GET | `/api/productos` | Listar productos | No |
| GET | `/api/productos/:id` | Obtener producto | No |
| POST | `/api/productos` | Crear producto | No* |
| PUT | `/api/productos/:id` | Actualizar producto | No* |
| DELETE | `/api/productos/:id` | Eliminar producto | No* |
| GET | `/api/productos/stats/resumen` | Estadísticas | No |
| GET | `/api/ordenes/mis-ordenes` | Mis órdenes | JWT |
| GET | `/api/ordenes` | Todas las órdenes | Admin |
| POST | `/api/ordenes` | Crear orden | JWT |
| PUT | `/api/ordenes/:id/estado` | Actualizar estado | Admin |
| GET | `/api/usuarios` | Listar usuarios | Admin |
| PUT | `/api/usuarios/:id/rol` | Cambiar rol | Admin |
| DELETE | `/api/usuarios/:id` | Eliminar usuario | Admin |
| GET | `/api/config/:clave` | Obtener config | No |
| PUT | `/api/config/:clave` | Actualizar config | Admin |
| GET | `/api/health` | Health check | No |

*\* Endpoints de productos no requieren auth (por definir)*

---

## Tecnologías usadas

| Capa | Tecnología | Rol |
|------|-----------|-----|
| Entorno | **Node.js** | Ejecuta JS en servidor |
| Framework | **Express.js** | API REST + web server |
| Base de datos | **Supabase (PostgreSQL)** | Almacenamiento |
| Frontend | **HTML/CSS/JS** | Interfaz de usuario |
| Imágenes | **Multer** | Upload de archivos |
| Auth | **JWT + bcryptjs** | Autenticación |
| IA | **Gemini API** | Chat asistente |
| Hosting | **Render.com** | Deploy |
