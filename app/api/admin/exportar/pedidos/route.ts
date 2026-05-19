import { NextRequest, NextResponse } from "next/server"
import { getAuthToken, getProxyHeaders, safeJsonParse, unauthorizedResponse, internalErrorResponse } from "@/lib/api/validation"

const API_URL = process.env.API_URL || "http://localhost:8000/api/v1"

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request)
    if (!token) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const query = searchParams.toString()

    const response = await fetch(`${API_URL}/admin/exportar/pedidos${query ? `?${query}` : ""}`, {
      headers: getProxyHeaders(request, token, false),
    })

    // May return a file (CSV/Excel) — stream the response directly
    const contentType = response.headers.get("content-type") ?? "application/octet-stream"
    if (!contentType.includes("application/json")) {
      const blob = await response.blob()
      return new NextResponse(blob, {
        status: response.status,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": response.headers.get("content-disposition") ?? "attachment",
        },
      })
    }

    const data = await safeJsonParse(response)
    return NextResponse.json(data, { status: response.status })
  } catch {
    return internalErrorResponse()
  }
}
