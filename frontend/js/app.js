/* ── InventApp — Frontend JS ─────────────────────────── */
const API = '/api/productos';

// ── Estado ────────────────────────────────────────────
let modoEdicion = false;

// ── DOM refs ──────────────────────────────────────────
const navBtns       = document.querySelectorAll('.nav-btn');
const views         = document.querySelectorAll('.view');
const modalOverlay  = document.getElementById('modalOverlay');
const formProducto  = document.getElementById('formProducto');
const formError     = document.getElementById('formError');
const modalTitle    = document.getElementById('modalTitle');
const toast         = document.getElementById('toast');

// ── Navegación ────────────────────────────────────────
navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navBtns.forEach(b => b.classList.remove('active'));
    views.forEach(v => v.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`view-${btn.dataset.view}`).classList.add('active');
    if (btn.dataset.view === 'dashboard') cargarDashboard();
    if (btn.dataset.view === 'productos') cargarProductos();
  });
});

// ── Modal ─────────────────────────────────────────────
function abrirModal(titulo = 'Nuevo Producto') {
  modalTitle.textContent = titulo;
  modalOverlay.classList.add('open');
  formError.classList.add('hidden');
}
function cerrarModal() {
  modalOverlay.classList.remove('open');
  formProducto.reset();
  document.getElementById('productoId').value = '';
  modoEdicion = false;
}
document.getElementById('btnNuevoProducto').addEventListener('click', () => abrirModal());
document.getElementById('modalClose').addEventListener('click', cerrarModal);
document.getElementById('btnCancelar').addEventListener('click', cerrarModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) cerrarModal(); });

// ── Toast ─────────────────────────────────────────────
function mostrarToast(msg, tipo = 'success') {
  toast.textContent = msg;
  toast.className = `toast ${tipo} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Helpers ───────────────────────────────────────────
const fmt = n => `S/ ${Number(n).toFixed(2)}`;
const stockClass = s => s === 0 ? 'stock-zero' : s <= 5 ? 'stock-warn' : 'stock-ok';

function tablaVacia(msg = 'No hay productos') {
  return `<div class="empty-state"><div class="icon">📦</div><p>${msg}</p></div>`;
}

function renderTabla(productos, acciones = true) {
  if (!productos.length) return tablaVacia();
  return `
    <table>
      <thead>
        <tr>
          <th>Nombre</th><th>Categoría</th><th>Precio</th>
          <th>Stock</th><th>Unidad</th>
          ${acciones ? '<th>Acciones</th>' : ''}
        </tr>
      </thead>
      <tbody>
        ${productos.map(p => `
          <tr>
            <td><strong>${p.nombre}</strong>${p.descripcion ? `<br><small style="color:var(--text2)">${p.descripcion.substring(0,60)}${p.descripcion.length>60?'…':''}</small>` : ''}</td>
            <td><span class="badge-cat">${p.categoria}</span></td>
            <td>${fmt(p.precio)}</td>
            <td class="${stockClass(p.stock)}">${p.stock}</td>
            <td style="color:var(--text2);font-size:.82rem">${p.unidad}</td>
            ${acciones ? `
            <td>
              <button class="btn-edit" title="Editar" onclick="editarProducto('${p._id}')">✏️</button>
              <button class="btn-del" title="Eliminar" onclick="eliminarProducto('${p._id}','${p.nombre}')">🗑️</button>
            </td>` : ''}
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

// ── Dashboard ─────────────────────────────────────────
async function cargarDashboard() {
  try {
    const [statsRes, productosRes] = await Promise.all([
      fetch(`${API}/stats/resumen`),
      fetch(`${API}?orden=stock`)
    ]);
    const { stats } = await statsRes.json();
    const { productos } = await productosRes.json();

    document.getElementById('stat-total').textContent = stats.totalProductos;
    document.getElementById('stat-valor').textContent = fmt(stats.valorInventario);
    document.getElementById('stat-bajo').textContent  = stats.stockBajo;
    document.getElementById('stat-sin').textContent   = stats.sinStock;

    const criticos = productos.filter(p => p.stock <= 5);
    document.getElementById('tabla-criticos').innerHTML =
      criticos.length ? renderTabla(criticos, false) : tablaVacia('No hay productos con stock crítico 🎉');
  } catch {
    mostrarToast('Error al cargar el dashboard', 'error');
  }
}
async function enviar() {
  const input = document.getElementById("msg");
  const mensaje = input.value;

  if (!mensaje) return;

  const chat = document.getElementById("chat");

  // mensaje usuario
  chat.innerHTML += `<p><b>Tú:</b> ${mensaje}</p>`;

  input.value = "";

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ mensaje })
    });

    const data = await res.json();

    // respuesta IA
    chat.innerHTML += `<p><b>IA:</b> ${data.respuesta}</p>`;
    chat.scrollTop = chat.scrollHeight;

  } catch (error) {
    chat.innerHTML += `<p style="color:red;">Error con IA</p>`;
  }
}

// ── Productos ─────────────────────────────────────────
async function cargarProductos() {
  const buscar   = document.getElementById('buscarInput').value;
  const categoria = document.getElementById('categoriaFiltro').value;
  const orden    = document.getElementById('ordenFiltro').value;

  const params = new URLSearchParams();
  if (buscar)    params.append('buscar', buscar);
  if (categoria) params.append('categoria', categoria);
  if (orden)     params.append('orden', orden);

  try {
    const res = await fetch(`${API}?${params}`);
    const data = await res.json();
    document.getElementById('tabla-productos').innerHTML = renderTabla(data.productos || []);
    actualizarCategorias(data.productos || []);
  } catch {
    mostrarToast('Error al cargar productos', 'error');
  }
}

function actualizarCategorias(productos) {
  const sel = document.getElementById('categoriaFiltro');
  const actual = sel.value;
  const cats = [...new Set(productos.map(p => p.categoria))].sort();
  sel.innerHTML = '<option value="">Todas las categorías</option>' +
    cats.map(c => `<option value="${c}" ${c === actual ? 'selected' : ''}>${c}</option>`).join('');
}

document.getElementById('btnBuscar').addEventListener('click', cargarProductos);
document.getElementById('buscarInput').addEventListener('keypress', e => { if (e.key === 'Enter') cargarProductos(); });

// ── CRUD ──────────────────────────────────────────────
formProducto.addEventListener('submit', async e => {
  e.preventDefault();
  formError.classList.add('hidden');

  const id = document.getElementById('productoId').value;
  const body = {
    nombre:      document.getElementById('nombre').value.trim(),
    categoria:   document.getElementById('categoria').value.trim(),
    descripcion: document.getElementById('descripcion').value.trim(),
    precio:      parseFloat(document.getElementById('precio').value),
    stock:       parseInt(document.getElementById('stock').value),
    unidad:      document.getElementById('unidad').value.trim() || 'unidad',
  };

  const url    = id ? `${API}/${id}` : API;
  const method = id ? 'PUT' : 'POST';

  try {
    const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!data.ok) {
      formError.textContent = data.errores ? data.errores.join(' | ') : data.mensaje;
      formError.classList.remove('hidden');
      return;
    }
    cerrarModal();
    mostrarToast(id ? 'Producto actualizado ✓' : 'Producto creado ✓');
    cargarProductos();
    cargarDashboard();
  } catch {
    mostrarToast('Error de conexión con el servidor', 'error');
  }
});

window.editarProducto = async function(id) {
  try {
    const res  = await fetch(`${API}/${id}`);
    const data = await res.json();
    const p = data.producto;
    modoEdicion = true;
    abrirModal('Editar Producto');
    document.getElementById('productoId').value   = p._id;
    document.getElementById('nombre').value        = p.nombre;
    document.getElementById('categoria').value     = p.categoria;
    document.getElementById('descripcion').value   = p.descripcion || '';
    document.getElementById('precio').value        = p.precio;
    document.getElementById('stock').value         = p.stock;
    document.getElementById('unidad').value        = p.unidad;
  } catch {
    mostrarToast('No se pudo cargar el producto', 'error');
  }
};

window.eliminarProducto = async function(id, nombre) {
  if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;
  try {
    const res  = await fetch(`${API}/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.ok) {
      mostrarToast('Producto eliminado');
      cargarProductos();
      cargarDashboard();
    }
  } catch {
    mostrarToast('Error al eliminar producto', 'error');
  }
};

// ── Init ──────────────────────────────────────────────
cargarDashboard();
