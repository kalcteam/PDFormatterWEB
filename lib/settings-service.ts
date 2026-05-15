/**
 * Settings service — persists to localStorage now.
 * Each function has the real API call prepared as a comment.
 * When the backend is ready: uncomment the fetch, remove the localStorage lines.
 */

import { getCurrentUser, saveAuth, getToken } from "./auth-simple"

/* ─── tipos públicos ──────────────────────────────────────── */

export interface PerfilData {
  nombre:   string
  telefono: string
}

export interface NotifData {
  erroresIA:      boolean
  confirmaciones: boolean
  exportaciones:  boolean
  resumenSemanal: boolean
}

export interface IAData {
  confianzaMin:   number
  idioma:         string
  revisionManual: boolean
  autoconfirmar:  boolean
}

export interface EmpresaData {
  nombre:    string
  cif:       string
  direccion: string
  timezone:  string
}

export interface CambioPasswordData {
  actual:   string
  nueva:    string
}

/* ─── defaults ────────────────────────────────────────────── */

const DEFAULTS = {
  notif: {
    erroresIA:      true,
    confirmaciones: false,
    exportaciones:  true,
    resumenSemanal: true,
  } satisfies NotifData,

  ia: {
    confianzaMin:   80,
    idioma:         "es",
    revisionManual: true,
    autoconfirmar:  false,
  } satisfies IAData,

  empresa: {
    nombre:    "Acme Industrial S.L.",
    cif:       "B-12345678",
    direccion: "Calle Mayor 12, Madrid",
    timezone:  "Europe/Madrid",
  } satisfies EmpresaData,
}

/* ─── helpers localStorage ────────────────────────────────── */

function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function lsSet(key: string, value: unknown) {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(value))
  }
}

/* ─── perfil ──────────────────────────────────────────────── */

export function getPerfil(): PerfilData {
  const user = getCurrentUser()
  return lsGet<PerfilData>("settings:perfil", {
    nombre:   user?.nombre ?? "",
    telefono: "",
  })
}

export async function savePerfil(data: PerfilData): Promise<void> {
  // TODO: replace with real API call when backend is ready
  // const res = await fetch("/api/user/profile", {
  //   method: "PUT",
  //   headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
  //   body: JSON.stringify(data),
  // })
  // if (!res.ok) throw new Error(await res.text())

  lsSet("settings:perfil", data)

  // Update the auth cookie so the sidebar reflects the new name immediately
  const user = getCurrentUser()
  const token = getToken()
  if (user && token) {
    saveAuth(token, { ...user, nombre: data.nombre })
  }
}

/* ─── notificaciones ─────────────────────────────────────── */

export function getNotif(userId?: string): NotifData {
  return lsGet<NotifData>(`settings:notif:${userId ?? "default"}`, DEFAULTS.notif)
}

export async function saveNotif(data: NotifData, userId?: string): Promise<void> {
  // TODO:
  // const res = await fetch("/api/user/notifications", {
  //   method: "PUT",
  //   headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
  //   body: JSON.stringify(data),
  // })
  // if (!res.ok) throw new Error(await res.text())

  lsSet(`settings:notif:${userId ?? "default"}`, data)
}

/* ─── extracción IA ──────────────────────────────────────── */

export function getIA(userId?: string): IAData {
  return lsGet<IAData>(`settings:ia:${userId ?? "default"}`, DEFAULTS.ia)
}

export async function saveIA(data: IAData, userId?: string): Promise<void> {
  // TODO:
  // const res = await fetch("/api/user/ia-preferences", {
  //   method: "PUT",
  //   headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
  //   body: JSON.stringify(data),
  // })
  // if (!res.ok) throw new Error(await res.text())

  lsSet(`settings:ia:${userId ?? "default"}`, data)
}

/* ─── empresa ─────────────────────────────────────────────── */

export function getEmpresa(): EmpresaData {
  return lsGet<EmpresaData>("settings:empresa", DEFAULTS.empresa)
}

export async function saveEmpresa(data: EmpresaData): Promise<void> {
  // TODO:
  // const res = await fetch("/api/company", {
  //   method: "PUT",
  //   headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
  //   body: JSON.stringify(data),
  // })
  // if (!res.ok) throw new Error(await res.text())

  lsSet("settings:empresa", data)
}

/* ─── contraseña ──────────────────────────────────────────── */

export async function cambiarPassword(data: CambioPasswordData): Promise<void> {
  // TODO: this one REQUIRES the real API — there's no client-side simulation possible.
  // Uncomment when the endpoint exists:
  // const res = await fetch("/api/auth/change-password", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
  //   body: JSON.stringify({ currentPassword: data.actual, newPassword: data.nueva }),
  // })
  // if (!res.ok) {
  //   const body = await res.json().catch(() => ({}))
  //   throw new Error(body.message ?? "Error al cambiar la contraseña")
  // }

  // Simulated for now — will throw if "actual" is wrong once backend is wired
  await new Promise(r => setTimeout(r, 800))
}

/* ─── fortaleza de contraseña (client-side, no API needed) ── */

export interface PasswordStrength {
  score:  0 | 1 | 2 | 3 | 4   // 0=vacía 1=débil 2=media 3=buena 4=fuerte
  label:  string
  color:  string
  checks: { label: string; ok: boolean }[]
}

export function calcPasswordStrength(password: string): PasswordStrength {
  const checks = [
    { label: "8 caracteres mínimo",       ok: password.length >= 8      },
    { label: "Una letra mayúscula",        ok: /[A-Z]/.test(password)    },
    { label: "Un número",                  ok: /[0-9]/.test(password)    },
    { label: "Un carácter especial (@#$…)", ok: /[^A-Za-z0-9]/.test(password) },
  ]
  const passed = checks.filter(c => c.ok).length
  if (!password) return { score: 0, label: "",        color: "transparent",  checks }
  if (passed <= 1) return { score: 1, label: "Débil",  color: "#ef4444",      checks }
  if (passed === 2) return { score: 2, label: "Media",  color: "#f59e0b",      checks }
  if (passed === 3) return { score: 3, label: "Buena",  color: "#f57a26",      checks }
  return               { score: 4, label: "Fuerte", color: "#22c55e",      checks }
}
