export default function LirListItem({
  lir,
  onDetail,
  onSend,
  onDelete
}) {

  // Tarihi düzgün formatla (YYYY-MM-DD → DD.MM.YYYY)
  const rawDate =
    lir.flight_date ||
    lir.flightDate ||
    lir.date ||
    null;

  const flightDate = rawDate
    ? new Date(rawDate).toLocaleDateString("tr-TR")
    : "-";

  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 14,
        border: "1px solid #e5e7eb",
        marginBottom: 12,
        background: "#ffffff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.07)",
        fontSize: 16,
      }}
    >
      {/* ÜST KISIM — UÇUŞ / REG / ID */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ maxWidth: "65%" }}>
          <div style={{ fontWeight: 700, fontSize: 17, whiteSpace: "nowrap" }}>
            • {lir.flight_no} • {lir.aircraftReg || lir.aircraft_reg} • #{lir.id}
          </div>
        </div>

        {/* DETAY BUTONU */}
        <button
          onClick={() => onDetail(lir.id)}
          style={{
            padding: "8px 14px",
            background: "#2563EB",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontSize: 18,
            fontWeight: 600,
            alignSelf: "flex-start",
            boxShadow: "0 2px 6px rgba(37,99,235,0.25)",
            marginTop: 10,
          }}
        >
          Detay
        </button>
      </div>

      {/* ALT KISIM — TARİH + ROUTE */}
      <div
        style={{
          fontSize: 14,
          color: "#6b7280",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {/* SOL: ROTA */}
        <div style={{ flex: 1, minWidth: "60%" }}>
          {(lir.fromAirport || lir.from_airport || "-")}
          {" - "}
          {(lir.toAirport || lir.to_airport || "-")}
        </div>

        {/* SAĞ: TARİH */}
        <div style={{ fontWeight: 600, minWidth: "40%", textAlign: "right" }}>
          {flightDate}
        </div>
      </div>

      {/* ALT BUTONLAR */}
      <div
        style={{
          marginTop: 12,
          display: "flex",
          justifyContent: "flex-start",
          gap: 10,
        }}
      >
        {onSend && (
          <button
            onClick={() => onSend(lir.id)}
            style={{
              padding: "6px 10px",
              background: "#10b981",
              color: "#fff",
              borderRadius: 10,
              fontSize: 14,
              border: "none",
            }}
          >
            Gönder
          </button>
        )}

        {onDelete && (
          <button
            onClick={() => onDelete(lir.id)}
            style={{
              padding: "6px 10px",
              background: "#ef4444",
              color: "#fff",
              borderRadius: 10,
              fontSize: 14,
              border: "none",
            }}
          >
            Sil
          </button>
        )}
      </div>
    </div>
  );
}
