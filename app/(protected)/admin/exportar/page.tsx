"use client"

import { useState, useRef, useEffect } from "react"
import { Download, Webhook, Server, FileText, CheckCircle2, AlertCircle, ChevronDown, Clock, X, Loader2, HelpCircle } from "lucide-react"
import { toast } from "sonner"

type Modo = "manual" | "webhook" | "api"
type Formato = "csv" | "json" | "xlsx"

interface Pedido {
  id: string
  empresa: string
  empleado: string
  fecha: string
  importe: string
  estado: "confirmado" | "pendiente" | "exportado"
}

const PEDIDOS_MOCK: Pedido[] = [
  { id: "PED-2024-0091", empresa: "Aceros del Norte S.L.",  empleado: "María López",     fecha: "2024-12-10", importe: "4.200,00 €", estado: "confirmado" },
  { id: "PED-2024-0090", empresa: "Fundición Ibérica S.A.", empleado: "Carlos Ruiz",     fecha: "2024-12-10", importe: "1.850,00 €", estado: "confirmado" },
  { id: "PED-2024-0089", empresa: "Distribuciones Ágora",   empleado: "Ana Martínez",    fecha: "2024-12-09", importe: "7.300,00 €", estado: "confirmado" },
  { id: "PED-2024-0088", empresa: "Química Levante S.L.",   empleado: "Pedro García",    fecha: "2024-12-09", importe: "2.100,00 €", estado: "exportado"  },
  { id: "PED-2024-0087", empresa: "Metalúrgica Vega",       empleado: "Laura Sánchez",   fecha: "2024-12-08", importe: "5.600,00 €", estado: "exportado"  },
  { id: "PED-2024-0086", empresa: "Grupo Textil Meridiano", empleado: "María López",     fecha: "2024-12-08", importe: "3.400,00 €", estado: "confirmado" },
  { id: "PED-2024-0085", empresa: "Papelera San Marcos",    empleado: "Carlos Ruiz",     fecha: "2024-12-07", importe: "980,00 €",   estado: "confirmado" },
  { id: "PED-2024-0084", empresa: "Envases Plásticos Tec.", empleado: "Ana Martínez",    fecha: "2024-12-07", importe: "6.750,00 €", estado: "exportado"  },
  { id: "PED-2024-0083", empresa: "Aceros del Norte S.L.",  empleado: "Pedro García",    fecha: "2024-12-06", importe: "2.300,00 €", estado: "confirmado" },
  { id: "PED-2024-0082", empresa: "Distribuciones Ágora",   empleado: "Laura Sánchez",   fecha: "2024-12-06", importe: "1.120,00 €", estado: "exportado"  },
  { id: "PED-2024-0081", empresa: "Química Levante S.L.",   empleado: "María López",     fecha: "2024-12-05", importe: "4.890,00 €", estado: "confirmado" },
  { id: "PED-2024-0080", empresa: "Fundición Ibérica S.A.", empleado: "Carlos Ruiz",     fecha: "2024-12-05", importe: "3.200,00 €", estado: "exportado"  },
]

const HISTORIAL_MOCK = [
  { id: 1, fecha: "2024-12-09 14:32", pedidos: 8,  formato: "CSV",  modo: "Manual",   usuario: "Carla Méndez" },
  { id: 2, fecha: "2024-12-07 09:15", pedidos: 12, formato: "JSON", modo: "Webhook",  usuario: "Sistema"      },
  { id: 3, fecha: "2024-12-05 17:48", pedidos: 5,  formato: "XLSX", modo: "Manual",   usuario: "Carla Méndez" },
  { id: 4, fecha: "2024-12-03 11:20", pedidos: 9,  formato: "CSV",  modo: "API REST", usuario: "Sistema"      },
]

const MODO_OPTIONS = [
  { value: "manual",  label: "Manual (CSV/JSON)", description: "Descarga periódica desde este panel.", icon: Download },
  { value: "webhook", label: "Webhook automático", description: "Push al ERP al confirmar.", icon: Webhook, badge: "Activo" },
  { value: "api",     label: "API REST (polling)", description: "El ERP consulta el endpoint.", icon: Server },
]

const FORMATO_OPTIONS: { value: Formato; label: string }[] = [
  { value: "csv",  label: "CSV (separado por comas)"  },
  { value: "json", label: "JSON (estructurado)"        },
  { value: "xlsx", label: "XLSX (Excel)"               },
]

export default function ExportarPage() {
  const [modo, setModo]         = useState<Modo>("webhook")
  const [formato, setFormato]   = useState<Formato>("csv")
  const [desde, setDesde]       = useState("2024-12-05")
  const [hasta, setHasta]       = useState("2024-12-10")
  const [loading, setLoading]   = useState(false)
  const [showHistorial, setShowHistorial] = useState(false)
  const [formatoOpen, setFormatoOpen]     = useState(false)
  const formatoRef = useRef<HTMLDivElement>(null)

  // Webhook config
  const [webhookUrl, setWebhookUrl]           = useState("https://erp.empresa.es/api/pedidos/ingest")
  const [webhookSecret, setWebhookSecret]     = useState("")
  const [webhookEditando, setWebhookEditando] = useState(false)
  const [webhookUrlTemp, setWebhookUrlTemp]   = useState("")
  const [webhookSecretTemp, setWebhookSecretTemp] = useState("")
  const [webhookGuardando, setWebhookGuardando]   = useState(false)
  const [webhookStatus, setWebhookStatus]         = useState<"ok" | "error" | "unknown" | "checking">("unknown")
  const [webhookStatusDetail, setWebhookStatusDetail] = useState("")

  // API config
  const [apiToken, setApiToken]           = useState("sk-prod-••••••••••••••••")
  const [apiEditando, setApiEditando]     = useState(false)
  const [apiTokenTemp, setApiTokenTemp]   = useState("")
  const [apiGuardando, setApiGuardando]   = useState(false)

  function iniciarEditWebhook() {
    setWebhookUrlTemp(webhookUrl)
    setWebhookSecretTemp(webhookSecret)
    setWebhookEditando(true)
  }

  async function guardarWebhook() {
    if (!webhookUrlTemp.trim()) return
    setWebhookGuardando(true)
    await new Promise(r => setTimeout(r, 400))
    setWebhookUrl(webhookUrlTemp)
    setWebhookSecret(webhookSecretTemp)
    setWebhookStatus("unknown")
    setWebhookStatusDetail("")
    setWebhookGuardando(false)
    setWebhookEditando(false)
    toast.success("Webhook guardado — prueba la conexión para verificarlo")
  }

  async function probarWebhook() {
    setWebhookStatus("checking")
    setWebhookStatusDetail("")
    try {
      const res = await fetch("/api/webhook/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl, secret: webhookSecret }),
      })
      const data = await res.json() as { ok: boolean; status?: number; statusText?: string; error?: string }
      if (data.ok) {
        setWebhookStatus("ok")
        setWebhookStatusDetail(data.status ? `${data.status} ${data.statusText ?? ""}`.trim() : "OK")
        toast.success(`Webhook respondió con ${data.status ?? 200} OK`)
      } else {
        setWebhookStatus("error")
        const detail = data.error ?? (data.status ? `${data.status} ${data.statusText ?? ""}`.trim() : "Error")
        setWebhookStatusDetail(detail)
        toast.error(`El webhook no respondió correctamente: ${detail}`)
      }
    } catch {
      setWebhookStatus("error")
      setWebhookStatusDetail("Sin conexión")
      toast.error("No se pudo contactar con el servidor")
    }
  }

  function iniciarEditApi() {
    setApiTokenTemp("")
    setApiEditando(true)
  }

  async function guardarApi() {
    setApiGuardando(true)
    await new Promise(r => setTimeout(r, 800))
    if (apiTokenTemp.trim()) setApiToken(apiTokenTemp)
    setApiGuardando(false)
    setApiEditando(false)
    toast.success("Token de API actualizado")
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (formatoRef.current && !formatoRef.current.contains(e.target as Node)) {
        setFormatoOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const pedidosFiltrados = PEDIDOS_MOCK.filter(p => {
    if (!desde && !hasta) return true
    const d = p.fecha
    if (desde && d < desde) return false
    if (hasta && d > hasta) return false
    return true
  })

  const pedidosExportables = pedidosFiltrados.filter(p => p.estado === "confirmado")

  function generarCSV(pedidos: Pedido[]) {
    const header = "ID,Empresa,Empleado,Fecha,Importe,Estado\n"
    const rows = pedidos.map(p =>
      `${p.id},"${p.empresa}","${p.empleado}",${p.fecha},"${p.importe}",${p.estado}`
    ).join("\n")
    return header + rows
  }

  async function handleDescargar() {
    if (!pedidosExportables.length) { toast.error("No hay pedidos confirmados en el rango seleccionado"); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    const contenido = generarCSV(pedidosExportables)
    const mime = formato === "json" ? "application/json" : "text/csv"
    const ext  = formato === "json" ? "json" : formato === "xlsx" ? "xlsx" : "csv"
    const data  = formato === "json"
      ? JSON.stringify(pedidosExportables, null, 2)
      : contenido
    const blob  = new Blob([data], { type: mime })
    const url   = URL.createObjectURL(blob)
    const a     = document.createElement("a")
    a.href      = url
    a.download  = `pedidos-erp-${desde}-${hasta}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${pedidosExportables.length} pedidos exportados como ${formato.toUpperCase()}`)
  }

  const estadoBadge = (estado: Pedido["estado"]) => {
    const styles: Record<Pedido["estado"], { bg: string; color: string; label: string }> = {
      confirmado: { bg: "rgba(34,197,94,0.1)",  color: "#16a34a", label: "Confirmado" },
      pendiente:  { bg: "rgba(234,179,8,0.1)",  color: "#a16207", label: "Pendiente"  },
      exportado:  { bg: "rgba(99,102,241,0.1)", color: "#4338ca", label: "Exportado"  },
    }
    const s = styles[estado]
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.color }}>
        {s.label}
      </span>
    )
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "#1a1410" }}>Exportación a ERP</h1>
          <p className="text-sm mt-1" style={{ color: "#847a6f" }}>Envía los pedidos confirmados a tu ERP. Manual, automático o por webhook.</p>
        </div>
        {modo === "webhook" && (
          <WebhookStatusBadge status={webhookStatus} detail={webhookStatusDetail} />
        )}
      </div>

      {/* Modo de exportación */}
      <Card title="Modo de exportación" description="Elige cómo quieres que los pedidos lleguen al ERP.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {MODO_OPTIONS.map(opt => {
            const active = modo === opt.value
            const Icon   = opt.icon
            return (
              <button
                key={opt.value}
                onClick={() => setModo(opt.value as Modo)}
                className="flex flex-col gap-2 px-4 py-3.5 rounded-[11px] text-left transition-all"
                style={{
                  border: `1.5px solid ${active ? "rgba(245,122,38,0.4)" : "rgba(235,228,216,0.8)"}`,
                  background: active ? "rgba(245,122,38,0.04)" : "#fffdf9",
                }}
              >
                <div className="flex items-center justify-between">
                  <Icon className="size-4" style={{ color: active ? "#c4622a" : "#847a6f" }} />
                  {opt.badge && (() => {
                    const sc: Record<WebhookStatus, { bg: string; color: string; label: string }> = {
                      ok:       { bg: "rgba(34,197,94,0.1)",   color: "#16a34a", label: "Conectado"    },
                      error:    { bg: "rgba(239,68,68,0.1)",   color: "#dc2626", label: "Error"        },
                      checking: { bg: "rgba(99,102,241,0.08)", color: "#4338ca", label: "Verificando…" },
                      unknown:  { bg: "rgba(184,174,161,0.15)",color: "#847a6f", label: "Sin verificar"},
                    }
                    const s = sc[webhookStatus]
                    return (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    )
                  })()}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#1a1410" }}>{opt.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#847a6f" }}>{opt.description}</p>
                </div>
              </button>
            )
          })}
        </div>

        {modo === "webhook" && (
          <div className="mt-1 p-4 rounded-[12px] flex flex-col gap-3"
            style={{ background: "rgba(245,240,232,0.5)", border: "1px solid rgba(235,228,216,0.8)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold" style={{ color: "#4a423b" }}>Configuración del webhook</p>
                {!webhookEditando && (
                  <WebhookStatusBadge status={webhookStatus} detail={webhookStatusDetail} small />
                )}
              </div>
              {!webhookEditando && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={probarWebhook}
                    disabled={webhookGuardando}
                    className="text-xs px-2.5 py-1 rounded-[7px] transition-colors"
                    style={{ color: "#847a6f", border: "1px solid rgba(235,228,216,0.8)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(235,228,216,0.5)" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
                  >
                    {webhookGuardando ? "Probando…" : "Probar conexión"}
                  </button>
                  <button
                    onClick={iniciarEditWebhook}
                    className="text-xs px-2.5 py-1 rounded-[7px] transition-colors"
                    style={{ color: "#c4622a", border: "1px solid rgba(245,122,38,0.3)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(245,122,38,0.07)" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>

            {!webhookEditando ? (
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px]" style={{ color: "#b8aea1" }}>URL del endpoint</span>
                  <code className="text-xs px-2.5 py-1.5 rounded-[7px] font-mono break-all"
                    style={{ background: "rgba(26,20,16,0.05)", color: "#4a423b" }}>
                    POST {webhookUrl}
                  </code>
                </div>
                {webhookSecret && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px]" style={{ color: "#b8aea1" }}>Secret</span>
                    <code className="text-xs px-2.5 py-1.5 rounded-[7px] font-mono"
                      style={{ background: "rgba(26,20,16,0.05)", color: "#4a423b" }}>
                      {"•".repeat(Math.min(webhookSecret.length, 24))}
                    </code>
                  </div>
                )}
                <p className="text-xs" style={{ color: "#847a6f" }}>Se dispara automáticamente al confirmar cada pedido.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: "#4a423b" }}>URL del endpoint (POST)</label>
                  <input
                    type="url"
                    value={webhookUrlTemp}
                    onChange={e => setWebhookUrlTemp(e.target.value)}
                    placeholder="https://tu-erp.es/api/pedidos/ingest"
                    className="w-full px-3 py-2 text-sm rounded-[9px] outline-none font-mono"
                    style={{ border: "1px solid rgba(245,122,38,0.4)", background: "#fffdf9", color: "#1a1410" }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: "#4a423b" }}>
                    Secret de validación <span style={{ color: "#b8aea1", fontWeight: 400 }}>(opcional)</span>
                  </label>
                  <input
                    type="password"
                    value={webhookSecretTemp}
                    onChange={e => setWebhookSecretTemp(e.target.value)}
                    placeholder="Se enviará en la cabecera X-PDFormatter-Secret"
                    className="w-full px-3 py-2 text-sm rounded-[9px] outline-none"
                    style={{ border: "1px solid rgba(235,228,216,0.8)", background: "#fffdf9", color: "#1a1410" }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={guardarWebhook}
                    disabled={webhookGuardando || !webhookUrlTemp.trim()}
                    className="text-xs px-3 py-1.5 rounded-[8px] font-medium transition-all"
                    style={{
                      background: webhookGuardando || !webhookUrlTemp.trim() ? "rgba(245,122,38,0.4)" : "#f57a26",
                      color: "#fff",
                      cursor: webhookGuardando || !webhookUrlTemp.trim() ? "not-allowed" : "pointer",
                    }}
                  >
                    {webhookGuardando ? "Guardando…" : "Guardar"}
                  </button>
                  <button
                    onClick={() => setWebhookEditando(false)}
                    className="text-xs px-3 py-1.5 rounded-[8px] transition-colors"
                    style={{ color: "#847a6f" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(235,228,216,0.5)" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {modo === "api" && (
          <div className="mt-1 p-4 rounded-[12px] flex flex-col gap-3"
            style={{ background: "rgba(245,240,232,0.5)", border: "1px solid rgba(235,228,216,0.8)" }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold" style={{ color: "#4a423b" }}>Configuración de API REST</p>
              {!apiEditando && (
                <button
                  onClick={iniciarEditApi}
                  className="text-xs px-2.5 py-1 rounded-[7px] transition-colors"
                  style={{ color: "#c4622a", border: "1px solid rgba(245,122,38,0.3)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(245,122,38,0.07)" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
                >
                  Editar
                </button>
              )}
            </div>

            {!apiEditando ? (
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px]" style={{ color: "#b8aea1" }}>Endpoint de consulta</span>
                  <code className="text-xs px-2.5 py-1.5 rounded-[7px] font-mono break-all"
                    style={{ background: "rgba(26,20,16,0.05)", color: "#4a423b" }}>
                    GET https://pdformatter.es/api/v1/pedidos?estado=confirmado
                  </code>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px]" style={{ color: "#b8aea1" }}>Token de acceso</span>
                  <code className="text-xs px-2.5 py-1.5 rounded-[7px] font-mono"
                    style={{ background: "rgba(26,20,16,0.05)", color: "#4a423b" }}>
                    {apiToken}
                  </code>
                </div>
                <p className="text-xs" style={{ color: "#847a6f" }}>
                  Enviar como <code className="font-mono">Authorization: Bearer &lt;token&gt;</code> en la cabecera.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: "#4a423b" }}>Nuevo token de acceso</label>
                  <input
                    type="text"
                    value={apiTokenTemp}
                    onChange={e => setApiTokenTemp(e.target.value)}
                    placeholder="sk-prod-…"
                    className="w-full px-3 py-2 text-sm rounded-[9px] outline-none font-mono"
                    style={{ border: "1px solid rgba(245,122,38,0.4)", background: "#fffdf9", color: "#1a1410" }}
                  />
                  <p className="text-[11px]" style={{ color: "#b8aea1" }}>
                    Deja vacío para mantener el token actual.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={guardarApi}
                    disabled={apiGuardando}
                    className="text-xs px-3 py-1.5 rounded-[8px] font-medium transition-all"
                    style={{
                      background: apiGuardando ? "rgba(245,122,38,0.4)" : "#f57a26",
                      color: "#fff",
                      cursor: apiGuardando ? "not-allowed" : "pointer",
                    }}
                  >
                    {apiGuardando ? "Guardando…" : "Guardar"}
                  </button>
                  <button
                    onClick={() => setApiEditando(false)}
                    className="text-xs px-3 py-1.5 rounded-[8px] transition-colors"
                    style={{ color: "#847a6f" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(235,228,216,0.5)" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Filtros y descarga */}
      <Card title="Pedidos a exportar" description="Selecciona el rango y formato antes de descargar.">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: "#4a423b" }}>Desde</label>
            <input
              type="date"
              value={desde}
              onChange={e => setDesde(e.target.value)}
              className="px-3 py-2 text-sm rounded-[9px] outline-none"
              style={{ border: "1px solid rgba(235,228,216,0.8)", background: "#fffdf9", color: "#1a1410" }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: "#4a423b" }}>Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={e => setHasta(e.target.value)}
              className="px-3 py-2 text-sm rounded-[9px] outline-none"
              style={{ border: "1px solid rgba(235,228,216,0.8)", background: "#fffdf9", color: "#1a1410" }}
            />
          </div>
          {/* Formato dropdown */}
          <div className="flex flex-col gap-1 relative" ref={formatoRef}>
            <label className="text-xs font-medium" style={{ color: "#4a423b" }}>Formato</label>
            <button
              onClick={() => setFormatoOpen(v => !v)}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-[9px] outline-none"
              style={{ border: "1px solid rgba(235,228,216,0.8)", background: "#fffdf9", color: "#1a1410", minWidth: 180 }}
            >
              <FileText className="size-4 shrink-0" style={{ color: "#847a6f" }} />
              <span className="flex-1 text-left">{FORMATO_OPTIONS.find(f => f.value === formato)?.label}</span>
              <ChevronDown className="size-4 shrink-0" style={{ color: "#847a6f" }} />
            </button>
            {formatoOpen && (
              <div
                className="absolute top-full left-0 mt-1 z-20 rounded-[10px] py-1 shadow-lg"
                style={{ border: "1px solid rgba(235,228,216,0.8)", background: "#fffdf9", minWidth: 200 }}
              >
                {FORMATO_OPTIONS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => { setFormato(f.value); setFormatoOpen(false) }}
                    className="w-full text-left px-3 py-2 text-sm transition-colors"
                    style={{
                      color: formato === f.value ? "#c4622a" : "#4a423b",
                      background: formato === f.value ? "rgba(245,122,38,0.05)" : "transparent",
                    }}
                    onMouseEnter={e => { if (formato !== f.value) (e.currentTarget as HTMLElement).style.background = "rgba(235,228,216,0.4)" }}
                    onMouseLeave={e => { if (formato !== f.value) (e.currentTarget as HTMLElement).style.background = "transparent" }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleDescargar}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-[9px] text-sm font-medium transition-all"
            style={{
              background: loading ? "rgba(245,122,38,0.5)" : "#f57a26",
              color: "#ffffff",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            <Download className="size-4" />
            {loading ? "Preparando…" : "Descargar ahora"}
          </button>
        </div>

        <div className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: "#b8aea1" }}>
          <AlertCircle className="size-3.5" />
          {pedidosExportables.length} pedido{pedidosExportables.length !== 1 ? "s" : ""} confirmado{pedidosExportables.length !== 1 ? "s" : ""} en el rango seleccionado
        </div>

        {/* Tabla */}
        <div className="mt-2 overflow-x-auto rounded-[10px]" style={{ border: "1px solid rgba(235,228,216,0.8)" }}>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(235,228,216,0.8)", background: "rgba(245,240,232,0.4)" }}>
                {["Pedido", "Empresa", "Empleado", "Fecha", "Importe", "Estado"].map(col => (
                  <th key={col} className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: "#847a6f" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pedidosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: "#b8aea1" }}>
                    No hay pedidos en el rango seleccionado
                  </td>
                </tr>
              ) : (
                pedidosFiltrados.map((p, i) => (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: i < pedidosFiltrados.length - 1 ? "1px solid rgba(235,228,216,0.5)" : "none",
                      background: p.estado === "exportado" ? "rgba(245,240,232,0.2)" : "transparent",
                    }}
                  >
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-mono font-medium" style={{ color: "#c4622a" }}>{p.id}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "#1a1410" }}>{p.empresa}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "#4a423b" }}>{p.empleado}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "#847a6f" }}>{p.fecha}</td>
                    <td className="px-4 py-2.5 text-xs font-medium" style={{ color: "#1a1410" }}>{p.importe}</td>
                    <td className="px-4 py-2.5">{estadoBadge(p.estado)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Historial */}
      <Card
        title="Historial de exports"
        description="Últimas exportaciones realizadas"
        action={
          <button
            onClick={() => setShowHistorial(v => !v)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-[8px] transition-colors"
            style={{ color: "#847a6f", border: "1px solid rgba(235,228,216,0.8)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(235,228,216,0.4)" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
          >
            <Clock className="size-3.5" />
            {showHistorial ? "Ocultar" : "Ver historial"}
          </button>
        }
      >
        {showHistorial && (
          <div className="overflow-x-auto rounded-[10px]" style={{ border: "1px solid rgba(235,228,216,0.8)" }}>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(235,228,216,0.8)", background: "rgba(245,240,232,0.4)" }}>
                  {["Fecha", "Pedidos", "Formato", "Modo", "Usuario"].map(col => (
                    <th key={col} className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: "#847a6f" }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HISTORIAL_MOCK.map((h, i) => (
                  <tr
                    key={h.id}
                    style={{ borderBottom: i < HISTORIAL_MOCK.length - 1 ? "1px solid rgba(235,228,216,0.5)" : "none" }}
                  >
                    <td className="px-4 py-2.5 text-xs font-mono" style={{ color: "#4a423b" }}>{h.fecha}</td>
                    <td className="px-4 py-2.5 text-xs font-medium" style={{ color: "#1a1410" }}>{h.pedidos}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: "rgba(245,122,38,0.08)", color: "#c4622a" }}>
                        {h.formato}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "#4a423b" }}>{h.modo}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "#847a6f" }}>{h.usuario}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!showHistorial && (
          <p className="text-xs" style={{ color: "#b8aea1" }}>
            {HISTORIAL_MOCK.length} exportaciones registradas. Última: {HISTORIAL_MOCK[0].fecha}.
          </p>
        )}
      </Card>
    </div>
  )
}

type WebhookStatus = "ok" | "error" | "unknown" | "checking"

function WebhookStatusBadge({ status, detail, small }: { status: WebhookStatus; detail: string; small?: boolean }) {
  const cfg: Record<WebhookStatus, { bg: string; border: string; color: string; icon: React.ReactNode; label: string }> = {
    ok:       { bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.2)",   color: "#16a34a", icon: <CheckCircle2 className={small ? "size-3" : "size-3.5"} />, label: `Conectado${detail ? ` · ${detail}` : ""}` },
    error:    { bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.2)",   color: "#dc2626", icon: <AlertCircle  className={small ? "size-3" : "size-3.5"} />, label: `Error${detail ? ` · ${detail}` : ""}` },
    checking: { bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.2)",  color: "#4338ca", icon: <Loader2      className={`${small ? "size-3" : "size-3.5"} animate-spin`} />, label: "Comprobando…" },
    unknown:  { bg: "rgba(184,174,161,0.15)",border: "rgba(184,174,161,0.3)", color: "#847a6f", icon: <HelpCircle   className={small ? "size-3" : "size-3.5"} />, label: "Sin verificar" },
  }
  const c = cfg[status]
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full font-medium shrink-0 ${small ? "text-[10px] px-1.5 py-0.5" : "text-xs px-3 py-1.5"}`}
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      {c.icon}
      {!small && <span>Webhook · {c.label}</span>}
      {small  && <span>{c.label}</span>}
    </div>
  )
}

function Card({ title, description, children, action }: {
  title: string
  description: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div
      className="rounded-[14px] p-5 flex flex-col gap-4"
      style={{ border: "1px solid rgba(235,228,216,0.8)", background: "rgba(255,253,250,0.7)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "#1a1410" }}>{title}</h2>
          <p className="text-xs mt-0.5" style={{ color: "#b8aea1" }}>{description}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}
