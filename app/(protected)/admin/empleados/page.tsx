"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { UserPlus, Download, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { getOverride, isDeleted } from "@/lib/empleados-store"

type RolEmpleado = "empleado" | "admin"
type EstadoEmpleado = "activo" | "inactivo" | "pendiente"

interface Empleado {
  id: number
  nombre: string
  email: string
  rol: RolEmpleado
  pedidos_procesados: number
  ultima_actividad: string | null
  estado: EstadoEmpleado
}

interface Stats {
  activos: number
  pedidos_mes: number
  precision_ia: number
  tiempo_extraccion: number
}

const MOCK_STATS: Stats = {
  activos: 24,
  pedidos_mes: 1284,
  precision_ia: 9.2,
  tiempo_extraccion: 1.6,
}

const MOCK_EMPLEADOS: Empleado[] = [
  { id: 1,  nombre: "Diego Ruiz",      email: "diego.ruiz@acme.es",      rol: "empleado", pedidos_procesados: 142, ultima_actividad: "2026-05-15T10:39:00Z", estado: "activo"   },
  { id: 2,  nombre: "Marina López",    email: "marina.lopez@acme.es",    rol: "empleado", pedidos_procesados: 198, ultima_actividad: "2026-05-15T09:42:00Z", estado: "activo"   },
  { id: 3,  nombre: "Carla Méndez",    email: "carla.mendez@acme.es",    rol: "admin",    pedidos_procesados: 12,  ultima_actividad: "2026-05-15T10:42:00Z", estado: "activo"   },
  { id: 4,  nombre: "Hugo Prieto",     email: "hugo.prieto@acme.es",     rol: "empleado", pedidos_procesados: 87,  ultima_actividad: "2026-05-14T18:05:00Z", estado: "activo"   },
  { id: 5,  nombre: "Sara Alonso",     email: "sara.alonso@acme.es",     rol: "empleado", pedidos_procesados: 203, ultima_actividad: "2026-05-15T08:30:00Z", estado: "activo"   },
  { id: 6,  nombre: "Pablo Crespo",    email: "pablo.crespo@acme.es",    rol: "empleado", pedidos_procesados: 56,  ultima_actividad: "2026-05-13T16:20:00Z", estado: "activo"   },
  { id: 7,  nombre: "Ana López",       email: "ana.lopez@acme.es",       rol: "empleado", pedidos_procesados: 119, ultima_actividad: "2026-05-14T10:00:00Z", estado: "activo"   },
  { id: 8,  nombre: "Iván Rivas",      email: "ivan.rivas@acme.es",      rol: "empleado", pedidos_procesados: 0,   ultima_actividad: null,                   estado: "pendiente"},
  { id: 9,  nombre: "Nuria Blanco",    email: "nuria.blanco@acme.es",    rol: "empleado", pedidos_procesados: 31,  ultima_actividad: "2026-05-10T09:00:00Z", estado: "inactivo" },
  { id: 10, nombre: "Tomás Vega",      email: "tomas.vega@acme.es",      rol: "empleado", pedidos_procesados: 76,  ultima_actividad: "2026-05-14T15:30:00Z", estado: "activo"   },
]

type FiltroEstado = "todos" | EstadoEmpleado
type FiltroRol = "todos" | RolEmpleado
type OrdenCampo = "nombre" | "pedidos" | "actividad"

function tiempoRelativo(iso: string | null): string {
  if (!iso) return "Nunca"
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "Ahora"
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  if (d === 1) return "ayer"
  return `hace ${d} días`
}

function initiales(nombre: string): string {
  return nombre.split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase()
}

const AVATAR_COLORS = [
  { bg: "#e6effa", color: "#2a5fb0" },
  { bg: "#e7f5ee", color: "#2a8a5d" },
  { bg: "#fff5ec", color: "#b04a10" },
  { bg: "#fdf6e8", color: "#a07828" },
  { bg: "#f3eef8", color: "#6b41a0" },
]

function avatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length]
}

const ESTADO_CFG: Record<EstadoEmpleado, { label: string; bg: string; color: string }> = {
  activo:    { label: "Activo",              bg: "#e7f5ee", color: "#2a8a5d" },
  inactivo:  { label: "Inactivo",            bg: "#f3eee6", color: "#847a6f" },
  pendiente: { label: "Invitación pendiente", bg: "#fff5ec", color: "#b04a10" },
}

const ROL_CFG: Record<RolEmpleado, { label: string; bg: string; color: string }> = {
  empleado: { label: "Empleado", bg: "#f3eee6", color: "#847a6f" },
  admin:    { label: "Admin",    bg: "#e6effa", color: "#2a5fb0" },
}

const PAGE_SIZE = 8

export default function EmpleadosPage() {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos")
  const [filtroRol, setFiltroRol] = useState<FiltroRol>("todos")
  const [orden, setOrden] = useState<OrdenCampo>("pedidos")
  const [pagina, setPagina] = useState(1)
  const [, forceRender] = useState(0)

  // Aplica overrides del store (estado/rol/eliminado) sobre el mock
  const empleados = MOCK_EMPLEADOS
    .filter(e => !isDeleted(e.id))
    .map(e => {
      const ov = getOverride(e.id)
      return { ...e, estado: ov.estado ?? e.estado, rol: ov.rol ?? e.rol }
    })

  const filtrados = empleados
    .filter(e => {
      if (filtroEstado !== "todos" && e.estado !== filtroEstado) return false
      if (filtroRol !== "todos" && e.rol !== filtroRol) return false
      if (busqueda) {
        const q = busqueda.toLowerCase()
        if (!e.nombre.toLowerCase().includes(q) && !e.email.toLowerCase().includes(q)) return false
      }
      return true
    })
    .sort((a, b) => {
      if (orden === "nombre") return a.nombre.localeCompare(b.nombre)
      if (orden === "pedidos") return b.pedidos_procesados - a.pedidos_procesados
      if (orden === "actividad") {
        if (!a.ultima_actividad) return 1
        if (!b.ultima_actividad) return -1
        return new Date(b.ultima_actividad).getTime() - new Date(a.ultima_actividad).getTime()
      }
      return 0
    })

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const paginaActual = Math.min(pagina, totalPaginas)
  const slice = filtrados.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE)

  const counts = {
    todos:     empleados.length,
    activo:    empleados.filter(e => e.estado === "activo").length,
    inactivo:  empleados.filter(e => e.estado === "inactivo").length,
    pendiente: empleados.filter(e => e.estado === "pendiente").length,
  }

  const TABS: { key: FiltroEstado; label: string; count: number }[] = [
    { key: "todos",    label: "Todos",     count: counts.todos    },
    { key: "activo",   label: "Activos",   count: counts.activo   },
    { key: "inactivo", label: "Inactivos", count: counts.inactivo },
    { key: "pendiente",label: "Pendientes",count: counts.pendiente},
  ]

  function handleTabClick(key: FiltroEstado) {
    setFiltroEstado(key)
    setPagina(1)
  }

  return (
    <div className="flex flex-col h-full -m-6">

      {/* Topbar */}
      <div
        className="flex items-center justify-between px-4 md:px-6 gap-3 flex-wrap shrink-0"
        style={{ minHeight: 48, borderBottom: "1px solid #ebe4d8", background: "#ffffff", paddingTop: 8, paddingBottom: 8 }}
      >
        <span className="text-sm font-medium" style={{ color: "#1a1410" }}>Empleados</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const header = "Nombre,Email,Rol,Pedidos procesados,Última actividad,Estado"
              const rows = empleados.map(e =>
                `"${e.nombre}","${e.email}","${e.rol}",${e.pedidos_procesados},"${e.ultima_actividad ?? ""}","${e.estado}"`
              )
              const csv  = [header, ...rows].join("\n")
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
              const url  = URL.createObjectURL(blob)
              const a    = document.createElement("a")
              a.href = url; a.download = "empleados.csv"; a.click()
              URL.revokeObjectURL(url)
            }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-[10px] transition-colors"
            style={{ border: "1px solid #ebe4d8", background: "#ffffff", color: "#4a423b" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f3eee6")}
            onMouseLeave={e => (e.currentTarget.style.background = "#ffffff")}
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Exportar lista</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-[10px] font-medium transition-colors"
            style={{ background: "#f57a26", color: "#ffffff" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#d96017")}
            onMouseLeave={e => (e.currentTarget.style.background = "#f57a26")}
            onClick={() => router.push("/admin/empleados/nuevo")}
          >
            <UserPlus className="size-3.5" />
            <span className="hidden sm:inline">Invitar empleado</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-5" style={{ background: "#faf7f2" }}>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Empleados activos",      value: MOCK_STATS.activos.toString(),                  sub: "+3 este mes"       },
            { label: "Pedidos procesados",      value: MOCK_STATS.pedidos_mes.toLocaleString("es-ES"), sub: "+186 esta semana"  },
            { label: "Precisión media IA",      value: `${MOCK_STATS.precision_ia}/10`,                sub: "sobre confirmaciones" },
            { label: "Tiempo medio extracción", value: `${MOCK_STATS.tiempo_extraccion}s`,             sub: "últimos 7 días"    },
          ].map(stat => (
            <div
              key={stat.label}
              className="rounded-[14px] p-4 flex flex-col gap-1"
              style={{ background: "#ffffff", border: "1px solid #ebe4d8" }}
            >
              <p className="text-xs" style={{ color: "#b8aea1" }}>{stat.label}</p>
              <p className="text-xl font-semibold" style={{ color: "#1a1410" }}>{stat.value}</p>
              <p className="text-[11px]" style={{ color: "#b8aea1" }}>{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="rounded-[16px] flex flex-col overflow-hidden" style={{ background: "#ffffff", border: "1px solid #ebe4d8" }}>

          {/* Filters row */}
          <div
            className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3 flex-wrap"
            style={{ borderBottom: "1px solid #f3eee6" }}
          >
            {/* Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {TABS.map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleTabClick(t.key)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-[8px] whitespace-nowrap transition-colors"
                  style={{
                    background: filtroEstado === t.key ? "#f57a26" : "transparent",
                    color:      filtroEstado === t.key ? "#ffffff"  : "#847a6f",
                    fontWeight: filtroEstado === t.key ? 500 : 400,
                  }}
                  onMouseEnter={e => { if (filtroEstado !== t.key) (e.currentTarget as HTMLElement).style.background = "#f3eee6" }}
                  onMouseLeave={e => { if (filtroEstado !== t.key) (e.currentTarget as HTMLElement).style.background = "transparent" }}
                >
                  {t.label}
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{
                      background: filtroEstado === t.key ? "rgba(255,255,255,0.25)" : "#f3eee6",
                      color:      filtroEstado === t.key ? "#ffffff" : "#b8aea1",
                    }}
                  >
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5" style={{ color: "#b8aea1" }} />
                <input
                  type="text"
                  placeholder="Buscar empleado..."
                  value={busqueda}
                  onChange={e => { setBusqueda(e.target.value); setPagina(1) }}
                  className="text-xs pl-8 pr-3 py-1.5 rounded-[8px] outline-none"
                  style={{ border: "1px solid #ebe4d8", background: "#faf7f2", color: "#1a1410", width: 180 }}
                />
              </div>

              {/* Rol filter */}
              <select
                value={filtroRol}
                onChange={e => { setFiltroRol(e.target.value as FiltroRol); setPagina(1) }}
                className="text-xs px-2.5 py-1.5 rounded-[8px] outline-none"
                style={{ border: "1px solid #ebe4d8", background: "#faf7f2", color: "#4a423b" }}
              >
                <option value="todos">Rol: Todos</option>
                <option value="empleado">Empleado</option>
                <option value="admin">Admin</option>
              </select>

              {/* Orden */}
              <select
                value={orden}
                onChange={e => setOrden(e.target.value as OrdenCampo)}
                className="text-xs px-2.5 py-1.5 rounded-[8px] outline-none"
                style={{ border: "1px solid #ebe4d8", background: "#faf7f2", color: "#4a423b" }}
              >
                <option value="pedidos">Pedidos ↓</option>
                <option value="nombre">Nombre A–Z</option>
                <option value="actividad">Última actividad</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: 560 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f3eee6" }}>
                  {["EMPLEADO", "ROL", "PEDIDOS", "ÚLTIMA ACTIVIDAD", "ESTADO", ""].map((col, i) => (
                    <th
                      key={col + i}
                      className="text-left text-[10px] font-semibold tracking-wider px-4 py-2.5"
                      style={{ color: "#b8aea1" }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slice.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-sm" style={{ color: "#b8aea1" }}>
                      No hay empleados para estos filtros.
                    </td>
                  </tr>
                ) : slice.map((emp, i) => {
                  const av = avatarColor(emp.id)
                  const estadoCfg = ESTADO_CFG[emp.estado]
                  const rolCfg = ROL_CFG[emp.rol]
                  return (
                    <tr
                      key={emp.id}
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: i < slice.length - 1 ? "1px solid #f3eee6" : "none" }}
                      onClick={() => router.push(`/admin/empleados/${emp.id}`)}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#faf7f2"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                    >
                      {/* Empleado */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="size-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                            style={{ background: av.bg, color: av.color }}
                          >
                            {initiales(emp.nombre)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: "#1a1410" }}>{emp.nombre}</p>
                            <p className="text-[11px] truncate" style={{ color: "#b8aea1" }}>{emp.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="px-4 py-3">
                        <span
                          className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: rolCfg.bg, color: rolCfg.color }}
                        >
                          {rolCfg.label}
                        </span>
                      </td>

                      {/* Pedidos */}
                      <td className="px-4 py-3">
                        <span className="text-sm tabular-nums" style={{ color: "#1a1410" }}>
                          {emp.pedidos_procesados}
                        </span>
                      </td>

                      {/* Última actividad */}
                      <td className="px-4 py-3">
                        <span className="text-sm" style={{ color: "#4a423b" }}>
                          {tiempoRelativo(emp.ultima_actividad)}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3">
                        <span
                          className="text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{ background: estadoCfg.bg, color: estadoCfg.color }}
                        >
                          {estadoCfg.label}
                        </span>
                      </td>

                      {/* Ver detalle */}
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className="text-xs px-2.5 py-1 rounded-[8px] transition-colors"
                          style={{ border: "1px solid #ebe4d8", background: "transparent", color: "#847a6f" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#f3eee6")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          onClick={e => { e.stopPropagation(); router.push(`/admin/empleados/${emp.id}`) }}
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPaginas > 1 && (
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderTop: "1px solid #f3eee6" }}
            >
              <span className="text-xs" style={{ color: "#b8aea1" }}>
                {filtrados.length} empleados · página {paginaActual} de {totalPaginas}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={paginaActual <= 1}
                  onClick={() => setPagina(p => p - 1)}
                  className="size-7 flex items-center justify-center rounded-[8px] transition-colors disabled:opacity-40"
                  style={{ border: "1px solid #ebe4d8", background: "transparent" }}
                >
                  <ChevronLeft className="size-3.5" style={{ color: "#847a6f" }} />
                </button>
                <button
                  type="button"
                  disabled={paginaActual >= totalPaginas}
                  onClick={() => setPagina(p => p + 1)}
                  className="size-7 flex items-center justify-center rounded-[8px] transition-colors disabled:opacity-40"
                  style={{ border: "1px solid #ebe4d8", background: "transparent" }}
                >
                  <ChevronRight className="size-3.5" style={{ color: "#847a6f" }} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
