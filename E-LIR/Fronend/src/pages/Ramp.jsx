import { useEffect, useState } from "react";
import axios from "axios";
import { AIRCRAFT_TYPES } from "../aircraftTypes";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://192.168.1.103:3001";

export default function Ramp({ token, user }) {
  const navigate = useNavigate();

  const [rampLirs, setRampLirs] = useState([]);
  const [message, setMessage] = useState("");

  const [selectedLirId, setSelectedLirId] = useState(null);
  const [reportText, setReportText] = useState("");

  const [bagCar, setBagCar] = useState("");
  const [bagHold, setBagHold] = useState("");
  const [bagPieces, setBagPieces] = useState("");
  const [bagType, setBagType] = useState("");

  const [bagAssignments, setBagAssignments] = useState({});
  const [rampPieces, setRampPieces] = useState({});


  const formatDate = (d) => {
    if (!d) return "-";
    const date = new Date(d);
    const gun = String(date.getDate()).padStart(2, "0");
    const ay = String(date.getMonth() + 1).padStart(2, "0");
    const yil = date.getFullYear();
    return `${gun}.${ay}.${yil}`;
  };


  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const loadRampLirs = async () => {
    try {
      const r = await axios.get(`${API_BASE}/api/lirs?scope=ramp-assigned`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRampLirs(Array.isArray(r.data) ? r.data : []);
    } catch (err) {
      console.error("Ramp LIR listesi alınamadı:", err);
      setRampLirs([]);
    }
  };

  useEffect(() => {
    loadRampLirs();
  }, []);

  const selectedLir =
    rampLirs.find((l) => l.id === selectedLirId) || null;

  return (
  <div
    style={{
      width: "100%",
      maxWidth: 600,        // 🔥 Daha dar, taşmayan ideal genişlik
      margin: "0 auto",
      padding: "12px 12px",
      boxSizing: "border-box",      // 🔥 Taşmayı bitiren ana çözüm
      overflow: "hidden",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display'",
    }}
  >
    {/* ⭐ ÜST NAV */}
    <div
      style={{
        background: "#ffffff",
        padding: "16px 20px",
        borderRadius: 18,
        marginBottom: 22,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <strong style={{ fontSize: 20 }}>{user?.full_name || "Kullanıcı"}</strong>
        <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
          {user?.role || "ROL YOK"}
        </div>
      </div>

      <button
        onClick={handleLogout}
        style={{
          background: "#ef4444",
          color: "#fff",
          padding: "10px 16px",
          border: "none",
          borderRadius: 14,
          fontWeight: 600,
          fontSize: 15,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        Çıkış
      </button>
    </div>

    {/* ⭐ LIR LİSTESİ */}
    <div
      style={{
        background: "#ffffff",
        borderRadius: 18,
        padding: 18,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        marginBottom: 18,
      }}
    >
      <h3
        style={{
          margin: 0,
          marginBottom: 14,
          fontSize: 18,
          textAlign: "center",       // 🔥 Başlık tam ortalı
        }}
      >
        📦 Sana Atanmış LIR'lar
      </h3>

      <div
        style={{
          maxHeight: "60vh",
          overflowY: "auto",
          paddingRight: 6,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {rampLirs.length === 0 && (
          <p
            style={{
              color: "#6b7280",
              fontSize: 15,
              textAlign: "center",     // 🔥 Ortalı boş mesaj
            }}
          >
            Atanmış LIR yok.
          </p>
        )}

        {rampLirs.map((lir) => (
          <div
            key={lir.id}
            onClick={() => navigate(`/lir/${lir.id}`)}
            style={{
              padding: "14px 16px",
              background: "#f8fafc",
              borderRadius: 14,
              border: "1px solid #e5e7eb",
              marginBottom: 12,
              cursor: "pointer",
              boxShadow: "0 2px 5px rgba(0,0,0,0.04)",
              transition: "0.2s",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 17,
                marginBottom: 4,
                color: "#1e293b",
                textAlign: "center",       // 🔥 Ortalı
              }}
            >
              #{lir.id} • {lir.flight_no || "-"}
            </div>

            <div
              style={{
                fontSize: 14,
                color: "#475569",
                marginBottom: 4,
                textAlign: "center",        // 🔥 Ortalı
              }}
            >
              {lir.from_airport || "-"} → {lir.to_airport || "-"}
            </div>

            <div
              style={{
                fontSize: 14,
                color: "#1e293b",
                textAlign: "center",        // 🔥 Ortalı REG
              }}
            >
              REG: <strong>{lir.aircraft_reg || "-"}</strong>
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#6b7280",
                marginTop: 6,
                textAlign: "center",
              }}
            >
              {formatDate(lir.created_at)}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* ⭐ ALT MESAJ */}
    {message && (
      <div
        style={{
          marginTop: 14,
          padding: "12px 14px",
          background: "#fef3c7",
          border: "1px solid #fbbf24",
          borderRadius: 12,
          fontSize: 15,
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          textAlign: "center",        // 🔥 Ortalı mesaj
        }}
      >
        {message}
      </div>
    )}
  </div>
);

}
