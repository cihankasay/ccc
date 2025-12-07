import { useRef, useEffect, useState } from "react";

export default function SignaturePopup({ onClose, onSave }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Dokunmatik gecikmeyi engelle
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.style.touchAction = "none";
  }, []);

  // Canvas setup (dinamik boyut)
  useEffect(() => {
    const setupCanvas = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const width = window.innerWidth;
      const height = window.innerHeight * 0.55;

      canvas.width = width;
      canvas.height = height;

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = "#000";

      ctxRef.current = ctx;
    };

    setupCanvas();
    window.addEventListener("resize", setupCanvas);
    return () => window.removeEventListener("resize", setupCanvas);
  }, []);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const { x, y } = getPos(e);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
    setHasDrawn(true);
  };

  const endDraw = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const saveSig = () => {
    if (!hasDrawn) {
      alert("Lütfen imza atın.");
      return;
    }

    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL("image/png");
    onSave(dataURL);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(3px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 12,
      }}
      onClick={onClose}
    >
      {/* İçerik */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          background: "#fff",
          borderRadius: 18,
          padding: 12,
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        }}
      >
        <h3 style={{ textAlign: "center", margin: 6, fontSize: 20 }}>
          Dijital İmza
        </h3>

        {/* Çizim Alanı */}
        <div
          style={{
            border: "2px dashed #666",
            borderRadius: 12,
            overflow: "hidden",
            marginTop: 10,
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: "100%",
              touchAction: "none",
              display: "block",
              background: "#fff",
            }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={(e) => startDraw(e)}
            touch-action="none"
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
        </div>

        {/* Butonlar */}
        <div
          style={{
            marginTop: 14,
            display: "flex",
            gap: 12,
            justifyContent: "space-between",
          }}
        >
          <button
            onClick={clearCanvas}
            style={{
              flex: 1,
              padding: "12px 0",
              background: "#e5e7eb",
              border: "1px solid #d1d5db",
              borderRadius: 12,
              fontSize: 16,
            }}
          >
            Temizle
          </button>

          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px 0",
              background: "#f87171",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 16,
            }}
          >
            İptal
          </button>

          <button
            onClick={saveSig}
            style={{
              flex: 1,
              padding: "12px 0",
              background: "#22c55e",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
