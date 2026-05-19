import { NextRequest, NextResponse } from "next/server"
import { getAuthToken, getProxyHeaders, isValidId, invalidIdResponse, unauthorizedResponse, internalErrorResponse } from "@/lib/api/validation"

const API_URL = process.env.API_URL || "http://localhost:8000/api/v1"

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    if (!isValidId(id)) return invalidIdResponse()

    const token = getAuthToken(request)
    if (!token) return unauthorizedResponse()

    const response = await fetch(`${API_URL}/ficheros/${id}/descargar`, {
      headers: getProxyHeaders(request, token, false),
    })

    if (!response.ok) {
      return NextResponse.json({ success: false, error: "Fichero no encontrado" }, { status: response.status })
    }

    const blob = await response.blob()
    return new NextResponse(blob, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/octet-stream",
        "Content-Disposition": response.headers.get("content-disposition") ?? `attachment; filename="fichero-${id}"`,
      },
    })
  } catch {
    return internalErrorResponse()
  }
}
