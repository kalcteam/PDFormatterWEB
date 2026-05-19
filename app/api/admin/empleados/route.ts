import { NextRequest, NextResponse } from "next/server"
import { getAuthToken, getProxyHeaders, safeJsonParse, unauthorizedResponse, internalErrorResponse } from "@/lib/api/validation"

const API_URL = process.env.API_URL || "http://localhost:8000/api/v1"

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request)
    if (!token) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const query = searchParams.toString()

    const response = await fetch(`${API_URL}/admin/empleados${query ? `?${query}` : ""}`, {
      headers: getProxyHeaders(request, token, false),
    })

    const data = await safeJsonParse(response)
    return NextResponse.json(data, { status: response.status })
  } catch {
    return internalErrorResponse()
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request)
    if (!token) return unauthorizedResponse()

    const body = await request.json()
    const response = await fetch(`${API_URL}/admin/empleados`, {
      method: "POST",
      headers: getProxyHeaders(request, token),
      body: JSON.stringify(body),
    })

    const data = await safeJsonParse(response)
    return NextResponse.json(data, { status: response.status })
  } catch {
    return internalErrorResponse()
  }
}
