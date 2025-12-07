const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "lir.db");
const db = new sqlite3.Database(dbPath);

// Eksik kolonları eklemeye çalışıyoruz
const columns = [
  "ALTER TABLE lirs ADD COLUMN ops_name TEXT;",
  "ALTER TABLE lirs ADD COLUMN ops_sicil TEXT;",
  "ALTER TABLE lirs ADD COLUMN ops_time TEXT;"
];

let index = 0;

function runNext() {
  if (index >= columns.length) {
    console.log("✔ Tüm kolon denemeleri tamamlandı.");
    db.close();
    return;
  }

  const sql = columns[index];
  index++;

  db.run(sql, (err) => {
    if (err) {
      console.log(`(Skip) ${sql} --> ${err.message}`);
    } else {
      console.log(`(OK) ${sql}`);
    }
    runNext();
  });
}

runNext();
