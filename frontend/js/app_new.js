/* ── TEMU Clone - Main App Logic ───────────────── */
const API = '/api';
let carrito = [];
let usuario = null;
let token = null;
let productoSeleccionado = null;
let cantidadSeleccionada = 1;

// Inicializar variables de forma segura
try {
  carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
} catch(e) {
  carrito = [];
  localStorage.removeItem('carrito');
}

try {
  usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
} catch(e) {
  usuario = null;
  localStorage.removeItem('usuario');
}

token = localStorage.getItem('token');

// ── INIT ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Iniciando aplicación...');
  cargarProductos();
  cargarFlashDeals();
  actualizarUI();
  if (usuario && usuario.rol === 'admin') mostrarAdminPanel();
});

// Backup: si el DOM ya está listo
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  console.log('🚀 DOM ya estaba listo, iniciando...');
  setTimeout(() => {
    cargarProductos();
    cargarFlashDeals();
    actualizarUI();
    if (usuario && usuario.rol === 'admin') mostrarAdminPanel();
  }, 100);
}

// ── AUTH FUNCTIONS ───────────────────────────────
function mostrarLogin() {
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('registroForm').classList.add('hidden');
  document.getElementById('modalTitle').textContent = 'Iniciar Sesión';
}

function mostrarRegistro() {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('registroForm').classList.remove('hidden');
  document.getElementById('modalTitle').textContent = 'Registrarse';
}

function abrirLogin() {
  console.log('Abriendo login...');
  document.getElementById('loginModal').classList.add('open');
  mostrarLogin();
}

function cerrarModal(id) {
  document.getElementById(id).classList.remove('open');
}

async function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPass').value;
  const errorDiv = document.getElementById('formError');

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.ok) {
      token = data.token;
      usuario = data.usuario;
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));
      actualizarUI();
      cerrarModal('loginModal');
      mostrarToast('Bienvenido ' + usuario.nombre);
      if (usuario.rol === 'admin') mostrarAdminPanel();
    } else {
      errorDiv.textContent = data.mensaje;
      errorDiv.classList.remove('hidden');
    }
  } catch {
    mostrarToast('Error de conexión', 'error');
  }
}

async function registro() {
  const nombre = document.getElementById('regNombre').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPass').value;
  const errorDiv = document.getElementById('formError');

  if (password.length < 6) {
    errorDiv.textContent = 'La contraseña debe tener al menos 6 caracteres';
    errorDiv.classList.remove('hidden');
    return;
  }

  try {
    const res = await fetch(`${API}/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password })
    });
    const data = await res.json();
    if (data.ok) {
      token = data.token;
      usuario = data.usuario;
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));
      actualizarUI();
      cerrarModal('loginModal');
      mostrarToast('Cuenta creada exitosamente');
    } else {
      errorDiv.textContent = data.mensaje;
      errorDiv.classList.remove('hidden');
    }
  } catch {
    mostrarToast('Error de conexión', 'error');
  }
}

function logout() {
  token = null;
  usuario = null;
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  actualizarUI();
  document.getElementById('adminPanel').classList.add('hidden');
  mostrarToast('Sesión cerrada');
}

function actualizarUI() {
  const userMenu = document.getElementById('userMenu');
  if (usuario) {
    userMenu.innerHTML = `
      <span style="color:white; margin-right:1rem;">Hola, ${usuario.nombre}</span>
      ${usuario.rol === 'admin' ? '<button class="btn-login" onclick="mostrarAdminPanel()">Admin</button>' : ''}
      <button class="btn-login" onclick="logout()">Salir</button>
    `;
  } else {
    userMenu.innerHTML = '<button class="btn-login" onclick="abrirLogin()">Iniciar Sesión</button>';
  }
  actualizarCartCount();
}

// ── PRODUCTOS ────────────────────────────────────
async function cargarProductos() {
  const categoria = document.body.dataset.categoria || '';
  const orden = document.getElementById('ordenFiltro')?.value || '';
  
  let url = `${API}/productos?activo=true`;
  if (categoria) url += `&categoria=${encodeURIComponent(categoria)}`;
  if (orden === 'precio-asc') url += '&orden=precio';
  if (orden === 'precio-desc') url += '&orden=-precio';
  if (orden === 'descuento') url += '&orden=descuento';
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('Productos cargados:', data.productos?.length);
    renderizarProductos(data.productos || [], 'productosGrid');
  } catch (error) {
    console.error('Error cargando productos:', error);
    mostrarToast('Error al cargar productos', 'error');
  }
}

async function cargarFlashDeals() {
  try {
    const res = await fetch(`${API}/productos?activo=true`);
    const data = await res.json();
    const ofertas = (data.productos || [])
      .filter(p => p.descuento > 0)
      .sort((a, b) => b.descuento - a.descuento)
      .slice(0, 8);
    renderizarProductos(ofertas, 'flashProducts');
  } catch {
    console.error('Error cargando ofertas');
  }
}

function renderizarProductos(productos, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!productos.length) {
    container.innerHTML = '<p style="text-align:center;grid-column:1/-1;padding:3rem;color:#666;">No hay productos disponibles</p>';
    return;
  }

  container.innerHTML = productos.map(p => `
    <div class="product-card" onclick="verProducto('${p._id}')">
      ${p.descuento ? `<div class="product-badge">-${p.descuento}%</div>` : ''}
      ${p.destacado ? `<div class="product-badge" style="background:#ffc107;left:auto;right:10px;">★ Destacado</div>` : ''}
      <img src="${p.imagen || 'https://via.placeholder.com/300'}" alt="${p.nombre}" class="product-img"/>
      <div class="product-info">
        <div class="product-name">${p.nombre}</div>
        <div class="product-price">
          <span class="price-current">S/ ${Number(p.precio).toFixed(2)}</span>
          ${p.precioOriginal ? `<span class="price-original">S/ ${Number(p.precioOriginal).toFixed(2)}</span>` : ''}
        </div>
        <div class="product-stock">${p.stock > 0 ? `Stock: ${p.stock}` : 'Agotado'}</div>
      </div>
    </div>
  `).join('');
}

function filtrarCategoria(cat, btn, orden) {
  console.log('Filtrando por categoría:', cat);
  document.body.dataset.categoria = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (orden) document.getElementById('ordenFiltro').value = orden;
  cargarProductos();
}
  document.body.dataset.categoria = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (orden) document.getElementById('ordenFiltro').value = orden;
  cargarProductos();
}

function buscarProductos() {
  const buscar = document.getElementById('buscarInput').value;
  if (buscar) {
    fetch(`${API}/productos?buscar=${buscar}`)
      .then(r => r.json())
      .then(data => renderizarProductos(data.productos || [], 'productosGrid'));
  }
}

function scrollToProducts() {
  document.getElementById('productosSection').scrollIntoView({ behavior: 'smooth' });
}

// ── PRODUCTO DETALLE ─────────────────────────────
async function verProducto(id) {
  try {
    const res = await fetch(`${API}/productos/${id}`);
    const data = await res.json();
    if (!data.ok) return mostrarToast('Producto no encontrado', 'error');
    
    productoSeleccionado = data.producto;
    cantidadSeleccionada = 1;
    
    const modal = document.getElementById('productoModal');
    const body = document.getElementById('productoModalBody');
    
    body.innerHTML = `
      <div class="producto-detalle">
        <div class="producto-imagen">
          <img src="${productoSeleccionado.imagen}" alt="${productoSeleccionado.nombre}" style="width:100%;border-radius:8px;"/>
        </div>
        <div class="producto-info">
          <h2>${productoSeleccionado.nombre}</h2>
          <p class="producto-descripcion">${productoSeleccionado.descripcion || 'Sin descripción'}</p>
          <div class="producto-precio">
            <span class="precio-final">S/ ${Number(productoSeleccionado.precio).toFixed(2)}</span>
            ${productoSeleccionado.descuento ? `
              <span class="precio-original">S/ ${Number(productoSeleccionado.precioOriginal).toFixed(2)}</span>
              <span class="descuento-badge">-${productoSeleccionado.descuento}%</span>
            ` : ''}
          </div>
          <div class="stock-info">
            <strong>Categoría:</strong> ${productoSeleccionado.categoria}<br/>
            <strong>Stock disponible:</strong> ${productoSeleccionado.stock} unidades
          </div>
          <div class="qty-selector">
            <span>Cantidad:</span>
            <button class="qty-btn" onclick="cambiarCantidadDetalle(-1)">-</button>
            <span class="qty-display" id="cantidadDisplay">${cantidadSeleccionada}</span>
            <button class="qty-btn" onclick="cambiarCantidadDetalle(1)">+</button>
          </div>
          <button class="btn-add-cart-lg" onclick="agregarAlCarritoDesdeDetalle()" 
                  ${productoSeleccionado.stock === 0 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
            ${productoSeleccionado.stock > 0 ? '🛒 Agregar al Carrito' : 'Agotado'}
          </button>
        </div>
      </div>
    `;
    
    modal.classList.add('open');
  } catch {
    mostrarToast('Error al cargar producto', 'error');
  }
}

function cambiarCantidadDetalle(delta) {
  cantidadSeleccionada += delta;
  if (cantidadSeleccionada < 1) cantidadSeleccionada = 1;
  if (cantidadSeleccionada > productoSeleccionado.stock) cantidadSeleccionada = productoSeleccionado.stock;
  document.getElementById('cantidadDisplay').textContent = cantidadSeleccionada;
}

function agregarAlCarritoDesdeDetalle() {
  if (!usuario) {
    cerrarModal('productoModal');
    abrirLogin();
    return;
  }
  
  const item = carrito.find(i => i._id === productoSeleccionado._id);
  if (item) {
    const nuevaCantidad = item.cantidad + cantidadSeleccionada;
    item.cantidad = Math.min(nuevaCantidad, productoSeleccionado.stock);
  } else {
    carrito.push({ ...productoSeleccionado, cantidad: cantidadSeleccionada });
  }
  
  guardarCarrito();
  cerrarModal('productoModal');
  mostrarToast('Producto agregado al carrito');
}

// ── CARRITO ──────────────────────────────────────
function agregarAlCarrito(id) {
  if (!usuario) {
    abrirLogin();
    return;
  }

  fetch(`${API}/productos/${id}`)
    .then(r => r.json())
    .then(data => {
      const p = data.producto;
      const item = carrito.find(i => i._id === id);
      if (item) {
        if (item.cantidad < p.stock) item.cantidad++;
      } else {
        carrito.push({ ...p, cantidad: 1 });
      }
      guardarCarrito();
      mostrarToast('Producto agregado al carrito');
    });
}

function guardarCarrito() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
  actualizarCartCount();
}

function actualizarCartCount() {
  const count = carrito.reduce((sum, i) => sum + i.cantidad, 0);
  document.getElementById('cartCount').textContent = count;
}

function toggleCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('open');
  renderizarCarrito();
}

function renderizarCarrito() {
  const container = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');

  if (!carrito.length) {
    container.innerHTML = '<p style="text-align:center;padding:3rem;color:#666;">Tu carrito está vacío</p>';
    footer.innerHTML = '';
    return;
  }

  container.innerHTML = carrito.map((item, i) => `
    <div class="cart-item">
      <img src="${item.imagen || 'https://via.placeholder.com/80'}" alt="${item.nombre}"/>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.nombre}</div>
        <div class="cart-item-price">S/ ${Number(item.precio).toFixed(2)}</div>
        <div class="cart-item-actions">
          <button class="qty-btn" onclick="cambiarCantidad(${i}, -1)">-</button>
          <span>${item.cantidad}</span>
          <button class="qty-btn" onclick="cambiarCantidad(${i}, 1)">+</button>
          <button class="qty-btn" style="margin-left:auto;color:red;" onclick="eliminarDelCarrito(${i})">🗑</button>
        </div>
      </div>
    </div>
  `).join('');

  const total = carrito.reduce((sum, i) => sum + (i.precio * i.cantidad), 0);
  footer.innerHTML = `
    <div class="cart-total">
      <span>Total: </span>
      <span>S/ ${total.toFixed(2)}</span>
    </div>
    <button class="btn-checkout" onclick="checkout()">Proceder al Pago</button>
  `;
}

function cambiarCantidad(index, delta) {
  carrito[index].cantidad += delta;
  if (carrito[index].cantidad <= 0) carrito.splice(index, 1);
  guardarCarrito();
  renderizarCarrito();
}

function eliminarDelCarrito(index) {
  carrito.splice(index, 1);
  guardarCarrito();
  renderizarCarrito();
}

function checkout() {
  if (!carrito.length) return;  
  const content = document.getElementById('checkoutContent');
  const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  
  content.innerHTML = `
    <div class="checkout-summary">
      ${carrito.map(item => `
        <div class="checkout-item">
          <img src="${item.imagen}" alt="${item.nombre}"/>
          <div style="flex:1;">
            <strong>${item.nombre}</strong><br/>
            <span style="color:#666;">Cantidad: ${item.cantidad}</span>
          </div>
          <div style="font-weight:700;">S/ ${(item.precio * item.cantidad).toFixed(2)}</div>
        </div>
      `).join('')}
      <div class="checkout-total">
        <span>Total a pagar:</span>
        <span>S/ ${total.toFixed(2)}</span>
      </div>
    </div>
    
    <div class="form-group">
      <label>Nombre completo:</label>
      <input type="text" id="checkoutNombre" value="${usuario?.nombre || ''}" class="input-field"/>
    </div>
    <div class="form-group">
      <label>Dirección de envío:</label>
      <textarea id="checkoutDireccion" rows="3" class="input-field" placeholder="Ingresa tu dirección completa..."></textarea>
    </div>
    <div class="form-group">
      <label>Método de pago:</label>
      <select id="checkoutPago" class="input-field" onchange="mostrarImagenPago()">
        <option value="tarjeta">Tarjeta de Crédito/Débito</option>
        <option value="yape">Yape</option>
        <option value="plin">Plin</option>
        <option value="contraentrega">Pago contra entrega</option>
      </select>
    </div>
    
    <div id="pagoContainer" class="pago-container hidden">
      <div class="pago-imagen-container">
        <img id="pagoImagen" src="" alt="Código de pago" class="pago-imagen"/>
      </div>
      <button class="btn-primary full" style="margin-top:1rem;" onclick="procesarCompra()">
        Confirmar Pago - S/ ${total.toFixed(2)}
      </button>
    </div>
    
    <button class="btn-primary full" style="margin-top:1rem;" onclick="procesarCompra()" id="btnPagarNormal">
      Confirmar Compra - S/ ${total.toFixed(2)}
    </button>
  `;  
  document.getElementById('checkoutModal').classList.add('open');
}

async function mostrarImagenPago() {
  const metodo = document.getElementById('checkoutPago').value;
  const container = document.getElementById('pagoContainer');
  const btnNormal = document.getElementById('btnPagarNormal');
  
  if (metodo === 'contraentrega') {
    container.classList.add('hidden');
    btnNormal.classList.remove('hidden');
    return;
  }
  
  try {
    const res = await fetch(`${API}/config/imagen_pago_${metodo}`);
    const data = await res.json();
    
    if (data.valor) {
      document.getElementById('pagoImagen').src = data.valor;
      container.classList.remove('hidden');
      btnNormal.classList.add('hidden');
    } else {
      container.classList.add('hidden');
      btnNormal.classList.remove('hidden');
    }
  } catch {
    container.classList.add('hidden');
    btnNormal.classList.remove('hidden');
  }
}

async function procesarCompra() {
  const nombre = document.getElementById('checkoutNombre').value;
  const direccion = document.getElementById('checkoutDireccion').value;
  const pago = document.getElementById('checkoutPago').value;
  
  if (!nombre || !direccion) {
    mostrarToast('Completa todos los campos', 'error');
    return;
  }
  
  try {
    const res = await fetch(`${API}/ordenes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productos: carrito.map(i => ({
          producto: i._id,
          cantidad: i.cantidad,
          precio: i.precio
        })),
        total: carrito.reduce((sum, i) => sum + (i.precio * i.cantidad), 0),
        direccionEnvio: direccion,
        metodoPago: pago
      })
    });
    
    const data = await res.json();
    if (data.ok) {
      if (pago === 'contraentrega') {
        carrito = [];
        guardarCarrito();
        cerrarModal('checkoutModal');
        cerrarModal('cartSidebar');
        mostrarToast('¡Compra realizada con éxito!');
      } else {
        // Mostrar mensaje de pago en proceso
        const content = document.getElementById('checkoutContent');
        content.innerHTML = `
          <div class="pago-proceso">
            <div class="pago-icon">⏳</div>
            <h3>Pago en Proceso</h3>
            <p>Tu pago está siendo verificado por el administrador.</p>
            <p>Orden #: ${data.orden._id}</p>
            <button class="btn-primary" onclick="cerrarModal('checkoutModal'); toggleCart();">Aceptar</button>
          </div>
        `;
        carrito = [];
        guardarCarrito();
      }
    } else {
      mostrarToast(data.mensaje || 'Error al procesar compra', 'error');
    }
  } catch {
    mostrarToast('Error de conexión', 'error');
  }
}

// ── ADMIN PANEL ──────────────────────────────────
function mostrarAdminPanel() {
  document.getElementById('adminPanel').classList.remove('hidden');
  document.getElementById('heroSection').style.display = 'none';
  document.getElementById('flashDeals').style.display = 'none';
  document.getElementById('productosSection').style.display = 'none';
  showTab('productos', document.querySelector('.tab-btn'));
  cargarUsuariosAdmin();
}

function showTab(tab, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tabProductos').classList.add('hidden');
  document.getElementById('tabUsuarios').classList.add('hidden');
  document.getElementById('tabPagos').classList.add('hidden');
  document.getElementById('tabNuevo').classList.add('hidden');
  document.getElementById('tabConfig').classList.add('hidden');
  document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.remove('hidden');
  
  if (tab === 'productos') cargarProductosAdmin();
  if (tab === 'usuarios') cargarUsuariosAdmin();
  if (tab === 'pagos') cargarPagosAdmin();
  if (tab === 'config') cargarConfigAdmin();
}

async function cargarProductosAdmin() {
  const res = await fetch(`${API}/productos`);
  const data = await res.json();
  const container = document.getElementById('tabProductos');
  container.innerHTML = `
    <table class="admin-table">
      <thead><tr><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr></thead>
      <tbody>
        ${(data.productos || []).map(p => `
          <tr>
            <td>${p.nombre}</td>
            <td>${p.categoria}</td>
            <td>S/ ${Number(p.precio).toFixed(2)}</td>
            <td>${p.stock}</td>
            <td>
              <button class="btn-edit" onclick="editarProducto('${p._id}')">Editar</button>
              <button class="btn-del" onclick="eliminarProducto('${p._id}')">Eliminar</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function editarProducto(id) {
  try {
    const res = await fetch(`${API}/productos/${id}`);
    const data = await res.json();
    if (!data.ok) return mostrarToast('Error al cargar producto', 'error');
    
    const p = data.producto;
    document.getElementById('productoId').value = p._id;
    document.getElementById('nombre').value = p.nombre;
    document.getElementById('categoria').value = p.categoria;
    document.getElementById('descripcion').value = p.descripcion || '';
    document.getElementById('precio').value = p.precio;
    document.getElementById('descuento').value = p.descuento || 0;
    document.getElementById('stock').value = p.stock;
    
    showTab('nuevo', document.querySelector('.tab-btn[onclick*="nuevo"]'));
    mostrarToast('Editando: ' + p.nombre);
  } catch {
    mostrarToast('Error al cargar producto', 'error');
  }
}

async function eliminarProducto(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  
  try {
    await fetch(`${API}/productos/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    mostrarToast('Producto eliminado');
    cargarProductosAdmin();
    cargarProductos();
  } catch {
    mostrarToast('Error al eliminar', 'error');
  }
}

async function cargarUsuariosAdmin() {
  try {
    const res = await fetch(`${API}/usuarios`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const container = document.getElementById('tabUsuarios');
    container.innerHTML = `
      <table class="admin-table">
        <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Acciones</th></tr></thead>
        <tbody>
          ${(data.usuarios || []).map(u => `
            <tr>
              <td>${u.nombre}</td>
              <td>${u.email}</td>
              <td>
                <select onchange="cambiarRol('${u._id}', this.value)" 
                        style="padding:0.3rem;border:1px solid #ddd;border-radius:4px;">
                  <option value="usuario" ${u.rol === 'usuario' ? 'selected' : ''}>Usuario</option>
                  <option value="admin" ${u.rol === 'admin' ? 'selected' : ''}>Admin</option>
                </select>
              </td>
              <td>
                <button class="btn-del" onclick="eliminarUsuario('${u._id}')">Eliminar</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch {
    mostrarToast('Error cargando usuarios', 'error');
  }
}

async function cambiarRol(id, rol) {
  try {
    await fetch(`${API}/usuarios/${id}/rol`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ rol })
    });
    mostrarToast('Rol actualizado');
  } catch {
    mostrarToast('Error al actualizar rol', 'error');
  }
}

async function eliminarUsuario(id) {
  if (!confirm('¿Eliminar usuario?')) return;
  try {
    await fetch(`${API}/usuarios/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    mostrarToast('Usuario eliminado');
    cargarUsuariosAdmin();
  } catch {
    mostrarToast('Error al eliminar', 'error');
  }
}

// ── TOAST ────────────────────────────────────────
function mostrarToast(msg, tipo = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast ${tipo} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── EVENT LISTENERS ──────────────────────────────
document.getElementById('loginPass')?.addEventListener('keypress', e => {
  if (e.key === 'Enter') login();
});

document.getElementById('buscarInput')?.addEventListener('keypress', e => {
  if (e.key === 'Enter') buscarProductos();
});

// Form submit para nuevo producto (con imagen)
document.getElementById('formProducto')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('productoId').value;
  const formData = new FormData();
  
  formData.append('nombre', document.getElementById('nombre').value);
  formData.append('categoria', document.getElementById('categoria').value);
  formData.append('descripcion', document.getElementById('descripcion').value);
  formData.append('precio', parseFloat(document.getElementById('precio').value));
  formData.append('descuento', parseInt(document.getElementById('descuento').value) || 0);
  formData.append('stock', parseInt(document.getElementById('stock').value));
  
  const imagenFile = document.getElementById('imagenFile').files[0];
  const imagenUrl = document.getElementById('imagenUrl').value;
  
  if (imagenFile) {
    formData.append('imagen', imagenFile);
  } else if (imagenUrl) {
    formData.append('imagen', imagenUrl);
  }
  
  try {
    const url = id ? `${API}/productos/${id}` : `${API}/productos`;
    const method = id ? 'PUT' : 'POST';
    
    await fetch(url, {
      method,
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    
    mostrarToast(id ? 'Producto actualizado' : 'Producto creado');
    document.getElementById('formProducto').reset();
    cargarProductosAdmin();
    cargarProductos();
  } catch {
    mostrarToast('Error al guardar', 'error');
  }
});

// ── PAGOS ADMIN ─────────────────────────────
async function cargarPagosAdmin() {
  try {
    const res = await fetch(`${API}/ordenes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const container = document.getElementById('tabPagos');
    
    const pagosPendientes = (data.ordenes || []).filter(o => 
      o.metodoPago !== 'contraentrega' && o.estadoPago !== 'pagado'
    );
    
    container.innerHTML = `
      <h3>Pagos Pendientes</h3>
      ${pagosPendientes.length === 0 ? '<p>No hay pagos pendientes</p>' : `
        <table class="admin-table">
          <thead><tr><th>ID</th><th>Usuario</th><th>Total</th><th>Método</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            ${pagosPendientes.map(o => `
              <tr>
                <td>${o._id.slice(-8)}</td>
                <td>${o.usuario?.nombre || 'N/A'}</td>
                <td>S/ ${Number(o.total).toFixed(2)}</td>
                <td>${o.metodoPago}</td>
                <td><span class="estado-badge ${o.estadoPago}">${o.estadoPago}</span></td>
                <td>
                  <button class="btn-edit" onclick="validarPago('${o._id}', 'pagado')">Validar</button>
                  <button class="btn-del" onclick="validarPago('${o._id}', 'rechazado')">Rechazar</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}
      
      <h3 style="margin-top:2rem;">Historial de Pagos</h3>
      <table class="admin-table">
        <thead><tr><th>ID</th><th>Usuario</th><th>Total</th><th>Método</th><th>Estado</th></tr></thead>
        <tbody>
          ${(data.ordenes || []).filter(o => o.metodoPago !== 'contraentrega').map(o => `
            <tr>
              <td>${o._id.slice(-8)}</td>
              <td>${o.usuario?.nombre || 'N/A'}</td>
              <td>S/ ${Number(o.total).toFixed(2)}</td>
              <td>${o.metodoPago}</td>
              <td><span class="estado-badge ${o.estadoPago}">${o.estadoPago}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch {
    mostrarToast('Error cargando pagos', 'error');
  }
}

async function validarPago(id, estado) {
  try {
    const res = await fetch(`${API}/ordenes/${id}/estado`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        estado: estado === 'pagado' ? 'pagado' : 'cancelado',
        estadoPago: estado
      })
    });
    
    const data = await res.json();
    if (data.ok) {
      mostrarToast(estado === 'pagado' ? 'Pago validado' : 'Pago rechazado');
      cargarPagosAdmin();
    }
  } catch {
    mostrarToast('Error al validar pago', 'error');
  }
}

// ── CONFIG ADMIN ────────────────────────────
async function cargarConfigAdmin() {
  const metodos = ['yape', 'plin'];
  
  for (const metodo of metodos) {
    try {
      const res = await fetch(`${API}/config/imagen_pago_${metodo}`);
      const data = await res.json();
      const preview = document.getElementById(`preview${metodo.charAt(0).toUpperCase() + metodo.slice(1)}`);
      if (data.valor) {
        preview.innerHTML = `<img src="${data.valor}" alt="${metodo}" style="max-width:200px;margin-top:1rem;"/>`;
      }
    } catch {
      console.error(`Error cargando config ${metodo}`);
    }
  }
}

async function subirImagenPago(metodo) {
  const fileInput = document.getElementById(`${metodo}File`);
  if (!fileInput.files[0]) {
    mostrarToast('Selecciona una imagen', 'error');
    return;
  }
  
  const formData = new FormData();
  formData.append('imagen', fileInput.files[0]);
  
  try {
    const res = await fetch(`${API}/config/imagen_pago_${metodo}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    
    const data = await res.json();
    if (data.ok) {
      mostrarToast('Imagen de pago actualizada');
      cargarConfigAdmin();
    }
  } catch {
    mostrarToast('Error al subir imagen', 'error');
  }
}
