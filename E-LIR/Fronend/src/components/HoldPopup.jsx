import React, { useState } from "react";

export default function HoldPopup({ hold, limit, onClose }) {
  const [car, setCar] = useState("");
  const [pcs, setPcs] = useState("");
  const [type, setType] = useState("");

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: "90%",
          maxWidth: 350,
          background: "#fff",
          padding: 18,
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        }}
      >
        <h3>HOLD {hold}</h3>
        <p>Max Limit: {limit} kg</p>

        <input
          placeholder="Araba No"
          value={car}
          onChange={(e) => setCar(e.target.value)}
          style={inputStyle}
        />

        <input
          type="number"
          placeholder="Parça Sayısı"
          value={pcs}
          onChange={(e) => setPcs(Number(e.target.value))}
          style={inputStyle}
        />

        <input
          placeholder="Cinsi (Bagaj / Kargo)"
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={inputStyle}
        />

        <button
          style={blueBtn}
          onClick={() => {
            alert(
              `HOLD ${hold} → ${pcs} PCS (${type}) | Araba ${car} kaydedildi (backend bağlanacak)`
            );
            onClose();
          }}
        >
          Kaydet
        </button>

        <button style={cancelBtn} onClick={onClose}>
          Kapat
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
  marginTop: 8,
  marginBottom: 8,
};

const blueBtn = {
  width: "100%",
  padding: 10,
  background: "#1e40af",
  color: "white",
  borderRadius: 10,
  border: "none",
  marginTop: 10,
};

const cancelBtn = {
  width: "100%",
  padding: 8,
  background: "#e5e7eb",
  borderRadius: 10,
  marginTop: 6,
  border: "none",
};
