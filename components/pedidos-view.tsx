"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Plus, ChevronLeft, ChevronRight, SlidersHorizontal, Search, CalendarDays, Sparkles, X } from "lucide-react"
import { getToken } from "@/lib/auth-simple"
import { formatDate } from "@/lib/utils"
import { IaConfianzaBadge, type Confianza } from "@/components/ia-confidence-badge"

type EstadoPedido = "procesado" | "pendiente" | "error"

interface Pedido {
  id: number
  referencia: string
  nombre_cliente: string | null
  nombre_empresa: string | null
  fecha_pedido: string | null
  num_productos: number | null
  estado: EstadoPedido
  ia_confianza: Confianza | null
  created_at: string
}

interface Stats {
  total: number
  confirmados: number
  pendientes: number
  errores: number
}

type FiltroEstado = "todos" | EstadoPedido

const MOCK_STATS: Stats = { total: 142, confirmados: 129, pendientes: 11, errores: 2 }
const MOCK_PEDIDOS: Pedido[] = [
  { id: 184, referencia: "PED-2026-00184", nombre_cliente: "Juan García",     nombre_empresa: "Construcciones Martínez S.L.", fecha_pedido: "2026-05-10", num_productos: 6,  estado: "procesado", ia_confianza: "alta",  created_at: "2026-05-14T09:57:00Z" },
  { id: 183, referencia: "PED-2026-00183", nombre_cliente: "María Soler",     nombre_empresa: "Distribuciones Levante S.A.", fecha_pedido: null,          num_productos: 12, estado: "pendiente", ia_confianza: "media", created_at: "2026-05-14T09:38:00Z" },
  { id: 182, referencia: "PED-2026-00182", nombre_cliente: "Andrés Mora",     nombre_empresa: "Talleres Industrial Norte",    fecha_pedido: "2026-05-09", num_productos: 8,  estado: "procesado", ia_confianza: "alta",  created_at: "2026-05-13T10:20:00Z" },
  { id: 181, referencia: "PED-2026-00181", nombre_cliente: "Lucía Hernán",   nombre_empresa: "Ferretería Central, S.L.",     fecha_pedido: null,          num_productos: 4,  estado: "pendiente", ia_confianza: "baja",  created_at: "2026-05-13T08:00:00Z" },
  { id: 180, referencia: "PED-2026-00180", nombre_cliente: "Carlos Iglesias", nombre_empresa: "Reformas Mediterráneas",       fecha_pedido: "2026-05-08", num_productos: 9,  estado: "error",     ia_confianza: null,    created_at: "2026-05-12T16:45:00Z" },
  { id: 179, referencia: "PED-2026-00179", nombre_cliente: "Patricia Vidal",  nombre_empresa: "Suministros Atlántico",        fecha_pedido: "2026-05-08", num_productos: 15, estado: "procesado", ia_confianza: "alta",  created_at: "2026-05-12T14:10:00Z" },
  { id: 178, referencia: "PED-2026-00178", nombre_cliente: "Jorge Sánchez",   nombre_empresa: "Construcciones Pinar Real",    fecha_pedido: "2026-05-07", num_productos: 7,  estado: "procesado", ia_confianza: "media", created_at: "2026-05-11T11:30:00Z" },
  { id: 177, referencia: "PED-2026-00177", nombre_cliente: "Elena Torres",    nombre_empresa: "Industrias Químicas Ribera",   fecha_pedido: null,          num_productos: 3,  estado: "pendiente", ia_confianza: "baja",  created_at: "2026-05-11T09:00:00Z" },
  { id: 176, referencia: "PED-2026-00176", nombre_cliente: "Roberto Núñez",   nombre_empresa: "Almacenes Cantábrico, S.L.",   fecha_pedido: "2026-05-06", num_productos: 22, estado: "procesado", ia_confianza: "alta",  created_at: "2026-05-10T17:20:00Z" },
]

function tiempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h}h`
  const d = Math.floor(h / 24)
  if (d === 1) return "ayer"
  return `hace ${d} días`
}

function EstadoBadge({ estado }: { estado: EstadoPedido }) {
  const cfg = {
    procesado: { label: "Procesado", bg: "#e7f5ee", color: "#2a8a5d" },
    pendiente:  { label: "Pendiente", bg: "#fbf1d9", color: "#b07a12" },
    error:      { label: "Error",     bg: "#fbe9e6", color: "#c0382a" },
  }[estado]
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

interface Props {
  basePath: string
}

export function PedidosView({ basePath }: Props) {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<FiltroEstado>("todos")
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [busqueda, setBusqueda] = useState("")
  const [filtrosOpen, setFiltrosOpen] = useState(false)
  const [filtrosPos, setFiltrosPos] = useState<{ top: number; left: number } | null>(null)
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [confianzaFiltro, setConfianzaFiltro] = useState<Confianza | "">("")
  const filtrosRef = useRef<HTMLDivElement>(null)

  const cargarDatos = useCallback(async (estado: FiltroEstado, page: number, q = "") => {
    setLoading(true)
    if (process.env.NODE_ENV === "development") {
      await new Promise(r => setTimeout(r, 400))
      let filtrados = estado === "todos" ? MOCK_PEDIDOS : MOCK_PEDIDOS.filter(p => p.estado === estado)
      if (q) {
        const term = q.toLowerCase()
        filtrados = filtrados.filter(p =>
          p.nombre_cliente?.toLowerCase().includes(term) ||
          p.nombre_empresa?.toLowerCase().includes(term) ||
          p.referencia.toLowerCase().includes(term)
        )
      }
      setPedidos(filtrados)
      setStats(MOCK_STATS)
      setTotalPaginas(16)
      setLoading(false)
      return
    }
    try {
      const token = getToken()
      const params = new URLSearchParams({ page: String(page), per_page: "15" })
      if (estado !== "todos") params.set("estado", estado)
      if (q) params.set("search", q)
      const [resPedidos, resStats] = await Promise.all([
        fetch(`/api/pedidos?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/pedidos/stats", { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (resPedidos.ok) {
        const json = await resPedidos.json()
        setPedidos(json.data ?? [])
        setTotalPaginas(json.meta?.last_page ?? 1)
      }
      if (resStats.ok) {
        const json = await resStats.json()
        setStats(json.data ?? null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargarDatos(filtro, pagina, busqueda) }, [filtro, pagina, busqueda, cargarDatos])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (filtrosRef.current && !filtrosRef.current.contains(e.target as Node)) {
        setFiltrosOpen(false); setFiltrosPos(null)
      }
    }
    if (filtrosOpen) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [filtrosOpen])

  function cambiarFiltro(f: FiltroEstado) { setFiltro(f); setPagina(1) }
  function limpiarFiltrosExtra() { setFechaDesde(""); setFechaHasta(""); setConfianzaFiltro(""); setPagina(1) }

  const filtrosActivosCount = [fechaDesde, fechaHasta, confianzaFiltro].filter(Boolean).length
  const pedidosFiltrados = pedidos.filter(p => {
    if (fechaDesde && p.fecha_pedido && p.fecha_pedido < fechaDesde) return false
    if (fechaHasta && p.fecha_pedido && p.fecha_pedido > fechaHasta) return false
    if (confianzaFiltro && p.ia_confianza !== confianzaFiltro) return false
    return true
  })

  const filtrosTabs: { key: FiltroEstado; label: string; count?: number }[] = [
    { key: "todos",     label: "Todos",      count: stats?.total },
    { key: "procesado", label: "Procesados", count: stats?.confirmados },
    { key: "pendiente", label: "Pendientes", count: stats?.pendientes },
    { key: "error",     label: "Con error",  count: stats?.errores },
  ]

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Topbar */}
      <div
        className="shrink-0 flex flex-col md:flex-row md:items-center gap-2 px-4 md:px-6 py-2 md:py-0"
        style={{ minHeight: 48, borderBottom: "1px solid #ebe4d8", background: "#ffffff" }}
      >
        <div className="flex items-center justify-between md:justify-start gap-4 md:shrink-0">
          <div className="flex flex-col justify-center">
            <span className="font-medium text-sm" style={{ color: "#1a1410" }}>Pedidos</span>
            {stats && <span className="text-xs" style={{ color: "#847a6f" }}>{stats.total} en total</span>}
          </div>
          <button
            type="button"
            onClick={() => router.push(`${basePath}/nuevo`)}
            className="flex md:hidden items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-[10px] transition-colors"
            style={{ background: "#f57a26", color: "#ffffff" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#d96017")}
            onMouseLeave={e => (e.currentTarget.style.background = "#f57a26")}
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 pointer-events-none" style={{ color: "#b8aea1" }} />
          <input
            type="text"
            placeholder="Buscar por cliente, empresa o referencia…"
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); setPagina(1) }}
            className="w-full text-xs pl-8 pr-3 rounded-[10px] outline-none transition-colors"
            style={{ height: 32, border: "1px solid #ebe4d8", background: "#faf7f2", color: "#1a1410" }}
            onFocus={e => { e.currentTarget.style.borderColor = "#f57a26"; e.currentTarget.style.background = "#ffffff" }}
            onBlur={e => { e.currentTarget.style.borderColor = "#ebe4d8"; e.currentTarget.style.background = "#faf7f2" }}
          />
        </div>
        <button
          type="button"
          onClick={() => router.push(`${basePath}/nuevo`)}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-[10px] transition-colors shrink-0"
          style={{ background: "#f57a26", color: "#ffffff" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#d96017")}
          onMouseLeave={e => (e.currentTarget.style.background = "#f57a26")}
        >
          <Plus className="size-3.5" /> Nuevo pedido
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            {[
              { label: "Pedidos totales",        value: stats.total,       sub: "+8 esta semana",       subColor: "#2a8a5d" },
              { label: "Confirmados",             value: stats.confirmados, sub: `${Math.round(stats.confirmados/stats.total*100)}% del total`, subColor: "#847a6f" },
              { label: "Pendientes de revisión",  value: stats.pendientes,  sub: "Requieren atención",   subColor: "#b07a12" },
              { label: "Con error",               value: stats.errores,     sub: "Reprocesa o sube de nuevo", subColor: "#c0382a" },
            ].map(s => (
              <div key={s.label} className="rounded-[14px] p-4" style={{ background: "#ffffff", border: "1px solid #ebe4d8" }}>
                <p className="text-xs mb-2" style={{ color: "#847a6f" }}>{s.label}</p>
                <p className="text-2xl font-semibold" style={{ color: "#1a1410" }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: s.subColor }}>{s.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter bar */}
        <div
          className="flex flex-wrap items-center justify-between gap-2 mb-4 px-3 md:px-4 py-2 rounded-[12px]"
          style={{ background: "#ffffff", border: "1px solid #ebe4d8" }}
        >
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-xs mr-2" style={{ color: "#847a6f" }}>Estado:</span>
            {filtrosTabs.map(f => (
              <button
                key={f.key}
                type="button"
                onClick={() => cambiarFiltro(f.key)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-[8px] transition-colors"
                style={{
                  background: filtro === f.key ? "#f3eee6" : "transparent",
                  color: filtro === f.key ? "#1a1410" : "#847a6f",
                  fontWeight: filtro === f.key ? 500 : 400,
                }}
              >
                {f.label}
                {f.count !== undefined && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: filtro === f.key ? "#ebe4d8" : "#f3eee6", color: "#847a6f" }}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "#b8aea1" }}>
              {loading ? "Cargando…" : `Mostrando ${pedidosFiltrados.length} de ${stats?.total ?? "—"}`}
            </span>
            <div className="relative" ref={filtrosRef}>
              <button
                type="button"
                onClick={e => {
                  if (filtrosOpen) { setFiltrosOpen(false); setFiltrosPos(null); return }
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                  const W = 320
                  const left = Math.max(8, Math.min(rect.right - W, window.innerWidth - W - 8))
                  setFiltrosPos({ top: rect.bottom + 6, left })
                  setFiltrosOpen(true)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[8px] transition-colors"
                style={{
                  border: `1px solid ${filtrosOpen || filtrosActivosCount > 0 ? "#f57a26" : "#ebe4d8"}`,
                  background: filtrosOpen ? "#fff5ec" : "#ffffff",
                  color: filtrosActivosCount > 0 ? "#f57a26" : "#4a423b",
                }}
              >
                <SlidersHorizontal className="size-3" /> Filtros
                {filtrosActivosCount > 0 && (
                  <span className="size-4 rounded-full text-[10px] flex items-center justify-center font-medium" style={{ background: "#f57a26", color: "#ffffff" }}>
                    {filtrosActivosCount}
                  </span>
                )}
              </button>

              {filtrosOpen && filtrosPos && (
                <div
                  className="rounded-[16px] w-80 max-w-[calc(100vw-1rem)]"
                  style={{ position: "fixed", top: filtrosPos.top, left: filtrosPos.left, zIndex: 200, background: "#ffffff", border: "1px solid #ebe4d8", boxShadow: "0 8px 24px rgba(26,20,16,0.10), 0 2px 6px rgba(26,20,16,0.06)" }}
                >
                  <div className="flex items-center justify-between px-4 pt-4 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-[7px] flex items-center justify-center" style={{ background: "#f3eee6" }}>
                        <SlidersHorizontal className="size-3.5" style={{ color: "#f57a26" }} />
                      </div>
                      <span className="text-sm font-semibold" style={{ color: "#1a1410" }}>Filtros</span>
                      {filtrosActivosCount > 0 && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "#f57a26", color: "#fff" }}>
                          {filtrosActivosCount}
                        </span>
                      )}
                    </div>
                    <button type="button" onClick={() => { setFiltrosOpen(false); setFiltrosPos(null) }} className="size-6 flex items-center justify-center rounded-[7px] transition-colors" style={{ color: "#b8aea1" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#f3eee6" }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}>
                      <X className="size-3.5" />
                    </button>
                  </div>
                  <div className="px-4 pb-4 flex flex-col gap-5">
                    <div style={{ height: 1, background: "#f3eee6" }} />
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="size-3.5" style={{ color: "#b8aea1" }} />
                        <span className="text-xs font-semibold" style={{ color: "#4a423b" }}>Rango de fechas</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[["Desde", fechaDesde, setFechaDesde], ["Hasta", fechaHasta, setFechaHasta]].map(([label, val, setter]) => (
                          <div key={label as string} className="flex flex-col gap-1">
                            <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "#b8aea1" }}>{label as string}</p>
                            <input type="date" value={val as string} onChange={e => { (setter as (v: string) => void)(e.target.value); setPagina(1) }} className="w-full text-xs px-2.5 py-2 rounded-[10px] outline-none" style={{ border: "1px solid #ebe4d8", background: "#faf7f2", color: "#1a1410" }} onFocus={e => { e.currentTarget.style.borderColor = "#f57a26"; e.currentTarget.style.background = "#fff" }} onBlur={e => { e.currentTarget.style.borderColor = "#ebe4d8"; e.currentTarget.style.background = "#faf7f2" }} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ height: 1, background: "#f3eee6" }} />
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="size-3.5" style={{ color: "#b8aea1" }} />
                        <span className="text-xs font-semibold" style={{ color: "#4a423b" }}>Confianza IA</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {([
                          { value: "",      label: "Todas",  activeBg: "#f3eee6", activeColor: "#4a423b", dot: null },
                          { value: "alta",  label: "Alta",   activeBg: "#e7f5ee", activeColor: "#2a8a5d", dot: "#2a8a5d" },
                          { value: "media", label: "Media",  activeBg: "#fbf1d9", activeColor: "#b07a12", dot: "#b07a12" },
                          { value: "baja",  label: "Baja",   activeBg: "#fbe9e6", activeColor: "#c0382a", dot: "#c0382a" },
                        ] as const).map(c => {
                          const active = confianzaFiltro === c.value
                          return (
                            <button key={c.value} type="button" onClick={() => { setConfianzaFiltro(c.value as Confianza | ""); setPagina(1) }} className="flex flex-col items-center gap-1 py-2 rounded-[10px] transition-colors" style={{ border: `1px solid ${active ? (c.dot ?? "#ebe4d8") : "#ebe4d8"}`, background: active ? c.activeBg : "#faf7f2", color: active ? c.activeColor : "#847a6f" }}>
                              {c.dot && <span className="size-2 rounded-full" style={{ background: c.dot, opacity: active ? 1 : 0.35 }} />}
                              <span className="text-[11px] font-medium">{c.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      {filtrosActivosCount > 0 && (
                        <button type="button" onClick={limpiarFiltrosExtra} className="flex-1 py-2 text-xs font-medium rounded-[10px] transition-colors" style={{ border: "1px solid #ebe4d8", background: "#ffffff", color: "#4a423b" }} onMouseEnter={e => (e.currentTarget.style.background = "#f3eee6")} onMouseLeave={e => (e.currentTarget.style.background = "#ffffff")}>
                          Limpiar
                        </button>
                      )}
                      <button type="button" onClick={() => { setFiltrosOpen(false); setFiltrosPos(null) }} className="flex-1 py-2 text-xs font-medium rounded-[10px] transition-colors" style={{ background: "#f57a26", color: "#ffffff" }} onMouseEnter={e => (e.currentTarget.style.background = "#d96017")} onMouseLeave={e => (e.currentTarget.style.background = "#f57a26")}>
                        Aplicar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-[14px] overflow-hidden" style={{ border: "1px solid #ebe4d8" }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr style={{ background: "#faf7f2", borderBottom: "1px solid #ebe4d8" }}>
                  {["ID / Cliente", "Empresa", "Fecha pedido", "Productos", "Estado", "Confianza IA", "Procesado"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: "#847a6f" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f3eee6" }}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-3 rounded-full animate-pulse" style={{ background: "#f3eee6", width: j === 0 ? 120 : j === 3 ? 40 : 80 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : pedidosFiltrados.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: "#b8aea1" }}>No hay pedidos con este filtro</td></tr>
                ) : pedidosFiltrados.map((p, i) => (
                  <tr
                    key={p.id}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: i < pedidosFiltrados.length - 1 ? "1px solid #f3eee6" : "none", background: "#ffffff" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#faf7f2")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#ffffff")}
                    onClick={() => router.push(`${basePath}/${p.id}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium" style={{ color: "#1a1410" }}>{p.nombre_cliente ?? "—"}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#b8aea1" }}>{p.referencia}</p>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#4a423b" }}>{p.nombre_empresa ?? "—"}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#4a423b" }}>
                      {p.fecha_pedido ? formatDate(p.fecha_pedido) : <span style={{ color: "#ddd4c4" }}>—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#4a423b" }}>{p.num_productos ?? <span style={{ color: "#ddd4c4" }}>—</span>}</td>
                    <td className="px-4 py-3"><EstadoBadge estado={p.estado} /></td>
                    <td className="px-4 py-3">{p.ia_confianza ? <IaConfianzaBadge nivel={p.ia_confianza} /> : <span style={{ color: "#ddd4c4" }}>—</span>}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#b8aea1" }}>{tiempoRelativo(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs" style={{ color: "#847a6f" }}>Página {pagina} de {totalPaginas}</span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={pagina <= 1} onClick={() => setPagina(p => p - 1)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-[8px] transition-colors" style={{ border: "1px solid #ebe4d8", background: "#ffffff", color: pagina <= 1 ? "#ddd4c4" : "#4a423b", cursor: pagina <= 1 ? "not-allowed" : "pointer" }} onMouseEnter={e => { if (pagina > 1) (e.currentTarget as HTMLElement).style.background = "#f3eee6" }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#ffffff" }}>
                <ChevronLeft className="size-3" /> Anterior
              </button>
              <button type="button" disabled={pagina >= totalPaginas} onClick={() => setPagina(p => p + 1)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-[8px] transition-colors" style={{ border: "1px solid #ebe4d8", background: "#ffffff", color: pagina >= totalPaginas ? "#ddd4c4" : "#4a423b", cursor: pagina >= totalPaginas ? "not-allowed" : "pointer" }} onMouseEnter={e => { if (pagina < totalPaginas) (e.currentTarget as HTMLElement).style.background = "#f3eee6" }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#ffffff" }}>
                Siguiente <ChevronRight className="size-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
