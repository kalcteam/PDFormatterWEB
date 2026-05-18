import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"
import { extractText } from "unpdf"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const SYSTEM_PROMPT = `You are an order data extractor. Given a document, extract the following fields and return them as a JSON object.

Required output format (replace values with extracted data, keep all keys):
{
  "nombre_cliente": "<person name or null>",
  "nombre_empresa": "<company name or null>",
  "fecha_pedido": "<YYYY-MM-DD or null>",
  "productos": [
    {
      "nombre": "<product name>",
      "cantidad": <number>,
      "precio_unitario": <number without symbols or null>,
      "referencia": "<ref code or null>",
      "confianza": "<alta|media|baja>"
    }
  ],
  "ia_confianza": {
    "nombre_cliente": "<alta|media|baja>",
    "nombre_empresa": "<alta|media|baja>",
    "fecha_pedido": "<alta|media|baja>",
    "productos": "<alta|media|baja>"
  }
}

confianza: "alta" = explicitly stated, "media" = inferred, "baja" = uncertain.
Use null for any missing field. Do not add any text outside the JSON object.`

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 })
    }

    const form = await req.formData()
    const file = form.get("pdf") as File | null
    if (!file) return NextResponse.json({ error: "No PDF received" }, { status: 400 })

    const buffer = await file.arrayBuffer()
    const { text: pages } = await extractText(new Uint8Array(buffer), { mergePages: true })
    const text = (Array.isArray(pages) ? pages.join("\n") : pages).trim()

    if (!text) {
      return NextResponse.json({ error: "No se pudo extraer texto del PDF (puede ser un PDF escaneado)" }, { status: 422 })
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      max_tokens: 1024,
      // No response_format — Llama handles plain JSON better without it
      messages: [
        { role: "system",    content: SYSTEM_PROMPT },
        { role: "user",      content: `DOCUMENT:\n${text.slice(0, 8000)}\n\nExtract the order data as JSON:` },
      ],
    })

    const content = completion.choices[0]?.message?.content ?? ""

    // Extract JSON block — handles markdown fences and surrounding text
    const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) ?? content.match(/(\{[\s\S]*\})/)
    if (!jsonMatch) throw new Error("No JSON found in model response")
    const raw = JSON.parse(jsonMatch[1] ?? jsonMatch[0])

    const datos = {
      nombre_cliente: raw.nombre_cliente ?? null,
      nombre_empresa: raw.nombre_empresa ?? null,
      fecha_pedido:   raw.fecha_pedido   ?? null,
      productos: Array.isArray(raw.productos) ? raw.productos.map((p: Record<string, unknown>) => ({
        nombre:          String(p.nombre ?? "Producto sin nombre"),
        cantidad:        Number(p.cantidad) || 1,
        precio_unitario: p.precio_unitario != null ? Number(p.precio_unitario) : null,
        referencia:      p.referencia ? String(p.referencia) : null,
        confianza:       ["alta","media","baja"].includes(p.confianza as string) ? p.confianza : "media",
      })) : [],
      ia_confianza: {
        nombre_cliente: raw.ia_confianza?.nombre_cliente ?? "media",
        nombre_empresa: raw.ia_confianza?.nombre_empresa ?? "media",
        fecha_pedido:   raw.ia_confianza?.fecha_pedido   ?? "media",
        productos:      raw.ia_confianza?.productos      ?? "media",
      },
    }

    return NextResponse.json(datos)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[/api/pedidos/extraer]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
