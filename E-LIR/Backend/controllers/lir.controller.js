// ======================================================
// LIR CONTROLLER — FINAL STABLE VERSION (PART 1)
// ======================================================

const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const registry = require("../data/aircraft-registry.json");

const dbPath = path.join(__dirname, "..", "lir.db");

const PDFDocument = require("pdfkit");

const db = require("../db");

// ------------------------------------------
// DB HELPERS
// ------------------------------------------

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

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.all(sql, params, function (err, rows) {
      db.close();
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function safeParse(x) {
  if (!x) return null;
  if (typeof x === "object") return x;
  try {
    return JSON.parse(x);
  } catch {
    return x;
  }
}

async function getUserById(id) {
  if (!id) return null;
  return await get(
    `SELECT id, full_name, sicil_no, role FROM users WHERE id = ?`,
    [id]
  );
}

// ======================================================
// 1) LIR OLUŞTUR — HAREKAT
// ======================================================
exports.createLir = async (req, res) => {
  try {
    const {
      flightNo,
      fromAirport,
      toAirport,
      flightDate,
      aircraftReg,
      assignedRampUserId,
    } = req.body;

    const reg = aircraftReg.toUpperCase();
    if (!registry[reg]) {
      return res.status(400).json({ error: "Bu kuyruk kayıtlı değil" });
    }

    const now = new Date().toISOString();
    const aircraftType = registry[reg].type;

    // Uçak tipine göre HOLD şeması
    let holdsSchema = {};

    if (aircraftType === "A320") {
      holdsSchema = { "1": "NIL", "3": "NIL", "4": "NIL", "5": "NIL" };
    } else if (aircraftType === "A321") {
      holdsSchema = { "1": "NIL", "2": "NIL", "3": "NIL", "4": "NIL", "5": "NIL" };
    } else if (aircraftType === "B738" || aircraftType === "B737-800") {
      holdsSchema = { "1": "NIL", "2": "NIL", "3": "NIL", "4": "NIL" };
    }

    // Max holds registry’den alınır
    const maxHoldsRaw = registry[reg].holds;
    const maxHolds = {};
    for (const key in maxHoldsRaw) {
      maxHolds[String(key)] = maxHoldsRaw[key];
    }

    const inserted = await run(
      `
      INSERT INTO lirs (
        flight_no, from_airport, to_airport, flight_date,
        aircraft_reg, aircraft_type, status,
        holds, max_holds,
        created_by_user_id, assigned_ramp_user_id,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?, ?, ?, ?, ?)
      `,
      [
        flightNo,
        fromAirport,
        toAirport,
        flightDate,
        reg,
        aircraftType,
        JSON.stringify(holdsSchema),
        JSON.stringify(maxHolds),
        req.user.id,
        assignedRampUserId || null,
        now,
        now
      ]
    );

    res.json({ id: inserted.lastID, status: "DRAFT" });

  } catch (err) {
    console.error("createLir:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};
// ======================================================
// 2) LIR DETAY — HER İKİ ROL İÇİN
// ======================================================
exports.getLirDetail = async (req, res) => {
  try {
    const id = req.params.id;

    // Önce temel LIR kaydı
    const base = await get(`SELECT * FROM lirs WHERE id = ?`, [id]);
    if (!base) return res.status(404).json({ error: "LIR bulunamadı" });

    // YETKİ KONTROLÜ
    if (req.user.role === "HAREKAT" && base.created_by_user_id !== req.user.id)
      return res.status(403).json({ error: "Bu LIR sana ait değil" });

    if (req.user.role === "RAMP" && base.assigned_ramp_user_id !== req.user.id)
      return res.status(403).json({ error: "Bu LIR sana atanmadı" });

    // Diğer tablolar
    const offload = await get(`SELECT content FROM lir_offload WHERE lir_id = ?`, [id]);
    const plan = await get(`SELECT content FROM lir_plan WHERE lir_id = ?`, [id]);
    const report = await get(`SELECT content FROM lir_report WHERE lir_id = ?`, [id]);
    const weightRow = await get(`SELECT weights FROM lir_weight WHERE lir_id = ?`, [id]);

    res.json({
      base,
      holds: safeParse(base.holds),
      max_holds: safeParse(base.max_holds),
      offload: safeParse(offload?.content),
      plan: safeParse(plan?.content),
      report: safeParse(report?.content),
      weight: weightRow ? safeParse(weightRow.weights) : {}
    });

  } catch (err) {
    console.error("getLirDetail:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};



// ======================================================
// 3) OFFLOAD — HAREKAT
// ======================================================
exports.updateOffload = async (req, res) => {
  try {
    const { offload } = req.body;
    const id = req.params.id;

    if (!offload || typeof offload.content !== "string")
      return res.status(400).json({ error: "offload.content metin olmalı" });

    const now = new Date().toISOString();

    await run(`DELETE FROM lir_offload WHERE lir_id = ?`, [id]);
    await run(
      `INSERT INTO lir_offload (lir_id, content, updated_at) VALUES (?, ?, ?)`,
      [id, offload.content, now]
    );

    res.json({ ok: true });

  } catch (err) {
    console.error("updateOffload:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};


// ======================================================
// 4) PLAN — HAREKAT
// ======================================================
exports.updatePlan = async (req, res) => {
  try {
    const id = req.params.id;
    const { plan } = req.body;

    const now = new Date().toISOString();

    const content = {
      holds: plan.holds || {},
      extra: plan.extra || ""
    };

    await run(`DELETE FROM lir_plan WHERE lir_id = ?`, [id]);
    await run(
      `INSERT INTO lir_plan (lir_id, content, updated_at)
       VALUES (?, ?, ?)`,
      [id, JSON.stringify(content), now]
    );

    res.json({ ok: true });

  } catch (err) {
    console.error("updatePlan:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};


// ======================================================
// 5) REPORT — RAMP
// ======================================================
exports.updateReport = async (req, res) => {
  try {
    const id = req.params.id;
    const { report } = req.body;

    await run(`DELETE FROM lir_report WHERE lir_id = ?`, [id]);
    await run(
      `INSERT INTO lir_report (lir_id, content, ramp_user_id, updated_at)
       VALUES (?, ?, ?, ?)`,
      [id, JSON.stringify(report), req.user.id, new Date().toISOString()]
    );

    res.json({ ok: true });

  } catch (err) {
    console.error("updateReport:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};


// ======================================================
// 6) WEIGHT — HAREKAT
// ======================================================
exports.updateWeight = async (req, res) => {
  try {
    const id = req.params.id;
    const { weights } = req.body;

    await run(`DELETE FROM lir_weight WHERE lir_id = ?`, [id]);
    await run(
      `INSERT INTO lir_weight (lir_id, weights, updated_by_user, updated_at)
       VALUES (?, ?, ?, ?)`,
      [id, JSON.stringify(weights), req.user.id, new Date().toISOString()]
    );

    res.json({ ok: true });

  } catch (err) {
    console.error("updateWeight:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};


// ======================================================
// 7) HOLDS — RAMP
// ======================================================
exports.updateHolds = async (req, res) => {
  try {
    const id = req.params.id;
    const { holds } = req.body;

    await run(
      `UPDATE lirs SET holds = ?, updated_at = ? WHERE id = ?`,
      [JSON.stringify(holds), new Date().toISOString(), id]
    );

    res.json({ ok: true });

  } catch (err) {
    console.error("updateHolds:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};


// ======================================================
// 8) RAMP → OPS ONAYI (İMZA)
// ======================================================
exports.rampApprove = async (req, res) => {
  try {
    const id = req.params.id;
    const { signature } = req.body;

    await run(
      `UPDATE lirs SET ramp_signature=?, status='WAITING_OPS_APPROVAL', updated_at=? WHERE id=?`,
      [signature, new Date().toISOString(), id]
    );

    res.json({ ok: true });

  } catch (err) {
    console.error("rampApprove:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};


// ======================================================
// 9) OPS → FINALIZE + OPS İMZASI
// ======================================================
exports.opsFinalize = (req, res) => {
  const lirId = req.params.id;
  const { signature } = req.body;
  const userId = req.user.id;

  if (!signature) {
    return res.status(400).json({ error: "İmza bulunamadı" });
  }

  // Önce LIR var mı bak
  db.get("SELECT * FROM lirs WHERE id = ?", [lirId], (err, lir) => {
    if (err) {
      console.log("OPS finalize hata:", err);
      return res.status(500).json({ error: "DB error" });
    }

    if (!lir) {
      return res.status(404).json({ error: "LIR bulunamadı" });
    }

    // Güncelleme SQL
    const sql = `
      UPDATE lirs
      SET 
        ops_signature = ?,
        ops_signed_at = DATETIME('now'),
        status = 'FINAL'
      WHERE id = ?
    `;

    db.run(sql, [signature, lirId], function (err2) {
      if (err2) {
        console.log("OPS imza kayıt hatası:", err2);
        return res.status(500).json({ error: "İmza kaydedilemedi" });
      }

      return res.json({ ok: true });
    });
  });
};



// ======================================================
// 10) LIR LISTELEME
// ======================================================
exports.listLirs = async (req, res) => {
  try {
    const user = req.user;
    const scope = req.query.scope;

    let sql = "SELECT * FROM lirs WHERE 1=1";
    let params = [];

    // ============================================================
    // HAREKAT
    // ============================================================
    if (user.role === "HAREKAT") {
      sql += " AND created_by_user_id = ?";
      params.push(user.id);

      // Taslak LIR'lar
      if (scope === "ops-draft") {
        sql += " AND status = 'DRAFT'";
      }

      // Ramp'ten gelen / ops onayını bekleyen
      if (scope === "waiting-ops") {
        sql += " AND status = 'WAITING_OPS_APPROVAL'";
      }
    }

    // ============================================================
    // RAMP
    // ============================================================
    if (user.role === "RAMP") {
      sql += " AND assigned_ramp_user_id = ?";
      params.push(user.id);

      if (scope === "ramp-assigned") {
        // Rampa kullanıcılarının görebileceği bütün statüler
        sql += " AND status IN ('WAITING_RAMP', 'WAITING_OPS_APPROVAL', 'REJECTED')";
      }
    }

    sql += " ORDER BY created_at DESC";

    const rows = await all(sql, params);
    res.json(rows);

  } catch (err) {
    console.error("listLirs:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};




// ======================================================
// 11) PDF ÜRET — 3 İMZALI PDF
// ======================================================
exports.generatePdf = async (req, res) => {
  const id = req.params.id;

  try {
    const lir = await getFullLir(id);
    if (!lir) return res.status(404).send("LIR bulunamadı");

    const harekatUser = await getUserById(lir.base?.created_by_user_id) || { full_name: "-", sicil_no: "-" };
    const rampUser = await getUserById(lir.base?.assigned_ramp_user_id) || { full_name: "-", sicil_no: "-" };
    const opsUser = lir.base?.ops_user_id ? await getUserById(lir.base.ops_user_id) : { full_name: "-", sicil_no: "-" };

    const fd = lir.base?.flight_date
      ? new Date(lir.base.flight_date).toLocaleDateString("tr-TR")
      : "-";

    const maxHolds = lir.max_holds || {};
    const offload = lir.offload || {};
    const plan = lir.plan || {};
    const planHolds = plan.holds || {};
    const report = lir.report || {};
    const weight = lir.weight || {};
    const signatures = lir.signatures || {};

    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
      bufferPages: true,
    });

    doc.registerFont(
      "OpenSans",
      path.join(__dirname, "../public/fonts/OpenSans-Regular.ttf")
    );
    doc.font("OpenSans");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=LIR_${id}.pdf`
    );

    doc.pipe(res);

    // ===============================================================
    // HEADER — Kurumsal Lacivert Bar
    // ===============================================================
    const headerHeight = 70;

    doc.rect(0, 0, doc.page.width, headerHeight).fill("#0F172A");

    // LOGO (opsiyonel)
    // doc.image(path.join(__dirname, "../public/logo.png"), 40, 15, { width: 80 });

    doc
      .fillColor("#FFFFFF")
      .fontSize(24)
      .text("LOAD INSTRUCTION REPORT", 130, 22, { align: "left" });

    doc.moveDown(2);
    doc.fillColor("black");

  // ===============================================================
  // FLIGHT INFO — KURUMSAL PROFESYONEL TASARIM
  // ===============================================================

  const infoTop = headerHeight + 20;
  const boxX = 22;
  const boxW = doc.page.width - 45;
  const boxH = 90;

  // Ana kutu
  doc
    .lineWidth(1)
    .rect(boxX, infoTop, boxW, boxH)
    .stroke("#D1D5DB");

  // Başlık şeridi
  doc
    .rect(boxX, infoTop, boxW, 22)
    .fillAndStroke("#F3F4F6", "#D1D5DB");

  // Başlık yazısı
  doc
    .fillColor("#111827")
    .fontSize(15)
    .font("Helvetica-Bold")
    .text("FLIGHT INFORMATION", boxX + 10, infoTop + 6);

  // İç metin başlangıcı
  const tY = infoTop + 30;

doc
  .fillColor("#1F2937")
  .font("Helvetica")
  .fontSize(11);

// -------------------------
// SOL BLOK
// -------------------------
doc
  .font("Helvetica-Bold")
  .text(`Flight No: `, boxX + 10, tY, { continued: true })
  .font("Helvetica")
  .text(lir.base?.flight_no || "-");

doc
  .font("Helvetica-Bold")
  .text(`Route: `, boxX + 10, tY + 20, { continued: true })
  .font("Helvetica")
  .text(`${lir.base?.from_airport || "-"} → ${lir.base?.to_airport || "-"}`);


// -------------------------
// ORTA BLOK
// -------------------------
doc
  .font("Helvetica-Bold")
  .text(`Aircraft Reg: `, boxX + 180, tY, { continued: true })
  .font("Helvetica")
  .text(lir.base?.aircraft_reg || "-");

doc
  .font("Helvetica-Bold")
  .text(`Aircraft Type: `, boxX + 180, tY + 20, { continued: true })
  .font("Helvetica")
  .text(lir.base?.aircraft_type || "-");


// -------------------------
// SAĞ BLOK
// -------------------------
doc
  .font("Helvetica-Bold")
  .text(`Date: `, boxX + 350, tY, { continued: true })
  .font("Helvetica")
  .text(fd);

doc
  .font("Helvetica-Bold")
  .text(`LIR ID: `, boxX + 350, tY + 20, { continued: true })
  .font("Helvetica")
  .text(`#${lir.base?.id || "-"}`);


  doc.moveDown(5);

    // ===============================================================
    // GRID TABLE — OFFLOAD / PLAN / REPORT / WEIGHT
    // ===============================================================

    const pageInnerWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;

    const colWidth = 130;
    const gap = 10;

    const totalWidth = colWidth * 4 + gap * 3;
    const startX = doc.page.margins.left + (pageInnerWidth - totalWidth) / 2;

    let y = infoTop + 100;

    // Kolon başlıkları
    const headers = ["OFFLOAD", "PLAN", "REPORT", "WEIGHT"];

    // Premium başlık arka plan rengi
    const headerBg = "#1F2937"; // daha koyu, daha kurumsal

    headers.forEach((h, i) => {
      const x = startX + (colWidth + gap) * i;

      // Başlık kutusu
      doc.rect(x, y, colWidth, 32).fill("#1F2937");

      // Başlık yazısı — tam yatay ve tam dikey ortalama
      doc
        .fillColor("#FFFFFF")
        .fontSize(15)
        .text(h, x, y + ((22 - 12) / 2), {   // 22px box height, 12px font height → center
          width: colWidth,
          align: "center",
        });

      doc.fillColor("black");
    });


    y += 28;


    // =========================
// AUTO-HEIGHT ROW GENERATION
// =========================

function getRowHeight(text, width) {
  const textWidth = doc.widthOfString(text);
  const maxWidth = width;
  const lines = Math.ceil(textWidth / maxWidth);
  return lines * 14; // 14 px per wrapped line
}

const rows = []; // each row: [col1, col2, col3, col4]

// -------- BUILD ROWS FOR EACH HOLD --------
Object.keys(maxHolds).forEach((h) => {
  // OFFLOAD
  const offVal = offload?.holds?.[h] || "NIL";

  // PLAN
  const planVal = planHolds[h] ?? "NIL";

  // REPORT
  let repVal = "NIL";
  const arr = report?.holds?.[h];
  if (Array.isArray(arr) && arr.length > 0) {
    repVal = arr
      .map((a) => `CAR${a.car} - ${a.pcs} PCS (${a.type})`)
      .join(", ");
  }

  // WEIGHT
  const w = Number(weight[h]) > 0 ? `${weight[h]} KG (MAX ${maxHolds[h]})` : `NIL (MAX ${maxHolds[h]})`;

  rows.push([
    `H${h}: ${offVal}`,
    `H${h}: ${planVal}`,
    `H${h}: ${repVal}`,
    `H${h}: ${w}`,
  ]);
});

// -------- ADD EXTRA ROWS --------
rows.push([
  `Extra: ${offload.extra || "-"}`,
  `Extra: ${plan.extra || "-"}`,
  "",
  "",
]);

// =========================
// RENDER ROWS
// =========================
rows.forEach((r, rowIndexGlobal) => {
  const heights = [
    getRowHeight(r[0], colWidth - 8),
    getRowHeight(r[1], colWidth - 8),
    getRowHeight(r[2], colWidth - 8),
    getRowHeight(r[3], colWidth - 8),
  ];

  const rowHeight = Math.max(...heights) + 6; // spacing

  // Zebra background
  const isEven = rowIndexGlobal % 2 === 0;
  const bgColor = isEven ? "#FFFFFF" : "#F3F4F6"; // hafif gri

  // Draw background for entire row
  headers.forEach((_, i) => {
    const x = startX + (colWidth + gap) * i;
    doc
      .rect(x, y, colWidth, rowHeight)
      .fill(bgColor);
  });

  // Draw borders
  headers.forEach((_, i) => {
    const x = startX + (colWidth + gap) * i;
    doc
      .rect(x, y, colWidth, rowHeight)
      .strokeColor("#D1D5DB")
      .stroke();
  });

  // Write texts
  headers.forEach((_, i) => {
    const x = startX + (colWidth + gap) * i;
    doc
      .fillColor("#1F2937") // koyu gri text
      .fontSize(10)
      .text(r[i], x + 4, y + 4, {
        width: colWidth - 8,
      });
  });

  y += rowHeight;
});


    doc.moveDown(8);

    // ===============================================================
    // SIGNATURE SECTION — Kurumsal Form Stili
    // ===============================================================

    doc.moveDown(1);

    const sigWidth = 160;
    const sigHeight = 140;
    const sigGap = 40;

    const totalSigWidth = sigWidth * 3 + sigGap * 2; // 3 kutu + 2 boşluk
    const sigStartX = (doc.page.width - totalSigWidth) / 2; // ✔ ORTALAMA

    let sigY = y + 180;

    function signatureBox(title, imgBase64, user, x, y) {
      doc.rect(x, y, sigWidth, sigHeight).stroke("#9CA3AF");

      doc.rect(x, y, sigWidth, 25)
        .fill("#E5E7EB");

      doc.fillColor("#1F2937").fontSize(12).text(title, x + 10, y + 7);

      doc.fillColor("#000");

      if (imgBase64) {
        try {
          const img = Buffer.from(imgBase64.split(",")[1], "base64");
          doc.image(img, x + 10, y + 35, { width: 120 });
        } catch {
          doc.text("(Signature unreadable)", x + 10, y + 40);
        }
      } else {
        doc.text("(No signature)", x + 10, y + 40);
      }

      doc.fontSize(10)
        .text(`Name: ${user.full_name}`, x + 10, y + 105)
        .text(`ID: ${user.sicil_no}`, x + 10, y + 120);
    }

    signatureBox("Prepared by", signatures?.harekat, harekatUser, sigStartX, sigY);
    signatureBox("Performed by", signatures?.ramp, rampUser, sigStartX + sigWidth + sigGap, sigY);
    signatureBox("Approved by", signatures?.ops, harekatUser, sigStartX + (sigWidth + sigGap) * 2, sigY);

    // ===============================================================
    // FOOTER
    // ===============================================================

    const timestamp = new Date().toLocaleString("tr-TR");

    doc.fontSize(9)
      .fillColor("#6B7280")
      .text(
        `Generated by LIR System | Çelebi Ground Handling | ${timestamp}`,
        40,
        doc.page.height - 60,
        { align: "center", width: doc.page.width - 80 }
      );

    doc.end();

  } catch (err) {
    console.error("generatePdf error:", err);
    if (!res.headersSent) res.status(500).send("PDF oluşturulamadı");
  }
};





// ======================================================
// FULL LIR GETTER
// ======================================================
async function getFullLir(id) {
  const base = await get(`SELECT * FROM lirs WHERE id=?`, [id]);
  if (!base) return null;

  const offload = await get(`SELECT content FROM lir_offload WHERE lir_id=?`, [id]);
  const plan = await get(`SELECT content FROM lir_plan WHERE lir_id=?`, [id]);
  const report = await get(`SELECT content FROM lir_report WHERE lir_id=?`, [id]);
  const weight = await get(`SELECT weights FROM lir_weight WHERE lir_id=?`, [id]);

  return {
    base,
    holds: safeParse(base.holds),
    max_holds: safeParse(base.max_holds),
    offload: safeParse(offload?.content),
    plan: safeParse(plan?.content),
    report: safeParse(report?.content),
    weight: safeParse(weight?.weights),
    signatures: {
      harekat: base.harekat_signature || null,
      ramp: base.ramp_signature || null,
      ops: base.ops_signature || null
    }
  };
}

// ======================================================
// 12) LIR → RAMP'A GÖNDER (HAREKAT)
// ======================================================
exports.sendToRamp = async (req, res) => {
  try {
    const id = req.params.id;
    const { assignedRampUserId } = req.body;

    if (!assignedRampUserId)
      return res.status(400).json({ error: "Ramp kullanıcısı gerekli" });

    await run(
      `UPDATE lirs
       SET assigned_ramp_user_id=?, status='WAITING_RAMP', updated_at=?
       WHERE id=?`,
      [assignedRampUserId, new Date().toISOString(), id]
    );

    res.json({ ok: true });

  } catch (err) {
    console.error("sendToRamp:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};



// ======================================================
// 13) OPS → REDDET
// ======================================================
exports.opsReject = async (req, res) => {
  try {
    const id = req.params.id;
    const { note } = req.body;

    const now = new Date().toISOString();

    await run(
      `UPDATE lirs 
       SET status='WAITING_RAMP',
           ops_reject_reason=?,
           reject_note=?,
           reject_at=?,
           updated_at=?
       WHERE id=?`,
      [note || null, note || null, now, now, id]
    );

    res.json({ ok: true });

  } catch (err) {
    console.error("opsReject:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};



// ======================================================
// 14) RAMP KULLANICISI DEĞİŞTİR (HAREKAT / OPS)
// ======================================================
exports.reassignRamp = async (req, res) => {
  try {
    const id = req.params.id;
    const { rampUserId } = req.body;

    await run(
      `UPDATE lirs SET assigned_ramp_user_id=?, updated_at=? WHERE id=?`,
      [rampUserId, new Date().toISOString(), id]
    );

    res.json({ ok: true });

  } catch (err) {
    console.error("reassignRamp:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};



// ======================================================
// 15) LIR SİL (HAREKAT)
// ======================================================
exports.deleteLir = async (req, res) => {
  try {
    const id = req.params.id;

    await run(`DELETE FROM lir_offload WHERE lir_id=?`, [id]);
    await run(`DELETE FROM lir_plan WHERE lir_id=?`, [id]);
    await run(`DELETE FROM lir_report WHERE lir_id=?`, [id]);
    await run(`DELETE FROM lir_weight WHERE lir_id=?`, [id]);
    await run(`DELETE FROM lir_logs WHERE lir_id=?`, [id]);

    await run(`DELETE FROM lirs WHERE id=?`, [id]);

    res.json({ ok: true });

  } catch (err) {
    console.error("deleteLir:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};



// ======================================================
// 16) KUYRUK REGISTRY LİSTESİ
// ======================================================
exports.getRegistryList = async (req, res) => {
  try {
    const list = Object.keys(registry).map((reg) => ({
      reg,
      type: registry[reg].type
    }));

    res.json(list);

  } catch (err) {
    console.error("getRegistryList:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};



// ======================================================
// 17) TEK BİR REGISTRY DETAYI
// ======================================================
exports.getRegistry = async (req, res) => {
  try {
    const reg = req.params.reg.toUpperCase();

    if (!registry[reg])
      return res.status(404).json({ error: "Kuyruk bulunamadı" });

    res.json(registry[reg]);

  } catch (err) {
    console.error("getRegistry:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};



// ======================================================
// 18) RAMP USER LİSTESİ
// ======================================================
exports.getRampUsers = async (req, res) => {
  try {
    const rows = await all(
      `SELECT id, full_name, sicil_no FROM users WHERE role='RAMP' ORDER BY full_name ASC`
    );

    res.json(rows);

  } catch (err) {
    console.error("getRampUsers:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};



// ======================================================
// 19) HAREKAT → RAMPTAN GERİ ÇEK (UNSEND)
// ======================================================
exports.unsendRamp = async (req, res) => {
  try {
    const id = req.params.id;

    await run(
      `UPDATE lirs
       SET status='DRAFT',
           assigned_ramp_user_id=NULL,
           updated_at=?
       WHERE id=?`,
      [new Date().toISOString(), id]
    );

    res.json({ ok: true });

  } catch (err) {
    console.error("unsendRamp:", err);
    res.status(500).json({ ok: false, error: "Sunucu hatası" });
  }
};

// ---------------------------------------------------------
// HAREKAT İMZA — RAMP'E GÖNDERMEDEN ÖNCE ALINAN İLK İMZA
// ---------------------------------------------------------


exports.harekatSign = async (req, res) => {
  const id = req.params.id;
  const { signature } = req.body;

  try {
    await run(
      `UPDATE lirs 
       SET harekat_signature = ?, 
           harekat_signed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [signature, id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("HAREKAT SIGN ERROR:", err);
    res.status(500).json({ ok: false });
  }
};



exports.opsApprove = async (req, res) => {
  const id = req.params.id;
  const { signature } = req.body;

  try {
    // LIR GETİR
    const lir = await get(`SELECT status FROM lirs WHERE id = ?`, [id]);

    // ❗ SADECE WAITING_OPS_APPROVAL durumunda imza atılabilir
    if (lir.status !== "WAITING_OPS_APPROVAL") {
      return res.status(400).json({ ok: false, msg: "OPS imzası için uygun durum değil" });
    }

    // OPS İMZASI KAYDET VE FİNAL YAP
    await run(
      `UPDATE lirs 
       SET ops_signature = ?, 
           ops_signed_at = CURRENT_TIMESTAMP,
           status = 'FINALIZED'
       WHERE id = ?`,
      [signature, id]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error("OPS APPROVE ERROR:", err);
    return res.status(500).json({ ok: false });
  }
};
