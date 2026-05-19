import { NextRequest, NextResponse } from "next/server"
import { getAuthToken, getProxyHeaders, safeJsonParse, unauthorizedResponse, internalErrorResponse } from "@/lib/api/validation"

const API_URL = process.env.API_URL || "http://localhost:8000/api/v1"

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request)
    if (!token) return unauthorizedResponse()

    const response = await fetch(`${API_URL}/empleado/pedidos/stats`, {
      headers: getProxyHeaders(request, token, false),
    })

    const data = await safeJsonParse(response)
    return NextResponse.json(data, { status: response.status })
  } catch {
    return internalErrorResponse()
  }
}
