import { useState } from "react";
import axios from "axios";


const API_BASE = "http://192.168.1.103:3001";

export default function Login({ setToken, setUser }) {
  const [sicilNo, setSicilNo] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  



  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, {
        sicilNo,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setToken(res.data.token);
      setUser(res.data.user);
    } catch {
      setMsg("❌ Giriş başarısız");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "max(env(safe-area-inset-top),20px) 16px env(safe-area-inset-bottom) 16px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 340, // 📌 iPhone taşmasını %100 engeller
          background: "#fff",
          padding: "26px 20px",
          borderRadius: 20,
          boxShadow: "0 12px 35px rgba(0,0,0,0.25)",
        }}
      >
        <h2
          style={{
            margin: 0,
            marginBottom: 6,
            fontSize: 25,
            fontWeight: 700,
            textAlign: "center",
            color: "#1e3a8a",
          }}
        >
          ✈️ LIR Panel
        </h2>

        <p
          style={{
            margin: 0,
            marginBottom: 20,
            fontSize: 14,
            textAlign: "center",
            color: "#6b7280",
          }}
        >
          Harekat & Rampa Dijital Giriş
        </p>

        <form onSubmit={handleLogin}>
          {/* SICIL */}
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 14,
                fontWeight: 600,
                color: "#374151",
              }}
            >
              Sicil No
            </label>

            <input
              type="text"
              value={sicilNo}
              onChange={(e) => setSicilNo(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 14,
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#111827",
                WebkitTextFillColor: "#111827",
                fontSize: 17, // 📌 ZOOM ve TAŞMA engeli
                outline: "none",
                WebkitAppearance: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Şifre */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 14,
                fontWeight: 600,
                color: "#111827",
                WebkitTextFillColor: "#111827",
              }}
            >
              Şifre
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 14,
                border: "1px solid #cbd5e1",
                background: "#f9fafb",
                color: "#111827",
                WebkitTextFillColor: "#111827",
                fontSize: 17, // 📌 iPhone minimum font-size üzerinde
                outline: "none",
                WebkitAppearance: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Buton */}
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "14px 0",
              borderRadius: 14,
              background: "linear-gradient(135deg, #2563eb, #1e40af)",
              color: "#fff",
              fontSize: 18,
              fontWeight: 700,
              border: "none",
              boxShadow: "0 5px 16px rgba(37,99,235,0.45)",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            Giriş Yap
          </button>
        </form>

        {msg && (
          <p
            style={{
              marginTop: 14,
              textAlign: "center",
              fontSize: 14,
              color: "#dc2626",
            }}
          >
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}
