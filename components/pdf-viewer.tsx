"use client"

import { useState, useCallback } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PdfViewerProps {
  file: File | string
  fileName?: string
  fileSize?: string
  modelUsed?: string
  processingTime?: string
  onDownload?: () => void
  onReprocess?: () => void
  className?: string
}

export function PdfViewer({
  file,
  fileName,
  fileSize,
  modelUsed,
  processingTime,
  onDownload,
  onReprocess,
  className,
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [page, setPage] = useState(1)
  const [scale, setScale] = useState(1)

  const onLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPage(1)
  }, [])

  const scalePercent = Math.round(scale * 100)

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3" style={{ borderBottom: "1px solid #ebe4d8" }}>
        {/* Left: PDF icon + name + metadata */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="shrink-0 size-10 rounded-[10px] flex items-center justify-center text-[10px] font-bold tracking-wide"
            style={{ background: "#ffd0a8", color: "#5a2706" }}
          >
            PDF
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "#1a1410" }}>{fileName ?? "documento.pdf"}</p>
            <p className="text-xs mt-0.5" style={{ color: "#847a6f" }}>
              {[fileSize, numPages > 0 ? `${numPages} página${numPages > 1 ? "s" : ""}` : null, processingTime ? `subido hace ${processingTime}` : null]
                .filter(Boolean)
                .join(" · ")}
              {modelUsed && (
                <> · <span style={{ color: "#f57a26" }}>extraído con {modelUsed}</span></>
              )}
            </p>
          </div>
        </div>
        {/* Right: action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onReprocess && (
            <button
              type="button"
              onClick={onReprocess}
              className="flex items-center gap-1.5 text-xs px-3 rounded-[10px] transition-colors"
              style={{ border: "1px solid #ddd4c4", background: "transparent", color: "#4a423b", height: 32 }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f3eee6")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              + Reprocesar con IA
            </button>
          )}
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="flex items-center gap-1.5 text-xs px-3 rounded-[10px] transition-colors"
              style={{ border: "1px solid #ddd4c4", background: "transparent", color: "#4a423b", height: 32 }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f3eee6")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              ↓ Descargar PDF
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between py-2 border-b border-border">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-7" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-xs tabular-nums text-muted-foreground w-12 text-center">{page} / {numPages || "—"}</span>
          <Button variant="ghost" size="icon" className="size-7" onClick={() => setPage((p) => Math.min(numPages, p + 1))} disabled={page >= numPages}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-7" onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}>
            <ZoomOut className="size-4" />
          </Button>
          <span className="text-xs tabular-nums text-muted-foreground w-10 text-center">{scalePercent}%</span>
          <Button variant="ghost" size="icon" className="size-7" onClick={() => setScale((s) => Math.min(2, s + 0.1))}>
            <ZoomIn className="size-4" />
          </Button>
        </div>
      </div>

      {/* PDF */}
      <div className="flex-1 overflow-auto flex justify-center bg-muted/30 rounded-md mt-2">
        <Document
          file={file}
          onLoadSuccess={onLoadSuccess}
          loading={<div className="flex items-center justify-center h-full text-sm text-muted-foreground p-8">Cargando PDF…</div>}
          error={<div className="flex items-center justify-center h-full text-sm text-destructive p-8">No se pudo cargar el PDF.</div>}
        >
          <Page pageNumber={page} scale={scale} className="shadow-md" />
        </Document>
      </div>
    </div>
  )
}
