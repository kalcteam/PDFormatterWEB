"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Mail, Download, KeyRound, Trash2, UserX, UserCheck, Pencil, Check, X, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { IaConfianzaBadge, type Confianza } from "@/components/ia-confidence-badge"
import { getOverride, setEstado as persistEstado, setRol as persistRol, deleteEmpleado } from "@/lib/empleados-store"

type RolEmpleado = "empleado" | "admin"
type EstadoEmpleado = "activo" | "inactivo" | "pendiente"

interface Empleado {
  id: number
  nombre: string
  email: string
  rol: RolEmpleado
  estado: EstadoEmpleado
  id_interno: string
  creado_por: string
  miembro_desde: string
  ultimo_acceso: string | null
}

interface Stats {
  pedidos_procesados: number
  confianza_ia: number
  tasa_correccion: number
  tiempo_medio: number
}

interface PedidoReciente {
  id: number
  referencia: string
  cliente: string
  empresa: string
  fecha: string
  confianza: Confianza
  estado: "procesado" | "pendiente" | "error"
}

const MOCK_EMPLEADOS: Record<number, Empleado> = {
  1:  { id: 1,  nombre: "Diego Ruiz",    email: "diego.ruiz@acme.es",    rol: "empleado", estado: "activo",    id_interno: "emp_1042", creado_por: "Carla Méndez", miembro_desde: "2026-01-15", ultimo_acceso: "2026-05-15T10:39:00Z" },
  2:  { id: 2,  nombre: "Marina López",  email: "marina.lopez@acme.es",  rol: "empleado", estado: "activo",    id_interno: "emp_1105", creado_por: "Carla Méndez", miembro_desde: "2026-01-20", ultimo_acceso: "2026-05-15T09:42:00Z" },
  3:  { id: 3,  nombre: "Carla Méndez",  email: "carla.mendez@acme.es",  rol: "admin",    estado: "activo",    id_interno: "emp_1001", creado_por: "Sistema",      miembro_desde: "2025-12-01", ultimo_acceso: "2026-05-15T10:42:00Z" },
  4:  { id: 4,  nombre: "Hugo Prieto",   email: "hugo.prieto@acme.es",   rol: "empleado", estado: "activo",    id_interno: "emp_1210", creado_por: "Carla Méndez", miembro_desde: "2026-02-03", ultimo_acceso: "2026-05-14T18:05:00Z" },
  5:  { id: 5,  nombre: "Sara Alonso",   email: "sara.alonso@acme.es",   rol: "empleado", estado: "activo",    id_interno: "emp_1294", creado_por: "Carla Méndez", miembro_desde: "2026-01-08", ultimo_acceso: "2026-05-15T08:30:00Z" },
  8:  { id: 8,  nombre: "Iván Rivas",    email: "ivan.rivas@acme.es",    rol: "empleado", estado: "pendiente", id_interno: "emp_1401", creado_por: "Carla Méndez", miembro_desde: "2026-05-10", ultimo_acceso: null },
  9:  { id: 9,  nombre: "Nuria Blanco",  email: "nuria.blanco@acme.es",  rol: "empleado", estado: "inactivo",  id_interno: "emp_1188", creado_por: "Carla Méndez", miembro_desde: "2026-01-25", ultimo_acceso: "2026-05-10T09:00:00Z" },
}

const MOCK_STATS: Stats = { pedidos_procesados: 256, confianza_ia: 94, tasa_correccion: 11, tiempo_medio: 1.3 }

const MOCK_PEDIDOS: PedidoReciente[] = [
  { id: 198, referencia: "PED-2026-00198", cliente: "Marcos Rey",    empresa: "Constructora Sur",          fecha: "2026-05-13", confianza: "alta",  estado: "procesado" },
  { id: 194, referencia: "PED-2026-00194", cliente: "Lucía Herrera", empresa: "Suministros del Norte",     fecha: "2026-05-12", confianza: "alta",  estado: "procesado" },
  { id: 191, referencia: "PED-2026-00191", cliente: "Pedro Molina",  empresa: "Industrias Roca S.L.",      fecha: "2026-05-12", confianza: "media", estado: "procesado" },
  { id: 188, referencia: "PED-2026-00188", cliente: "Ana Vázquez",   empresa: "Ferrallas Mediterráneo",    fecha: "2026-05-11", confianza: "alta",  estado: "procesado" },
  { id: 185, referencia: "PED-2026-00185", cliente: "Jorge Olmedo",  empresa: "Construcciones Pinar Real", fecha: "2026-05-10", confianza: "baja",  estado: "pendiente" },
]

const AVATAR_COLORS = [
  { bg: "#e6effa", color: "#2a5fb0" },
  { bg: "#e7f5ee", color: "#2a8a5d" },
  { bg: "#fff5ec", color: "#b04a10" },
  { bg: "#fdf6e8", color: "#a07828" },
  { bg: "#f3eef8", color: "#6b41a0" },
]

function initiales(nombre: string) {
  return nombre.split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase()
}

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

const ESTADO_CFG: Record<EstadoEmpleado, { label: string; bg: string; color: string }> = {
  activo:    { label: "Activo",               bg: "#e7f5ee", color: "#2a8a5d" },
  inactivo:  { label: "Inactivo",             bg: "#f3eee6", color: "#847a6f" },
  pendiente: { label: "Invitación pendiente", bg: "#fff5ec", color: "#b04a10" },
}

const ROL_CFG: Record<RolEmpleado, { label: string; bg: string; color: string }> = {
  empleado: { label: "Empleado", bg: "#f3eee6", color: "#847a6f" },
  admin:    { label: "Admin",    bg: "#e6effa", color: "#2a5fb0" },
}

/* ── Modal de confirmación ── */
interface ConfirmModalProps {
  title: string
  description: string
  confirmLabel: string
  confirmStyle?: "danger" | "warning" | "normal"
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmModal({ title, description, confirmLabel, confirmStyle = "danger", loading, onConfirm, onCancel }: ConfirmModalProps) {
  const btnBg = confirmStyle === "danger" ? "#c0382a" : confirmStyle === "warning" ? "#b07a12" : "#f57a26"
  const btnHover = confirmStyle === "danger" ? "#9e2e22" : confirmStyle === "warning" ? "#8c6010" : "#d96017"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(26,20,16,0.45)", backdropFilter: "blur(2px)" }}>
      <div className="rounded-[20px] w-full max-w-sm flex flex-col gap-0 overflow-hidden" style={{ background: "#ffffff", border: "1px solid #ebe4d8", boxShadow: "0 20px 60px rgba(26,20,16,0.18)" }}>
        <div className="px-6 pt-6 pb-4 flex flex-col gap-3">
          <div className="size-10 rounded-[12px] flex items-center justify-center" style={{ background: confirmStyle === "danger" ? "#fbe9e6" : confirmStyle === "warning" ? "#fdf6e8" : "#fff5ec" }}>
            <AlertTriangle className="size-5" style={{ color: btnBg }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#1a1410" }}>{title}</p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: "#847a6f" }}>{description}</p>
          </div>
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <button type="button" onClick={onCancel} disabled={loading} className="flex-1 py-2 text-xs font-medium rounded-[10px] transition-colors" style={{ border: "1px solid #ebe4d8", background: "#ffffff", color: "#4a423b" }} onMouseEnter={e => (e.currentTarget.style.background = "#f3eee6")} onMouseLeave={e => (e.currentTarget.style.background = "#ffffff")}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2 text-xs font-medium rounded-[10px] transition-colors"
            style={{ background: loading ? "#ddd4c4" : btnBg, color: "#ffffff", cursor: loading ? "not-allowed" : "pointer" }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = btnHover }}
            onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = btnBg }}
          >
            {loading ? "Procesando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

type ModalType = "desactivar" | "reactivar" | "eliminar" | "reset" | null

export default function EmpleadoDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)

  const empleadoBase = MOCK_EMPLEADOS[id] ?? MOCK_EMPLEADOS[5]
  const av = AVATAR_COLORS[id % AVATAR_COLORS.length]

  const override = getOverride(id)
  const [estado, setEstado] = useState<EstadoEmpleado>(override.estado ?? empleadoBase.estado)
  const [rolActual, setRolActual] = useState<RolEmpleado>(override.rol ?? empleadoBase.rol)
  const [editandoRol, setEditandoRol] = useState(false)
  const [rolTemp, setRolTemp] = useState<RolEmpleado>(override.rol ?? empleadoBase.rol)
  const [modal, setModal] = useState<ModalType>(null)
  const [loadingModal, setLoadingModal] = useState(false)

  const estadoCfg = ESTADO_CFG[estado]

  /* ── Handlers ── */
  function handleEnviarEmail() {
    window.location.href = `mailto:${empleadoBase.email}`
  }

  function handleExportar() {
    const csv = [
      "Referencia,Cliente,Empresa,Fecha,Confianza,Estado",
      ...MOCK_PEDIDOS.map(p => `${p.referencia},${p.cliente},${p.empresa},${p.fecha},${p.confianza},${p.estado}`)
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `pedidos-${empleadoBase.nombre.replace(/\s+/g, "-").toLowerCase()}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success("Pedidos exportados correctamente")
  }

  function handleReenviarInvitacion() {
    toast.success(`Invitación reenviada a ${empleadoBase.email}`)
  }

  async function handleConfirmarRol() {
    setLoadingModal(true)
    try {
      await persistRol(id, rolTemp)
      setRolActual(rolTemp)
      setEditandoRol(false)
      toast.success(`Rol actualizado a ${ROL_CFG[rolTemp].label}`)
    } catch {
      toast.error("Error al actualizar el rol")
    } finally {
      setLoadingModal(false)
    }
  }

  async function ejecutarModal() {
    setLoadingModal(true)
    try {
      if (modal === "desactivar") {
        await persistEstado(id, "inactivo")
        setEstado("inactivo")
        toast.success(`${empleadoBase.nombre} ha sido desactivado`)
      } else if (modal === "reactivar") {
        await persistEstado(id, "activo")
        setEstado("activo")
        toast.success(`${empleadoBase.nombre} ha sido reactivado`)
      } else if (modal === "eliminar") {
        await deleteEmpleado(id)
        toast.success("Cuenta eliminada correctamente")
        router.push("/admin/empleados")
        return
      } else if (modal === "reset") {
        await new Promise(r => setTimeout(r, 800))
        toast.success(`Se ha enviado un email de reseteo a ${empleadoBase.email}`)
      }
    } catch {
      toast.error("Error al ejecutar la acción")
    } finally {
      setLoadingModal(false)
      setModal(null)
    }
  }

  return (
    <>
      <div className="flex flex-col h-full -m-6">

        {/* Topbar */}
        <div
          className="flex items-center justify-between px-4 md:px-6 shrink-0 gap-3 flex-wrap"
          style={{ minHeight: 48, borderBottom: "1px solid #ebe4d8", background: "#ffffff", paddingTop: 8, paddingBottom: 8 }}
        >
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => router.push("/admin/empleados")}
              className="flex items-center gap-1.5 transition-colors"
              style={{ color: "#b8aea1" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#4a423b")}
              onMouseLeave={e => (e.currentTarget.style.color = "#b8aea1")}
            >
              <ArrowLeft className="size-3.5" /> Empleados
            </button>
            <span style={{ color: "#ddd4c4" }}>/</span>
            <span className="font-medium" style={{ color: "#1a1410" }}>{empleadoBase.nombre}</span>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={handleEnviarEmail} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-[10px] transition-colors" style={{ border: "1px solid #ebe4d8", background: "#ffffff", color: "#4a423b" }} onMouseEnter={e => (e.currentTarget.style.background = "#f3eee6")} onMouseLeave={e => (e.currentTarget.style.background = "#ffffff")}>
              <Mail className="size-3.5" />
              <span className="hidden sm:inline">Enviar email</span>
            </button>
            <button type="button" onClick={handleExportar} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-[10px] transition-colors" style={{ border: "1px solid #ebe4d8", background: "#ffffff", color: "#4a423b" }} onMouseEnter={e => (e.currentTarget.style.background = "#f3eee6")} onMouseLeave={e => (e.currentTarget.style.background = "#ffffff")}>
              <Download className="size-3.5" />
              <span className="hidden sm:inline">Exportar pedidos</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-5" style={{ background: "#faf7f2" }}>

          {/* Header card */}
          <div className="rounded-[16px] p-5 flex flex-col sm:flex-row sm:items-center gap-4" style={{ background: "#ffffff", border: "1px solid #ebe4d8" }}>
            <div className="size-16 rounded-2xl flex items-center justify-center text-xl font-semibold shrink-0" style={{ background: av.bg, color: av.color }}>
              {initiales(empleadoBase.nombre)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold" style={{ color: "#1a1410" }}>{empleadoBase.nombre}</h1>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: estadoCfg.bg, color: estadoCfg.color }}>{estadoCfg.label}</span>
              </div>
              <p className="text-sm mt-0.5" style={{ color: "#847a6f" }}>{empleadoBase.email}</p>
              <p className="text-xs mt-1" style={{ color: "#b8aea1" }}>
                Miembro desde el {new Date(empleadoBase.miembro_desde).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                {" · "}Último acceso: {tiempoRelativo(empleadoBase.ultimo_acceso)}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-col sm:items-end">
              {estado === "pendiente" && (
                <button type="button" onClick={handleReenviarInvitacion} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-[10px] transition-colors" style={{ border: "1px solid #ebe4d8", background: "#ffffff", color: "#b04a10" }} onMouseEnter={e => (e.currentTarget.style.background = "#fff5ec")} onMouseLeave={e => (e.currentTarget.style.background = "#ffffff")}>
                  <Mail className="size-3.5" /> Reenviar invitación
                </button>
              )}
              {estado === "activo" && (
                <button type="button" onClick={() => setModal("desactivar")} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-[10px] transition-colors" style={{ border: "1px solid #ebe4d8", background: "#ffffff", color: "#847a6f" }} onMouseEnter={e => (e.currentTarget.style.background = "#f3eee6")} onMouseLeave={e => (e.currentTarget.style.background = "#ffffff")}>
                  <UserX className="size-3.5" /> Desactivar
                </button>
              )}
              {estado === "inactivo" && (
                <button type="button" onClick={() => setModal("reactivar")} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-[10px] transition-colors" style={{ border: "1px solid #ebe4d8", background: "#ffffff", color: "#2a8a5d" }} onMouseEnter={e => (e.currentTarget.style.background = "#e7f5ee")} onMouseLeave={e => (e.currentTarget.style.background = "#ffffff")}>
                  <UserCheck className="size-3.5" /> Reactivar
                </button>
              )}
              <button type="button" onClick={() => setModal("eliminar")} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-[10px] transition-colors" style={{ border: "1px solid #fbe9e6", background: "#ffffff", color: "#c0382a" }} onMouseEnter={e => (e.currentTarget.style.background = "#fbe9e6")} onMouseLeave={e => (e.currentTarget.style.background = "#ffffff")}>
                <Trash2 className="size-3.5" /> Eliminar cuenta
              </button>
            </div>
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Left: info + stats */}
            <div className="flex flex-col gap-5">

              {/* Info */}
              <div className="rounded-[16px] p-5 flex flex-col gap-4" style={{ background: "#ffffff", border: "1px solid #ebe4d8" }}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#b8aea1" }}>Información</p>

                {/* Rol */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs" style={{ color: "#847a6f" }}>Rol</span>
                  {editandoRol ? (
                    <div className="flex items-center gap-1.5">
                      <select value={rolTemp} onChange={e => setRolTemp(e.target.value as RolEmpleado)} className="text-xs px-2 py-1 rounded-[7px] outline-none" style={{ border: "1px solid #f57a26", background: "#fff5ec", color: "#4a423b" }}>
                        <option value="empleado">Empleado</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button type="button" onClick={() => { void handleConfirmarRol() }} disabled={loadingModal} className="size-6 flex items-center justify-center rounded-[7px]" style={{ background: "#e7f5ee" }}>
                        <Check className="size-3.5" style={{ color: "#2a8a5d" }} />
                      </button>
                      <button type="button" onClick={() => { setRolTemp(rolActual); setEditandoRol(false) }} className="size-6 flex items-center justify-center rounded-[7px]" style={{ background: "#f3eee6" }}>
                        <X className="size-3.5" style={{ color: "#847a6f" }} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: ROL_CFG[rolActual].bg, color: ROL_CFG[rolActual].color }}>{ROL_CFG[rolActual].label}</span>
                      <button type="button" onClick={() => { setRolTemp(rolActual); setEditandoRol(true) }} className="size-6 flex items-center justify-center rounded-[7px] transition-colors" style={{ color: "#b8aea1" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#f3eee6" }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}>
                        <Pencil className="size-3" />
                      </button>
                    </div>
                  )}
                </div>

                {[
                  { label: "Email",      value: empleadoBase.email },
                  { label: "ID interno", value: empleadoBase.id_interno },
                  { label: "Creado por", value: empleadoBase.creado_por },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-4">
                    <span className="text-xs shrink-0" style={{ color: "#847a6f" }}>{label}</span>
                    <span className="text-xs text-right font-medium" style={{ color: "#1a1410" }}>{value}</span>
                  </div>
                ))}

                <button type="button" onClick={() => setModal("reset")} className="flex items-center justify-center gap-1.5 w-full text-xs py-2 rounded-[10px] transition-colors mt-1" style={{ border: "1px solid #ebe4d8", background: "#faf7f2", color: "#4a423b" }} onMouseEnter={e => (e.currentTarget.style.background = "#f3eee6")} onMouseLeave={e => (e.currentTarget.style.background = "#faf7f2")}>
                  <KeyRound className="size-3.5" /> Resetear contraseña
                </button>
              </div>

              {/* Stats */}
              <div className="rounded-[16px] p-5 flex flex-col gap-3" style={{ background: "#ffffff", border: "1px solid #ebe4d8" }}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#b8aea1" }}>Rendimiento</p>
                {[
                  { label: "Pedidos procesados",    value: MOCK_STATS.pedidos_procesados.toString(), sub: "en total" },
                  { label: "Confianza IA promedio",  value: `${MOCK_STATS.confianza_ia}%`,           sub: "sobre confirmaciones" },
                  { label: "Correcciones manuales",  value: `${MOCK_STATS.tasa_correccion}%`,        sub: "tasa de edición" },
                  { label: "Tiempo medio / pedido",  value: `${MOCK_STATS.tiempo_medio}s`,           sub: "extracción IA" },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-xs" style={{ color: "#847a6f" }}>{s.label}</p>
                      <p className="text-[11px]" style={{ color: "#b8aea1" }}>{s.sub}</p>
                    </div>
                    <span className="text-base font-semibold" style={{ color: "#1a1410" }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: recent orders */}
            <div className="lg:col-span-2 rounded-[16px] flex flex-col overflow-hidden" style={{ background: "#ffffff", border: "1px solid #ebe4d8" }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #f3eee6" }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#1a1410" }}>Pedidos recientes</p>
                  <p className="text-xs mt-0.5" style={{ color: "#b8aea1" }}>Últimos 30 días · {MOCK_PEDIDOS.length} pedidos</p>
                </div>
                <button type="button" onClick={() => router.push(`/admin/todos-los-pedidos?empleado=${id}`)} className="text-xs px-3 py-1.5 rounded-[8px] transition-colors" style={{ border: "1px solid #ebe4d8", color: "#4a423b", background: "#ffffff" }} onMouseEnter={e => (e.currentTarget.style.background = "#f3eee6")} onMouseLeave={e => (e.currentTarget.style.background = "#ffffff")}>
                  Ver todos
                </button>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full" style={{ minWidth: 480 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #f3eee6" }}>
                      {["Referencia", "Cliente / Empresa", "Fecha", "Confianza", "Estado"].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#b8aea1" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_PEDIDOS.map((p, i) => (
                      <tr key={p.id} className="cursor-pointer transition-colors" style={{ borderBottom: i < MOCK_PEDIDOS.length - 1 ? "1px solid #f3eee6" : "none" }} onMouseEnter={e => (e.currentTarget.style.background = "#faf7f2")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")} onClick={() => router.push(`/admin/pedidos/${p.id}`)}>
                        <td className="px-5 py-3"><span className="text-xs font-mono" style={{ color: "#847a6f" }}>{p.referencia}</span></td>
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium" style={{ color: "#1a1410" }}>{p.cliente}</p>
                          <p className="text-xs" style={{ color: "#b8aea1" }}>{p.empresa}</p>
                        </td>
                        <td className="px-5 py-3 text-sm" style={{ color: "#4a423b" }}>
                          {new Date(p.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                        </td>
                        <td className="px-5 py-3"><IaConfianzaBadge nivel={p.confianza} /></td>
                        <td className="px-5 py-3">
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: p.estado === "procesado" ? "#e7f5ee" : p.estado === "pendiente" ? "#fbf1d9" : "#fbe9e6", color: p.estado === "procesado" ? "#2a8a5d" : p.estado === "pendiente" ? "#b07a12" : "#c0382a" }}>
                            {p.estado === "procesado" ? "Procesado" : p.estado === "pendiente" ? "Pendiente" : "Error"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales de confirmación */}
      {modal === "desactivar" && (
        <ConfirmModal
          title={`¿Desactivar a ${empleadoBase.nombre}?`}
          description="El empleado perderá el acceso a la plataforma inmediatamente. Podrás reactivarlo en cualquier momento."
          confirmLabel="Desactivar"
          confirmStyle="warning"
          loading={loadingModal}
          onConfirm={ejecutarModal}
          onCancel={() => setModal(null)}
        />
      )}
      {modal === "reactivar" && (
        <ConfirmModal
          title={`¿Reactivar a ${empleadoBase.nombre}?`}
          description="El empleado recuperará el acceso a la plataforma con su rol actual."
          confirmLabel="Reactivar"
          confirmStyle="normal"
          loading={loadingModal}
          onConfirm={ejecutarModal}
          onCancel={() => setModal(null)}
        />
      )}
      {modal === "eliminar" && (
        <ConfirmModal
          title={`¿Eliminar la cuenta de ${empleadoBase.nombre}?`}
          description="Esta acción es irreversible. Se eliminarán todos los datos del empleado y perderá el acceso permanentemente."
          confirmLabel="Eliminar cuenta"
          confirmStyle="danger"
          loading={loadingModal}
          onConfirm={ejecutarModal}
          onCancel={() => setModal(null)}
        />
      )}
      {modal === "reset" && (
        <ConfirmModal
          title="¿Resetear contraseña?"
          description={`Se enviará un email a ${empleadoBase.email} con un enlace para establecer una nueva contraseña.`}
          confirmLabel="Enviar email de reseteo"
          confirmStyle="normal"
          loading={loadingModal}
          onConfirm={ejecutarModal}
          onCancel={() => setModal(null)}
        />
      )}
    </>
  )
}
