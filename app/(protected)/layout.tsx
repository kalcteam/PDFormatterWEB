"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { isAuthenticated, saveAuth } from "@/lib/auth-simple"
import { AppShell } from "@/components/app-shell"

const DEV_MODE = process.env.NODE_ENV === "development"

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const isAdmin  = pathname.startsWith("/admin")

  useEffect(() => {
    if (DEV_MODE && !isAuthenticated()) {
      saveAuth("dev-token", { id: "1", nombre: "Usuario Dev", email: "dev@pdformatter.com", role: "empleado" })
    }
    if (!DEV_MODE && !isAuthenticated()) {
      router.replace("/login")
    }
  }, [router])

  if (!DEV_MODE && !isAuthenticated()) return null

  if (isAdmin) return <>{children}</>

  return <AppShell>{children}</AppShell>
}
