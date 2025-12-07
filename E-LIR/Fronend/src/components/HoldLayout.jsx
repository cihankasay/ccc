export default function HoldLayout({ aircraftType, maxHolds, holds, holdTexts, onHoldClick, mode }) {
  if (!aircraftType || !holds) return null;

  let front = [];
  let rear = [];

  // --------------------------
  // UÇAK TİPİNE GÖRE AYIRMA
  // --------------------------
  if (aircraftType === "A320") {
    front = [1];
    rear = [3, 4, 5];
  } else if (aircraftType === "A321") {
    front = [1, 2];
    rear = [3, 4, 5];
  } else if (aircraftType === "B738" || aircraftType === "B737-800") {
    front = [1, 2];
    rear = [3, 4];
  }

  // Tek bir hold box bileşeni
  const renderHold = (id) => {
    const max = maxHolds?.[id] ?? "—";
    const value = holds?.[id];

    return (
      <div
        key={id}
        onClick={() => onHoldClick && onHoldClick(id)}
        style={{
          padding: 14,
          background: "#fff",
          borderRadius: 14,
          border: "1px solid #d1d5db",
          marginBottom: 12,
          cursor: "pointer",
          transition: "all 0.15s ease",
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
      >
        <strong style={{ fontSize: 18, marginBottom: 4 }}>
          {id}. HLD
        </strong>

        {/* Max Weight bilgisi */}
        <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
          Max: {max} KGS
        </div>

        {/* -------------------------------
            WEIGHT MODU GÖSTERİMİ
        -------------------------------- */}
        {mode === "weight" && (
          <div
            style={{
              marginTop: 8,
              padding: "6px 10px",
              background: "#f1f5f9",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 20,
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            {(Number(value) || 0) + " KG"}
          </div>
        )}

        {/* NORMAL MOD (OFFLOAD / PLAN) */}
        {mode !== "report" && mode !== "weight" && (
          <div
            style={{
              marginTop: 8,
              padding: "6px 10px",
              background: "#f8fafc",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 18,
              fontWeight: 700,
              color: "#0f172a",
              textAlign: "center",
              wordBreak: "break-word",
            }}
          >
            {value || "NIL"}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: 12, background: "#f1f5f9", borderRadius: 12 }}>
      <h3 style={{ marginTop: 0, marginBottom: 16 }}>
        🛒 {aircraftType} — Ambar Şeması
      </h3>

      {/* ÖN AMBAR */}
      <h4 style={{ marginBottom: 8, marginTop: 0, fontSize: 18, color: "#1e293b" }}>
        🔵 ÖN AMBAR
      </h4>

      {front.map(renderHold)}

      {/* AYIRICI */}
      <div
        style={{
          width: "100%",
          height: 2,
          background: "#94a3b8",
          margin: "18px 0",
          borderRadius: 2,
        }}
      />

      {/* ARKA AMBAR */}
      <h4 style={{ marginBottom: 8, fontSize: 18, color: "#1e293b" }}>
        🟠 ARKA AMBAR
      </h4>

      {rear.map(renderHold)}
    </div>
  );
}
