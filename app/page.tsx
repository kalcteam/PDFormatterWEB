"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, isAuthenticated } from "@/lib/auth-simple"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login")
      return
    }
    const user = getCurrentUser()
    router.replace(user?.role === "admin" ? "/admin/empleados" : "/empleado/pedidos/nuevo")
  }, [router])

  return null
}
