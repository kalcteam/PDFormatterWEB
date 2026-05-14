import { NextRequest, NextResponse } from "next/server"
import { getAuthToken, safeJsonParse, unauthorizedResponse, internalErrorResponse } from "@/lib/api/validation"

const API_URL = process.env.API_URL || "http://localhost:8000/api/v1"

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request)
    if (!token) return unauthorizedResponse()

    const formData = await request.formData()

    const response = await fetch(`${API_URL}/empleado/pedidos`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      body: formData,
    })

    const data = await safeJsonParse(response)
    return NextResponse.json(data, { status: response.status })
  } catch {
    return internalErrorResponse()
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request)
    if (!token) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const query = searchParams.toString()

    const response = await fetch(`${API_URL}/empleado/pedidos${query ? `?${query}` : ""}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })

    const data = await safeJsonParse(response)
    return NextResponse.json(data, { status: response.status })
  } catch {
    return internalErrorResponse()
  }
}
