import axios from "axios";

const API_BASE = "http://192.168.1.103:3001";

/* ============================================================
   === OFFLOAD BÖLÜMÜ =========================================
   ============================================================ */
export function OffloadSection({ role, offload, setOffload, save }) {
  return (
    <div style={sectionBox}>
      <h3>OFFLOAD</h3>

      {role === "HAREKAT" ? (
        <>
          <textarea
            rows={8}
            value={offload}
            onChange={(e) => setOffload(e.target.value)}
            style={inputArea}
          />
          <button style={blueBtn} onClick={save}>
            Kaydet
          </button>
        </>
      ) : (
        <p>{offload || "—"}</p>
      )}
    </div>
  );
}

/* ============================================================
   === PLAN BÖLÜMÜ ============================================
   ============================================================ */
export function PlanSection({ role, plan, edition, setPlan, save }) {
  return (
    <div style={sectionBox}>
      <h3>PLAN (Edition {edition})</h3>

      {role === "HAREKAT" ? (
        <>
          <textarea
            rows={8}
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            style={inputArea}
          />
          <button style={greenBtn} onClick={save}>
            Kaydet (Edition +1)
          </button>
        </>
      ) : (
        <p>{plan || "—"}</p>
      )}
    </div>
  );
}

/* ============================================================
   === REPORT BÖLÜMÜ ==========================================
   ============================================================ */
export function ReportSection({
  role,
  report,
  setReport,
  holds,
  bagajCar,
  bagajPieces,
  bagajHold,
  setBagajCar,
  setBagajPieces,
  setBagajHold,
  id,
  token,
  reload,
  save,
}) {
  return (
    <div style={sectionBox}>
      <h3>REPORT</h3>

      {/* ---- RAMP BAGAJ GİRİŞİ ---- */}
      {role === "RAMP" && (
        <div style={bagajBox}>
          <h4>🧳 Bagaj Arabası Girişi</h4>

          <input
            placeholder="Araba No"
            value={bagajCar}
            onChange={(e) => setBagajCar(e.target.value)}
            style={textInput}
          />

          <input
            type="number"
            placeholder="Parça"
            value={bagajPieces}
            onChange={(e) => setBagajPieces(Number(e.target.value))}
            style={textInput}
          />

          <select
            value={bagajHold}
            onChange={(e) => setBagajHold(e.target.value)}
            style={textInput}
          >
            <option value="">HOLD seç</option>
            {Object.keys(holds).map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>

          <button
            style={blueBtn}
            onClick={async () => {
              await axios.post(
                `${API_BASE}/api/lirs/${id}/bagaj-entry`,
                {
                  car: bagajCar,
                  pieces: bagajPieces,
                  hold: bagajHold,
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              setBagajCar("");
              setBagajPieces("");
              setBagajHold("");
              reload();
            }}
          >
            ➕ Ekle
          </button>
        </div>
      )}

      {/* ---- RAPOR YAZIM BÖLÜMÜ ---- */}
      {role === "RAMP" ? (
        <>
          <textarea
            rows={8}
            value={report}
            onChange={(e) => setReport(e.target.value)}
            style={inputArea}
          />
          <button style={blueBtn} onClick={save}>
            Kaydet
          </button>
        </>
      ) : (
        <p>{report || "—"}</p>
      )}
    </div>
  );
}

/* ============================================================
   === HOLD PANELİ ============================================
   ============================================================ */
export function HoldSection({ role, holds, rampPieces, setRampPieces }) {
  return (
    <div style={sectionBox}>
      <h3>HOLD Parçaları</h3>

      {Object.keys(holds).map((h) => (
        <div key={h} style={holdBox}>
          <strong>{h}. HOLD</strong> — Max {holds[h]} kg
          {role === "RAMP" && (
            <>
              <input
                type="number"
                value={rampPieces[h] || ""}
                placeholder="PCS"
                onChange={(e) =>
                  setRampPieces({
                    ...rampPieces,
                    [h]: Number(e.target.value),
                  })
                }
                style={holdInput}
              />

              {rampPieces[h] > holds[h] && (
                <span style={{ color: "red", marginLeft: 6 }}>
                  Limit Aşıldı!
                </span>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   === WEIGHT PANELİ ==========================================
   ============================================================ */
export function WeightSection({ role, weight, setWeight, save }) {
  return (
    <div style={sectionBox}>
      <h3>WEIGHT</h3>

      {role === "HAREKAT" ? (
        <>
          <textarea
            rows={8}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            style={inputArea}
          />
          <button style={greenBtn} onClick={save}>
            Kaydet
          </button>
        </>
      ) : (
        <p>{weight || "—"}</p>
      )}
    </div>
  );
}

/* ============================================================
   === STYLES ==================================================
   ============================================================ */

const sectionBox = {
  marginTop: 20,
  padding: 14,
  background: "#fff",
  borderRadius: 12,
  boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
};

const inputArea = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
  marginBottom: 12,
};

const textInput = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
  marginBottom: 8,
};

const bagajBox = {
  padding: 12,
  borderRadius: 8,
  background: "#f1f5f9",
  marginBottom: 16,
};

const holdBox = {
  padding: 12,
  background: "#f8fafc",
  borderRadius: 10,
  border: "11px solid #e5e7eb",
  marginBottom: 12,
};

const holdInput = {
  width: 80,
  padding: 6,
  marginLeft: 10,
  borderRadius: 6,
  border: "1px solid #aaa",
};

const blueBtn = {
  width: "100%",
  padding: 12,
  background: "#0ea5e9",
  color: "#fff",
  borderRadius: 10,
  border: "none",
  marginTop: 8,
};

const greenBtn = {
  width: "100%",
  padding: 12,
  background: "#22c55e",
  color: "#fff",
  borderRadius: 10,
  border: "none",
  marginTop: 8,
};
