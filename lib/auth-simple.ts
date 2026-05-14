export type UserRole = "admin" | "empleado"

export interface User {
  id: string
  nombre: string
  email: string
  role: UserRole
}

const TOKEN_COOKIE = "auth-token"
const USER_COOKIE = "user-info"

function setCookie(name: string, value: string, days = 1) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}

export function saveAuth(token: string, user: User) {
  setCookie(TOKEN_COOKIE, token)
  setCookie(USER_COOKIE, JSON.stringify(user))
}

export function getToken(): string | null {
  if (typeof document === "undefined") return null
  return getCookie(TOKEN_COOKIE)
}

export function getCurrentUser(): User | null {
  if (typeof document === "undefined") return null
  const raw = getCookie(USER_COOKIE)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function clearAuth() {
  deleteCookie(TOKEN_COOKIE)
  deleteCookie(USER_COOKIE)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}
