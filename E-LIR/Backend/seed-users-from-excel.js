const XLSX = require("xlsx");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcryptjs");

// DB yolu
const dbPath = path.join(__dirname, "lir.db");

// SQLite GET
function getAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.all(sql, params, function (err, rows) {
      db.close();
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// SQLite RUN
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.run(sql, params, function (err) {
      db.close();
      if (err) reject(err);
      else resolve(this);
    });
  });
}

async function syncUsers() {
  try {
    console.log("📌 Kullanıcı senkronizasyonu başlıyor...");

    // Excel oku
    const filePath = path.join(__dirname, "users.xlsx");
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const excelRows = XLSX.utils.sheet_to_json(sheet);

    // DB'deki tüm kullanıcıları çek
    const dbUsers = await getAll(`SELECT * FROM users`);
    const now = new Date().toISOString();

    // Excel SICIL LISTESI
    const excelSicilSet = new Set(excelRows.map(r => r.sicil_no.toString()));

    //
    // 1️⃣ EXCEL'DE OLMAYANLARI DB'DEN SİL
    //
    for (const user of dbUsers) {
      if (!excelSicilSet.has(user.sicil_no.toString())) {
        await run(`DELETE FROM users WHERE id = ?`, [user.id]);
        console.log(`🗑 Silindi (Excel'de yok): ${user.full_name} (${user.sicil_no})`);
      }
    }

    //
    // 2️⃣ EXCEL'DEKİ TÜM KULLANICILARI EKLE/GÜNCELLE
    //
    for (const row of excelRows) {
      if (!row.sicil_no || !row.full_name || !row.role || !row.password) {
        console.log("❌ Eksik satır atlandı:", row);
        continue;
      }

      const sicil = row.sicil_no.toString();
      const passwordString = String(row.password);

      const existing = dbUsers.find(u => u.sicil_no.toString() === sicil);

      if (!existing) {
        //
        // 🆕 EKLE
        //
        const hash = await bcrypt.hash(passwordString, 10);

        await run(
          `INSERT INTO users (sicil_no, full_name, password_hash, role, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, 1, ?, ?)`,
          [sicil, row.full_name, hash, row.role, now, now]
        );

        console.log(`✔ Eklendi: ${row.full_name}`);
      } else {
        //
        // 🔄 GÜNCELLE
        //

        let newHash = existing.password_hash;

        // ŞİFRE DEĞİŞMİŞ Mİ?
        const isSamePassword = await bcrypt.compare(passwordString, existing.password_hash);

        if (!isSamePassword) {
          newHash = await bcrypt.hash(passwordString, 10);
          console.log(`🔐 Şifre güncellendi: ${row.full_name}`);
        }

        // Diğer alanları güncelle
        await run(
          `UPDATE users
           SET full_name = ?, role = ?, password_hash = ?, updated_at = ?
           WHERE sicil_no = ?`,
          [row.full_name, row.role, newHash, now, sicil]
        );

        console.log(`🔄 Güncellendi: ${row.full_name}`);
      }
    }

    console.log("\n🎉 SENKRONİZASYON TAMAMLANDI!");

  } catch (err) {
    console.error("❌ HATA:", err);
  }
}

syncUsers();
