"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, ChevronRight, SlidersHorizontal, Search, CalendarDays, Sparkles, X } from "lucide-react"
import { IaConfianzaBadge, type Confianza } from "@/components/ia-confidence-badge"
import { formatDate } from "@/lib/utils"

type EstadoPedido = "procesado" | "pendiente" | "error"
type FiltroEstado = "todos" | EstadoPedido

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
  empleado_nombre: string
  empleado_id: number
}

const EMPLEADOS = [
  { id: 1, nombre: "Diego Ruiz" },
  { id: 2, nombre: "Marina López" },
  { id: 3, nombre: "Carla Méndez" },
  { id: 4, nombre: "Hugo Prieto" },
  { id: 5, nombre: "Sara Alonso" },
]

const MOCK_PEDIDOS: Pedido[] = [
  { id: 198, referencia: "PED-2026-00198", nombre_cliente: "Marcos Rey",      nombre_empresa: "Constructora Sur",           fecha_pedido: "2026-05-13", num_productos: 8,  estado: "procesado", ia_confianza: "alta",  created_at: "2026-05-13T11:00:00Z", empleado_nombre: "Sara Alonso",  empleado_id: 5 },
  { id: 197, referencia: "PED-2026-00197", nombre_cliente: "Paula Serrano",   nombre_empresa: "Metales Ibérica S.L.",       fecha_pedido: "2026-05-13", num_productos: 5,  estado: "pendiente", ia_confianza: "media", created_at: "2026-05-13T10:30:00Z", empleado_nombre: "Diego Ruiz",   empleado_id: 1 },
  { id: 196, referencia: "PED-2026-00196", nombre_cliente: "Carlos Vidal",    nombre_empresa: "Reformas del Sur",           fecha_pedido: "2026-05-12", num_productos: 11, estado: "procesado", ia_confianza: "alta",  created_at: "2026-05-12T16:20:00Z", empleado_nombre: "Marina López", empleado_id: 2 },
  { id: 195, referencia: "PED-2026-00195", nombre_cliente: "Elena Fuentes",   nombre_empresa: "Suministros Atlántico",      fecha_pedido: "2026-05-12", num_productos: 3,  estado: "error",     ia_confianza: null,    created_at: "2026-05-12T15:00:00Z", empleado_nombre: "Hugo Prieto",  empleado_id: 4 },
  { id: 194, referencia: "PED-2026-00194", nombre_cliente: "Lucía Herrera",   nombre_empresa: "Suministros del Norte",      fecha_pedido: "2026-05-12", num_productos: 7,  estado: "procesado", ia_confianza: "alta",  created_at: "2026-05-12T14:10:00Z", empleado_nombre: "Sara Alonso",  empleado_id: 5 },
  { id: 193, referencia: "PED-2026-00193", nombre_cliente: "Roberto Álvarez", nombre_empresa: "Ferretería Central S.L.",    fecha_pedido: "2026-05-11", num_productos: 14, estado: "procesado", ia_confianza: "alta",  created_at: "2026-05-11T12:40:00Z", empleado_nombre: "Marina López", empleado_id: 2 },
  { id: 192, referencia: "PED-2026-00192", nombre_cliente: "Nuria Campos",    nombre_empresa: "Construcciones Pinar Real",  fecha_pedido: "2026-05-11", num_productos: 6,  estado: "pendiente", ia_confianza: "baja",  created_at: "2026-05-11T11:00:00Z", empleado_nombre: "Diego Ruiz",   empleado_id: 1 },
  { id: 191, referencia: "PED-2026-00191", nombre_cliente: "Pedro Molina",    nombre_empresa: "Industrias Roca S.L.",       fecha_pedido: "2026-05-12", num_productos: 9,  estado: "procesado", ia_confianza: "media", created_at: "2026-05-12T09:50:00Z", empleado_nombre: "Sara Alonso",  empleado_id: 5 },
  { id: 190, referencia: "PED-2026-00190", nombre_cliente: "Jorge Castillo",  nombre_empresa: "Almacenes Cantábrico",       fecha_pedido: "2026-05-10", num_productos: 20, estado: "procesado", ia_confianza: "alta",  created_at: "2026-05-10T17:30:00Z", empleado_nombre: "Hugo Prieto",  empleado_id: 4 },
  { id: 189, referencia: "PED-2026-00189", nombre_cliente: "Marta Iglesias",  nombre_empresa: "Talleres Industrial Norte",  fecha_pedido: "2026-05-10", num_productos: 4,  estado: "pendiente", ia_confianza: "media", created_at: "2026-05-10T14:00:00Z", empleado_nombre: "Carla Méndez", empleado_id: 3 },
  { id: 188, referencia: "PED-2026-00188", nombre_cliente: "Ana Vázquez",     nombre_empresa: "Ferrallas Mediterráneo",     fecha_pedido: "2026-05-11", num_productos: 12, estado: "procesado", ia_confianza: "alta",  created_at: "2026-05-11T10:20:00Z", empleado_nombre: "Sara Alonso",  empleado_id: 5 },
  { id: 187, referencia: "PED-2026-00187", nombre_cliente: "Luis Moreno",     nombre_empresa: "Distribuciones Levante S.A.",fecha_pedido: "2026-05-09", num_productos: 8,  estado: "procesado", ia_confianza: "alta",  created_at: "2026-05-09T16:00:00Z", empleado_nombre: "Diego Ruiz",   empleado_id: 1 },
  { id: 186, referencia: "PED-2026-00186", nombre_cliente: "Teresa Romero",   nombre_empresa: "Química Ribera S.A.",        fecha_pedido: null,         num_productos: 2,  estado: "error",     ia_confianza: null,    created_at: "2026-05-09T10:00:00Z", empleado_nombre: "Marina López", empleado_id: 2 },
  { id: 185, referencia: "PED-2026-00185", nombre_cliente: "Jorge Olmedo",    nombre_empresa: "Construcciones Pinar Real",  fecha_pedido: "2026-05-10", num_productos: 5,  estado: "pendiente", ia_confianza: "baja",  created_at: "2026-05-10T09:00:00Z", empleado_nombre: "Sara Alonso",  empleado_id: 5 },
  { id: 184, referencia: "PED-2026-00184", nombre_cliente: "Juan García",     nombre_empresa: "Construcciones Martínez S.L.",fecha_pedido:"2026-05-10", num_productos: 6,  estado: "procesado", ia_confianza: "alta",  created_at: "2026-05-09T09:57:00Z", empleado_nombre: "Diego Ruiz",   empleado_id: 1 },
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
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
}

const AVATAR_COLORS = ["#2a5fb0","#2a8a5d","#b04a10","#a07828","#6b41a0"]
function EmpleadoAvatar({ nombre, id }: { nombre: string; id: number }) {
  const color = AVATAR_COLORS[id % AVATAR_COLORS.length]
  const initials = nombre.split(" ").slice(0,2).map(p => p[0]).join("").toUpperCase()
  return (
    <Link
      href={`/admin/empleados/${id}`}
      className="flex items-center gap-2 w-fit"
      onClick={e => e.stopPropagation()}
    >
      <div className="size-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0" style={{ background: color + "22", color }}>
        {initials}
      </div>
      <span className="text-xs underline-offset-2 hover:underline" style={{ color: "#4a423b" }}>{nombre}</span>
    </Link>
  )
}

const PAGE_SIZE = 10

export default function TodosLosPedidosPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const empleadoParam = Number(searchParams.get("empleado") ?? "")
  const initialEmpleado: number | "todos" = empleadoParam > 0 ? empleadoParam : "todos"

  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos")
  const [filtroEmpleado, setFiltroEmpleado] = useState<number | "todos">(initialEmpleado)
  const [busqueda, setBusqueda] = useState("")
  const [pagina, setPagina] = useState(1)
  const [filtrosOpen, setFiltrosOpen] = useState(false)
  const [filtrosPos, setFiltrosPos] = useState<{ top: number; left: number } | null>(null)
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [confianzaFiltro, setConfianzaFiltro] = useState<Confianza | "">("")
  const filtrosRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (filtrosRef.current && !filtrosRef.current.contains(e.target as Node)) {
        setFiltrosOpen(false); setFiltrosPos(null)
      }
    }
    if (filtrosOpen) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [filtrosOpen])

  const filtrados = MOCK_PEDIDOS.filter(p => {
    if (filtroEstado !== "todos" && p.estado !== filtroEstado) return false
    if (filtroEmpleado !== "todos" && p.empleado_id !== filtroEmpleado) return false
    if (fechaDesde && p.fecha_pedido && p.fecha_pedido < fechaDesde) return false
    if (fechaHasta && p.fecha_pedido && p.fecha_pedido > fechaHasta) return false
    if (confianzaFiltro && p.ia_confianza !== confianzaFiltro) return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      if (!p.nombre_cliente?.toLowerCase().includes(q) && !p.nombre_empresa?.toLowerCase().includes(q) && !p.referencia.toLowerCase().includes(q) && !p.empleado_nombre.toLowerCase().includes(q)) return false
    }
    return true
  })

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const paginaActual = Math.min(pagina, totalPaginas)
  const slice = filtrados.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE)

  const filtrosActivosCount = [fechaDesde, fechaHasta, confianzaFiltro, filtroEmpleado !== "todos" ? "emp" : ""].filter(Boolean).length

  function limpiarFiltros() {
    setFechaDesde(""); setFechaHasta(""); setConfianzaFiltro(""); setFiltroEmpleado("todos"); setPagina(1)
  }

  const TABS: { key: FiltroEstado; label: string }[] = [
    { key: "todos",     label: `Todos · ${MOCK_PEDIDOS.length}` },
    { key: "procesado", label: `Procesados · ${MOCK_PEDIDOS.filter(p => p.estado === "procesado").length}` },
    { key: "pendiente", label: `Pendientes · ${MOCK_PEDIDOS.filter(p => p.estado === "pendiente").length}` },
    { key: "error",     label: `Errores · ${MOCK_PEDIDOS.filter(p => p.estado === "error").length}` },
  ]

  return (
    <div className="flex flex-col h-full -m-6">

      {/* Topbar */}
      <div
        className="shrink-0 flex flex-col md:flex-row md:items-center gap-2 px-4 md:px-6 py-2 md:py-0"
        style={{ minHeight: 48, borderBottom: "1px solid #ebe4d8", background: "#ffffff" }}
      >
        <div className="flex flex-col justify-center md:shrink-0">
          <span className="font-medium text-sm" style={{ color: "#1a1410" }}>Todos los pedidos</span>
          <span className="text-xs" style={{ color: "#847a6f" }}>{MOCK_PEDIDOS.length} en total · {EMPLEADOS.length} empleados</span>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 pointer-events-none" style={{ color: "#b8aea1" }} />
          <input
            type="text"
            placeholder="Buscar por cliente, empresa, referencia o empleado…"
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); setPagina(1) }}
            className="w-full text-xs pl-8 pr-3 rounded-[10px] outline-none"
            style={{ height: 32, border: "1px solid #ebe4d8", background: "#faf7f2", color: "#1a1410" }}
            onFocus={e => { e.currentTarget.style.borderColor = "#f57a26"; e.currentTarget.style.background = "#ffffff" }}
            onBlur={e => { e.currentTarget.style.borderColor = "#ebe4d8"; e.currentTarget.style.background = "#faf7f2" }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">

        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 px-3 md:px-4 py-2 rounded-[12px]" style={{ background: "#ffffff", border: "1px solid #ebe4d8" }}>
          <div className="flex items-center gap-1 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.key} type="button" onClick={() => { setFiltroEstado(t.key); setPagina(1) }}
                className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-[8px] transition-colors whitespace-nowrap"
                style={{ background: filtroEstado === t.key ? "#f3eee6" : "transparent", color: filtroEstado === t.key ? "#1a1410" : "#847a6f", fontWeight: filtroEstado === t.key ? 500 : 400 }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "#b8aea1" }}>Mostrando {filtrados.length}</span>
            <div className="relative" ref={filtrosRef}>
              <button
                type="button"
                onClick={e => {
                  if (filtrosOpen) { setFiltrosOpen(false); setFiltrosPos(null); return }
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                  const W = 340
                  const left = Math.max(8, Math.min(rect.right - W, window.innerWidth - W - 8))
                  setFiltrosPos({ top: rect.bottom + 6, left })
                  setFiltrosOpen(true)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[8px] transition-colors"
                style={{ border: `1px solid ${filtrosOpen || filtrosActivosCount > 0 ? "#f57a26" : "#ebe4d8"}`, background: filtrosOpen ? "#fff5ec" : "#ffffff", color: filtrosActivosCount > 0 ? "#f57a26" : "#4a423b" }}
              >
                <SlidersHorizontal className="size-3" /> Filtros
                {filtrosActivosCount > 0 && <span className="size-4 rounded-full text-[10px] flex items-center justify-center font-medium" style={{ background: "#f57a26", color: "#ffffff" }}>{filtrosActivosCount}</span>}
              </button>

              {filtrosOpen && filtrosPos && (
                <div className="rounded-[16px] max-w-[calc(100vw-1rem)]" style={{ position: "fixed", top: filtrosPos.top, left: filtrosPos.left, width: 340, zIndex: 200, background: "#ffffff", border: "1px solid #ebe4d8", boxShadow: "0 8px 24px rgba(26,20,16,0.10)" }}>
                  <div className="flex items-center justify-between px-4 pt-4 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-[7px] flex items-center justify-center" style={{ background: "#f3eee6" }}>
                        <SlidersHorizontal className="size-3.5" style={{ color: "#f57a26" }} />
                      </div>
                      <span className="text-sm font-semibold" style={{ color: "#1a1410" }}>Filtros</span>
                      {filtrosActivosCount > 0 && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "#f57a26", color: "#fff" }}>{filtrosActivosCount}</span>}
                    </div>
                    <button type="button" onClick={() => { setFiltrosOpen(false); setFiltrosPos(null) }} className="size-6 flex items-center justify-center rounded-[7px]" style={{ color: "#b8aea1" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#f3eee6" }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}>
                      <X className="size-3.5" />
                    </button>
                  </div>

                  <div className="px-4 pb-4 flex flex-col gap-4">
                    <div style={{ height: 1, background: "#f3eee6" }} />

                    {/* Empleado */}
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold" style={{ color: "#4a423b" }}>Empleado</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[{ id: "todos" as const, nombre: "Todos" }, ...EMPLEADOS].map(emp => {
                          const active = filtroEmpleado === emp.id
                          return (
                            <button key={emp.id} type="button" onClick={() => { setFiltroEmpleado(emp.id as number | "todos"); setPagina(1) }}
                              className="text-[11px] px-2.5 py-1 rounded-[8px] transition-colors"
                              style={{ border: `1px solid ${active ? "#f57a26" : "#ebe4d8"}`, background: active ? "#fff5ec" : "#faf7f2", color: active ? "#f57a26" : "#4a423b", fontWeight: active ? 500 : 400 }}
                            >
                              {emp.nombre}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div style={{ height: 1, background: "#f3eee6" }} />

                    {/* Fechas */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="size-3.5" style={{ color: "#b8aea1" }} />
                        <span className="text-xs font-semibold" style={{ color: "#4a423b" }}>Rango de fechas</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {([["Desde", fechaDesde, setFechaDesde], ["Hasta", fechaHasta, setFechaHasta]] as const).map(([label, val, setter]) => (
                          <div key={label} className="flex flex-col gap-1">
                            <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "#b8aea1" }}>{label}</p>
                            <input type="date" value={val} onChange={e => { (setter as (v: string) => void)(e.target.value); setPagina(1) }} className="w-full text-xs px-2.5 py-2 rounded-[10px] outline-none" style={{ border: "1px solid #ebe4d8", background: "#faf7f2", color: "#1a1410" }} onFocus={e => { e.currentTarget.style.borderColor = "#f57a26"; e.currentTarget.style.background = "#fff" }} onBlur={e => { e.currentTarget.style.borderColor = "#ebe4d8"; e.currentTarget.style.background = "#faf7f2" }} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ height: 1, background: "#f3eee6" }} />

                    {/* Confianza IA */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="size-3.5" style={{ color: "#b8aea1" }} />
                        <span className="text-xs font-semibold" style={{ color: "#4a423b" }}>Confianza IA</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {([
                          { value: "",      label: "Todas", activeBg: "#f3eee6", activeColor: "#4a423b", dot: null },
                          { value: "alta",  label: "Alta",  activeBg: "#e7f5ee", activeColor: "#2a8a5d", dot: "#2a8a5d" },
                          { value: "media", label: "Media", activeBg: "#fbf1d9", activeColor: "#b07a12", dot: "#b07a12" },
                          { value: "baja",  label: "Baja",  activeBg: "#fbe9e6", activeColor: "#c0382a", dot: "#c0382a" },
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
                        <button type="button" onClick={limpiarFiltros} className="flex-1 py-2 text-xs font-medium rounded-[10px] transition-colors" style={{ border: "1px solid #ebe4d8", background: "#ffffff", color: "#4a423b" }} onMouseEnter={e => (e.currentTarget.style.background = "#f3eee6")} onMouseLeave={e => (e.currentTarget.style.background = "#ffffff")}>
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
            <table className="w-full min-w-[720px]">
              <thead>
                <tr style={{ background: "#faf7f2", borderBottom: "1px solid #ebe4d8" }}>
                  {["ID / Cliente", "Empresa", "Empleado", "Fecha pedido", "Productos", "Estado", "Confianza IA"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: "#847a6f" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slice.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: "#b8aea1" }}>No hay pedidos con este filtro</td></tr>
                ) : slice.map((p, i) => (
                  <tr
                    key={p.id}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: i < slice.length - 1 ? "1px solid #f3eee6" : "none", background: "#ffffff" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#faf7f2")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#ffffff")}
                    onClick={() => router.push(`/admin/pedidos/${p.id}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium" style={{ color: "#1a1410" }}>{p.nombre_cliente ?? "—"}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#b8aea1" }}>{p.referencia}</p>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#4a423b" }}>{p.nombre_empresa ?? "—"}</td>
                    <td className="px-4 py-3">
                      <EmpleadoAvatar nombre={p.empleado_nombre} id={p.empleado_id} />
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#4a423b" }}>
                      {p.fecha_pedido ? formatDate(p.fecha_pedido) : <span style={{ color: "#ddd4c4" }}>—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#4a423b" }}>{p.num_productos ?? <span style={{ color: "#ddd4c4" }}>—</span>}</td>
                    <td className="px-4 py-3"><EstadoBadge estado={p.estado} /></td>
                    <td className="px-4 py-3">{p.ia_confianza ? <IaConfianzaBadge nivel={p.ia_confianza} /> : <span style={{ color: "#ddd4c4" }}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs" style={{ color: "#847a6f" }}>
              {filtrados.length} pedidos · página {paginaActual} de {totalPaginas}
            </span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={paginaActual <= 1} onClick={() => setPagina(p => p - 1)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-[8px] transition-colors disabled:opacity-40" style={{ border: "1px solid #ebe4d8", background: "#ffffff", color: "#4a423b" }} onMouseEnter={e => { if (paginaActual > 1) (e.currentTarget as HTMLElement).style.background = "#f3eee6" }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#ffffff" }}>
                <ChevronLeft className="size-3" /> Anterior
              </button>
              <button type="button" disabled={paginaActual >= totalPaginas} onClick={() => setPagina(p => p + 1)} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-[8px] transition-colors disabled:opacity-40" style={{ border: "1px solid #ebe4d8", background: "#ffffff", color: "#4a423b" }} onMouseEnter={e => { if (paginaActual < totalPaginas) (e.currentTarget as HTMLElement).style.background = "#f3eee6" }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#ffffff" }}>
                Siguiente <ChevronRight className="size-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
