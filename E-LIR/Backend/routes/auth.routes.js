const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const router = express.Router();

const JWT_SECRET = "SUPER_GIZLI_LIR_SECRET";
const dbPath = path.join(__dirname, "..", "lir.db");

// DB helper
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.get(sql, params, function (err, row) {
      db.close();
      if (err) reject(err);
      else resolve(row);
    });
  });
}

router.post("/login", async (req, res) => {
  const { sicilNo, password } = req.body;

  if (!sicilNo || !password) {
    return res.status(400).json({ error: "Sicil ve şifre gerekli" });
  }

  try {
    // Kullanıcıyı SQLite'tan çek
    const user = await get(
      `SELECT * FROM users WHERE sicil_no = ? AND is_active = 1`,
      [sicilNo]
    );

    if (!user) {
      return res.status(401).json({ error: "Geçersiz sicil veya şifre" });
    }

    // bcrypt doğrulaması
    const passOk = await bcrypt.compare(password, user.password_hash);

    if (!passOk) {
      return res.status(401).json({ error: "Geçersiz sicil veya şifre" });
    }

    // Token oluştur
    const token = jwt.sign(
      {
        id: user.id,
        sicil_no: user.sicil_no,
        role: user.role,
        full_name: user.full_name
      },
      JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        sicil_no: user.sicil_no,
        full_name: user.full_name,
        role: user.role
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

module.exports = router;
