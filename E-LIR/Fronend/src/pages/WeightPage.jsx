import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import HoldLayout from "../components/HoldLayout";
import { useNavigate } from "react-router-dom";


const API_BASE = "http://192.168.1.103:3001";

export default function WeightPage() {
  const { id } = useParams();
  const token = localStorage.getItem("token");

  const [lir, setLir] = useState(null);
  const [maxHolds, setMaxHolds] = useState({});
  const [weights, setWeights] = useState({}); // sadece ağırlık değerleri

  const [selectedHold, setSelectedHold] = useState(null);
  const [popupText, setPopupText] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();


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

      console.log("----- WEIGHT DEBUG -----");
      console.log("AIRCRAFT TYPE:", data.base?.aircraft_type);
      console.log("HOLDS:", data.base?.holds);
      console.log("MAX HOLDS:", data.max_holds);
      console.log("WEIGHTS:", data.weight);
      console.log("------------------------");

      // Max limitleri backend'den al
      setMaxHolds(data.max_holds || {});

      // ÖNCEKİ ağırlık değerleri varsa yükle, yoksa boş obje
      setWeights(data.weight || {});

    } catch (err) {
      console.error(err);
      alert("LIR yüklenemedi");
    }
  };

  const openHold = (holdKey) => {
    setSelectedHold(holdKey);
    setPopupText(weights[holdKey] ?? ""); // mevcut değer varsa göster
    setShowPopup(true);
  };

  const savePopup = async () => {
    try {
      const val = Number(popupText || 0);
      const max = Number(maxHolds[selectedHold] || 0);

      if (val > max) {
        alert(`Maksimum limit aşıldı! (${max} KG)`);
        return;
      }

      // 1) STATE güncelle
      const updated = {
        ...weights,
        [selectedHold]: val,
      };

      setWeights(updated);
      setShowPopup(false);

      // 2) BACKEND'E OTOMATİK KAYDET
      await axios.patch(
        `${API_BASE}/api/lirs/${id}/weight`,
        { weights: updated },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("AUTO-SAVE WEIGHT OK:", updated);

    } catch (err) {
      console.error("AUTO-SAVE WEIGHT ERROR:", err);
      alert("Kaydedilemedi!");
    }
  };


  const saveWeight = async () => {
    try {
      await axios.patch(
        `${API_BASE}/api/lirs/${id}/weight`,
        { weights },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Weight kaydedildi");
    } catch (err) {
      console.error(err);
      alert("Kaydedilemedi");
    }
  };

  if (!lir) return null;

  return (

    
    <div style={{ padding: 20 }}>
      <div
        onClick={() => navigate(`/lir/${id}`)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 16,
          cursor: "pointer",
          background: "#e2e8f0",
          padding: "8px 14px",
          borderRadius: 10,
          fontWeight: 600,
          fontSize: 16,
          color: "#1e293b",
          width: "fit-content"
        }}
      >
        ← Geri
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700 }}>
        
        
        WEIGHT • #{lir.base?.id || id}
        
      </h2>

      <HoldLayout
        aircraftType={lir.base?.aircraft_type}
        holds={weights}          // 🔥 artık sadece ağırlık değerleri gösteriliyor
        maxHolds={maxHolds}
        mode="weight"
        onHoldClick={openHold}
      />

      

      {/* POPUP */}
      {showPopup && (
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 12,
              width: 300,
            }}
          >
            <h3 style={{ marginBottom: 10 }}>
              {selectedHold} Weight (KG)
            </h3>

            <input
              type="number"
              value={popupText}
              onChange={(e) => setPopupText(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                border: "1px solid #ddd",
                borderRadius: 8,
                marginBottom: 15,
              }}
            />

            <button
              onClick={savePopup}
              style={{
                width: "100%",
                padding: 10,
                background: "#16a34a",
                color: "#fff",
                borderRadius: 8,
                border: "none",
                marginBottom: 8,
              }}
            >
              Kaydet
            </button>

            <button
              onClick={() => setShowPopup(false)}
              style={{
                width: "100%",
                padding: 10,
                background: "#dc2626",
                color: "#fff",
                borderRadius: 8,
                border: "none",
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
