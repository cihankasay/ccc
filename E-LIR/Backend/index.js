// ------------------------------------------
// LIR BACKEND - STABLE INDEX.JS
// ------------------------------------------

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const lirRoutes = require('./routes/lir.routes');
const authMiddleware = require('./middlewares/auth.middleware');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// ROOT — Public
// ----------------------------------------------------
app.get('/', (req, res) => {
  res.json({ message: 'LIR Backend Çalışıyor 🚀' });
});

// ----------------------------------------------------
// AUTH (LOGIN/REGISTER) — Public
// ----------------------------------------------------
app.use('/api/auth', authRoutes);

// ----------------------------------------------------

// PDF — Public (AUTH YOK)
// ----------------------------------------------------
const lirController = require("./controllers/lir.controller");
app.get("/api/lirs/:id/pdf", lirController.generatePdf);

// ----------------------------------------------------
// AUTH ZORUNLU ALANLAR
// ----------------------------------------------------
app.use('/api', authMiddleware);

// ----------------------------------------------------
// USERS (protected)
// ----------------------------------------------------
app.use('/api/users', userRoutes);

// ----------------------------------------------------
// LIR ROUTES (protected)
// ----------------------------------------------------
app.use('/api', lirRoutes);

// ----------------------------------------------------
// Profile — protected
// ----------------------------------------------------
app.get('/api/me', (req, res) => {
  res.json({
    sicil: req.user.sicil,
    role: req.user.role,
    name: req.user.name
  });
});

// ----------------------------------------------------
// SERVER LISTEN
// ----------------------------------------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌍 Server ${PORT} portunda 0.0.0.0 üzerinden çalışıyor`);
});
