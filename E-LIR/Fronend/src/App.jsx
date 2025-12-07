import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Login from "./pages/Login";
import Harekat from "./pages/Harekat";
import Ramp from "./pages/Ramp";
import LirDetail from "./pages/LirDetail";

import OffloadPage from "./pages/OffloadPage";
import PlanPage from "./pages/PlanPage";
import ReportPage from "./pages/ReportPage";
import WeightPage from "./pages/WeightPage";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "{}")
  );

  // -------------------------------------
  // LOGOUT (HER ŞEYİ TEK YERDEN YÖNETİR)
  // -------------------------------------
  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
  };
  // -------------------------------------

  // TOKEN YOKSA LOGIN SAYFASINI GÖSTER
  if (!token) {
    return <Login setToken={setToken} setUser={setUser} />;
  }

  return (
    <Routes>
      {/* Giriş yapmış kişi dashboard'a yönlendirilir */}
      <Route
        index
        element={
          user.role === "HAREKAT"
            ? <Navigate to="/harekat" replace />
            : <Navigate to="/ramp" replace />
        }
      />

      {/* HAREKAT SAYFASI */}
      <Route
        path="/harekat"
        element={
          <Harekat
            token={token}
            user={user}
            onLogout={handleLogout}
          />
        }
      />

      {/* RAMP SAYFASI */}
      <Route
        path="/ramp"
        element={
          <Ramp
            token={token}
            user={user}
            onLogout={handleLogout}
          />
        }
      />

      {/* LIR DETAY */}
      <Route
        path="/lir/:id"
        element={<LirDetail token={token} user={user} />}
      />

      {/* ALT SAYFALAR */}
      <Route path="/lir/:id/offload" element={<OffloadPage />} />
      <Route path="/lir/:id/plan" element={<PlanPage />} />
      <Route path="/lir/:id/report" element={<ReportPage />} />
      <Route path="/lir/:id/weight" element={<WeightPage />} />

      {/* HERHANGİ YANLIŞ PATH */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
