import { useState, useRef, useCallback } from "react";

const PROVEEDORES_INIT = [
  { id: "aguas", nombre: "Aguas Manquehue", categoria: "Servicios Básicos" },
  { id: "enel", nombre: "Enel", categoria: "Servicios Básicos" },
  { id: "metrogas", nombre: "Metrogas", categoria: "Servicios Básicos" },
  { id: "entel", nombre: "Entel PCS Movil", categoria: "Telefonía / Internet" },
  { id: "gtd", nombre: "GTD Manquehue", categoria: "Telefonía / Internet" },
  { id: "costanera", nombre: "Costanera Norte", categoria: "Autopistas" },
  { id: "vespucio_sur", nombre: "Vespucio Sur", categoria: "Autopistas" },
  { id: "vespucio_norte", nombre: "Vespucio Norte", categoria: "Autopistas" },
  { id: "central", nombre: "Central / Autopase", categoria: "Autopistas" },
  { id: "ruta_maipo", nombre: "Ruta del Maipo", categoria: "Autopistas" },
  { id: "canopsa", nombre: "Nogales Puchuncaví (Canopsa)", categoria: "Autopistas" },
];

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const CAT_COLORS_INIT = {
  "Servicios Básicos":    { bg: "#e8f5e9", accent: "#2e7d32", dot: "#43a047", pdf: "#2e7d32" },
  "Telefonía / Internet": { bg: "#fff8e1", accent: "#f57f17", dot: "#ffa000", pdf: "#e65100" },
  "Autopistas":           { bg: "#e3f2fd", accent: "#1565c0", dot: "#1e88e5", pdf: "#1565c0" },
};

const PALETTE = [
  { bg: "#f3e5f5", accent: "#6a1b9a", dot: "#8e24aa", pdf: "#6a1b9a" },
  { bg: "#fce4ec", accent: "#880e4f", dot: "#e91e63", pdf: "#880e4f" },
  { bg: "#e0f2f1", accent: "#004d40", dot: "#00897b", pdf: "#004d40" },
  { bg: "#fff3e0", accent: "#bf360c", dot: "#ff5722", pdf: "#bf360c" },
  { bg: "#ede7f6", accent: "#311b92", dot: "#5e35b1", pdf: "#311b92" },
  { bg: "#e8eaf6", accent: "#1a237e", dot: "#3949ab", pdf: "#1a237e" },
];

const ABRIL_DATA = {
  aguas:         { 3: 183040 },
  enel:          { 3: 161704 },
  metrogas:      { 3: 103881 },
  entel:         { 3: 56963 },
  gtd:           { 3: 28326 },
  costanera:     { 3: 195270 },
  vespucio_sur:  { 3: 5267 },
  vespucio_norte:{ 3: 5300 },
  central:       { 3: 15853 },
  ruta_maipo:    { 3: 858 },
  canopsa:       { 3: 9800 },
};

const fmt = (n) => n ? `$${Number(n).toLocaleString("es-CL")}` : "—";
const fmtNum = (n) => n ? Number(n).toLocaleString("es-CL") : "—";

const diffColor = (curr, prev) => {
  if (!curr || !prev) return "#999";
  const pct = ((curr - prev) / prev) * 100;
  if (pct > 5) return "#c62828";
  if (pct < -5) return "#2e7d32";
  return "#555";
};
const diffLabel = (curr, prev) => {
  if (!curr || !prev) return null;
  const pct = ((curr - prev) / prev) * 100;
  return `${pct > 0 ? "▲" : "▼"} ${Math.abs(pct).toFixed(1)}%`;
};

// ── Genera y descarga el PDF usando solo el browser (sin librerías) ──────────
function generarPDF(mes, proveedores, data, catColors) {
  const categorias = [...new Set(proveedores.map(p => p.categoria))];
  const totalMes = proveedores.reduce((s, p) => s + (data[p.id]?.[mes] || 0), 0);
  const fecha = new Date().toLocaleDateString("es-CL");

  // Construimos el HTML del informe
  let rowsHTML = "";
  categorias.forEach(cat => {
    const provsCat = proveedores.filter(p => p.categoria === cat);
    const totalCat = provsCat.reduce((s, p) => s + (data[p.id]?.[mes] || 0), 0);
    const colors = catColors[cat] || PALETTE[0];
    const hayDatos = provsCat.some(p => data[p.id]?.[mes]);

    rowsHTML += `
      <tr class="cat-header">
        <td colspan="2" style="background:${colors.bg};color:${colors.pdf};padding:10px 16px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-top:2px solid ${colors.pdf}22;">
          ● ${cat}
        </td>
        <td style="background:${colors.bg};color:${colors.pdf};padding:10px 16px;text-align:right;font-weight:700;font-size:13px;border-top:2px solid ${colors.pdf}22;">
          ${hayDatos ? "$" + fmtNum(totalCat) : "—"}
        </td>
      </tr>`;

    provsCat.forEach((p, pi) => {
      const val = data[p.id]?.[mes];
      rowsHTML += `
        <tr style="background:${pi % 2 === 0 ? "#fff" : "#fafbfc"}">
          <td style="padding:9px 16px 9px 28px;color:#555;font-size:12px;border-bottom:1px solid #f0f0f0;">—</td>
          <td style="padding:9px 16px;color:#222;font-size:13px;border-bottom:1px solid #f0f0f0;">${p.nombre}</td>
          <td style="padding:9px 16px;text-align:right;font-size:13px;color:${val ? "#1a3a5c" : "#ccc"};font-weight:${val ? 600 : 400};border-bottom:1px solid #f0f0f0;font-family:monospace;">
            ${val ? "$" + fmtNum(val) : "—"}
          </td>
        </tr>`;
    });
  });

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Informe ${MESES[mes]} 2026</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #222; }
  .page { max-width: 680px; margin: 0 auto; padding: 40px 40px 60px; }
  .header { background: linear-gradient(135deg, #0f2044, #1565c0); color: white; padding: 32px 36px; border-radius: 12px; margin-bottom: 32px; }
  .header h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
  .header p { font-size: 12px; opacity: 0.7; letter-spacing: 1px; text-transform: uppercase; }
  .header .total-box { margin-top: 20px; background: rgba(255,255,255,0.15); border-radius: 8px; padding: 14px 20px; display: inline-block; }
  .header .total-label { font-size: 11px; opacity: 0.8; }
  .header .total-value { font-size: 28px; font-weight: 800; letter-spacing: -1px; font-family: monospace; }
  table { width: 100%; border-collapse: collapse; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
  th { background: #0f2044; color: white; padding: 12px 16px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
  th:last-child { text-align: right; }
  .total-row td { background: #0f2044; color: white; font-weight: 700; font-size: 14px; padding: 14px 16px; }
  .total-row td:last-child { text-align: right; font-size: 16px; font-family: monospace; }
  .footer { margin-top: 28px; text-align: center; font-size: 11px; color: #aaa; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <p>Control de Cuentas del Hogar</p>
    <h1>Informe de Gastos — ${MESES[mes]} 2026</h1>
    <div class="total-box">
      <div class="total-label">Total del mes</div>
      <div class="total-value">$${fmtNum(totalMes)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:30px"></th>
        <th style="text-align:left">Proveedor</th>
        <th style="text-align:right">Monto</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHTML}
      <tr class="total-row">
        <td colspan="2">TOTAL ${MESES[mes].toUpperCase()} 2026</td>
        <td>$${fmtNum(totalMes)}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">Generado el ${fecha} · Control de Cuentas del Hogar 2026</div>
</div>
</body>
</html>`;

  // Abrir en nueva ventana y lanzar impresión/guardar como PDF
  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.onload = () => win.print();
}

export default function App() {
  const [proveedores, setProveedores] = useState(PROVEEDORES_INIT);
  const [catColors, setCatColors] = useState(CAT_COLORS_INIT);
  const [data, setData] = useState(() => {
    const d = {};
    PROVEEDORES_INIT.forEach(p => { d[p.id] = { ...(ABRIL_DATA[p.id] || {}) }; });
    return d;
  });
  const [mesActivo, setMesActivo] = useState(3);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [editCell, setEditCell] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [vista, setVista] = useState("tabla");
  const [showModal, setShowModal] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  const [newCat, setNewCat] = useState("");
  const [newCatCustom, setNewCatCustom] = useState("");
  const [modalError, setModalError] = useState("");
  // Modal proveedor desconocido
  const [showNuevoProvModal, setShowNuevoProvModal] = useState(false);
  const [pendingResult, setPendingResult] = useState(null);
  const [npNombre, setNpNombre] = useState("");
  const [npCat, setNpCat] = useState("");
  const [npCatCustom, setNpCatCustom] = useState("");
  const fileRef = useRef();

  const categorias = [...new Set(proveedores.map(p => p.categoria))];
  const mesesConDatos = MESES.map((m, i) => ({
    nombre: m, idx: i,
    total: proveedores.reduce((s, p) => s + (data[p.id]?.[i] || 0), 0)
  }));
  const mesesTabla = MESES.map((_, i) => i).filter(i =>
    proveedores.some(p => data[p.id]?.[i]) || i === mesActivo
  );

  const agregarProveedor = () => {
    const nombre = newNombre.trim();
    const categoria = newCat === "__nueva__" ? newCatCustom.trim() : newCat;
    if (!nombre) return setModalError("Escribe el nombre del proveedor.");
    if (!categoria) return setModalError("Selecciona o escribe una categoría.");
    if (proveedores.some(p => p.nombre.toLowerCase() === nombre.toLowerCase()))
      return setModalError("Ya existe un proveedor con ese nombre.");
    const id = nombre.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Date.now();
    if (!catColors[categoria]) {
      const color = PALETTE[Object.keys(catColors).length % PALETTE.length];
      setCatColors(prev => ({ ...prev, [categoria]: color }));
    }
    setProveedores(prev => [...prev, { id, nombre, categoria }]);
    setData(prev => ({ ...prev, [id]: {} }));
    setNewNombre(""); setNewCat(""); setNewCatCustom(""); setModalError("");
    setShowModal(false);
  };

  const processFile = useCallback(async (file) => {
    setUploading(true); setUploadResult(null);
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const isPdf = file.type === "application/pdf";
      const contentBlock = isPdf
        ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
        : { type: "image", source: { type: "base64", media_type: file.type, data: base64 } };
      const lista = proveedores.map(p => `- ${p.nombre} (id: ${p.id})`).join("\n");
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 500,
          messages: [{ role: "user", content: [
            contentBlock,
            { type: "text", text: `Analiza este comprobante.\n\nProveedores:\n${lista}\n\nResponde SOLO JSON:\n{"proveedor_id":"id o null","proveedor_nombre":"nombre","monto":número,"mes":0-11 o null,"confianza":"alta|media|baja"}` }
          ]}]
        })
      });
      const json = await resp.json();
      const result = JSON.parse((json.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim());
      setUploadResult({ ...result, fileName: file.name });
      if (result.proveedor_id && result.monto && result.mes != null) {
        setData(prev => ({ ...prev, [result.proveedor_id]: { ...prev[result.proveedor_id], [result.mes]: result.monto } }));
        setMesActivo(result.mes);
      } else if (!result.proveedor_id && result.monto && result.mes != null) {
        // Proveedor desconocido — abrir modal para crearlo
        setPendingResult(result);
        setNpNombre(result.proveedor_nombre || "");
        setNpCat(""); setNpCatCustom("");
        setShowNuevoProvModal(true);
      }
    } catch { setUploadResult({ error: "No se pudo leer el comprobante." }); }
    setUploading(false);
  }, [proveedores]);

  const confirmarNuevoProv = () => {
    if (!pendingResult) return;
    const nombre = npNombre.trim();
    const categoria = npCat === "__nueva__" ? npCatCustom.trim() : npCat;
    if (!nombre || !categoria) return;
    const id = nombre.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Date.now();
    if (!catColors[categoria]) {
      const color = PALETTE[Object.keys(catColors).length % PALETTE.length];
      setCatColors(prev => ({ ...prev, [categoria]: color }));
    }
    setProveedores(prev => [...prev, { id, nombre, categoria }]);
    setData(prev => ({
      ...prev,
      [id]: { [pendingResult.mes]: pendingResult.monto }
    }));
    setMesActivo(pendingResult.mes);
    setShowNuevoProvModal(false);
    setPendingResult(null);
    setUploadResult(prev => ({ ...prev, proveedor_nombre: nombre, proveedor_id: id }));
  };

  const startEdit = (pId, mi, val) => { setEditCell(`${pId}-${mi}`); setEditVal(val || ""); };
  const commitEdit = (pId, mi) => {
    const val = parseInt(editVal.replace(/\D/g, "")) || undefined;
    setData(prev => ({ ...prev, [pId]: { ...prev[pId], [mi]: val } }));
    setEditCell(null);
  };

  const inputSt = {
    width: "100%", padding: "9px 12px", border: "1.5px solid #dde3ea",
    borderRadius: 8, fontFamily: "inherit", fontSize: 13, outline: "none",
    boxSizing: "border-box", color: "#333", background: "white",
  };

  const btnHeader = {
    display: "flex", alignItems: "center", gap: 7, padding: "10px 18px",
    borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.4)",
    background: "rgba(255,255,255,0.12)", color: "white", cursor: "pointer",
    fontFamily: "inherit", fontWeight: 600, fontSize: 13,
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f0f4f8", minHeight: "100vh", paddingBottom: 60 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* ── MODAL AGREGAR ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setShowModal(false)}>
          <div style={{ background: "white", borderRadius: 16, padding: 28, width: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 4px", fontSize: 17, color: "#1a3a5c", fontWeight: 700 }}>Agregar proveedor</h3>
            <p style={{ margin: "0 0 18px", color: "#999", fontSize: 13 }}>Aparecerá en todas las vistas y meses</p>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 5 }}>Nombre del proveedor</div>
            <input value={newNombre} onChange={e => setNewNombre(e.target.value)}
              placeholder="Ej: Seguro Mapfre" style={inputSt} autoFocus
              onKeyDown={e => e.key === "Enter" && agregarProveedor()} />
            <div style={{ fontSize: 12, fontWeight: 600, color: "#555", margin: "14px 0 5px" }}>Categoría</div>
            <select value={newCat} onChange={e => setNewCat(e.target.value)} style={inputSt}>
              <option value="">— Seleccionar —</option>
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="__nueva__">＋ Nueva categoría</option>
            </select>
            {newCat === "__nueva__" && <>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#555", margin: "14px 0 5px" }}>Nombre de la nueva categoría</div>
              <input value={newCatCustom} onChange={e => setNewCatCustom(e.target.value)}
                placeholder="Ej: Seguros" style={inputSt} />
            </>}
            {modalError && <p style={{ color: "#c62828", fontSize: 12, margin: "10px 0 0" }}>⚠ {modalError}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button onClick={() => { setShowModal(false); setModalError(""); }} style={{
                flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 8,
                background: "white", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "#666",
              }}>Cancelar</button>
              <button onClick={agregarProveedor} style={{
                flex: 2, padding: 10, border: "none", borderRadius: 8,
                background: "#1a3a5c", color: "white", cursor: "pointer",
                fontFamily: "inherit", fontSize: 13, fontWeight: 700,
              }}>Agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL PROVEEDOR DESCONOCIDO ── */}
      {showNuevoProvModal && pendingResult && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001 }}
          onClick={() => setShowNuevoProvModal(false)}>
          <div style={{ background: "white", borderRadius: 16, padding: 28, width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
            <h3 style={{ margin: "0 0 4px", fontSize: 17, color: "#1a3a5c", fontWeight: 700 }}>Proveedor no reconocido</h3>
            <p style={{ margin: "0 0 16px", color: "#888", fontSize: 13 }}>
              La IA leyó <strong style={{color:"#1a3a5c"}}>{pendingResult.proveedor_nombre}</strong> por <strong style={{color:"#1a3a5c"}}>${Number(pendingResult.monto).toLocaleString("es-CL")}</strong> en <strong style={{color:"#1a3a5c"}}>{MESES[pendingResult.mes]}</strong>.
              ¿Quieres crearlo como nuevo proveedor?
            </p>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 5 }}>Nombre del proveedor</div>
            <input value={npNombre} onChange={e => setNpNombre(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #dde3ea", borderRadius: 8, fontFamily: "inherit", fontSize: 13, outline: "none", boxSizing: "border-box", color: "#333", marginBottom: 14 }} />
            <div style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 5 }}>Categoría</div>
            <select value={npCat} onChange={e => setNpCat(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #dde3ea", borderRadius: 8, fontFamily: "inherit", fontSize: 13, outline: "none", boxSizing: "border-box", color: "#333" }}>
              <option value="">— Seleccionar —</option>
              {[...new Set(proveedores.map(p => p.categoria))].map(c => <option key={c} value={c}>{c}</option>)}
              <option value="__nueva__">＋ Nueva categoría</option>
            </select>
            {npCat === "__nueva__" && (
              <>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#555", margin: "14px 0 5px" }}>Nombre de la nueva categoría</div>
                <input value={npCatCustom} onChange={e => setNpCatCustom(e.target.value)}
                  placeholder="Ej: Supermercado"
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #dde3ea", borderRadius: 8, fontFamily: "inherit", fontSize: 13, outline: "none", boxSizing: "border-box", color: "#333" }} />
              </>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button onClick={() => setShowNuevoProvModal(false)} style={{
                flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 8,
                background: "white", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "#666",
              }}>Omitir</button>
              <button
                onClick={confirmarNuevoProv}
                disabled={!npNombre.trim() || !npCat || (npCat === "__nueva__" && !npCatCustom.trim())}
                style={{
                  flex: 2, padding: 10, border: "none", borderRadius: 8, cursor: "pointer",
                  fontFamily: "inherit", fontSize: 13, fontWeight: 700,
                  background: (!npNombre.trim() || !npCat || (npCat === "__nueva__" && !npCatCustom.trim())) ? "#ccc" : "#1a3a5c",
                  color: "white",
              }}>Crear y registrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ background: "linear-gradient(135deg, #0f2044 0%, #1a3a5c 60%, #1565c0 100%)", padding: "32px 32px 28px", color: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 11, letterSpacing: 3, opacity: 0.6, marginBottom: 6, textTransform: "uppercase" }}>Control de Gastos</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>Cuentas del Hogar 2026</h1>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => setShowModal(true)} style={btnHeader}>
                <span style={{ fontSize: 16 }}>＋</span> Agregar proveedor
              </button>
              <button
                onClick={() => generarPDF(mesActivo, proveedores, data, catColors)}
                style={{ ...btnHeader, background: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.5)" }}
              >
                <span style={{ fontSize: 16 }}>⬇</span> Informe {MESES[mesActivo]}
              </button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 20, flexWrap: "wrap" }}>
            {mesesConDatos.filter(m => m.total > 0).map(m => (
              <div key={m.idx} onClick={() => setMesActivo(m.idx)} style={{
                background: m.idx === mesActivo ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.08)",
                border: m.idx === mesActivo ? "1px solid rgba(255,255,255,0.5)" : "1px solid transparent",
                borderRadius: 10, padding: "10px 18px", cursor: "pointer",
              }}>
                <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>{m.nombre}</div>
                <div style={{ fontSize: 17, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{fmt(m.total)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 0" }}>

        {/* ── UPLOAD ── */}
        <div
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => !uploading && fileRef.current.click()}
          style={{
            border: `2px dashed ${dragOver ? "#1565c0" : "#b0c4de"}`,
            borderRadius: 14, background: dragOver ? "#e3f2fd" : "white",
            padding: "22px", cursor: uploading ? "default" : "pointer",
            marginBottom: 20, display: "flex", alignItems: "center",
            gap: 20, justifyContent: "center", flexWrap: "wrap", transition: "all 0.2s",
          }}>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: "none" }}
            onChange={e => e.target.files[0] && processFile(e.target.files[0])} />
          {uploading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 28, height: 28, border: "3px solid #e3f2fd", borderTop: "3px solid #1565c0", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <span style={{ color: "#1565c0", fontWeight: 600 }}>Leyendo con IA...</span>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 30 }}>📄</div>
              <div>
                <div style={{ fontWeight: 600, color: "#1a3a5c", fontSize: 14 }}>Sube un comprobante o aviso de pago</div>
                <div style={{ color: "#999", fontSize: 12, marginTop: 2 }}>Imagen o PDF — la IA extrae el monto automáticamente</div>
              </div>
            </>
          )}
          {uploadResult && !uploading && (
            <div style={{
              background: uploadResult.error ? "#ffebee" : "#e8f5e9",
              border: `1px solid ${uploadResult.error ? "#ef9a9a" : "#a5d6a7"}`,
              borderRadius: 10, padding: "9px 16px", fontSize: 13,
              color: uploadResult.error ? "#c62828" : "#2e7d32",
            }}>
              {uploadResult.error ? `❌ ${uploadResult.error}` :
                <span>✅ <strong>{uploadResult.proveedor_nombre}</strong> — {fmt(uploadResult.monto)} en <strong>{MESES[uploadResult.mes]}</strong>{uploadResult.confianza === "baja" && <span style={{ color: "#f57f17" }}> (verificar)</span>}</span>}
            </div>
          )}
        </div>

        {/* ── TABS ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[["tabla", "📋 Tabla mensual"], ["comparar", "📊 Comparar meses"]].map(([v, label]) => (
            <button key={v} onClick={() => setVista(v)} style={{
              padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
              fontFamily: "inherit", fontWeight: 600, fontSize: 13,
              background: vista === v ? "#1a3a5c" : "white",
              color: vista === v ? "white" : "#555",
              boxShadow: vista === v ? "0 2px 8px rgba(26,58,92,0.2)" : "0 1px 3px rgba(0,0,0,0.08)",
            }}>{label}</button>
          ))}
        </div>

        {/* ── VISTA TABLA ── */}
        {vista === "tabla" && (
          <div style={{ background: "white", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", overflowX: "auto", borderBottom: "1px solid #e8edf2", padding: "0 16px" }}>
              {MESES.map((m, i) => {
                const hasData = proveedores.some(p => data[p.id]?.[i]);
                return (
                  <button key={i} onClick={() => setMesActivo(i)} style={{
                    padding: "12px 13px", border: "none", background: "none", cursor: "pointer",
                    fontFamily: "inherit", fontSize: 13, fontWeight: mesActivo === i ? 700 : 400,
                    color: mesActivo === i ? "#1565c0" : hasData ? "#333" : "#bbb",
                    borderBottom: mesActivo === i ? "3px solid #1565c0" : "3px solid transparent",
                    whiteSpace: "nowrap",
                  }}>
                    {m}{hasData && <span style={{ marginLeft: 5, display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#43a047", verticalAlign: "middle" }} />}
                  </button>
                );
              })}
            </div>

            {categorias.map(cat => {
              const provsCat = proveedores.filter(p => p.categoria === cat);
              const colors = catColors[cat] || PALETTE[0];
              const prevMes = mesActivo > 0 ? mesActivo - 1 : null;
              const totalCat = provsCat.reduce((s, p) => s + (data[p.id]?.[mesActivo] || 0), 0);
              const totalPrev = prevMes !== null ? provsCat.reduce((s, p) => s + (data[p.id]?.[prevMes] || 0), 0) : null;
              return (
                <div key={cat}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px 8px", background: colors.bg, marginTop: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: colors.dot }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: colors.accent, letterSpacing: 1, textTransform: "uppercase" }}>{cat}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {totalPrev > 0 && totalCat > 0 && <span style={{ fontSize: 11, color: diffColor(totalCat, totalPrev), fontWeight: 600 }}>{diffLabel(totalCat, totalPrev)} vs {MESES[prevMes]}</span>}
                      <span style={{ fontSize: 13, fontWeight: 700, color: colors.accent, fontFamily: "'DM Mono', monospace" }}>{fmt(totalCat)}</span>
                    </div>
                  </div>
                  {provsCat.map((p, pi) => {
                    const val = data[p.id]?.[mesActivo];
                    const valPrev = prevMes !== null ? data[p.id]?.[prevMes] : null;
                    const isEditing = editCell === `${p.id}-${mesActivo}`;
                    return (
                      <div key={p.id} onClick={() => !isEditing && startEdit(p.id, mesActivo, val)} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "9px 20px", cursor: "pointer",
                        background: pi % 2 === 0 ? "white" : "#fafbfc",
                        borderBottom: "1px solid #f0f4f8",
                      }}>
                        <span style={{ fontSize: 13, color: "#333" }}>{p.nombre}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          {valPrev > 0 && val > 0 && <span style={{ fontSize: 11, color: diffColor(val, valPrev) }}>{diffLabel(val, valPrev)}</span>}
                          {isEditing ? (
                            <input autoFocus value={editVal}
                              onChange={e => setEditVal(e.target.value)}
                              onBlur={() => commitEdit(p.id, mesActivo)}
                              onKeyDown={e => { if (e.key === "Enter") commitEdit(p.id, mesActivo); if (e.key === "Escape") setEditCell(null); }}
                              onClick={e => e.stopPropagation()}
                              placeholder="Ej: 183040"
                              style={{ width: 130, padding: "4px 8px", border: "2px solid #1565c0", borderRadius: 6, fontFamily: "'DM Mono', monospace", fontSize: 13, textAlign: "right", outline: "none" }}
                            />
                          ) : (
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: val ? "#1a3a5c" : "#ccc", fontWeight: val ? 600 : 400, minWidth: 100, textAlign: "right" }}>
                              {val ? fmt(val) : "— editar"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", background: "#0f2044", marginTop: 4 }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>TOTAL {MESES[mesActivo].toUpperCase()}</span>
              <span style={{ color: "white", fontWeight: 700, fontSize: 18, fontFamily: "'DM Mono', monospace" }}>
                {fmt(proveedores.reduce((s, p) => s + (data[p.id]?.[mesActivo] || 0), 0))}
              </span>
            </div>
          </div>
        )}

        {/* ── COMPARAR MESES ── */}
        {vista === "comparar" && (
          <div style={{ background: "white", borderRadius: 14, overflow: "auto", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#0f2044" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "white", fontWeight: 600, position: "sticky", left: 0, background: "#0f2044", minWidth: 200 }}>Proveedor</th>
                  {mesesTabla.map(i => (
                    <th key={i} style={{ padding: "12px 12px", color: "white", fontWeight: i === mesActivo ? 700 : 400, background: i === mesActivo ? "#1565c0" : "#0f2044", minWidth: 110, textAlign: "right" }}>{MESES[i]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categorias.map(cat => {
                  const provsCat = proveedores.filter(p => p.categoria === cat);
                  const colors = catColors[cat] || PALETTE[0];
                  return [
                    <tr key={`h-${cat}`} style={{ background: colors.bg }}>
                      <td colSpan={mesesTabla.length + 1} style={{ padding: "7px 16px", fontSize: 11, fontWeight: 700, color: colors.accent, letterSpacing: 1, textTransform: "uppercase" }}>● {cat}</td>
                    </tr>,
                    ...provsCat.map((p, pi) => (
                      <tr key={p.id} style={{ background: pi % 2 === 0 ? "white" : "#fafbfc" }}>
                        <td style={{ padding: "9px 16px", color: "#333", fontWeight: 500, position: "sticky", left: 0, background: pi % 2 === 0 ? "white" : "#fafbfc", borderRight: "1px solid #e8edf2" }}>{p.nombre}</td>
                        {mesesTabla.map((mi, idx) => {
                          const val = data[p.id]?.[mi];
                          const prevVal = idx > 0 ? data[p.id]?.[mesesTabla[idx - 1]] : null;
                          return (
                            <td key={mi} style={{ padding: "9px 12px", textAlign: "right", background: mi === mesActivo ? "#f0f7ff" : "inherit", fontFamily: "'DM Mono', monospace" }}>
                              <div style={{ color: val ? "#1a3a5c" : "#ddd", fontWeight: val ? 600 : 400 }}>{val ? fmt(val) : "—"}</div>
                              {val && prevVal && <div style={{ fontSize: 10, color: diffColor(val, prevVal), marginTop: 1 }}>{diffLabel(val, prevVal)}</div>}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ];
                })}
                <tr style={{ background: "#0f2044" }}>
                  <td style={{ padding: "12px 16px", color: "white", fontWeight: 700, position: "sticky", left: 0, background: "#0f2044" }}>TOTAL</td>
                  {mesesTabla.map(mi => (
                    <td key={mi} style={{ padding: "12px 12px", textAlign: "right", color: "white", fontWeight: 700, fontFamily: "'DM Mono', monospace", fontSize: 13, background: mi === mesActivo ? "#1565c0" : "#0f2044" }}>
                      {fmt(proveedores.reduce((s, p) => s + (data[p.id]?.[mi] || 0), 0))}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <p style={{ textAlign: "center", color: "#aaa", fontSize: 12, marginTop: 20 }}>
          Clic en cualquier monto para editarlo · Sube comprobantes para registro automático
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { height: 4px; width: 4px; }
        ::-webkit-scrollbar-track { background: #f0f4f8; }
        ::-webkit-scrollbar-thumb { background: #b0c4de; border-radius: 4px; }
      `}</style>
    </div>
  );
}
