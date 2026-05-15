"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Mail, User, Shield, CheckCircle2, Send } from "lucide-react"
import { toast } from "sonner"

const ROL_OPTIONS = [
  {
    value: "empleado",
    label: "Empleado",
    description: "Sube PDFs, revisa los datos extraídos por la IA y confirma los pedidos.",
    icon: User,
  },
  {
    value: "administrador",
    label: "Administrador",
    description: "Gestiona empleados, accede a la auditoría y configura la exportación al ERP.",
    icon: Shield,
  },
]

export default function InvitarEmpleadoPage() {
  const router = useRouter()

  const [nombre, setNombre]         = useState("")
  const [apellidos, setApellidos]   = useState("")
  const [email, setEmail]           = useState("")
  const [rol, setRol]               = useState<"empleado" | "administrador">("empleado")
  const [acceso, setAcceso]         = useState(true)
  const [tutorial, setTutorial]     = useState(true)
  const [forzarPass, setForzarPass] = useState(false)
  const [mensaje, setMensaje]       = useState("")
  const [loading, setLoading]       = useState(false)
  const [errors, setErrors]         = useState<Record<string, string>>({})

  const nombreCompleto = [nombre, apellidos].filter(Boolean).join(" ") || "Empleado"
  const emailPreview   = email || "empleado@empresa.es"
  const adminNombre    = "Carla Méndez"

  function validate() {
    const e: Record<string, string> = {}
    if (!nombre.trim())  e.nombre = "El nombre es obligatorio"
    if (!email.trim())   e.email  = "El correo es obligatorio"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Correo no válido"
    return e
  }

  async function handleEnviar() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setLoading(true)
    await new Promise(r => setTimeout(r, 900))
    setLoading(false)
    toast.success(`Invitación enviada a ${email}`)
    router.push("/admin/empleados")
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm mb-4 transition-colors"
          style={{ color: "#847a6f" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#1a1410" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#847a6f" }}
        >
          <ArrowLeft className="size-4" />
          Empleados
        </button>
        <h1 className="text-xl font-semibold" style={{ color: "#1a1410" }}>Invitar un nuevo empleado</h1>
        <p className="text-sm mt-1" style={{ color: "#847a6f" }}>Le enviaremos un email con un enlace para que establezca su contraseña.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-3 flex flex-col gap-5">

          {/* Datos personales */}
          <Section title="Datos personales" description="Nombre y correo del empleado a invitar">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombre" error={errors.nombre}>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Andrés"
                  className="w-full px-3 py-2 text-sm rounded-[9px] outline-none transition-all"
                  style={{ border: `1px solid ${errors.nombre ? "#e05a2b" : "rgba(235,228,216,0.8)"}`, background: "#fffdf9", color: "#1a1410" }}
                  onFocus={e => { (e.target as HTMLElement).style.borderColor = "#f57a26" }}
                  onBlur={e => { (e.target as HTMLElement).style.borderColor = errors.nombre ? "#e05a2b" : "rgba(235,228,216,0.8)" }}
                />
              </Field>
              <Field label="Apellidos">
                <input
                  type="text"
                  value={apellidos}
                  onChange={e => setApellidos(e.target.value)}
                  placeholder="Cárdenas López"
                  className="w-full px-3 py-2 text-sm rounded-[9px] outline-none transition-all"
                  style={{ border: "1px solid rgba(235,228,216,0.8)", background: "#fffdf9", color: "#1a1410" }}
                  onFocus={e => { (e.target as HTMLElement).style.borderColor = "#f57a26" }}
                  onBlur={e => { (e.target as HTMLElement).style.borderColor = "rgba(235,228,216,0.8)" }}
                />
              </Field>
            </div>
            <Field label="Correo electrónico" error={errors.email} hint="Se usará como dirección de invitación e identificador de acceso">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="andres.cardenas@empresa.es"
                className="w-full px-3 py-2 text-sm rounded-[9px] outline-none transition-all"
                style={{ border: `1px solid ${errors.email ? "#e05a2b" : "rgba(235,228,216,0.8)"}`, background: "#fffdf9", color: "#1a1410" }}
                onFocus={e => { (e.target as HTMLElement).style.borderColor = "#f57a26" }}
                onBlur={e => { (e.target as HTMLElement).style.borderColor = errors.email ? "#e05a2b" : "rgba(235,228,216,0.8)" }}
              />
            </Field>
          </Section>

          {/* Acceso y rol */}
          <Section title="Acceso y rol" description="Define qué puede hacer dentro de PDFormatter">
            <div className="flex flex-col gap-2">
              {ROL_OPTIONS.map(opt => {
                const active = rol === opt.value
                const Icon   = opt.icon
                return (
                  <button
                    key={opt.value}
                    onClick={() => setRol(opt.value as typeof rol)}
                    className="flex items-start gap-3 px-4 py-3 rounded-[10px] text-left transition-all"
                    style={{
                      border: `1.5px solid ${active ? "rgba(245,122,38,0.4)" : "rgba(235,228,216,0.8)"}`,
                      background: active ? "rgba(245,122,38,0.04)" : "#fffdf9",
                    }}
                  >
                    <div
                      className="size-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5"
                      style={{ borderColor: active ? "#f57a26" : "rgba(180,170,160,0.6)" }}
                    >
                      {active && <div className="size-2.5 rounded-full" style={{ background: "#f57a26" }} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Icon className="size-4" style={{ color: active ? "#c4622a" : "#847a6f" }} />
                        <span className="text-sm font-medium" style={{ color: "#1a1410" }}>{opt.label}</span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "#847a6f" }}>{opt.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </Section>

          {/* Activación inmediata */}
          <Section title="Activación inmediata" description="Configuración de acceso al invitar">
            <div className="flex flex-col gap-3">
              {[
                { state: acceso,     set: setAcceso,     label: "Permitir el acceso desde la primera conexión" },
                { state: tutorial,   set: setTutorial,   label: "Enviar tutorial de bienvenida por email" },
                { state: forzarPass, set: setForzarPass, label: "Requerir cambio de contraseña en el primer login" },
              ].map(({ state, set, label }) => (
                <label key={label} className="flex items-center gap-3 cursor-pointer select-none">
                  <button
                    onClick={() => set(!state)}
                    className="size-5 rounded-[5px] border-2 flex items-center justify-center shrink-0 transition-all"
                    style={{
                      borderColor: state ? "#f57a26" : "rgba(180,170,160,0.6)",
                      background: state ? "#f57a26" : "transparent",
                    }}
                  >
                    {state && <CheckCircle2 className="size-3.5 text-white" strokeWidth={3} />}
                  </button>
                  <span className="text-sm" style={{ color: "#4a423b" }}>{label}</span>
                </label>
              ))}
            </div>
          </Section>

          {/* Mensaje personalizado */}
          <Section title="Mensaje personalizado" description="(Opcional) Se incluye en el email de invitación">
            <textarea
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              rows={3}
              placeholder={`¡Hola ${nombre || "Andrés"}! Te damos acceso a PDFormatter…`}
              className="w-full px-3 py-2 text-sm rounded-[9px] outline-none resize-none transition-all"
              style={{ border: "1px solid rgba(235,228,216,0.8)", background: "#fffdf9", color: "#1a1410" }}
              onFocus={e => { (e.target as HTMLElement).style.borderColor = "#f57a26" }}
              onBlur={e => { (e.target as HTMLElement).style.borderColor = "rgba(235,228,216,0.8)" }}
            />
          </Section>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleEnviar}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-medium transition-all"
              style={{
                background: loading ? "rgba(245,122,38,0.5)" : "#f57a26",
                color: "#ffffff",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              <Send className="size-4" />
              {loading ? "Enviando…" : "Enviar invitación"}
            </button>
            <button
              onClick={() => router.back()}
              className="px-4 py-2.5 rounded-[10px] text-sm transition-colors"
              style={{ color: "#847a6f", border: "1px solid rgba(235,228,216,0.8)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(235,228,216,0.4)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
            >
              Cancelar
            </button>
          </div>
        </div>

        {/* Email preview */}
        <div className="lg:col-span-2">
          <div
            className="sticky top-0 rounded-[14px] overflow-hidden"
            style={{ border: "1px solid rgba(235,228,216,0.8)", background: "#fffdf9" }}
          >
            <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(235,228,216,0.6)", background: "rgba(245,240,232,0.4)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#b8aea1" }}>Vista previa del email</p>
            </div>
            <div className="px-4 py-4">
              {/* Meta */}
              <div className="flex flex-col gap-1 mb-4 text-xs" style={{ color: "#847a6f" }}>
                <span><span className="font-medium" style={{ color: "#4a423b" }}>Para:</span> {emailPreview}</span>
                <span><span className="font-medium" style={{ color: "#4a423b" }}>Asunto:</span> {adminNombre} te ha invitado a PDFormatter</span>
              </div>
              {/* Email body */}
              <div
                className="rounded-[10px] p-4 flex flex-col gap-3"
                style={{ border: "1px solid rgba(235,228,216,0.8)", background: "#ffffff" }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="size-6 rounded-[6px] flex items-center justify-center"
                    style={{ background: "rgba(245,122,38,0.1)", border: "1px solid rgba(245,122,38,0.2)" }}
                  >
                    <Mail className="size-3.5" style={{ color: "#f57a26" }} />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "#1a1410" }}>PDFormatter</span>
                </div>
                <p className="text-xs" style={{ color: "#4a423b", lineHeight: 1.6 }}>
                  Hola <strong>{nombreCompleto}</strong>,
                </p>
                <p className="text-xs" style={{ color: "#4a423b", lineHeight: 1.6 }}>
                  <strong>{adminNombre}</strong> te ha invitado a PDFormatter como <strong>{rol}</strong>. Haz clic en el botón para establecer tu contraseña y empezar.
                </p>
                {mensaje && (
                  <p className="text-xs italic px-3 py-2 rounded-[8px]" style={{ color: "#847a6f", background: "rgba(245,240,232,0.6)", borderLeft: "2px solid rgba(245,122,38,0.3)" }}>
                    "{mensaje}"
                  </p>
                )}
                <button
                  className="w-full py-2 rounded-[8px] text-xs font-semibold text-white"
                  style={{ background: "#f57a26" }}
                  disabled
                >
                  Aceptar invitación
                </button>
                <p className="text-[11px] text-center" style={{ color: "#b8aea1" }}>El enlace expira en 7 días.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-[14px] p-5 flex flex-col gap-4"
      style={{ border: "1px solid rgba(235,228,216,0.8)", background: "rgba(255,253,250,0.7)" }}
    >
      <div>
        <h2 className="text-sm font-semibold" style={{ color: "#1a1410" }}>{title}</h2>
        <p className="text-xs mt-0.5" style={{ color: "#b8aea1" }}>{description}</p>
      </div>
      {children}
    </div>
  )
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: "#4a423b" }}>{label}</label>
      {children}
      {error && <p className="text-xs" style={{ color: "#e05a2b" }}>{error}</p>}
      {hint && !error && <p className="text-xs" style={{ color: "#b8aea1" }}>{hint}</p>}
    </div>
  )
}
