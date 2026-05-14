"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff } from "lucide-react"
import { saveAuth } from "@/lib/auth-simple"

const loginSchema = z.object({
  email: z.string().email("Introduce un email válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
})
type LoginForm = z.infer<typeof loginSchema>

const STATS = [
  { value: "< 8s", label: "tiempo medio de extracción" },
  { value: "97%", label: "precisión en campos clave" },
  { value: "1.240", label: "pedidos procesados este mes" },
]

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
    <div className="min-h-screen grid lg:grid-cols-2" style={{ fontFamily: "var(--font-sans)" }}>

      {/* ── Panel izquierdo: branding ── */}
      <div className="hidden lg:flex flex-col justify-between p-12" style={{ background: "#1a1410", color: "#ffffff" }}>
        {/* Logo */}
        <span className="text-base font-semibold tracking-tight">PDFormatter</span>

        {/* Cuerpo */}
        <div className="space-y-7">
          {/* Pills */}
          <div className="flex gap-2">
            {["🗂 Pedidos", "🤖 IA", "📊 ERP"].map((t) => (
              <span key={t} className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}>
                {t}
              </span>
            ))}
          </div>

          <h1 className="text-[2rem] font-semibold leading-snug" style={{ maxWidth: 440 }}>
            De un PDF a un pedido estructurado en segundos
          </h1>

          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)", maxWidth: 400 }}>
            Sube cualquier pedido en PDF —sea cual sea su formato— y deja que la IA extraiga
            cliente, empresa, productos y fecha. Tú revisas, confirmas, y el ERP lo recibe.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 pt-2">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="text-2xl font-semibold" style={{ color: "#f57a26" }}>{value}</p>
                <p className="text-xs mt-1 leading-snug" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Formatos */}
          <div className="flex items-center gap-2 pt-1">
            {["CSV", "JSON", "API"].map((fmt, i) => (
              <span key={fmt} className="flex items-center gap-2">
                {i > 0 && <span style={{ color: "rgba(255,255,255,0.3)" }}>→</span>}
                <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)" }}>
                  {fmt}
                </span>
              </span>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>© 2026 PDFormatter</p>
      </div>

      {/* ── Panel derecho: formulario ── */}
      <div className="flex items-center justify-center p-8" style={{ background: "#fbf8f4" }}>
        <div className="w-full" style={{ maxWidth: 360 }}>

          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <span className="text-lg font-semibold">PDFormatter</span>
          </div>

          {/* Cabecera */}
          <div className="mb-7">
            <h2 className="text-2xl font-semibold mb-1" style={{ color: "#1a1410" }}>Inicia sesión</h2>
            <p className="text-sm" style={{ color: "#847a6f" }}>Detectamos tu rol automáticamente — admin o empleado</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium" style={{ color: "#1a1410" }}>
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                placeholder="nombre@empresa.com"
                autoComplete="email"
                {...register("email")}
                className="w-full px-3 py-2 text-sm rounded-[10px] outline-none transition-all"
                style={{
                  border: `1px solid ${errors.email ? "#c0382a" : "#ebe4d8"}`,
                  background: "#ffffff",
                  color: "#1a1410",
                  boxShadow: "var(--shadow-xs)",
                }}
                onFocus={e => e.target.style.borderColor = "#f57a26"}
                onBlur={e  => e.target.style.borderColor = errors.email ? "#c0382a" : "#ebe4d8"}
              />
              {errors.email && <p className="text-xs" style={{ color: "#c0382a" }}>{errors.email.message}</p>}
            </div>

            {/* Contraseña */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium" style={{ color: "#1a1410" }}>Contraseña</label>
                <button type="button" className="text-xs transition-colors" style={{ color: "#847a6f" }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register("password")}
                  className="w-full px-3 py-2 pr-10 text-sm rounded-[10px] outline-none transition-all"
                  style={{
                    border: `1px solid ${errors.password ? "#c0382a" : "#ebe4d8"}`,
                    background: "#ffffff",
                    color: "#1a1410",
                    boxShadow: "var(--shadow-xs)",
                  }}
                  onFocus={e => e.target.style.borderColor = "#f57a26"}
                  onBlur={e  => e.target.style.borderColor = errors.password ? "#c0382a" : "#ebe4d8"}
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
              className="w-full py-2 text-sm font-medium rounded-[10px] transition-all mt-1"
              style={{
                background: isSubmitting ? "#ddd4c4" : "#f57a26",
                color: "#ffffff",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                boxShadow: "0 1px 2px rgba(26,20,16,0.1)",
              }}
              onMouseEnter={e => { if (!isSubmitting) (e.target as HTMLElement).style.background = "#d96017" }}
              onMouseLeave={e => { if (!isSubmitting) (e.target as HTMLElement).style.background = "#f57a26" }}
            >
              {isSubmitting ? "Entrando…" : "Entrar"}
            </button>
          </form>

          {/* Nota final */}
          <p className="text-center text-xs mt-6 leading-relaxed" style={{ color: "#b8aea1" }}>
            ¿Aún no tienes cuenta?{" "}
            <span style={{ color: "#4a423b" }}>Pide a tu administrador que te invite desde el panel de empleados.</span>
          </p>
        </div>
      </div>
    </div>
  )
}
