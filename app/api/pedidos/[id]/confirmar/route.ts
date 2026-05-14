import { NextRequest, NextResponse } from "next/server"
import {
  getAuthToken, isValidId, invalidIdResponse, unauthorizedResponse,
  safeJsonParse, internalErrorResponse, getProxyHeaders,
} from "@/lib/api/validation"

const API_URL = process.env.API_URL || "http://localhost:8000/api/v1"

interface RouteParams { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    if (!isValidId(id)) return invalidIdResponse()

    const token = getAuthToken(request)
    if (!token) return unauthorizedResponse()

    const body = await request.json()
    const response = await fetch(`${API_URL}/empleado/pedidos/${id}/confirmar`, {
      method: "PATCH",
      headers: getProxyHeaders(request, token),
      body: JSON.stringify(body),
    })

    const data = await safeJsonParse(response)
    return NextResponse.json(data, { status: response.status })
  } catch {
    return internalErrorResponse()
  }
}
