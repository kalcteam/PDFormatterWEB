"use client"

import { useState, useCallback } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from "lucide-react"
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
      <div className="flex flex-col gap-2 pb-3 border-b border-border">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{fileName ?? "documento.pdf"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {[fileSize, numPages > 0 ? `${numPages} página${numPages > 1 ? "s" : ""}` : null, processingTime ? `procesado en ${processingTime}` : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          {modelUsed && (
            <span className="shrink-0 text-[10px] font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
              {modelUsed}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onReprocess && (
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={onReprocess}>
              ✦ Reprocesar con IA
            </Button>
          )}
          {onDownload && (
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={onDownload}>
              <Download className="size-3" /> Descargar PDF
            </Button>
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
