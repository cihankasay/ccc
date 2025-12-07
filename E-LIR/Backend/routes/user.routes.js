const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// users.json yolu
const USERS_PATH = path.join(__dirname, "..", "data", "users.json");

// JSON oku
function loadUsers() {
  const raw = fs.readFileSync(USERS_PATH, "utf-8");
  return JSON.parse(raw);
}

/**
 * RAMP kullanıcı listesi
 * /api/users/ramp
 */
router.get("/ramp", (req, res) => {
  try {
    const users = loadUsers();

    const rampUsers = users
      .filter((u) => u.role === "RAMP" && u.is_active === 1)
      .map((u) => ({
        id: u.id,
        full_name: u.full_name,
        sicil_no: u.sicil_no
      }));

    res.json(rampUsers);
  } catch (err) {
    console.error("Rampa kullanıcıları hatası:", err);
    res.status(500).json({ error: "Rampa kullanıcıları alınamadı" });
  }
});


module.exports = router;
