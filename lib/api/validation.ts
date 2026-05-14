import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

export function getAuthToken(request: NextRequest): string | null {
  const cookie = request.cookies.get("auth-token")
  if (cookie?.value) return cookie.value
  const auth = request.headers.get("authorization")
  if (auth?.startsWith("Bearer ")) return auth.slice(7)
  return null
}

export function getProxyHeaders(request: NextRequest, token: string, includeContentType = true) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  }
  if (includeContentType) headers["Content-Type"] = "application/json"
  return headers
}

export async function validateBody<T>(request: NextRequest, schema: z.ZodSchema<T>) {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      return {
        data: null,
        error: NextResponse.json(
          { success: false, error: "Datos inválidos", errors: result.error.flatten().fieldErrors },
          { status: 400 }
        ),
      }
    }
    return { data: result.data, error: null }
  } catch {
    return {
      data: null,
      error: NextResponse.json({ success: false, error: "Body inválido" }, { status: 400 }),
    }
  }
}

export async function safeJsonParse(response: Response) {
  try {
    return await response.json()
  } catch {
    return {}
  }
}

export function isValidId(id: string): boolean {
  return /^\d+$/.test(id) && parseInt(id) > 0
}

export function invalidIdResponse() {
  return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 })
}

export function unauthorizedResponse() {
  return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 })
}

export function internalErrorResponse() {
  return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
}
