import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import HoldLayoutShared from "../components/HoldLayoutShared";

const API_BASE = "http://192.168.1.103:3001";

export default function ReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.role;

  const [lir, setLir] = useState(null);
  const [reportHolds, setReportHolds] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [selectedHold, setSelectedHold] = useState(null);

  const [car, setCar] = useState("");
  const [pcs, setPcs] = useState("");
  const [type, setType] = useState("");

  const [showTypeList, setShowTypeList] = useState(false);

  const TYPE_OPTIONS = ["BY", "BT", "EIC", "FKT", "CGO", "PETC", "AVIH"];

  const saveReportAuto = async (updatedHolds) => {
    try {
      await axios.patch(
        `${API_BASE}/api/lirs/${id}/report`,
        { report: { holds: updatedHolds } },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Otomatik kayıt hatası:", err);
      alert("Otomatik kaydedilemedi!");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/lirs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data;
      setLir(data);

      const schema = JSON.parse(data.base.holds || "{}");
      const existing = data.report?.holds || {};

      let uiHolds = [];
      if (data.base.aircraftType === "A320") {
        uiHolds = ["1", "3", "4", "5"];
      } else if (data.base.aircraftType === "A321") {
        uiHolds = ["1", "2", "3", "4", "5"];
      } else if (
        data.base.aircraftType === "B738" ||
        data.base.aircraftType === "B737-800"
      ) {
        uiHolds = ["1", "2", "3", "4"];
      }

      const merged = {};

      for (const hold of Object.keys(schema)) {
        merged[hold] = existing[hold] || [];
      }

      for (const hold of uiHolds) {
        if (!merged[hold]) merged[hold] = existing[hold] || [];
      }

      setReportHolds(merged);
    } catch (err) {
      console.error(err);
      alert("LIR yüklenemedi");
    }
  };

  const addHoldRecord = () => {
    if (!car || !pcs || !type) {
      alert("Tüm alanlar zorunludur");
      return;
    }

    const newItem = {
      car,
      pcs: Number(pcs),
      type: type.toUpperCase(),
    };

    setReportHolds((prev) => {
      const updated = {
        ...prev,
        [selectedHold]: [...(prev[selectedHold] || []), newItem],
      };

      saveReportAuto(updated);
      return updated;
    });

    setCar("");
    setPcs("");
    setType("");
    setShowPopup(false);
    setShowTypeList(false);
  };

  const deleteRecord = (holdNo, index) => {
    if (!window.confirm("Bu kaydı silmek istediğine emin misin?")) return;

    setReportHolds((prev) => {
      const updated = { ...prev };
      updated[holdNo] = updated[holdNo].filter((_, i) => i !== index);

      saveReportAuto(updated);
      return updated;
    });
  };

  if (!lir) return <p style={{ padding: 20 }}>Yükleniyor...</p>;

  return (
    <div style={{ padding: 14, maxWidth: 620, margin: "0 auto" }}>

      {/* GERİ */}
      <div
        onClick={() => navigate(-1)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 18,
          cursor: "pointer",
          background: "#f1f5f9",
          padding: "8px 16px",
          borderRadius: 12,
          fontWeight: 600,
          fontSize: 15,
          color: "#1e293b",
          border: "1px solid #e2e8f0",
        }}
      >
        ← Geri
      </div>

      {/* ŞEMA */}
      <div style={{ marginBottom: 20 }}>
        <HoldLayoutShared
          aircraftType={lir.base.aircraftType || lir.base.aircraft_type}
          maxHolds={lir.max_holds}
          mode="report"
          holds={reportHolds}
          onHoldClick={(holdNo) => {
            if (role !== "RAMP") return;

            const clean = String(holdNo).replace("HOLD", "").trim();
            setSelectedHold(clean);
            setShowPopup(true);
          }}
        />
      </div>

      {/* RAPOR LISTESI */}
      <h3 style={{ marginBottom: 10, fontSize: 20 }}>📦 Hold Bazlı Raporlar</h3>

      {Object.entries(reportHolds).map(([hold, arr]) => (
        <div
          key={hold}
          style={{
            background: "#f8fafc",
            padding: 12,
            borderRadius: 12,
            marginBottom: 12,
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          }}
        >
          <strong style={{ fontSize: 16 }}>HOLD {hold}</strong>

          {arr.length === 0 && (
            <p style={{ color: "#64748b", marginTop: 6 }}>Kayıt yok.</p>
          )}

          {arr.map((it, i) => (
            <div
              key={i}
              style={{
                marginTop: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#fff",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
              }}
            >
              <span style={{ fontSize: 15 }}>
                🚗 {it.car} — 📦 {it.pcs} pcs — 🏷 {it.type}
              </span>

              {role === "RAMP" && (
                <button
                  onClick={() => deleteRecord(hold, i)}
                  style={{
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    padding: "4px 10px",
                    borderRadius: 8,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Sil
                </button>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* POPUP */}
      {showPopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => setShowTypeList(false)} // dışarı tıklayınca kapanır
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 14,
              width: "100%",
              maxWidth: 350,
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()} // popup kapanmasın
          >
            <h3 style={{ marginBottom: 12 }}>HOLD {selectedHold} → Yeni Kayıt</h3>

            <input
              value={car}
              onChange={(e) => setCar(e.target.value)}
              placeholder="Bagaj Araba No"
              style={{
                width: "100%",
                padding: 10,
                marginBottom: 10,
                borderRadius: 10,
                border: "1px solid #cbd5e1",
              }}
            />

            <input
              value={pcs}
              type="number"
              onChange={(e) => setPcs(e.target.value)}
              placeholder="Parça Sayısı"
              style={{
                width: "100%",
                padding: 10,
                marginBottom: 10,
                borderRadius: 10,
                border: "1px solid #cbd5e1",
              }}
            />

            {/* TYPE AUTOCOMPLETE */}
            <div style={{ position: "relative", marginBottom: 14 }}>
              <input
                value={type}
                onChange={(e) => setType(e.target.value.toUpperCase())}
                placeholder="Cinsi (BY, BT, FKT...)"
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                }}
                onFocus={() => setShowTypeList(true)}
              />

              {showTypeList && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "#fff",
                    border: "1px solid #cbd5e1",
                    borderRadius: 10,
                    marginTop: 4,
                    maxHeight: 150,
                    overflowY: "auto",
                    zIndex: 999,
                  }}
                >
                  {TYPE_OPTIONS.filter((opt) =>
                    opt.includes(type.toUpperCase())
                  ).map((opt) => (
                    <div
                      key={opt}
                      onClick={() => {
                        setType(opt);
                        setShowTypeList(false);
                      }}
                      style={{
                        padding: 10,
                        cursor: "pointer",
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      {opt}
                    </div>
                  ))}

                  {TYPE_OPTIONS.filter((opt) =>
                    opt.includes(type.toUpperCase())
                  ).length === 0 && (
                    <div style={{ padding: 10, color: "#64748b" }}>
                      Sonuç bulunamadı
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={addHoldRecord}
              style={{
                width: "100%",
                padding: 12,
                background: "#2563eb",
                color: "white",
                borderRadius: 10,
                border: "none",
                marginBottom: 8,
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              Ekle
            </button>

            <button
              onClick={() => {
                setShowPopup(false);
                setShowTypeList(false);
              }}
              style={{
                width: "100%",
                padding: 12,
                background: "#94a3b8",
                color: "white",
                borderRadius: 10,
                border: "none",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
