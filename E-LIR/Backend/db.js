const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// db klasöründe lir.db dosyası oluşacak
const dbPath = path.join(__dirname, 'lir.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Veritabanı bağlantı hatası:', err.message);
  } else {
    console.log('SQLite veritabanına bağlanıldı:', dbPath);
  }
});

module.exports = db;
