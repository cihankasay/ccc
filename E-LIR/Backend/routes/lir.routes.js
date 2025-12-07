const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const requireRole = require("../middlewares/role.middleware");
const lir = require("../controllers/lir.controller");


// ---------------------------------------------------------
// PDF — PUBLIC
// ---------------------------------------------------------
router.get("/lirs/:id/pdf", lir.generatePdf);


// ---------------------------------------------------------
// BUNDAN SONRAKİ TÜM ROTALAR TOKEN GEREKTİRİR
// ---------------------------------------------------------
router.use(authMiddleware);


// ---------------------------------------------------------
// LIR OLUŞTUR (HAREKAT)
// ---------------------------------------------------------
router.post("/lirs", requireRole("HAREKAT"), lir.createLir);


// ---------------------------------------------------------
// LIR DETAY
// ---------------------------------------------------------
router.get("/lirs/:id", lir.getLirDetail);


// ---------------------------------------------------------
// LIR LİSTELEME
// ---------------------------------------------------------
router.get("/lirs", lir.listLirs);


// ---------------------------------------------------------
// OFFLOAD / PLAN / REPORT / WEIGHT
// ---------------------------------------------------------
router.patch("/lirs/:id/offload", requireRole("HAREKAT"), lir.updateOffload);
router.patch("/lirs/:id/plan", requireRole("HAREKAT"), lir.updatePlan);
router.patch("/lirs/:id/report", requireRole("RAMP"), lir.updateReport);
router.patch("/lirs/:id/weight", requireRole("HAREKAT"), lir.updateWeight);


// ---------------------------------------------------------
// HOLD GÜNCELLE (RAMP)
// ---------------------------------------------------------
router.patch("/lirs/:id/holds", requireRole("RAMP"), lir.updateHolds);


// ---------------------------------------------------------
// RAMP APPROVE (İMZA)
// ---------------------------------------------------------
router.post("/lirs/:id/ramp-approve", requireRole("RAMP"), lir.rampApprove);


// ---------------------------------------------------------
// OPS → APPROVE (İMZA)  
// NOT: Senin sistemde OPS rolü yok → HAREKAT yapıyor
// ---------------------------------------------------------
router.post("/lirs/:id/ops-approve", requireRole("HAREKAT"), lir.opsApprove);


// ---------------------------------------------------------
// HAREKAT → RAMP’A GÖNDER
// ---------------------------------------------------------
router.post("/lirs/:id/harekat-sign", requireRole("HAREKAT"), lir.harekatSign);
router.post("/lirs/:id/send-to-ramp", requireRole("HAREKAT"), lir.sendToRamp);


// ---------------------------------------------------------
// OPS REJECT → HAREKAT YAPACAK
// ---------------------------------------------------------
router.post("/lirs/:id/ops-reject", requireRole("HAREKAT"), lir.opsReject);


// ---------------------------------------------------------
// HAREKAT → LIR SİLER
// ---------------------------------------------------------
router.delete("/lirs/:id", requireRole("HAREKAT"), lir.deleteLir);


// ---------------------------------------------------------
// HAREKAT → RAMPTAN GERİ ÇEK
// ---------------------------------------------------------
router.post("/lirs/:id/unsend-ramp", requireRole("HAREKAT"), lir.unsendRamp);


// ---------------------------------------------------------
// RAMP USER LISTESI
// ---------------------------------------------------------
router.get("/users/ramp", lir.getRampUsers);


// ---------------------------------------------------------
// REGISTRY
// ---------------------------------------------------------
router.get("/aircraft-registry", lir.getRegistryList);
router.get("/aircraft-registry/:reg", lir.getRegistry);


module.exports = router;
