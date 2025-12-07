export default function HoldLayoutShared({ aircraftType, maxHolds, holds, onHoldClick, mode }) {
  if (!aircraftType || !holds) return null;

  let front = [];
  let rear = [];

  // --------------------------
  // UÇAK TİPİNE GÖRE ÖN/ARKA AYIRMA
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

  // Tek bir HOLD kart bileşeni
const renderHold = (id) => {
  const key = String(id);              // 🔥 KEY HER ZAMAN STRING
  const value = holds?.[key] || [];    // 🔥 DOĞRU VERİ ÇEKME
  const max = maxHolds?.[key] ?? "—";  // 🔥 DOĞRU MAX AYARI

  return (
    <div
      key={key}
      onClick={() => onHoldClick && onHoldClick(key)}   // 🔥 STRING OLARAK GÖNDER
      style={{
        padding: 14,
        background: "#fff",
        borderRadius: 14,
        border: "1px solid #d1d5db",
        marginBottom: 12,
        cursor: onHoldClick ? "pointer" : "default",
        transition: "all 0.15s ease",
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        width: "100%",
      }}
    >
      {/* HOLD BAŞLIĞI */}
      <strong style={{ fontSize: 18, marginBottom: 4 }}>
        {key}. HOLD
      </strong>

      {/* MAX KG */}
      <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
        Max: {max} kg
      </div>

      {/* 🔥 SADECE OFFLOAD SAYFASINDA AYT YAZISI */}
      {mode === "offload" && (
        <div
          style={{
            fontSize: 30,
            fontWeight: 900,
            color: "#1e3a8a",
            marginTop: 6,
            marginBottom: 6,
            letterSpacing: 2,
          }}
        >
          AYT
        </div>
      )}

      {/* NORMAL GÖRÜNTÜ (OFFLOAD / PLAN vs.) */}
      {mode !== "report" && (
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
            wordBreak: "break-word",
            width: "100%",
          }}
        >
          {value}
        </div>
      )}

      {/* REPORT LİSTESİ */}
      {mode === "report" && (
        <div
          style={{
            marginTop: 8,
            padding: "6px 10px",
            background: "#f8fafc",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            fontSize: 14,
            fontWeight: 600,
            color: "#0f172a",
            textAlign: "left",
            width: "100%",
          }}
        >
          {Array.isArray(value) && value.length > 0 ? (
            value.map((item, i) => (
              <div
                key={i}
                style={{
                  marginBottom: 6,
                  display: "flex",
                  justifyContent: "center",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  🚗 {item.car} — 📦 {item.pcs} — 🏷 {item.type}
                </span>
              </div>
            ))
          ) : (
            <div style={{ color: "#6b7280" }}>Kayıt yok</div>
          )}
        </div>
      )}

      {/* WEIGHT SAYFASI — SADECE KG GÖSTERİR */}
      {mode === "weight" && (
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
            width: "100%",
          }}
        >
          {Number(value) || 0} KG
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

    <h4 style={{ marginBottom: 8, fontSize: 18 }}>
      🔵 ÖN AMBAR
    </h4>

    {/* ÖN AMBAR ORTALAMA */}
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%"
      }}
    >
      {front.map(renderHold)}
    </div>

    <div
      style={{
        width: "100%",
        height: 2,
        background: "#94a3b8",
        margin: "18px 0",
        borderRadius: 2,
      }}
    />

    <h4 style={{ marginBottom: 8, fontSize: 18 }}>
      🟠 ARKA AMBAR
    </h4>

    {/* ARKA AMBAR ORTALAMA */}
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%"
      }}
    >
      {rear.map(renderHold)}
    </div>
  </div>
);

}
