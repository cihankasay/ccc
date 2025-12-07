const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "lir.db");
const db = new sqlite3.Database(dbPath);

db.all("PRAGMA table_info(users)", [], (err, rows) => {
  if (err) {
    console.error("ERROR:", err);
  } else {
    console.log("LIRS TABLE STRUCTURE:");
    console.table(rows);
  }
  db.close();
});
