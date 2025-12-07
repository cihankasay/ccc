import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import LirListItem from "../components/LirListItem";



const API_BASE = "http://192.168.1.103:3001";

export default function Harekat({ onLogout }) {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!token) return;
    navigate("/harekat");
  }, []);

  // ------------------------ STATE’LER ------------------------
  const [draftLirs, setDraftLirs] = useState([]);
  const [waitingLirs, setWaitingLirs] = useState([]);
  const [finalLirs, setFinalLirs] = useState([]);
  const [sentLirs, setSentLirs] = useState([]);

  const [registryList, setRegistryList] = useState([]);

  const [rampUsers, setRampUsers] = useState([]);
  const [openRampPopup, setOpenRampPopup] = useState(false);
  const [rampSearch, setRampSearch] = useState("");
  const [selectedRampLirId, setSelectedRampLirId] = useState(null);

  const [newLir, setNewLir] = useState({
    flightNo: "",
    fromAirport: "",
    toAirport: "",
    aircraftReg: "",
    flightDate: "",
  });

  // Form açıldığında UTC tarih ve default from/to değerleri ayarlanır
  useEffect(() => {
    const now = new Date();

    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");

    const utcDate = `${year}-${month}-${day}`;

    setNewLir((prev) => ({
        ...prev,
        flightDate: utcDate,
        fromAirport: "AYT",
        toAirport: "SAW",
      }));
  }, []);
/////////////////////////
function openSignaturePopup() {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 300, 200);

    let drawing = false;

    canvas.onmousedown = () => (drawing = true);
    canvas.onmouseup = () => (drawing = false);
    canvas.onmousemove = (e) => {
      if (!drawing) return;
      const rect = canvas.getBoundingClientRect();
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#000";
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    };

    const popup = document.createElement("div");
    popup.style.position = "fixed";
    popup.style.top = 0;
    popup.style.left = 0;
    popup.style.width = "100vw";
    popup.style.height = "100vh";
    popup.style.background = "rgba(0,0,0,0.5)";
    popup.style.display = "flex";
    popup.style.justifyContent = "center";
    popup.style.alignItems = "center";
    popup.style.zIndex = 999999;

    const box = document.createElement("div");
    box.style.background = "#fff";
    box.style.padding = "20px";
    box.style.borderRadius = "12px";
    box.appendChild(canvas);

    const btn = document.createElement("button");
    btn.innerText = "Kaydet";
    btn.style.marginTop = "10px";
    btn.onclick = () => {
      const data = canvas.toDataURL("image/png");
      document.body.removeChild(popup);
      resolve(data);
    };

    box.appendChild(btn);
    popup.appendChild(box);
    document.body.appendChild(popup);
  });
}




  const [autoMaxHolds, setAutoMaxHolds] = useState({});
  const [holdInputs, setHoldInputs] = useState({});

  const unsendToRamp = async (id) => {
    if (!window.confirm("Bu LIR Ramptan geri alınsın mı?")) return;

    try {
      const res = await axios.post(
        `${API_BASE}/api/lirs/${id}/unsend-ramp`,
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.ok) {
        alert("LIR Ramptan geri alındı");
      }

      await Promise.all([
        loadDraftLirs(),
        loadWaitingLirs(),
        loadFinalLirs(),
        loadSentLirs(),
      ]);

    } catch (err) {
      console.error("Unsend ramp error:", err);
      alert("LIR Ramptan geri alınamadı.");
    }
  };
  

  // ------------------------ BURAYA DİKKAT ------------------------
  // ❌ handleLogout ARTIK YOK
  // ✔️ onLogout = App.jsx'ten gelen logout fonksiyonu
  // -------------------------------------------------------------

  // ------------------------ KUYRUK LİSTESİ ------------------------
  const loadRegistryList = async () => {
    if (!token) return;

    try {
      const res = await axios.get(`${API_BASE}/api/aircraft-registry`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRegistryList(res.data);
    } catch (err) {
      console.error("Kuyruk listesi alınamadı", err);
    }
  };



  const fetchAircraftInfo = async (reg) => {
    if (!reg) return;
    try {
      const r = await axios.get(`${API_BASE}/api/aircraft-registry/${reg}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAutoMaxHolds(r.data.holds || {});
      setHoldInputs({});
    } catch {
      setAutoMaxHolds({});
      setHoldInputs({});
    }
  };

  // ------------------------ LIR LİSTELERİ ------------------------
  useEffect(() => {
    if (!token) return;
    loadRegistryList();
  }, [token]);


  useEffect(() => {
    if (!token) return;
    fetchRampUsers();
    loadDraftLirs();
    loadWaitingLirs();
    loadFinalLirs();
    loadSentLirs();
  }, []);


  const fetchRampUsers = async () => {
    const r = await axios.get(`${API_BASE}/api/users/ramp`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setRampUsers(r.data);
  };

  const loadDraftLirs = async () => {
    const r = await axios.get(`${API_BASE}/api/lirs?scope=ops-draft`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setDraftLirs(r.data);
  };

  const loadWaitingLirs = async () => {
    const r = await axios.get(`${API_BASE}/api/lirs`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setWaitingLirs(r.data.filter((x) => x.status === "WAITING_OPS_APPROVAL"));
  };


  const loadFinalLirs = async () => {
    const r = await axios.get(`${API_BASE}/api/lirs?scope=final`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setFinalLirs(r.data);
  };





  const loadSentLirs = async () => {
    const r = await axios.get(`${API_BASE}/api/lirs`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setSentLirs(r.data.filter((x) => x.status === "WAITING_RAMP"));
  };



  // ------------------------ YENİ LIR OLUŞTUR ------------------------
  const handleCreateLir = async (e) => {
    e.preventDefault();
    try {
      const body = {
        flightNo: newLir.flightNo,
        fromAirport: newLir.fromAirport,
        toAirport: newLir.toAirport,
        flightDate: newLir.flightDate,
        aircraftReg: newLir.aircraftReg,
        assignedRampUserId: null
        // holds gönderilmiyor!
      };

      await axios.post(`${API_BASE}/api/lirs`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNewLir({
        flightNo: "",
        fromAirport: "AYT",
        toAirport: "SAW",
        aircraftReg: "",
        flightDate: "",
      });

      loadDraftLirs();
    } catch (err) {
      alert(err.response?.data?.error || "Hata");
    }
  };


  // ------------------------ RAMP ATAMA ------------------------
  const sendToRamp = async (lirId, rampUserId) => {
    await axios.post(
      `${API_BASE}/api/lirs/${lirId}/send-to-ramp`,
      { assignedRampUserId: Number(rampUserId) },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    loadDraftLirs();
    loadSentLirs();
    setOpenRampPopup(false);
  };
  // ------------------------------------------

  async function handleSendToRamp(lirId) {
  try {
    // 1) İMZA AL
    const sign = await openSignaturePopup();

    if (!sign) {
      alert("İmza alınmadı!");
      return;
    }

    // 2) HAREKAT İMZASINI KAYDET
    await axios.post(
      `${API_BASE}/api/lirs/${lirId}/harekat-sign`,
      { signature: sign },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // 3) RAMP SEÇİM POPUP AÇILSIN
    setSelectedRampLirId(lirId);
    setOpenRampPopup(true);

  } catch (err) {
    console.error(err);
    alert("Gönderme işlemi sırasında hata oluştu!");
  }
}



  // ------------------------ OPS ONAY / RED ------------------------
  const opsApprove = async (lirId) => {
    await axios.post(
      `${API_BASE}/api/lirs/${lirId}/ops-approve`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    loadWaitingLirs();
    loadFinalLirs();
  };

  const opsReject = async (lirId) => {
    const reason = prompt("Red sebebi:");
    if (!reason) return;

    await axios.post(
      `${API_BASE}/api/lirs/${lirId}/ops-reject`,
      { reason },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    loadWaitingLirs();
  };

  const deleteDraftLir = async (lirId) => {
    if (!confirm("Silinsin mi?")) return;
    await axios.delete(`${API_BASE}/api/lirs/${lirId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    loadDraftLirs();
  };

  // -------------------------------------------------------------
  //                      RENDER
  // -------------------------------------------------------------
 return (
  <div
    style={{
      width: "100%",
      maxWidth: 500,
      margin: "0 auto",
      padding: "20px 18px",
      paddingBottom: "40px",
      background: "#F2F2F7", // iOS system background
      minHeight: "100vh",
      boxSizing: "border-box",
    }}
  >
    {/* ÜST BAR */}
    <div
      style={{
        background: "#ffffff",
        padding: "22px 20px",
        borderRadius: 24,
        marginBottom: 26,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 8px 20px rgba(0,0,0,0.06)", // iOS shadow
      }}
    >
      <div>
        <strong style={{ fontSize: 20, color: "#111827" }}>
          {user.full_name}
        </strong>
        <div style={{ fontSize: 14, color: "#6b7280", marginTop: 2 }}>
          {user.role}
        </div>
      </div>

      <button
        onClick={onLogout}
        style={{
          background: "#EF4444",
          color: "#fff",
          border: "none",
          padding: "10px 18px",
          borderRadius: 14,
          fontSize: 15,
          fontWeight: 600,
          boxShadow: "0 4px 14px rgba(239,68,68,0.35)",
        }}
      >
        Çıkış
      </button>
    </div>

    {/* YENİ LIR OLUŞTUR FORMU */}
    <div
      style={{
        background: "#ffffff",
        padding: 22,
        borderRadius: 24,
        marginBottom: 28,
        boxShadow: "0 8px 22px rgba(0,0,0,0.05)",
      }}
    >
      <h3
        style={{
          fontSize: 20,
          fontWeight: 700,
          marginBottom: 20,
          color: "#1F2937",
        }}
      >
        ➕ Yeni LIR Oluştur
      </h3>

      <form onSubmit={handleCreateLir}>
        {/* FROM–TO row */}
        <div
          style={{
            display: "flex",
            gap: 12,
            width: "100%",
            flexWrap: "nowrap",
            marginBottom: 14,
          }}
        >
          <input
      type="text"
      placeholder="From"
      maxLength={4}
      value={newLir.fromAirport}
      onChange={(e) =>
        setNewLir({ ...newLir, fromAirport: e.target.value })
      }
      style={{
        width: "50%",
        minWidth: 0,              // 🔥 EŞİT VE TAŞMA OLMAMASI İÇİN ŞART
        height: 48,
        background: "#F9FAFB",
        borderRadius: 14,
        border: "1px solid #D1D5DB",
        padding: "12px",
        fontSize: 16,
        textAlign: "center",
        WebkitAppearance: "none",
        boxSizing: "border-box",  // 🔥 iPhone overflow fix
      }}
    />

    <input
      type="text"
      placeholder="To"
      maxLength={4}
      value={newLir.toAirport}
      onChange={(e) =>
        setNewLir({ ...newLir, toAirport: e.target.value })
      }
      style={{
        width: "50%",             // 🔥 flex kaldırıldı → tam eşit
        minWidth: 0,
        height: 48,
        background: "#F9FAFB",
        borderRadius: 14,
        border: "1px solid #D1D5DB",
        padding: "12px",
        fontSize: 16,
        textAlign: "center",
        WebkitAppearance: "none",
        boxSizing: "border-box",
      }}
    />

        </div>

        {/* Sefer No */}
        <input
          type="text"
          placeholder="Sefer No"
          value={newLir.flightNo}
          onChange={(e) =>
            setNewLir({ ...newLir, flightNo: e.target.value })
          }
          style={{
            width: "100%",
            height: 48,
            background: "#F9FAFB",
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid #D1D5DB",
            marginBottom: 14,
            fontSize: 16,
            WebkitAppearance: "none",
          }}
        />

        {/* Date */}
        <input
          type="date"
          value={newLir.flightDate}
          onChange={(e) =>
            setNewLir({ ...newLir, flightDate: e.target.value })
          }
          style={{
            width: "100%",
            height: 48,
            background: "#F9FAFB",
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid #D1D5DB",
            marginBottom: 14,
            fontSize: 16,
            WebkitAppearance: "none",
          }}
        />

        {/* Kuyruk */}
        <select
          value={newLir.aircraftReg}
          onChange={(e) => {
            setNewLir({ ...newLir, aircraftReg: e.target.value });
            fetchAircraftInfo(e.target.value);
          }}
          style={{
            width: "100%",
            height: 48,
            background: "#F9FAFB",
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid #D1D5DB",
            marginBottom: 18,
            fontSize: 16,
            WebkitAppearance: "none",
          }}
        >
          <option value="">Kuyruk Seç</option>
          {registryList.map((r) => (
            <option value={r.reg} key={r.reg}>
              {r.reg}
            </option>
          ))}
        </select>

        {/* Oluştur */}
        <button
          type="submit"
          style={{
            width: "100%",
            height: 50,
            background: "#2563EB",
            color: "#fff",
            border: "none",
            borderRadius: 14,
            fontSize: 17,
            fontWeight: 600,
            boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
          }}
        >
          Oluştur
        </button>
      </form>
    </div>

    {/* LİSTELER */}
    <h3
      style={{
        fontSize: 17,
        fontWeight: 600,
        color: "#6B7280",
        marginBottom: 12,
        marginTop: 24,
      }}
    >
      📝 Draft LIR'lar
    </h3>

    {draftLirs.map((lir) => (
      <LirListItem
        key={lir.id}
        lir={lir}
        onDetail={() => navigate(`/lir/${lir.id}`)}
        onSend={handleSendToRamp}
        onDelete={() => deleteDraftLir(lir.id)}
      />
    ))}

    <h3
      style={{
        fontSize: 17,
        fontWeight: 600,
        color: "#6B7280",
        marginBottom: 12,
        marginTop: 24,
      }}
    >
      ⏳ Ops Onayı Bekleyen
    </h3>

    {waitingLirs.map((lir) => (
      <LirListItem
        key={lir.id}
        lir={lir}
        onDetail={() => navigate(`/lir/${lir.id}`)}
        onApprove={() => opsApprove(lir.id)}
        onReject={() => opsReject(lir.id)}
      />
    ))}

    <h3
      style={{
        fontSize: 17,
        fontWeight: 600,
        color: "#6B7280",
        marginBottom: 12,
        marginTop: 24,
      }}
    >
      📦 Rampa Gönderilen
    </h3>

    {sentLirs.map((lir) => (
      <div key={lir.id} style={{ marginBottom: 14 }}>
        <LirListItem
          lir={lir}
          onDetail={() => navigate(`/lir/${lir.id}`)}
        />

        <button
          onClick={() => unsendToRamp(lir.id)}
          style={{
            marginTop: 8,
            width: "100%",
            height: 50,
            background: "#EF4444",
            color: "#fff",
            border: "none",
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 600,
            boxShadow: "0 4px 14px rgba(239,68,68,0.35)",
          }}
        >
          Ramptan Geri Çek
        </button>
      </div>
    ))}

    <h3
      style={{
        fontSize: 17,
        fontWeight: 600,
        color: "#6B7280",
        marginBottom: 12,
        marginTop: 24,
      }}
    >
      📄 Final LIR'lar
    </h3>

    {finalLirs.map((lir) => (
      <LirListItem
        key={lir.id}
        lir={lir}
        onDetail={() => navigate(`/lir/${lir.id}`)}
      />
    ))}

    {/* RAMP SEÇ POPUP */}
    {openRampPopup && (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backdropFilter: "blur(4px)", // iOS blur effect
          background: "rgba(0,0,0,0.3)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
        }}
        onClick={() => setOpenRampPopup(false)}
      >
        <div
          style={{
            background: "#fff",
            padding: 22,
            borderRadius: 24,
            width: 340,
            maxHeight: "70vh",
            overflowY: "auto",
            boxShadow: "0 8px 22px rgba(0,0,0,0.12)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 18 }}>
            👷‍♂️ Rampa Kullanıcısı Seç
          </h3>

          <input
            type="text"
            placeholder="Ara..."
            value={rampSearch}
            onChange={(e) => setRampSearch(e.target.value)}
            style={{
              width: "100%",
              height: 46,
              padding: "10px 14px",
              borderRadius: 14,
              border: "1px solid #d1d5db",
              marginBottom: 14,
            }}
          />

          {rampUsers
            .filter((u) =>
              u.full_name.toLowerCase().includes(rampSearch.toLowerCase())
            )
            .map((u) => (
              <div
                key={u.id}
                onClick={() => sendToRamp(selectedRampLirId, u.id)}
                style={{
                  padding: "14px 10px",
                  borderBottom: "1px solid #eee",
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                {u.full_name} — {u.sicil_no}
              </div>
            ))}

          <button
            onClick={() => setOpenRampPopup(false)}
            style={{
              marginTop: 16,
              width: "100%",
              height: 48,
              background: "#9CA3AF",
              border: "none",
              color: "#fff",
              borderRadius: 14,
              fontSize: 16,
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
