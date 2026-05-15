"use client"

import { useState, useEffect, useRef } from "react"
import { User, Bell, Cpu, Lock, Building2, Check, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { getCurrentUser } from "@/lib/auth-simple"
import {
  getPerfil, savePerfil,
  getNotif,  saveNotif,
  getIA,     saveIA,
  getEmpresa, saveEmpresa,
  cambiarPassword,
  calcPasswordStrength,
  type PerfilData, type NotifData, type IAData, type EmpresaData,
} from "@/lib/settings-service"

/* ─── tipos ─────────────────────────────────────────────── */
type Seccion = "perfil" | "notificaciones" | "ia" | "seguridad" | "empresa"
interface Props { modo: "empleado" | "admin" }

/* ─── helpers UI ─────────────────────────────────────────── */
function Card({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] p-5 flex flex-col gap-4"
      style={{ border: "1px solid rgba(235,228,216,0.8)", background: "rgba(255,253,250,0.7)" }}>
      <div>
        <h2 className="text-sm font-semibold" style={{ color: "#1a1410" }}>{title}</h2>
        <p className="text-xs mt-0.5" style={{ color: "#b8aea1" }}>{description}</p>
      </div>
      {children}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: "#4a423b" }}>{label}</label>
      {children}
      {hint && <p className="text-xs" style={{ color: "#b8aea1" }}>{hint}</p>}
    </div>
  )
}

function StyledInput({ value, onChange, placeholder, type = "text", disabled }: {
  value: string; onChange?: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      disabled={disabled}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm rounded-[9px] outline-none transition-all"
      style={{
        border: "1px solid rgba(235,228,216,0.8)",
        background: disabled ? "rgba(245,240,232,0.4)" : "#fffdf9",
        color: disabled ? "#b8aea1" : "#1a1410",
        cursor: disabled ? "not-allowed" : "text",
      }}
      onFocus={e => { if (!disabled) (e.target as HTMLElement).style.borderColor = "#f57a26" }}
      onBlur={e => { if (!disabled) (e.target as HTMLElement).style.borderColor = "rgba(235,228,216,0.8)" }}
    />
  )
}

function StyledSelect({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm rounded-[9px] outline-none transition-all"
      style={{ border: "1px solid rgba(235,228,216,0.8)", background: "#fffdf9", color: "#1a1410" }}
      onFocus={e => { (e.target as HTMLElement).style.borderColor = "#f57a26" }}
      onBlur={e => { (e.target as HTMLElement).style.borderColor = "rgba(235,228,216,0.8)" }}
    >
      {children}
    </select>
  )
}

function Toggle({ value, onChange, label, description }: {
  value: boolean; onChange: (v: boolean) => void; label: string; description?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm" style={{ color: "#1a1410" }}>{label}</p>
        {description && <p className="text-xs mt-0.5" style={{ color: "#b8aea1" }}>{description}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className="shrink-0 relative rounded-full transition-all"
        style={{ width: 36, height: 20, background: value ? "#f57a26" : "rgba(180,170,160,0.4)" }}
        aria-checked={value}
        role="switch"
      >
        <span
          className="absolute top-0.5 rounded-full transition-all duration-150"
          style={{ width: 16, height: 16, background: "#ffffff", left: value ? 18 : 2, boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}
        />
      </button>
    </div>
  )
}

function SaveButton({ loading, dirty, onClick }: { loading: boolean; dirty: boolean; onClick: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onClick}
        disabled={loading || !dirty}
        className="flex items-center gap-2 px-4 py-2 rounded-[9px] text-sm font-medium transition-all self-start"
        style={{
          background: !dirty ? "rgba(245,122,38,0.25)" : loading ? "rgba(245,122,38,0.5)" : "#f57a26",
          color: "#fff",
          cursor: loading || !dirty ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Guardando…" : <><Check className="size-4" />Guardar cambios</>}
      </button>
      {dirty && !loading && (
        <span className="text-xs" style={{ color: "#b8aea1" }}>Cambios sin guardar</span>
      )}
    </div>
  )
}

/* ─── sección Perfil ─────────────────────────────────────── */
function SeccionPerfil() {
  const user = getCurrentUser()
  const saved = getPerfil()

  const [nombre,   setNombre]   = useState(saved.nombre   || user?.nombre   || "")
  const [telefono, setTelefono] = useState(saved.telefono || "")
  const [loading,  setLoading]  = useState(false)

  const initial = useRef({ nombre: saved.nombre || user?.nombre || "", telefono: saved.telefono || "" })
  const dirty = nombre !== initial.current.nombre || telefono !== initial.current.telefono

  async function guardar() {
    if (!nombre.trim()) { toast.error("El nombre no puede estar vacío"); return }
    setLoading(true)
    try {
      await savePerfil({ nombre: nombre.trim(), telefono: telefono.trim() })
      initial.current = { nombre: nombre.trim(), telefono: telefono.trim() }
      toast.success("Perfil actualizado")
    } catch {
      toast.error("Error al guardar el perfil")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="Perfil personal" description="Tu nombre e información de contacto visible en la plataforma">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Nombre completo">
          <StyledInput value={nombre} onChange={setNombre} placeholder="Tu nombre" />
        </Field>
        <Field label="Teléfono" hint="Opcional">
          <StyledInput value={telefono} onChange={setTelefono} placeholder="+34 600 000 000" />
        </Field>
      </div>
      <Field label="Correo electrónico" hint="Identificador de acceso. Contacta con el administrador para cambiarlo.">
        <StyledInput value={user?.email ?? ""} disabled />
      </Field>
      <SaveButton loading={loading} dirty={dirty} onClick={guardar} />
    </Card>
  )
}

/* ─── sección Notificaciones ─────────────────────────────── */
function SeccionNotificaciones() {
  const user   = getCurrentUser()
  const userId = user?.id

  const saved = getNotif(userId)
  const [data,    setData]    = useState<NotifData>(saved)
  const [loading, setLoading] = useState(false)
  const initial = useRef<NotifData>(saved)

  const dirty = JSON.stringify(data) !== JSON.stringify(initial.current)

  function set<K extends keyof NotifData>(key: K, val: NotifData[K]) {
    setData(prev => ({ ...prev, [key]: val }))
  }

  async function guardar() {
    setLoading(true)
    try {
      await saveNotif(data, userId)
      initial.current = { ...data }
      toast.success("Preferencias de notificación guardadas")
    } catch {
      toast.error("Error al guardar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="Notificaciones por email" description="Elige qué alertas quieres recibir en tu correo">
      <div className="flex flex-col gap-4">
        <Toggle value={data.erroresIA}      onChange={v => set("erroresIA", v)}      label="Errores de extracción IA"      description="Cuando la IA no consigue extraer datos correctamente de un PDF" />
        <Toggle value={data.confirmaciones} onChange={v => set("confirmaciones", v)} label="Confirmación de pedidos"       description="Cada vez que confirmas un pedido y se envía al ERP" />
        <Toggle value={data.exportaciones}  onChange={v => set("exportaciones", v)}  label="Exportaciones al ERP"          description="Resumen cuando se completa una exportación manual o webhook" />
        <Toggle value={data.resumenSemanal} onChange={v => set("resumenSemanal", v)} label="Resumen semanal de actividad"  description="Un email cada lunes con el resumen de pedidos de la semana anterior" />
      </div>
      <SaveButton loading={loading} dirty={dirty} onClick={guardar} />
    </Card>
  )
}

/* ─── sección Extracción IA ──────────────────────────────── */
function SeccionIA() {
  const user   = getCurrentUser()
  const userId = user?.id

  const saved = getIA(userId)
  const [data,    setData]    = useState<IAData>(saved)
  const [loading, setLoading] = useState(false)
  const initial = useRef<IAData>(saved)

  const dirty = JSON.stringify(data) !== JSON.stringify(initial.current)

  function set<K extends keyof IAData>(key: K, val: IAData[K]) {
    setData(prev => ({ ...prev, [key]: val }))
  }

  async function guardar() {
    const v = Number(data.confianzaMin)
    if (isNaN(v) || v < 0 || v > 100) { toast.error("La confianza debe estar entre 0 y 100"); return }
    if (data.autoconfirmar && data.revisionManual) {
      toast.error("No puedes activar autoconfirmar y revisión manual a la vez")
      return
    }
    setLoading(true)
    try {
      await saveIA(data, userId)
      initial.current = { ...data }
      toast.success("Preferencias de extracción guardadas")
    } catch {
      toast.error("Error al guardar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="Extracción IA" description="Configura cómo se comporta la IA al procesar tus PDFs">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Confianza mínima aceptada (%)" hint="Pedidos por debajo de este umbral se marcan para revisión">
          <input
            type="number" min={0} max={100}
            value={data.confianzaMin}
            onChange={e => set("confianzaMin", Number(e.target.value))}
            className="w-full px-3 py-2 text-sm rounded-[9px] outline-none transition-all"
            style={{ border: "1px solid rgba(235,228,216,0.8)", background: "#fffdf9", color: "#1a1410" }}
            onFocus={e => { (e.target as HTMLElement).style.borderColor = "#f57a26" }}
            onBlur={e => { (e.target as HTMLElement).style.borderColor = "rgba(235,228,216,0.8)" }}
          />
        </Field>
        <Field label="Idioma del PDF">
          <StyledSelect value={data.idioma} onChange={v => set("idioma", v)}>
            <option value="es">Español</option>
            <option value="en">Inglés</option>
            <option value="fr">Francés</option>
            <option value="de">Alemán</option>
            <option value="auto">Detectar automáticamente</option>
          </StyledSelect>
        </Field>
      </div>
      <div className="flex flex-col gap-4">
        <Toggle
          value={data.revisionManual}
          onChange={v => { set("revisionManual", v); if (v) set("autoconfirmar", false) }}
          label="Siempre revisar antes de confirmar"
          description="Muestra la pantalla de revisión aunque la confianza sea alta"
        />
        <Toggle
          value={data.autoconfirmar}
          onChange={v => { set("autoconfirmar", v); if (v) set("revisionManual", false) }}
          label="Autoconfirmar si confianza ≥ 95 %"
          description="Envía automáticamente al ERP sin revisión manual"
        />
      </div>
      {data.autoconfirmar && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-[9px] text-xs"
          style={{ background: "rgba(245,122,38,0.06)", border: "1px solid rgba(245,122,38,0.2)", color: "#c4622a" }}>
          <span className="mt-0.5">⚠</span>
          Con el autoconfirmado activo los pedidos con confianza alta se enviarán al ERP sin revisión. Asegúrate de que la IA es fiable con tus documentos.
        </div>
      )}
      <SaveButton loading={loading} dirty={dirty} onClick={guardar} />
    </Card>
  )
}

/* ─── sección Seguridad ──────────────────────────────────── */
function SeccionSeguridad() {
  const [actual,     setActual]     = useState("")
  const [nueva,      setNueva]      = useState("")
  const [confirma,   setConfirma]   = useState("")
  const [loading,    setLoading]    = useState(false)
  const [showActual, setShowActual] = useState(false)
  const [showNueva,  setShowNueva]  = useState(false)

  const strength = calcPasswordStrength(nueva)
  const dirty    = !!actual || !!nueva || !!confirma

  async function cambiar() {
    if (!actual)         { toast.error("Introduce tu contraseña actual"); return }
    if (!nueva)          { toast.error("Introduce la nueva contraseña"); return }
    if (strength.score < 2) { toast.error("La contraseña es demasiado débil"); return }
    if (nueva !== confirma) { toast.error("Las contraseñas no coinciden"); return }
    if (nueva === actual)   { toast.error("La nueva contraseña debe ser distinta a la actual"); return }

    setLoading(true)
    try {
      await cambiarPassword({ actual, nueva })
      setActual(""); setNueva(""); setConfirma("")
      toast.success("Contraseña actualizada correctamente")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar la contraseña")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="Seguridad" description="Cambia tu contraseña de acceso">
      <div className="flex flex-col gap-3 max-w-sm">
        {/* Contraseña actual */}
        <Field label="Contraseña actual">
          <div className="relative">
            <input
              type={showActual ? "text" : "password"}
              value={actual}
              onChange={e => setActual(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 pr-9 text-sm rounded-[9px] outline-none transition-all"
              style={{ border: "1px solid rgba(235,228,216,0.8)", background: "#fffdf9", color: "#1a1410" }}
              onFocus={e => { (e.target as HTMLElement).style.borderColor = "#f57a26" }}
              onBlur={e => { (e.target as HTMLElement).style.borderColor = "rgba(235,228,216,0.8)" }}
            />
            <button onClick={() => setShowActual(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2" type="button">
              {showActual ? <EyeOff className="size-4" style={{ color: "#b8aea1" }} /> : <Eye className="size-4" style={{ color: "#b8aea1" }} />}
            </button>
          </div>
        </Field>

        {/* Nueva contraseña */}
        <Field label="Nueva contraseña">
          <div className="relative">
            <input
              type={showNueva ? "text" : "password"}
              value={nueva}
              onChange={e => setNueva(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 pr-9 text-sm rounded-[9px] outline-none transition-all"
              style={{ border: "1px solid rgba(235,228,216,0.8)", background: "#fffdf9", color: "#1a1410" }}
              onFocus={e => { (e.target as HTMLElement).style.borderColor = "#f57a26" }}
              onBlur={e => { (e.target as HTMLElement).style.borderColor = "rgba(235,228,216,0.8)" }}
            />
            <button onClick={() => setShowNueva(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2" type="button">
              {showNueva ? <EyeOff className="size-4" style={{ color: "#b8aea1" }} /> : <Eye className="size-4" style={{ color: "#b8aea1" }} />}
            </button>
          </div>

          {/* Barra de fortaleza */}
          {nueva && (
            <div className="flex flex-col gap-1.5 mt-1">
              <div className="flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-1 flex-1 rounded-full transition-all"
                      style={{ background: i <= strength.score ? strength.color : "rgba(235,228,216,0.8)" }} />
                  ))}
                </div>
                <span className="text-[11px] font-medium" style={{ color: strength.color }}>{strength.label}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                {strength.checks.map(c => (
                  <span key={c.label} className="text-[11px] flex items-center gap-1.5"
                    style={{ color: c.ok ? "#22c55e" : "#b8aea1" }}>
                    <span>{c.ok ? "✓" : "○"}</span>{c.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Field>

        {/* Confirmar */}
        <Field label="Confirmar nueva contraseña">
          <div className="relative">
            <input
              type="password"
              value={confirma}
              onChange={e => setConfirma(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm rounded-[9px] outline-none transition-all"
              style={{
                border: `1px solid ${confirma && nueva && confirma !== nueva ? "#ef4444" : "rgba(235,228,216,0.8)"}`,
                background: "#fffdf9", color: "#1a1410",
              }}
              onFocus={e => { (e.target as HTMLElement).style.borderColor = "#f57a26" }}
              onBlur={e => {
                (e.target as HTMLElement).style.borderColor =
                  confirma && nueva && confirma !== nueva ? "#ef4444" : "rgba(235,228,216,0.8)"
              }}
            />
          </div>
          {confirma && nueva && confirma !== nueva && (
            <p className="text-xs" style={{ color: "#ef4444" }}>Las contraseñas no coinciden</p>
          )}
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={cambiar}
          disabled={loading || !dirty}
          className="flex items-center gap-2 px-4 py-2 rounded-[9px] text-sm font-medium transition-all"
          style={{
            background: !dirty ? "rgba(245,122,38,0.25)" : loading ? "rgba(245,122,38,0.5)" : "#f57a26",
            color: "#fff",
            cursor: loading || !dirty ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Actualizando…" : <><Lock className="size-4" />Cambiar contraseña</>}
        </button>

        {/* Nota: requiere API */}
        <span className="text-[11px] px-2 py-1 rounded-[6px]"
          style={{ background: "rgba(245,240,232,0.6)", color: "#b8aea1" }}>
          Requiere API
        </span>
      </div>
    </Card>
  )
}

/* ─── sección Empresa ─────────────────────────────────────── */
function SeccionEmpresa() {
  const saved = getEmpresa()
  const [data,    setData]    = useState<EmpresaData>(saved)
  const [loading, setLoading] = useState(false)
  const initial = useRef<EmpresaData>(saved)

  const dirty = JSON.stringify(data) !== JSON.stringify(initial.current)

  function set<K extends keyof EmpresaData>(key: K, val: EmpresaData[K]) {
    setData(prev => ({ ...prev, [key]: val }))
  }

  async function guardar() {
    if (!data.nombre.trim()) { toast.error("El nombre de empresa es obligatorio"); return }
    setLoading(true)
    try {
      await saveEmpresa(data)
      initial.current = { ...data }
      toast.success("Datos de empresa actualizados")
    } catch {
      toast.error("Error al guardar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="Empresa" description="Datos de tu organización que aparecen en exportaciones y emails">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Nombre de la empresa">
          <StyledInput value={data.nombre} onChange={v => set("nombre", v)} placeholder="Nombre S.L." />
        </Field>
        <Field label="CIF / NIF">
          <StyledInput value={data.cif} onChange={v => set("cif", v)} placeholder="B-00000000" />
        </Field>
      </div>
      <Field label="Dirección">
        <StyledInput value={data.direccion} onChange={v => set("direccion", v)} placeholder="Calle, número, ciudad" />
      </Field>
      <Field label="Zona horaria">
        <StyledSelect value={data.timezone} onChange={v => set("timezone", v)}>
          <option value="Europe/Madrid">Europa / Madrid (UTC+1)</option>
          <option value="Europe/London">Europa / Londres (UTC+0)</option>
          <option value="America/New_York">América / Nueva York (UTC-5)</option>
          <option value="America/Mexico_City">América / Ciudad de México (UTC-6)</option>
        </StyledSelect>
      </Field>
      <SaveButton loading={loading} dirty={dirty} onClick={guardar} />
    </Card>
  )
}

/* ─── vista principal ────────────────────────────────────── */
const SECCIONES_EMPLEADO: { key: Seccion; label: string; icon: React.ElementType }[] = [
  { key: "perfil",         label: "Perfil",         icon: User      },
  { key: "notificaciones", label: "Notificaciones",  icon: Bell      },
  { key: "ia",             label: "Extracción IA",   icon: Cpu       },
  { key: "seguridad",      label: "Seguridad",       icon: Lock      },
]

const SECCIONES_ADMIN: typeof SECCIONES_EMPLEADO = [
  { key: "empresa",        label: "Empresa",         icon: Building2 },
  ...SECCIONES_EMPLEADO,
]

function NavItem({ item, activa, onClick }: {
  item: typeof SECCIONES_EMPLEADO[number]; activa: Seccion; onClick: () => void
}) {
  const { key, label, icon: Icon } = item
  const active = activa === key
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-sm font-medium text-left w-full transition-colors"
      style={{ background: active ? "rgba(245,122,38,0.07)" : "transparent", color: active ? "#c4622a" : "#4a423b" }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(235,228,216,0.5)" }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent" }}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </button>
  )
}

export function AjustesView({ modo }: Props) {
  const [activa, setActiva] = useState<Seccion>(modo === "admin" ? "empresa" : "perfil")

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "#1a1410" }}>Ajustes</h1>
        <p className="text-sm mt-1" style={{ color: "#847a6f" }}>
          {modo === "admin"
            ? "Configuración de empresa, tu perfil y preferencias de la plataforma."
            : "Tu perfil y preferencias personales de PDFormatter."}
        </p>
      </div>

      <div className="flex gap-6 items-start">
        {/* Sidebar */}
        <nav className="shrink-0 flex flex-col gap-0.5 w-44">
          {modo === "admin" && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-1" style={{ color: "#b8aea1" }}>Admin</p>
              <NavItem item={SECCIONES_ADMIN[0]} activa={activa} onClick={() => setActiva("empresa")} />
              <div style={{ height: 1, background: "rgba(235,228,216,0.6)", margin: "6px 12px" }} />
              <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-1" style={{ color: "#b8aea1" }}>Personal</p>
            </>
          )}
          {SECCIONES_EMPLEADO.map(item => (
            <NavItem key={item.key} item={item} activa={activa} onClick={() => setActiva(item.key)} />
          ))}
        </nav>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {activa === "empresa"        && <SeccionEmpresa />}
          {activa === "perfil"         && <SeccionPerfil />}
          {activa === "notificaciones" && <SeccionNotificaciones />}
          {activa === "ia"             && <SeccionIA />}
          {activa === "seguridad"      && <SeccionSeguridad />}
        </div>
      </div>
    </div>
  )
}
