function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Yetkisiz: Kullanıcı yok' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Yetkisiz: Bu işlem için yetkin yok' });
    }

    next();
  };
}

module.exports = requireRole;
