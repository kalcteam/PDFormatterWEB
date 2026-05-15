"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  FileText, Pencil, Download, Trash2, Copy, CheckCircle, AlertCircle,
  Upload, LogIn, LogOut, UserPlus, UserCog, Settings, Search, X,
} from "lucide-react"

type TipoEvento =
  | "pedido_nuevo"
  | "pedido_editado"
  | "pedido_exportado"
  | "pedido_duplicado"
  | "pedido_eliminado"
  | "pedido_confirmado"
  | "pedido_error"
  | "pdf_subido"
  | "sesion_inicio"
  | "sesion_cierre"
  | "empleado_invitado"
  | "empleado_rol_cambiado"
  | "empleado_desactivado"
  | "ajuste_guardado"

interface Evento {
  id: number
  tipo: TipoEvento
  descripcion: string
  detalle?: string
  referencia?: string
  empleado_id: number
  empleado_nombre: string
  empleado_email: string
  fecha: string
}

const EMPLEADOS = [
  { id: 1, nombre: "María López",   email: "maria.lopez@acme.es"   },
  { id: 2, nombre: "Carlos Ruiz",   email: "carlos.ruiz@acme.es"   },
  { id: 3, nombre: "Ana Martínez",  email: "ana.martinez@acme.es"  },
  { id: 4, nombre: "Pedro García",  email: "pedro.garcia@acme.es"  },
  { id: 5, nombre: "Laura Sánchez", email: "laura.sanchez@acme.es" },
  { id: 0, nombre: "Carla Méndez",  email: "carla.mendez@acme.es"  }, // admin
]

const MOCK_EVENTOS: Evento[] = [
  { id: 1,  tipo: "pedido_confirmado",    descripcion: "Pedido confirmado y enviado al ERP",          referencia: "PED-2026-00191", empleado_id: 1, empleado_nombre: "María López",   empleado_email: "maria.lopez@acme.es",   fecha: "2026-05-15T10:48:00Z" },
  { id: 2,  tipo: "pedido_editado",       descripcion: "Precio unitario corregido en línea #3",        referencia: "PED-2026-00191", empleado_id: 1, empleado_nombre: "María López",   empleado_email: "maria.lopez@acme.es",   fecha: "2026-05-15T10:47:12Z" },
  { id: 3,  tipo: "pdf_subido",           descripcion: "PDF subido y extracción IA completada",        referencia: "PED-2026-00191", detalle: "proveedor-aceros.pdf · Confianza 94%", empleado_id: 1, empleado_nombre: "María López", empleado_email: "maria.lopez@acme.es", fecha: "2026-05-15T10:45:30Z" },
  { id: 4,  tipo: "sesion_inicio",        descripcion: "Inicio de sesión",                                                           empleado_id: 1, empleado_nombre: "María López",   empleado_email: "maria.lopez@acme.es",   fecha: "2026-05-15T10:44:55Z" },
  { id: 5,  tipo: "pedido_exportado",     descripcion: "Exportación al ERP completada",               detalle: "4 pedidos exportados via webhook",      empleado_id: 0, empleado_nombre: "Carla Méndez",  empleado_email: "carla.mendez@acme.es",  fecha: "2026-05-15T09:30:00Z" },
  { id: 6,  tipo: "empleado_invitado",    descripcion: "Nuevo empleado invitado",                      referencia: "javier.mora@acme.es",                empleado_id: 0, empleado_nombre: "Carla Méndez",  empleado_email: "carla.mendez@acme.es",  fecha: "2026-05-15T09:12:40Z" },
  { id: 7,  tipo: "pedido_nuevo",         descripcion: "Nuevo pedido creado",                          referencia: "PED-2026-00190", empleado_id: 2, empleado_nombre: "Carlos Ruiz",   empleado_email: "carlos.ruiz@acme.es",   fecha: "2026-05-15T08:55:00Z" },
  { id: 8,  tipo: "pedido_error",         descripcion: "Error en extracción IA",                       referencia: "PED-2026-00189", detalle: "No se detectaron líneas de producto. Revisión manual requerida.", empleado_id: 3, empleado_nombre: "Ana Martínez", empleado_email: "ana.martinez@acme.es", fecha: "2026-05-14T17:42:10Z" },
  { id: 9,  tipo: "pedido_confirmado",    descripcion: "Pedido confirmado y enviado al ERP",           referencia: "PED-2026-00188", empleado_id: 4, empleado_nombre: "Pedro García",  empleado_email: "pedro.garcia@acme.es",  fecha: "2026-05-14T16:30:22Z" },
  { id: 10, tipo: "pedido_editado",       descripcion: "Nombre de empresa corregido",                  referencia: "PED-2026-00188", empleado_id: 4, empleado_nombre: "Pedro García",  empleado_email: "pedro.garcia@acme.es",  fecha: "2026-05-14T16:29:05Z" },
  { id: 11, tipo: "pdf_subido",           descripcion: "PDF subido y extracción IA completada",        referencia: "PED-2026-00188", detalle: "pedido-quimica.pdf · Confianza 88%",   empleado_id: 4, empleado_nombre: "Pedro García", empleado_email: "pedro.garcia@acme.es", fecha: "2026-05-14T16:27:00Z" },
  { id: 12, tipo: "sesion_cierre",        descripcion: "Cierre de sesión",                                                           empleado_id: 2, empleado_nombre: "Carlos Ruiz",   empleado_email: "carlos.ruiz@acme.es",   fecha: "2026-05-14T14:10:00Z" },
  { id: 13, tipo: "pedido_duplicado",     descripcion: "Pedido duplicado",                             referencia: "PED-2026-00187 → PED-2026-00188",   empleado_id: 4, empleado_nombre: "Pedro García",  empleado_email: "pedro.garcia@acme.es",  fecha: "2026-05-14T09:05:18Z" },
  { id: 14, tipo: "empleado_rol_cambiado",descripcion: "Rol de empleado actualizado a Administrador",  referencia: "carlos.ruiz@acme.es",                empleado_id: 0, empleado_nombre: "Carla Méndez",  empleado_email: "carla.mendez@acme.es",  fecha: "2026-05-13T18:00:00Z" },
  { id: 15, tipo: "pedido_eliminado",     descripcion: "Pedido eliminado",                             referencia: "PED-2026-00185", empleado_id: 3, empleado_nombre: "Ana Martínez",  empleado_email: "ana.martinez@acme.es",  fecha: "2026-05-13T17:55:30Z" },
  { id: 16, tipo: "pedido_exportado",     descripcion: "Exportación al ERP completada",               detalle: "2 pedidos exportados via webhook",      empleado_id: 0, empleado_nombre: "Carla Méndez",  empleado_email: "carla.mendez@acme.es",  fecha: "2026-05-13T12:00:00Z" },
  { id: 17, tipo: "pedido_nuevo",         descripcion: "Nuevo pedido creado",                          referencia: "PED-2026-00187", empleado_id: 5, empleado_nombre: "Laura Sánchez", empleado_email: "laura.sanchez@acme.es", fecha: "2026-05-13T11:45:00Z" },
  { id: 18, tipo: "sesion_inicio",        descripcion: "Inicio de sesión",                                                           empleado_id: 5, empleado_nombre: "Laura Sánchez", empleado_email: "laura.sanchez@acme.es", fecha: "2026-05-13T11:44:00Z" },
  { id: 19, tipo: "ajuste_guardado",      descripcion: "Configuración del webhook actualizada",        detalle: "URL: https://erp.empresa.es/api/pedidos/ingest", empleado_id: 0, empleado_nombre: "Carla Méndez", empleado_email: "carla.mendez@acme.es", fecha: "2026-05-12T10:20:00Z" },
  { id: 20, tipo: "empleado_desactivado", descripcion: "Cuenta de empleado desactivada",               referencia: "javier.mora@acme.es",                empleado_id: 0, empleado_nombre: "Carla Méndez",  empleado_email: "carla.mendez@acme.es",  fecha: "2026-05-11T16:05:00Z" },
  { id: 21, tipo: "pedido_confirmado",    descripcion: "Pedido confirmado y enviado al ERP",           referencia: "PED-2026-00184", empleado_id: 2, empleado_nombre: "Carlos Ruiz",   empleado_email: "carlos.ruiz@acme.es",   fecha: "2026-05-11T09:30:00Z" },
  { id: 22, tipo: "pdf_subido",           descripcion: "PDF subido y extracción IA completada",        referencia: "PED-2026-00184", detalle: "distribuciones-norte.pdf · Confianza 97%", empleado_id: 2, empleado_nombre: "Carlos Ruiz", empleado_email: "carlos.ruiz@acme.es", fecha: "2026-05-11T09:25:00Z" },
  { id: 23, tipo: "sesion_inicio",        descripcion: "Inicio de sesión",                                                           empleado_id: 3, empleado_nombre: "Ana Martínez",  empleado_email: "ana.martinez@acme.es",  fecha: "2026-05-10T08:00:00Z" },
]

const TIPO_CFG: Record<TipoEvento, { icon: React.ElementType; bg: string; color: string; label: string }> = {
  pedido_nuevo:           { icon: FileText,    bg: "#e6effa", color: "#2a5fb0", label: "Nuevo pedido"    },
  pedido_editado:         { icon: Pencil,      bg: "#faf7f2", color: "#847a6f", label: "Edición"         },
  pedido_exportado:       { icon: Download,    bg: "#e7f5ee", color: "#2a8a5d", label: "Exportación"     },
  pedido_duplicado:       { icon: Copy,        bg: "#faf7f2", color: "#847a6f", label: "Duplicado"       },
  pedido_eliminado:       { icon: Trash2,      bg: "#fbe9e6", color: "#c0382a", label: "Eliminado"       },
  pedido_confirmado:      { icon: CheckCircle, bg: "#e7f5ee", color: "#2a8a5d", label: "Confirmado"      },
  pedido_error:           { icon: AlertCircle, bg: "#fbe9e6", color: "#c0382a", label: "Error IA"        },
  pdf_subido:             { icon: Upload,      bg: "#fff5ec", color: "#b04a10", label: "PDF subido"      },
  sesion_inicio:          { icon: LogIn,       bg: "#f0f4ff", color: "#3b52c4", label: "Inicio sesión"   },
  sesion_cierre:          { icon: LogOut,      bg: "#faf7f2", color: "#847a6f", label: "Cierre sesión"   },
  empleado_invitado:      { icon: UserPlus,    bg: "#e7f5ee", color: "#2a8a5d", label: "Invitación"      },
  empleado_rol_cambiado:  { icon: UserCog,     bg: "#fff5ec", color: "#b04a10", label: "Cambio de rol"   },
  empleado_desactivado:   { icon: UserCog,     bg: "#fbe9e6", color: "#c0382a", label: "Desactivación"   },
  ajuste_guardado:        { icon: Settings,    bg: "#f0f4ff", color: "#3b52c4", label: "Configuración"   },
}

const FILTRO_TIPO: { key: TipoEvento | "todos" | "pedidos" | "sesiones" | "admin"; label: string }[] = [
  { key: "todos",    label: "Todos"          },
  { key: "pedidos",  label: "Pedidos"        },
  { key: "sesiones", label: "Sesiones"       },
  { key: "admin",    label: "Administración" },
  { key: "pedido_error", label: "Errores"    },
]

const TIPOS_PEDIDOS:  TipoEvento[] = ["pedido_nuevo","pedido_editado","pedido_exportado","pedido_duplicado","pedido_eliminado","pedido_confirmado","pedido_error","pdf_subido"]
const TIPOS_SESIONES: TipoEvento[] = ["sesion_inicio","sesion_cierre"]
const TIPOS_ADMIN:    TipoEvento[] = ["empleado_invitado","empleado_rol_cambiado","empleado_desactivado","ajuste_guardado","pedido_exportado"]

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
}
function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
}
function agruparPorFecha(eventos: Evento[]) {
  const grupos: Record<string, Evento[]> = {}
  for (const ev of eventos) {
    const key = formatFecha(ev.fecha)
    if (!grupos[key]) grupos[key] = []
    grupos[key].push(ev)
  }
  return grupos
}

const AVATAR_COLORS = ["#f57a26","#2a8a5d","#2a5fb0","#b04a10","#3b52c4","#847a6f"]
function avatarColor(id: number) { return AVATAR_COLORS[id % AVATAR_COLORS.length] }
function initials(nombre: string) {
  return nombre.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
}

export default function AuditoriaPage() {
  const [filtroTipo, setFiltroTipo]       = useState<string>("todos")
  const [filtroEmpleado, setFiltroEmpleado] = useState<number | "todos">("todos")
  const [busqueda, setBusqueda]           = useState("")

  const filtrados = useMemo(() => {
    return MOCK_EVENTOS.filter(ev => {
      if (filtroEmpleado !== "todos" && ev.empleado_id !== filtroEmpleado) return false
      if (filtroTipo === "pedidos"  && !TIPOS_PEDIDOS.includes(ev.tipo))  return false
      if (filtroTipo === "sesiones" && !TIPOS_SESIONES.includes(ev.tipo)) return false
      if (filtroTipo === "admin"    && !TIPOS_ADMIN.includes(ev.tipo))    return false
      if (filtroTipo === "pedido_error" && ev.tipo !== "pedido_error")    return false
      if (busqueda) {
        const q = busqueda.toLowerCase()
        if (
          !ev.descripcion.toLowerCase().includes(q) &&
          !ev.empleado_nombre.toLowerCase().includes(q) &&
          !(ev.referencia?.toLowerCase().includes(q)) &&
          !(ev.detalle?.toLowerCase().includes(q))
        ) return false
      }
      return true
    })
  }, [filtroTipo, filtroEmpleado, busqueda])

  const grupos = agruparPorFecha(filtrados)

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Topbar */}
      <div
        className="flex items-center justify-between gap-3 px-4 md:px-6 flex-wrap shrink-0"
        style={{ minHeight: 52, borderBottom: "1px solid #ebe4d8", background: "#ffffff", paddingTop: 8, paddingBottom: 8 }}
      >
        <span className="text-sm font-semibold" style={{ color: "#1a1410" }}>Auditoría</span>

        {/* Filtros de tipo */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {FILTRO_TIPO.map(f => (
            <button
              key={f.key}
              onClick={() => setFiltroTipo(f.key)}
              className="text-xs px-2.5 py-1 rounded-[8px] whitespace-nowrap transition-colors"
              style={{
                background: filtroTipo === f.key ? "#f57a26" : "transparent",
                color:      filtroTipo === f.key ? "#ffffff"  : "#847a6f",
                fontWeight: filtroTipo === f.key ? 500 : 400,
              }}
              onMouseEnter={e => { if (filtroTipo !== f.key) (e.currentTarget as HTMLElement).style.background = "#f3eee6" }}
              onMouseLeave={e => { if (filtroTipo !== f.key) (e.currentTarget as HTMLElement).style.background = "transparent" }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Subbar: búsqueda + filtro empleado */}
      <div
        className="flex items-center gap-3 px-4 md:px-6 py-2.5 shrink-0 flex-wrap"
        style={{ borderBottom: "1px solid #f3eee6", background: "#fdfaf7" }}
      >
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5" style={{ color: "#b8aea1" }} />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar en el log…"
            className="w-full pl-8 pr-7 py-1.5 text-xs rounded-[8px] outline-none"
            style={{ border: "1px solid rgba(235,228,216,0.8)", background: "#fffdf9", color: "#1a1410" }}
          />
          {busqueda && (
            <button onClick={() => setBusqueda("")} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="size-3.5" style={{ color: "#b8aea1" }} />
            </button>
          )}
        </div>

        {/* Chips empleados */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setFiltroEmpleado("todos")}
            className="text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
            style={{
              background: filtroEmpleado === "todos" ? "rgba(26,20,16,0.08)" : "transparent",
              color:      filtroEmpleado === "todos" ? "#1a1410" : "#847a6f",
              border: "1px solid rgba(235,228,216,0.8)",
            }}
          >
            Todos
          </button>
          {EMPLEADOS.map(emp => (
            <button
              key={emp.id}
              onClick={() => setFiltroEmpleado(filtroEmpleado === emp.id ? "todos" : emp.id)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
              style={{
                background: filtroEmpleado === emp.id ? avatarColor(emp.id) + "18" : "transparent",
                color:      filtroEmpleado === emp.id ? avatarColor(emp.id) : "#847a6f",
                border: `1px solid ${filtroEmpleado === emp.id ? avatarColor(emp.id) + "44" : "rgba(235,228,216,0.8)"}`,
              }}
            >
              <span
                className="size-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                style={{ background: avatarColor(emp.id), color: "#fff" }}
              >
                {initials(emp.nombre)}
              </span>
              {emp.nombre.split(" ")[0]}
            </button>
          ))}
        </div>

        <span className="text-xs ml-auto shrink-0" style={{ color: "#b8aea1" }}>
          {filtrados.length} evento{filtrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6" style={{ background: "#faf7f2" }}>
        {Object.keys(grupos).length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-sm" style={{ color: "#b8aea1" }}>No hay eventos para este filtro.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {Object.entries(grupos).map(([fecha, eventos]) => (
              <div key={fecha}>
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#b8aea1" }}>
                  {fecha}
                </p>
                <div className="rounded-[16px] overflow-hidden" style={{ background: "#ffffff", border: "1px solid #ebe4d8" }}>
                  {eventos.map((ev, i) => {
                    const cfg  = TIPO_CFG[ev.tipo]
                    const Icon = cfg.icon
                    return (
                      <div
                        key={ev.id}
                        className="flex items-start gap-4 px-5 py-3.5"
                        style={{ borderBottom: i < eventos.length - 1 ? "1px solid #f3eee6" : "none" }}
                      >
                        {/* Tipo icon */}
                        <div
                          className="size-8 rounded-[9px] flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: cfg.bg }}
                        >
                          <Icon className="size-4" style={{ color: cfg.color }} />
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium" style={{ color: "#1a1410" }}>{ev.descripcion}</span>
                            {ev.referencia && (
                              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-[5px]" style={{ background: "#f3eee6", color: "#847a6f" }}>
                                {ev.referencia}
                              </span>
                            )}
                          </div>
                          {ev.detalle && (
                            <p className="text-xs mt-0.5" style={{ color: "#b8aea1" }}>{ev.detalle}</p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className="size-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0"
                              style={{ background: avatarColor(ev.empleado_id), color: "#fff" }}
                            >
                              {initials(ev.empleado_nombre)}
                            </span>
                            {ev.empleado_id > 0 ? (
                              <Link
                                href={`/admin/empleados/${ev.empleado_id}`}
                                className="text-[11px] transition-colors"
                                style={{ color: "#b8aea1" }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#c4622a"; (e.currentTarget as HTMLElement).style.textDecoration = "underline" }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#b8aea1"; (e.currentTarget as HTMLElement).style.textDecoration = "none" }}
                              >
                                {ev.empleado_nombre}
                              </Link>
                            ) : (
                              <span className="text-[11px]" style={{ color: "#b8aea1" }}>{ev.empleado_nombre}</span>
                            )}
                            <span className="text-[11px]" style={{ color: "#b8aea1" }}>· {formatHora(ev.fecha)}</span>
                          </div>
                        </div>

                        {/* Badge tipo */}
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 mt-1"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
