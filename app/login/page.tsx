"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff, Mail, Lock, ArrowRight, Info } from "lucide-react"
import { saveAuth } from "@/lib/auth-simple"

const loginSchema = z.object({
  email:    z.string().email("Introduce un email válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
  remember: z.boolean().optional(),
})
type LoginForm = z.infer<typeof loginSchema>

const STATS = [
  { value: "1.4s",   label: "tiempo medio de extracción" },
  { value: "98%",    label: "precisión en campos clave" },
  { value: "10k+",   label: "pedidos procesados este mes" },
  { value: "CSV · JSON · API", label: "salida hacia tu ERP" },
]

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="size-8 rounded-[9px] flex items-center justify-center shrink-0 text-sm font-bold"
        style={{ background: "#f57a26", color: "#ffffff" }}
      >
        P
      </div>
      <span
        className="text-base font-semibold tracking-tight"
        style={{ color: "#1a1410", fontStyle: "italic", fontFamily: "'Instrument Serif', Georgia, serif" }}
      >
        PDFormatter
      </span>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginForm) {
    setApiError(null)
    const guards = [
      { url: "/api/auth/admin/login",    role: "admin"    as const },
      { url: "/api/auth/empleado/login", role: "empleado" as const },
    ]
    for (const guard of guards) {
      try {
        const res  = await fetch(guard.url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
        const json = await res.json()
        if (res.ok && json.success) {
          saveAuth(json.data.token, { ...json.data.user, role: guard.role })
          router.replace(guard.role === "admin" ? "/admin/empleados" : "/empleado/pedidos/nuevo")
          return
        }
      } catch { /* try next guard */ }
    }
    setApiError("Credenciales incorrectas. Comprueba tu email y contraseña.")
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#fbf8f4", fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ── Panel izquierdo: branding ── */}
      <div
        className="hidden lg:flex flex-col justify-between flex-1 relative overflow-hidden"
        style={{ padding: 52, background: "linear-gradient(135deg, #fbf8f4 0%, #f3eee6 100%)", borderRight: "1px solid #ebe4d8" }}
      >
        <Logo />

        {/* Cuerpo central */}
        <div style={{ maxWidth: 480 }}>
          {/* Eyebrow */}
          <p className="text-xs font-semibold uppercase tracking-widest mb-5 flex items-center gap-1.5" style={{ color: "#f57a26" }}>
            <span>✦</span> Pedidos · IA · ERP
          </p>

          {/* Heading */}
          <h1 className="font-semibold leading-[1.1] mb-5" style={{ fontSize: 42, color: "#1a1410" }}>
            De un PDF<br />
            a un pedido{" "}
            <em style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: "#f57a26", fontStyle: "italic", fontWeight: 400 }}>
              estructurado
            </em>
            <br />
            en segundos.
          </h1>

          <p className="text-sm leading-relaxed mb-8" style={{ color: "#847a6f", maxWidth: 400 }}>
            Sube cualquier pedido en PDF —sea cual sea su formato— y deja que la IA extraiga
            cliente, empresa, productos y fecha.{" "}
            <span style={{ color: "#b8aea1" }}>Tú revisas, confirmas, y el ERP lo recibe.</span>
          </p>

          {/* Stats 2×2 */}
          <div className="grid grid-cols-2 gap-x-10 gap-y-5">
            {STATS.map(({ value, label }) => (
              <div key={label} style={{ borderTop: "1px solid #ebe4d8", paddingTop: 14 }}>
                <p className="text-xl font-semibold mb-0.5" style={{ color: "#1a1410" }}>{value}</p>
                <p className="text-xs" style={{ color: "#b8aea1" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4">
          <p className="text-xs" style={{ color: "#b8aea1" }}>© 2026 PDFormatter</p>
          <span style={{ color: "#ddd4c4" }}>·</span>
          <button type="button" className="text-xs transition-colors" style={{ color: "#b8aea1" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#4a423b")}
            onMouseLeave={e => (e.currentTarget.style.color = "#b8aea1")}>
            Privacidad
          </button>
          <span style={{ color: "#ddd4c4" }}>·</span>
          <button type="button" className="text-xs transition-colors" style={{ color: "#b8aea1" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#4a423b")}
            onMouseLeave={e => (e.currentTarget.style.color = "#b8aea1")}>
            Términos
          </button>
        </div>

        {/* Decorative document card */}
        <div
          className="absolute rounded-[28px] shadow-2xl"
          style={{
            width: 520, padding: 40,
            bottom: -80, right: -120,
            background: "#ffffff",
            border: "1px solid #ebe4d8",
            transform: "rotate(18deg)",
            opacity: 0.7,
          }}
        >
          <div className="h-3 rounded-full mb-5" style={{ background: "#f3eee6", width: "50%" }} />
          <div className="h-3 rounded-full mb-4" style={{ background: "#f57a26", width: "90%", opacity: 0.3 }} />
          <div className="h-3 rounded-full mb-4" style={{ background: "#f3eee6", width: "75%" }} />
          <div className="h-3 rounded-full mb-8" style={{ background: "#f3eee6", width: "45%" }} />
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[82, 58, 94, 66, 88, 46, 75, 60, 90, 70, 85, 52].map((w, i) => (
              <div key={i} className="h-2.5 rounded-full" style={{ background: "#ebe4d8", width: `${w}%` }} />
            ))}
          </div>
          <div className="h-px mb-6" style={{ background: "#f3eee6" }} />
          <div className="flex justify-between items-center mb-4">
            <div className="h-2.5 rounded-full" style={{ background: "#ebe4d8", width: 90 }} />
            <div className="h-2.5 rounded-full" style={{ background: "#f57a26", width: 70, opacity: 0.35 }} />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-2.5 rounded-full" style={{ background: "#ebe4d8", width: 110 }} />
            <div className="h-2.5 rounded-full" style={{ background: "#ebe4d8", width: 55 }} />
          </div>
        </div>
      </div>

      {/* ── Panel derecho: formulario ── */}
      <div className="flex flex-col items-center justify-center flex-1 p-8" style={{ background: "#ffffff", minWidth: 0 }}>
        <div className="w-full" style={{ maxWidth: 380 }}>

          {/* Logo mobile */}
          <div className="lg:hidden mb-8">
            <Logo />
          </div>

          {/* Cabecera */}
          <div className="mb-7">
            <h2 className="text-2xl font-semibold mb-1.5" style={{ color: "#1a1410" }}>Inicia sesión</h2>
            <p className="text-sm" style={{ color: "#847a6f" }}>Detectamos tu rol automáticamente — admin o empleado.</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium" style={{ color: "#1a1410" }}>
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 pointer-events-none" style={{ color: "#b8aea1" }} />
                <input
                  id="email"
                  type="email"
                  placeholder="nombre@empresa.com"
                  autoComplete="email"
                  {...register("email")}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-[10px] outline-none transition-all"
                  style={{
                    border: `1px solid ${errors.email ? "#c0382a" : "#ebe4d8"}`,
                    background: "#faf7f2",
                    color: "#1a1410",
                  }}
                  onFocus={e => { e.target.style.borderColor = "#f57a26"; e.target.style.background = "#ffffff" }}
                  onBlur={e  => { e.target.style.borderColor = errors.email ? "#c0382a" : "#ebe4d8"; e.target.style.background = "#faf7f2" }}
                />
              </div>
              {errors.email && <p className="text-xs" style={{ color: "#c0382a" }}>{errors.email.message}</p>}
            </div>

            {/* Contraseña */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium" style={{ color: "#1a1410" }}>Contraseña</label>
                <button type="button" className="text-xs transition-colors" style={{ color: "#f57a26" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#d96017")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#f57a26")}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 pointer-events-none" style={{ color: "#b8aea1" }} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  {...register("password")}
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-[10px] outline-none transition-all"
                  style={{
                    border: `1px solid ${errors.password ? "#c0382a" : "#ebe4d8"}`,
                    background: "#faf7f2",
                    color: "#1a1410",
                  }}
                  onFocus={e => { e.target.style.borderColor = "#f57a26"; e.target.style.background = "#ffffff" }}
                  onBlur={e  => { e.target.style.borderColor = errors.password ? "#c0382a" : "#ebe4d8"; e.target.style.background = "#faf7f2" }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#b8aea1" }}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs" style={{ color: "#c0382a" }}>{errors.password.message}</p>}
            </div>

            {/* Recordarme */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                {...register("remember")}
                className="size-4 rounded accent-orange-500"
                style={{ accentColor: "#f57a26" }}
              />
              <span className="text-sm" style={{ color: "#4a423b" }}>Recordarme en este dispositivo</span>
            </label>

            {/* Error banner */}
            {apiError && (
              <div className="px-3 py-2.5 rounded-[10px] text-sm" style={{ background: "#fbe9e6", color: "#c0382a", border: "1px solid rgba(192,56,42,0.2)" }}>
                {apiError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 text-sm font-medium rounded-[10px] transition-all flex items-center justify-center gap-2 mt-1"
              style={{
                background: isSubmitting ? "#ddd4c4" : "#f57a26",
                color: "#ffffff",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                boxShadow: "0 1px 2px rgba(26,20,16,0.1)",
              }}
              onMouseEnter={e => { if (!isSubmitting) (e.currentTarget as HTMLElement).style.background = "#d96017" }}
              onMouseLeave={e => { if (!isSubmitting) (e.currentTarget as HTMLElement).style.background = "#f57a26" }}
            >
              {isSubmitting ? "Entrando…" : <><span>Entrar</span><ArrowRight className="size-4" /></>}
            </button>
          </form>

          {/* Nota final */}
          <div
            className="mt-5 px-3.5 py-3 rounded-[10px] flex items-start gap-2.5"
            style={{ background: "#faf7f2", border: "1px solid #ebe4d8" }}
          >
            <Info className="size-3.5 shrink-0 mt-0.5" style={{ color: "#b8aea1" }} />
            <p className="text-xs leading-relaxed" style={{ color: "#847a6f" }}>
              ¿Aún no tienes cuenta? Pide a tu administrador que te invite desde el panel de empleados.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
