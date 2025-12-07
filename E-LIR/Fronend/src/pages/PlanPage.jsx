import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import HoldLayout from "../components/HoldLayout";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://192.168.1.103:3001";

export default function PlanPage() {
  const { id } = useParams();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.role;

  const [lir, setLir] = useState(null);
  const [maxHolds, setMaxHolds] = useState({});
  const [planHolds, setPlanHolds] = useState({});
  const [extraText, setExtraText] = useState("");

  const [selectedHold, setSelectedHold] = useState(null);
  const [popupText, setPopupText] = useState("");
  const [showPopup, setShowPopup] = useState(false);

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
      setMaxHolds(data.max_holds || {});

      const baseHolds = JSON.parse(data.base.holds || "{}");
      const savedPlan = data.plan || {};

      setPlanHolds(savedPlan.holds || baseHolds);
      setExtraText(savedPlan.extra || "");

    } catch (err) {
      console.error(err);
      alert("Plan verisi yüklenemedi");
    }
  };

  const openPopup = (holdNo) => {
    setSelectedHold(holdNo);
    setPopupText(planHolds[holdNo] || "");
    setShowPopup(true);
  };

  const savePopup = async () => {
    try {
      const updatedHolds = {
        ...planHolds,
        [selectedHold]: popupText,
      };

      setPlanHolds(updatedHolds);
      setShowPopup(false);

      await axios.patch(
        `${API_BASE}/api/lirs/${id}/plan`,
        {
          plan: {
            holds: updatedHolds,
            extra: extraText,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("PLAN auto save error:", err);
    }
  };

  const savePlan = async () => {
    try {
      await axios.patch(
        `${API_BASE}/api/lirs/${id}/plan`,
        {
          plan: {
            holds: planHolds,
            extra: extraText,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Plan kaydedildi");
      load();
    } catch (err) {
      console.error(err);
      alert("Kaydedilemedi");
    }
  };

  if (!lir) return <p style={{ padding: 20 }}>Yükleniyor...</p>;

  return (
    <div style={{ padding: 14, maxWidth: 900, margin: "0 auto" }}>

      {/* GERİ BUTONU */}
      <div
        onClick={() => navigate(`/lir/${id}`)}
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

      {/* ÜST BADGE GRUP */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            background: "#e0f2fe",
            color: "#0369a1",
            padding: "10px 16px",
            borderRadius: 12,
            fontSize: 18,
            fontWeight: 800,
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            whiteSpace: "nowrap",
          }}
        >
          🛬 To: {lir.base.to_airport}
        </div>

        <div
          style={{
            background: "#ede9fe",
            color: "#5b21b6",
            padding: "10px 16px",
            borderRadius: 12,
            fontSize: 18,
            fontWeight: 800,
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            whiteSpace: "nowrap",
          }}
        >
          🔢 Sefer: {lir.base.flight_no}
        </div>

        <div
          style={{
            background: "#dcfce7",
            color: "#166534",
            padding: "10px 16px",
            borderRadius: 12,
            fontSize: 18,
            fontWeight: 800,
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            whiteSpace: "nowrap",
          }}
        >
          🏷 Kuyruk: {lir.base.aircraft_reg}
        </div>
      </div>

      {/* HOLD LAYOUT */}
      <div style={{ marginBottom: 24 }}>
        <HoldLayout
          aircraftType={lir.base.aircraftType || lir.base.aircraft_type}
          maxHolds={maxHolds}
          holds={planHolds}
          holdTexts={planHolds}
          onHoldClick={role === "HAREKAT" ? openPopup : null}
        />
      </div>

      {/* EKSTRA NOT */}
      <h2 style={{ marginBottom: 6 }}>📝 Ekstra Notlar</h2>

      <textarea
        value={extraText}
        onChange={(e) => role === "HAREKAT" && setExtraText(e.target.value)}
        readOnly={role !== "HAREKAT"}
        style={{
          width: "100%",
          height: 140,
          padding: 12,
          borderRadius: 12,
          border: "1px solid #cbd5e1",
          background: role === "HAREKAT" ? "#fff" : "#f1f5f9",
          fontSize: 15,
          marginBottom: 10,
        }}
      />

      {role === "HAREKAT" && (
        <button
          onClick={savePlan}
          style={{
            width: "100%",
            padding: 14,
            background: "#1e40af",
            color: "#fff",
            fontSize: 18,
            fontWeight: 600,
            borderRadius: 12,
            border: "none",
            marginTop: 4,
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            marginBottom: 30,
          }}
        >
          Kaydet
        </button>
      )}

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
          >
            <h3 style={{ marginBottom: 12 }}>HOLD {selectedHold} Planı</h3>

            <textarea
              value={popupText}
              onChange={(e) => setPopupText(e.target.value)}
              style={{
                width: "100%",
                height: 120,
                padding: 10,
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                marginBottom: 14,
              }}
            />

            <button
              onClick={savePopup}
              style={{
                width: "100%",
                padding: 12,
                background: "#2563eb",
                color: "white",
                borderRadius: 10,
                border: "none",
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              Kaydet
            </button>

            <button
              onClick={() => setShowPopup(false)}
              style={{
                width: "100%",
                padding: 12,
                background: "#94a3b8",
                color: "white",
                borderRadius: 10,
                border: "none",
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
