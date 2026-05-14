"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileText, FlaskConical } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PdfViewer } from "@/components/pdf-viewer"
import { ExtraccionIaPanel, type DatosExtraidos, type PedidoFormValues } from "@/components/extraccion-ia-panel"
import { cn } from "@/lib/utils"
import { getToken } from "@/lib/auth-simple"

type EstadoPantalla = "idle" | "uploading" | "processing" | "review" | "confirming"

const MOCK_DATOS: DatosExtraidos = {
  nombre_cliente: "Juan García",
  nombre_empresa: "Construcciones Martínez S.L.",
  fecha_pedido: "2026-05-10",
  ia_confianza: {
    nombre_cliente: "alta",
    nombre_empresa: "alta",
    fecha_pedido: "media",
    productos: "alta",
  },
  productos: [
    { nombre: "Tornillo cabeza hexagonal M8 × 100 mm", cantidad: 100, precio_unitario: 0.15, referencia: "TM8-100", confianza: "alta" },
    { nombre: "Tuerca hexagonal M8 zincada", cantidad: 100, precio_unitario: 0.08, referencia: "TU8-Z", confianza: "alta" },
    { nombre: "Anclaje químico resina + barra 12 mm × 160", cantidad: 24, precio_unitario: 3.20, referencia: "AQ-12160", confianza: "alta" },
    { nombre: "Varilla roscada inoxidable A4 M12 × 1 m", cantidad: 12, precio_unitario: 9.50, referencia: null, confianza: "media" },
    { nombre: "Taco plástico expansión Ø10 × 50 (caja 100)", cantidad: 4, precio_unitario: 12.40, referencia: "TP10-50", confianza: "media" },
    { nombre: "Arandela plana M8 zincada (bolsa 200)", cantidad: 2, precio_unitario: 6.80, referencia: null, confianza: "baja" },
  ],
}

export default function NuevoPedidoPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [estado, setEstado] = useState<EstadoPantalla>("idle")
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pedidoId, setPedidoId] = useState<number | null>(null)
  const [datos, setDatos] = useState<DatosExtraidos | null>(null)
  const [processingTime, setProcessingTime] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  async function procesarPdf(file: File) {
    setPdfFile(file)
    setEstado("uploading")

    const formData = new FormData()
    formData.append("pdf_file", file)

    const token = getToken()
    const start = Date.now()

    try {
      setEstado("processing")
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Error al procesar el PDF")
        setEstado("idle")
        return
      }

      const elapsed = ((Date.now() - start) / 1000).toFixed(1)
      setProcessingTime(`${elapsed}s`)
      setPedidoId(json.data.id)
      setDatos(json.data)
      setEstado("review")
    } catch {
      toast.error("Error de conexión al procesar el PDF")
      setEstado("idle")
    }
  }

  const handleFileSelect = useCallback((file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Solo se admiten archivos PDF")
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("El PDF no puede superar los 20 MB")
      return
    }
    procesarPdf(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  async function handleConfirmar(values: PedidoFormValues) {
    if (!pedidoId) return
    setEstado("confirming")
    const token = getToken()

    try {
      const res = await fetch(`/api/pedidos/${pedidoId}/confirmar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(values),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Error al confirmar el pedido")
        setEstado("review")
        return
      }

      toast.success("Pedido confirmado correctamente")
      router.push(`/empleado/pedidos/${pedidoId}`)
    } catch {
      toast.error("Error de conexión")
      setEstado("review")
    }
  }

  function handleDescartar() {
    setPdfFile(null)
    setDatos(null)
    setPedidoId(null)
    setProcessingTime(null)
    setEstado("idle")
  }

  async function cargarMock() {
    setEstado("processing")
    await new Promise((r) => setTimeout(r, 1800))
    setProcessingTime("1.4s")
    setPedidoId(99)
    setDatos(MOCK_DATOS)
    setEstado("review")
  }

  const isProcessing = estado === "uploading" || estado === "processing"
  const fileSize = pdfFile ? `${(pdfFile.size / 1024).toFixed(0)} KB` : undefined

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Topbar */}
      <div
        className="flex items-center justify-between px-6 shrink-0"
        style={{ height: 48, borderBottom: "1px solid #ebe4d8", background: "#ffffff" }}
      >
        <div className="flex items-center gap-1.5 text-sm">
          <span style={{ color: "#b8aea1" }}>Pedidos</span>
          <span style={{ color: "#ddd4c4" }}>/</span>
          <span className="font-medium" style={{ color: "#1a1410" }}>Nuevo pedido</span>
          {processingTime && (
            <span
              className="text-xs px-2 py-0.5 rounded-full ml-2"
              style={{ background: "#f3eee6", color: "#847a6f" }}
            >
              Procesado en {processingTime}
            </span>
          )}
        </div>
      </div>

      {/* Two panels */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Panel izquierdo: PDF ── */}
        <div
          className="w-1/2 flex flex-col overflow-hidden"
          style={{ padding: 20, borderRight: "1px solid #ebe4d8" }}
        >
          {!pdfFile ? (
            <div
              className="flex-1 flex flex-col items-center justify-center gap-4 rounded-[14px] cursor-pointer transition-colors"
              style={{
                border: `2px dashed ${dragOver ? "#f57a26" : "#ddd4c4"}`,
                background: dragOver ? "#fff5ec" : "#faf7f2",
              }}
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => inputRef.current?.click()}
            >
              <div
                className="size-16 rounded-2xl flex items-center justify-center"
                style={{ background: dragOver ? "#ffe7d2" : "#f3eee6" }}
              >
                <Upload className="size-7" style={{ color: dragOver ? "#f57a26" : "#b8aea1" }} />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium" style={{ color: "#1a1410" }}>Arrastra el PDF aquí</p>
                <p className="text-xs" style={{ color: "#b8aea1" }}>o haz clic para seleccionar</p>
                <p className="text-xs" style={{ color: "#ddd4c4" }}>PDF · máx. 20 MB</p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
              />
              {process.env.NODE_ENV === "development" && (
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-[10px] transition-colors"
                  style={{ border: "1px solid #ebe4d8", background: "#ffffff", color: "#4a423b" }}
                  onClick={e => { e.stopPropagation(); cargarMock() }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f3eee6")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#ffffff")}
                >
                  <FlaskConical className="size-3.5" />
                  Cargar datos de prueba
                </button>
              )}
            </div>
          ) : (
            <PdfViewer
              file={pdfFile}
              fileName={pdfFile.name}
              fileSize={fileSize}
              modelUsed="GPT-4o"
              processingTime={processingTime ?? undefined}
              onDownload={() => {
                const url = URL.createObjectURL(pdfFile)
                const a = document.createElement("a"); a.href = url; a.download = pdfFile.name; a.click()
                URL.revokeObjectURL(url)
              }}
              onReprocess={() => procesarPdf(pdfFile)}
              className="flex-1"
            />
          )}
        </div>

        {/* ── Panel derecho: IA ── */}
        <div className="w-1/2 flex flex-col overflow-hidden" style={{ padding: 20 }}>
          {estado === "idle" && !datos ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
              <div className="size-12 rounded-full flex items-center justify-center" style={{ background: "#f3eee6" }}>
                <FileText className="size-5" style={{ color: "#b8aea1" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "#1a1410" }}>Sube un PDF para empezar</p>
              <p className="text-xs max-w-xs" style={{ color: "#847a6f" }}>
                La IA extraerá automáticamente los datos del pedido y los mostrará aquí para que los revises.
              </p>
            </div>
          ) : (
            <ExtraccionIaPanel
              loading={isProcessing}
              datos={datos ?? undefined}
              onConfirmar={handleConfirmar}
              onDescartar={handleDescartar}
              confirming={estado === "confirming"}
            />
          )}
        </div>
      </div>
    </div>
  )
}
