"use client"

import { useState } from "react"
import { FileText, Pencil, Download, Trash2, Copy, CheckCircle, AlertCircle, Upload } from "lucide-react"

type TipoEvento =
  | "pedido_nuevo"
  | "pedido_editado"
  | "pedido_exportado"
  | "pedido_duplicado"
  | "pedido_eliminado"
  | "pedido_confirmado"
  | "pedido_error"
  | "pdf_subido"

interface Evento {
  id: number
  tipo: TipoEvento
  descripcion: string
  detalle?: string
  referencia?: string
  usuario: string
  fecha: string
}

const MOCK_EVENTOS: Evento[] = [
  {
    id: 1,
    tipo: "pedido_exportado",
    descripcion: "Exportación al ERP completada",
    detalle: "3 pedidos enviados al ERP mediante webhook",
    usuario: "diego.ruiz@acme.es",
    fecha: "2026-05-14T10:42:00Z",
  },
  {
    id: 2,
    tipo: "pedido_confirmado",
    descripcion: "Pedido confirmado y enviado al ERP",
    referencia: "PED-2026-00184",
    usuario: "diego.ruiz@acme.es",
    fecha: "2026-05-14T10:25:14Z",
  },
  {
    id: 3,
    tipo: "pedido_editado",
    descripcion: "Cantidad corregida en línea \"Arandela M8\"",
    referencia: "PED-2026-00184",
    usuario: "diego.ruiz@acme.es",
    fecha: "2026-05-14T10:24:55Z",
  },
  {
    id: 4,
    tipo: "pdf_subido",
    descripcion: "PDF subido y extracción IA completada",
    referencia: "PED-2026-00184",
    detalle: "pedido-construcciones-m.pdf · Confianza 92%",
    usuario: "diego.ruiz@acme.es",
    fecha: "2026-05-14T10:23:08Z",
  },
  {
    id: 5,
    tipo: "pedido_duplicado",
    descripcion: "Pedido duplicado",
    referencia: "PED-2026-00183 → PED-2026-00184",
    usuario: "ana.lopez@acme.es",
    fecha: "2026-05-13T16:11:30Z",
  },
  {
    id: 6,
    tipo: "pedido_error",
    descripcion: "Error en extracción IA",
    referencia: "PED-2026-00182",
    detalle: "No se detectaron líneas de producto. Revisión manual requerida.",
    usuario: "ana.lopez@acme.es",
    fecha: "2026-05-13T15:54:02Z",
  },
  {
    id: 7,
    tipo: "pedido_nuevo",
    descripcion: "Nuevo pedido creado",
    referencia: "PED-2026-00183",
    usuario: "ana.lopez@acme.es",
    fecha: "2026-05-13T15:30:00Z",
  },
  {
    id: 8,
    tipo: "pedido_editado",
    descripcion: "Precio unitario actualizado en 2 líneas",
    referencia: "PED-2026-00181",
    usuario: "diego.ruiz@acme.es",
    fecha: "2026-05-12T09:17:44Z",
  },
  {
    id: 9,
    tipo: "pedido_exportado",
    descripcion: "Exportación al ERP completada",
    detalle: "1 pedido enviado al ERP mediante webhook",
    usuario: "diego.ruiz@acme.es",
    fecha: "2026-05-12T09:05:20Z",
  },
  {
    id: 10,
    tipo: "pedido_eliminado",
    descripcion: "Pedido eliminado",
    referencia: "PED-2026-00180",
    usuario: "ana.lopez@acme.es",
    fecha: "2026-05-11T18:02:11Z",
  },
]

const TIPO_CFG: Record<TipoEvento, { icon: React.ElementType; bg: string; color: string; label: string }> = {
  pedido_nuevo:       { icon: FileText,     bg: "#e6effa", color: "#2a5fb0", label: "Nuevo pedido"  },
  pedido_editado:     { icon: Pencil,       bg: "#faf7f2", color: "#847a6f", label: "Edición"       },
  pedido_exportado:   { icon: Download,     bg: "#e7f5ee", color: "#2a8a5d", label: "Exportación"   },
  pedido_duplicado:   { icon: Copy,         bg: "#faf7f2", color: "#847a6f", label: "Duplicado"     },
  pedido_eliminado:   { icon: Trash2,       bg: "#fbe9e6", color: "#c0382a", label: "Eliminado"     },
  pedido_confirmado:  { icon: CheckCircle,  bg: "#e7f5ee", color: "#2a8a5d", label: "Confirmado"    },
  pedido_error:       { icon: AlertCircle,  bg: "#fbe9e6", color: "#c0382a", label: "Error"         },
  pdf_subido:         { icon: Upload,       bg: "#fff5ec", color: "#b04a10", label: "PDF subido"    },
}

const FILTROS: { key: TipoEvento | "todos"; label: string }[] = [
  { key: "todos",            label: "Todos"       },
  { key: "pedido_nuevo",     label: "Nuevos"      },
  { key: "pedido_editado",   label: "Ediciones"   },
  { key: "pedido_exportado", label: "Exportaciones" },
  { key: "pedido_error",     label: "Errores"     },
]

function formatFecha(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
}
function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
}

function agruparPorFecha(eventos: Evento[]) {
  const grupos: Record<string, Evento[]> = {}
  for (const ev of eventos) {
    const key = formatFecha(ev.fecha)
    if (!grupos[key]) grupos[key] = []
    grupos[key].push(ev)
  }
  return grupos
}

export default function HistorialPage() {
  const [filtro, setFiltro] = useState<TipoEvento | "todos">("todos")

  const filtrados = filtro === "todos"
    ? MOCK_EVENTOS
    : MOCK_EVENTOS.filter(e => e.tipo === filtro)

  const grupos = agruparPorFecha(filtrados)

  return (
    <div className="flex flex-col h-full -m-6">

      {/* Topbar */}
      <div
        className="flex items-center justify-between px-4 md:px-6 shrink-0 gap-4 flex-wrap"
        style={{ minHeight: 48, borderBottom: "1px solid #ebe4d8", background: "#ffffff", paddingTop: 8, paddingBottom: 8 }}
      >
        <span className="text-sm font-medium" style={{ color: "#1a1410" }}>Historial de actividad</span>

        {/* Filtros */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {FILTROS.map(f => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFiltro(f.key)}
              className="text-xs px-2.5 py-1 rounded-[8px] transition-colors"
              style={{
                background: filtro === f.key ? "#f57a26" : "transparent",
                color:      filtro === f.key ? "#ffffff"  : "#847a6f",
                fontWeight: filtro === f.key ? 500 : 400,
              }}
              onMouseEnter={e => { if (filtro !== f.key) (e.currentTarget as HTMLElement).style.background = "#f3eee6" }}
              onMouseLeave={e => { if (filtro !== f.key) (e.currentTarget as HTMLElement).style.background = "transparent" }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6" style={{ background: "#faf7f2" }}>
        {Object.keys(grupos).length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm" style={{ color: "#b8aea1" }}>No hay eventos para este filtro.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {Object.entries(grupos).map(([fecha, eventos]) => (
              <div key={fecha}>
                {/* Fecha grupo */}
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#b8aea1" }}>
                  {fecha}
                </p>

                {/* Eventos del día */}
                <div className="rounded-[16px] overflow-hidden" style={{ background: "#ffffff", border: "1px solid #ebe4d8" }}>
                  {eventos.map((ev, i) => {
                    const cfg = TIPO_CFG[ev.tipo]
                    const Icon = cfg.icon
                    return (
                      <div
                        key={ev.id}
                        className="flex items-start gap-4 px-5 py-4"
                        style={{ borderBottom: i < eventos.length - 1 ? "1px solid #f3eee6" : "none" }}
                      >
                        {/* Icono */}
                        <div
                          className="size-8 rounded-[9px] flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: cfg.bg }}
                        >
                          <Icon className="size-4" style={{ color: cfg.color }} />
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium" style={{ color: "#1a1410" }}>{ev.descripcion}</span>
                            {ev.referencia && (
                              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-[5px]" style={{ background: "#f3eee6", color: "#847a6f" }}>
                                {ev.referencia}
                              </span>
                            )}
                          </div>
                          {ev.detalle && (
                            <p className="text-xs mt-0.5" style={{ color: "#b8aea1" }}>{ev.detalle}</p>
                          )}
                          <p className="text-[11px] mt-1" style={{ color: "#b8aea1" }}>
                            {ev.usuario} · {formatHora(ev.fecha)}
                          </p>
                        </div>

                        {/* Badge tipo */}
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 mt-1"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
