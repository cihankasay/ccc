import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import SignaturePopup from "../components/SignaturePopup";
import HoldLayout from "../components/HoldLayout";

const API_BASE = "http://192.168.1.103:3001";

export default function LirDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.role;

  const [lir, setLir] = useState(null);

  // Signatures
  const [showSignature, setShowSignature] = useState(false);
  const [signType, setSignType] = useState(null);

  // Holds
  const [holds, setHolds] = useState({});

  // -------------------------------
  // LIR LOAD
  // -------------------------------
  useEffect(() => {
    loadLir();
  }, []);

  const loadLir = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/lirs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLir(res.data);

      const base = res.data.base;

      let parsed = {};
      try {
        if (typeof base.holds === "string") {
          parsed = JSON.parse(base.holds);
        } else if (typeof base.holds === "object" && base.holds !== null) {
          parsed = base.holds;
        }
      } catch {
        parsed = {};
      }

      setHolds(parsed);
    } catch (err) {
      console.error("LIR yükleme hatası:", err);
      alert("LIR yüklenemedi");
    }
  };

  // -------------------------------
  // Signature Actions
  // -------------------------------
  const handleRampApprove = () => {
    setSignType("ramp");
    setShowSignature(true);
  };

  const handleOpsFinalize = () => {
    setSignType("ops");
    setShowSignature(true);
  };

  const submitSignature = async (img) => {
    try {
      if (signType === "ramp") {
        await axios.post(
          `${API_BASE}/api/lirs/${id}/ramp-approve`,
          { signature: img },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (signType === "ops") {
        await axios.post(
          `${API_BASE}/api/lirs/${id}/ops-approve`,
          { signature: img },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      alert("İmza kaydedildi");
      setShowSignature(false);
      loadLir();
    } catch (err) {
      console.error(err);
      alert("İmza kaydedilemedi");
    }
  };

  // -------------------------------------
  // MAIN UI
  // -------------------------------------
  if (!lir)
    return (
      <p style={{ padding: 20, textAlign: "center", fontSize: 18 }}>
        LIR yükleniyor…
      </p>
    );

  return (
    <div style={{ padding: 14, maxWidth: 900, margin: "0 auto" }}>
      
      {/* BACK BUTTON — iPhone Premium */}
      <button
        onClick={() => navigate(role === "HAREKAT" ? "/harekat" : "/ramp")}
        style={{
          padding: "10px 16px",
          background: "#eef1f4",
          border: "1px solid #d1d5db",
          borderRadius: 12,
          marginBottom: 14,
          fontSize: 16,
          fontWeight: 500,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        ← Geri
      </button>

      {/* INFO */}
      <h2 style={{ marginTop: 0, color: "#003b77" }}>LIR #{lir.base.id}</h2>

      <div
        style={{
          background: "#ffffff",
          padding: 16,
          borderRadius: 16,
          boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
          marginBottom: 20,
        }}
      >
        <p style={{ margin: 0, fontSize: 17 }}>
          ✈ <strong>{lir.base.flightNo}</strong> — {lir.base.fromAirport} →{" "}
          {lir.base.toAirport}
        </p>
        <p style={{ marginTop: 6, color: "#6b7280", fontSize: 15 }}>
          Durum: <strong>{lir.base.status}</strong>
        </p>
      </div>

      {/* 4 ANA BÖLÜM BUTONU */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          marginTop: 20,
          marginBottom: 20,
        }}
      >
        <button style={bigBtn} onClick={() => navigate(`/lir/${id}/offload`)}>
          🛄 OFFLOAD
        </button>

        <button style={bigBtn} onClick={() => navigate(`/lir/${id}/plan`)}>
          📋 PLAN
        </button>

        <button style={bigBtn} onClick={() => navigate(`/lir/${id}/report`)}>
          📝 REPORT
        </button>

        {role === "HAREKAT" && (
          <button style={bigBtn} onClick={() => navigate(`/lir/${id}/weight`)}>
            ⚖️ WEIGHT
          </button>
        )}
      </div>

      {/* HOLD LAYOUT */}
      {holds && Object.keys(holds).length > 0 ? (
        <div
          style={{
            marginTop: 20,
            marginBottom: 20,
            background: "#ffffff",
            padding: 14,
            borderRadius: 16,
            boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
          }}
        >
          <HoldLayout aircraftType={lir.base.aircraftType} holds={holds} />
        </div>
      ) : (
        <div
          style={{
            marginTop: 20,
            marginBottom: 20,
            padding: 20,
            background: "#f3f4f6",
            borderRadius: 12,
            textAlign: "center",
            color: "#6b7280",
            fontSize: 16,
          }}
        >
          Bu uçak için ambar bilgisi bulunamadı.
        </div>
      )}

      {/* RAMP → YÜKLEME TAMAMLAMA */}
      {role === "RAMP" && lir.base.status === "WAITING_RAMP" && (
        <button style={blueAction} onClick={handleRampApprove}>
          ✔ YÜKLEME TAMAMLANDI (İMZA)
        </button>
      )}

      {/* OPS → FINALIZE / REDDET */}
      {role === "HAREKAT" &&
        lir.base.status === "WAITING_OPS_APPROVAL" && (
          <div
            style={{
              marginTop: 20,
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            {/* REDDET */}
            <button
              onClick={() => {
                if (window.confirm("LIR reddedilsin mi?")) {
                  axios
                    .post(
                      `${API_BASE}/api/lirs/${id}/ops-reject`,
                      {},
                      { headers: { Authorization: `Bearer ${token}` } }
                    )
                    .then(() => {
                      alert("LIR reddedildi");
                      navigate("/harekat");
                    })
                    .catch(() => alert("Reddetme işlemi başarısız"));
                }
              }}
              style={{
                flex: 1,
                padding: 16,
                background: "#dc2626",
                color: "white",
                fontSize: 17,
                fontWeight: 700,
                borderRadius: 14,
                border: "none",
                boxShadow: "0 3px 6px rgba(220,38,38,0.3)",
              }}
            >
              ✖ Reddet
            </button>

            {/* FINALIZE */}
            <button
              onClick={handleOpsFinalize}
              style={{
                flex: 1,
                padding: 16,
                background: "#16a34a",
                color: "white",
                fontSize: 17,
                fontWeight: 700,
                borderRadius: 14,
                border: "none",
                boxShadow: "0 3px 6px rgba(22,163,74,0.3)",
              }}
            >
              ✔ Finalize Et
            </button>
          </div>
        )}

      {/* FINAL LIR → PDF */}
      {lir.base.status === "FINALIZED" && (
        <button
          onClick={() =>
            window.open(`${API_BASE}/api/lirs/${id}/pdf`, "_blank")
          }
          style={{
            marginTop: 22,
            width: "100%",
            padding: 16,
            borderRadius: 16,
            background: "#111827",
            color: "white",
            fontSize: 18,
            fontWeight: 600,
            border: "none",
            boxShadow: "0 4px 10px rgba(0,0,0,0.45)",
          }}
        >
          📄 PDF GÖRÜNTÜLE
        </button>
      )}

      {/* SIGNATURE POPUP */}
      {showSignature && (
        <SignaturePopup
          onCancel={() => setShowSignature(false)}
          onSave={submitSignature}
        />
      )}
    </div>
  );
}

/* --------------------------------- */
/* --------- STYLES --------------- */
/* --------------------------------- */

const blueAction = {
  marginTop: 20,
  width: "100%",
  padding: 16,
  borderRadius: 16,
  background: "#0073cf",
  color: "#fff",
  fontSize: 18,
  fontWeight: 700,
  border: "none",
  boxShadow: "0 4px 10px rgba(0,115,207,0.35)",
};

const bigBtn = {
  width: "100%",
  padding: "34px 0",
  background: "#003b77",
  color: "#fff",
  fontSize: 18,
  fontWeight: 600,
  borderRadius: 16,
  border: "none",
  textAlign: "center",
  boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
  transition: "transform 0.15s ease",
};
