const jwt = require('jsonwebtoken');

const JWT_SECRET = 'SUPER_GIZLI_LIR_SECRET';

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Yetkisiz: Token yok' });
  }

  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Yetkisiz: Geçersiz Authorization formatı' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, sicilNo, role }
    console.log("TOKEN USER:", payload);
    next();
  } catch (err) {
    console.error('Token doğrulama hatası:', err.message);
    return res.status(401).json({ error: 'Yetkisiz: Geçersiz veya süresi dolmuş token' });
  }
}

module.exports = authMiddleware;
