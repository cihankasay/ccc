import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import HoldLayoutShared from "../components/HoldLayoutShared";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://192.168.1.103:3001";

export default function OffloadPage() {
  const { id } = useParams();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.role;

  const [lir, setLir] = useState(null);
  const [offloadHolds, setOffloadHolds] = useState({});
  const [extraText, setExtraText] = useState("");

  const [showPopup, setShowPopup] = useState(false);
  const [selectedHold, setSelectedHold] = useState(null);
  const [popupText, setPopupText] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/lirs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = res.data;
      setLir(data);

      if (data.offload) {
        setOffloadHolds(data.offload.holds || {});
        setExtraText(data.offload.extra || "");
      } else {
        setOffloadHolds({});
        setExtraText("");
      }

    } catch (err) {
      console.error(err);
      alert("LIR yüklenemedi");
    }
  };

  const saveOffload = async () => {
    try {
      await axios.patch(
        `${API_BASE}/api/lirs/${id}/offload`,
        {
          offload: {
            content: JSON.stringify({
              holds: offloadHolds,
              extra: extraText
            })
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Kaydedildi");
      load();

    } catch (err) {
      console.error("Offload kaydedilemedi:", err);
      alert("Kaydedilemedi");
    }
  };

  const savePopup = async () => {
    const updated = {
      ...offloadHolds,
      [selectedHold]: popupText.trim() === "" ? "NIL" : popupText
    };

    setOffloadHolds(updated);
    setShowPopup(false);

    try {
      await axios.patch(
        `${API_BASE}/api/lirs/${id}/offload`,
        {
          offload: {
            content: JSON.stringify({
              holds: updated,
              extra: extraText
            })
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Otomatik kaydedildi");

    } catch (err) {
      console.error("Auto save error:", err);
      alert("Kaydedilirken hata oluştu!");
    }
  };

  if (!lir) return <p style={{ padding: 20 }}>Yükleniyor...</p>;

  return (
    <div style={{ padding: 14, maxWidth: 900, margin: "0 auto" }}>

      {/* GERİ BUTONU – iOS STYLE */}
      <div
        onClick={() => navigate(`/lir/${id}`)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 18,
          cursor: "pointer",
          background: "#f1f5f9",
          padding: "10px 18px",
          borderRadius: 14,
          fontWeight: 600,
          fontSize: 15,
          color: "#0f172a",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
        }}
      >
        <span style={{ fontSize: 18 }}>←</span> Geri
      </div>

      {/* AMBAR ŞEMASI */}
      <HoldLayoutShared
        aircraftType={lir.base.aircraftType || lir.base.aircraft_type}
        maxHolds={lir.max_holds}
        mode="offload"
        holds={offloadHolds}
        onHoldClick={
          role === "HAREKAT"
            ? (holdNo) => {
                setSelectedHold(holdNo);
                setPopupText(offloadHolds[holdNo] || "");
                setShowPopup(true);
              }
            : null
        }
      />

      <h2 style={{ marginTop: 20, marginBottom: 8 }}>📝 Ekstra Notlar</h2>

      {/* NOTLAR KUTUSU – PREMIUM STYLE */}
      <textarea
        value={extraText}
        onChange={(e) => role === "HAREKAT" && setExtraText(e.target.value)}
        readOnly={role !== "HAREKAT"}
        style={{
          width: "100%",
          height: 140,
          padding: 14,
          borderRadius: 14,
          border: "1px solid #d4d4d8",
          marginBottom: 16,
          fontSize: 15,
          background: role === "HAREKAT" ? "#fff" : "#f3f4f6",
          color: "#1e293b",
          outline: "none",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06)"
        }}
      />

      {/* KAYDET BUTONU – iPhone Mavisi */}
      {role === "HAREKAT" && (
        <button
          onClick={saveOffload}
          style={{
            padding: 16,
            width: "100%",
            border: "none",
            borderRadius: 14,
            background: "#2563eb",
            color: "#fff",
            fontSize: 17,
            fontWeight: 600,
            boxShadow: "0 4px 10px rgba(37,99,235,0.25)",
            marginBottom: 30,
          }}
        >
          Kaydet
        </button>
      )}

      {/* POPUP – iOS Sheet Popup */}
      {showPopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(2px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999
          }}
        >
          <div
            style={{
              background: "#ffffff",
              padding: 22,
              borderRadius: 18,
              width: "85%",
              maxWidth: 360,
              boxShadow: "0 8px 20px rgba(0,0,0,0.15)"
            }}
          >
            <h3 style={{ marginBottom: 12, fontSize: 17 }}>
              HOLD {selectedHold} Offload
            </h3>

            <textarea
              value={popupText}
              onChange={(e) => setPopupText(e.target.value)}
              style={{
                width: "100%",
                height: 120,
                padding: 12,
                borderRadius: 12,
                border: "1px solid #d1d5db",
                fontSize: 15,
                background: "#f8fafc",
                marginBottom: 14,
                outline: "none",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.07)"
              }}
            />

            <button
              onClick={savePopup}
              style={{
                width: "100%",
                padding: 12,
                background: "#2563eb",
                color: "#fff",
                borderRadius: 12,
                border: "none",
                fontSize: 16,
                fontWeight: 600,
                marginBottom: 8,
                boxShadow: "0 3px 8px rgba(37,99,235,0.25)"
              }}
            >
              Kaydet
            </button>

            <button
              onClick={() => setShowPopup(false)}
              style={{
                width: "100%",
                padding: 12,
                background: "#e5e7eb",
                color: "#374151",
                borderRadius: 12,
                border: "none",
                fontSize: 16,
                fontWeight: 600
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
