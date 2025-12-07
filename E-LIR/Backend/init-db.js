const bcrypt = require('bcryptjs');
const db = require('./db');

async function run() {
  console.log('Tablolar oluşturuluyor...');

  function runSql(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  try {
    // USERS
    await runSql(`
      CREATE TABLE IF NOT EXISTS users (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        sicil_no        TEXT UNIQUE NOT NULL,
        full_name       TEXT NOT NULL,
        password_hash   TEXT NOT NULL,
        role            TEXT NOT NULL CHECK (role IN ('HAREKAT', 'RAMP')),
        is_active       INTEGER NOT NULL DEFAULT 1,
        created_at      DATETIME NOT NULL,
        updated_at      DATETIME NOT NULL
      );
    `);

    await runSql(`
      CREATE TABLE IF NOT EXISTS lir_offload (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lir_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        updated_at DATETIME NOT NULL,
        FOREIGN KEY (lir_id) REFERENCES lirs(id)
      );
    `);


    // LIRS
    await runSql(`
      CREATE TABLE IF NOT EXISTS lirs (
        id                     INTEGER PRIMARY KEY AUTOINCREMENT,
        flight_no              TEXT NOT NULL,
        from_airport           TEXT NOT NULL,
        to_airport             TEXT NOT NULL,
        flight_date            DATETIME NOT NULL,
        aircraft_reg           TEXT NOT NULL,
        aircraft_type          TEXT NOT NULL,
        status                 TEXT NOT NULL CHECK (
          status IN (
            'DRAFT',
            'WAITING_RAMP',
            'WAITING_OPS_APPROVAL',
            'REJECTED_BY_OPS',
            'FINALIZED'
          )
        ),
        holds                  TEXT,
        created_by_user_id     INTEGER NOT NULL,
        assigned_ramp_user_id  INTEGER,
        ops_reject_reason      TEXT,
        created_at             DATETIME NOT NULL,
        updated_at             DATETIME NOT NULL,
        finalized_at           DATETIME,
        FOREIGN KEY (created_by_user_id) REFERENCES users(id),
        FOREIGN KEY (assigned_ramp_user_id) REFERENCES users(id)
      );
    `);

    // LOGS, PLAN, REPORT, WEIGHT (diğer tablolar)
    await runSql(`
      CREATE TABLE IF NOT EXISTS lir_plan (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lir_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        updated_at DATETIME NOT NULL,
        FOREIGN KEY (lir_id) REFERENCES lirs(id)
      );
    `);

    await runSql(`
      CREATE TABLE IF NOT EXISTS lir_report (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lir_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        ramp_user_id INTEGER NOT NULL,
        updated_at DATETIME NOT NULL,
        FOREIGN KEY (lir_id) REFERENCES lirs(id),
        FOREIGN KEY (ramp_user_id) REFERENCES users(id)
      );
    `);

    await runSql(`
      CREATE TABLE IF NOT EXISTS lir_weight (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lir_id INTEGER NOT NULL,
        dow REAL,
        zfw REAL,
        tow REAL,
        lw REAL,
        trim_mac REAL,
        updated_by_user INTEGER,
        updated_at DATETIME NOT NULL,
        FOREIGN KEY (lir_id) REFERENCES lirs(id),
        FOREIGN KEY (updated_by_user) REFERENCES users(id)
      );
    `);

    await runSql(`
      CREATE TABLE IF NOT EXISTS lir_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lir_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        actor_id INTEGER NOT NULL,
        note TEXT,
        created_at DATETIME NOT NULL,
        FOREIGN KEY (lir_id) REFERENCES lirs(id),
        FOREIGN KEY (actor_id) REFERENCES users(id)
      );
    `);

    // ÖRNEK KULLANICI EKLE
    const now = new Date().toISOString();

    const harekatPass = await bcrypt.hash("harekat123", 10);
    const rampPass = await bcrypt.hash("ramp123", 10);

    await runSql(`
      INSERT OR IGNORE INTO users 
      (sicil_no, full_name, password_hash, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, 'HAREKAT', 1, ?, ?)
    `, ["1001", "Harekat Memuru 1", harekatPass, now, now]);

    await runSql(`
      INSERT OR IGNORE INTO users 
      (sicil_no, full_name, password_hash, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, 'RAMP', 1, ?, ?)
    `, ["2001", "Ramp Görevlisi 1", rampPass, now, now]);

    console.log("Örnek hesaplar hazır:");
    console.log("Harekat → 1001 / harekat123");
    console.log("Rampa   → 2001 / ramp123");

  } catch (err) {
    console.error("Hata:", err);
  } finally {
    db.close();
  }
}

run();
