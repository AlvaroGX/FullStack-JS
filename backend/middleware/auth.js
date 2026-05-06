const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ ok: false, mensaje: 'Acceso denegado' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto123');
    req.usuario = decoded;
    next();
  } catch {
    res.status(401).json({ ok: false, mensaje: 'Token inválido' });
  }
};

module.exports.admin = (req, res, next) => {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ ok: false, mensaje: 'Acceso solo para administradores' });
  }
  next();
};
