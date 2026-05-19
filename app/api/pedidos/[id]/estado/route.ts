import { NextRequest, NextResponse } from "next/server"
import { getAuthToken, getProxyHeaders, safeJsonParse, isValidId, invalidIdResponse, unauthorizedResponse, internalErrorResponse } from "@/lib/api/validation"

const API_URL = process.env.API_URL || "http://localhost:8000/api/v1"

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    if (!isValidId(id)) return invalidIdResponse()

    const token = getAuthToken(request)
    if (!token) return unauthorizedResponse()

    const response = await fetch(`${API_URL}/empleado/pedidos/${id}/estado`, {
      headers: getProxyHeaders(request, token, false),
    })

    const data = await safeJsonParse(response)
    return NextResponse.json(data, { status: response.status })
  } catch {
    return internalErrorResponse()
  }
}
