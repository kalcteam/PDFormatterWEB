"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { FileText, ShoppingBag, History, Users, Download, LogOut, Menu, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { clearAuth, getCurrentUser } from "@/lib/auth-simple"

const navAdmin = [
  { href: "/admin/empleados", label: "Empleados",     icon: Users },
  { href: "/admin/exportar",  label: "Exportar a ERP", icon: Download },
]

const navEmpleado = [
  { href: "/empleado/pedidos/nuevo", label: "Nuevo pedido", icon: FileText },
  { href: "/empleado/pedidos",       label: "Mis pedidos",  icon: ShoppingBag },
  { href: "/empleado/historial",     label: "Historial",    icon: History },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname()
  const router     = useRouter()
  const user       = getCurrentUser()
  const [open, setOpen] = useState(false)

  const nav = user?.role === "admin" ? navAdmin : navEmpleado

  const initials = user?.nombre
    ? user.nombre.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "?"

  function handleLogout() {
    clearAuth()
    router.push("/login")
  }

  const sidebar = (
    <aside
      className="flex flex-col h-full"
      style={{
        width: 232,
        background: "rgba(255, 253, 250, 0.65)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(235, 228, 216, 0.5)",
        boxShadow: "1px 0 24px 0 rgba(26, 20, 16, 0.04)",
        padding: "20px 12px",
      }}
    >
      {/* Logo */}
      <div className="px-3 mb-6 flex items-center gap-2.5">
        <div
          className="size-8 rounded-[9px] flex items-center justify-center shrink-0"
          style={{ background: "rgba(245, 122, 38, 0.1)", border: "1px solid rgba(245, 122, 38, 0.2)" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="1" width="9" height="12" rx="1.5" stroke="#f57a26" strokeWidth="1.25"/>
            <path d="M5 5h5M5 7.5h5M5 10h3" stroke="#f57a26" strokeWidth="1.1" strokeLinecap="round"/>
            <circle cx="12.5" cy="11.5" r="2.5" fill="rgba(245,122,38,0.15)" stroke="#f57a26" strokeWidth="1.1"/>
            <path d="M11.5 11.5l.8.8 1.2-1.2" stroke="#f57a26" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold tracking-tight" style={{ color: "#1a1410" }}>PDFormatter</span>
          <span className="text-[10px] mt-0.5" style={{ color: "#b8aea1" }}>Gestión de pedidos</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/empleado/pedidos" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-sm font-medium transition-colors"
              style={{
                background:  active ? "rgba(245, 122, 38, 0.07)" : "transparent",
                color:       active ? "#c4622a" : "#4a423b",
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(235, 228, 216, 0.5)" }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent" }}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Usuario */}
      <div style={{ borderTop: "1px solid rgba(235, 228, 216, 0.5)", paddingTop: 16, marginTop: 8 }}>
        <div className="flex items-center gap-2.5 px-3 mb-2">
          <div
            className="size-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
            style={{ background: "#f57a26", color: "#ffffff" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "#1a1410" }}>{user?.nombre ?? "Usuario"}</p>
            <p className="text-xs truncate" style={{ color: "#b8aea1" }}>{user?.email ?? ""}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 px-3 py-1.5 rounded-[10px] text-sm transition-colors"
          style={{ color: "#847a6f" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(235, 228, 216, 0.5)" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#fbf8f4" }}>
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col shrink-0">{sidebar}</div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative z-50 flex flex-col">{sidebar}</div>
        </div>
      )}

      {/* Contenido */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar mobile */}
        <header
          className="flex md:hidden items-center gap-3 px-4 shrink-0"
          style={{ height: 52, borderBottom: "1px solid #ebe4d8", background: "#faf7f2" }}
        >
          <button onClick={() => setOpen(v => !v)} style={{ color: "#847a6f" }}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <span className="text-sm font-semibold" style={{ color: "#1a1410" }}>PDFormatter</span>
        </header>

        <main className={cn("flex-1 overflow-y-auto")} style={{ padding: 24 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
