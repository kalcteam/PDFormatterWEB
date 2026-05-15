import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { url, secret } = await req.json() as { url?: string; secret?: string }

  if (!url || !/^https?:\/\/.+/.test(url)) {
    return NextResponse.json({ ok: false, error: "URL inválida" }, { status: 400 })
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "PDFormatter-Webhook/1.0",
  }
  if (secret) headers["X-PDFormatter-Secret"] = secret

  const body = JSON.stringify({
    event: "webhook.test",
    timestamp: new Date().toISOString(),
    message: "Ping de prueba desde PDFormatter",
  })

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    })

    clearTimeout(timeout)

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
    })
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.name === "AbortError"
          ? "Tiempo de espera agotado (8 s)"
          : err.message
        : "Error de red desconocido"

    return NextResponse.json({ ok: false, error: message })
  }
}
