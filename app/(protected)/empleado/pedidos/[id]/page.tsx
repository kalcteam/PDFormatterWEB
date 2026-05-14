"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ChevronRight, Download, Copy, FileJson, Pencil, Plus, Trash2, Check, X } from "lucide-react"
import { toast } from "sonner"
import { getToken } from "@/lib/auth-simple"
import { IaConfianzaBadge, type Confianza } from "@/components/ia-confidence-badge"

/* ── Types ── */
interface ProductoLinea {
  referencia: string | null
  nombre: string
  cantidad: number
  precio_unitario: number | null
  importe: number | null
}

interface PedidoDetalle {
  id: number
  referencia: string
  estado: "procesado" | "pendiente" | "error"
  ia_confianza: Confianza | null
  ia_confianza_pct: number | null
  nombre_cliente: string | null
  email_cliente: string | null
  nombre_empresa: string | null
  cif_empresa: string | null
  fecha_pedido: string | null
  fecha_entrega: string | null
  num_productos: number
  subtotal: number | null
  iva_pct: number
  total: number | null
  productos: ProductoLinea[]
  pdf_nombre: string | null
  pdf_size_kb: number | null
  pdf_paginas: number | null
  procesado_por: string | null
  erp_json: string | null
  timeline: Array<{ label: string; fecha: string }>
  created_at: string
}

/* ── Form schema ── */
const productoSchema = z.object({
  referencia:      z.string().nullable(),
  nombre:          z.string().min(1, "Requerido"),
  cantidad:        z.number().min(0),
  precio_unitario: z.number().nullable(),
})

const editSchema = z.object({
  nombre_cliente: z.string().min(1, "Requerido"),
  email_cliente:  z.string().nullable(),
  nombre_empresa: z.string().min(1, "Requerido"),
  cif_empresa:    z.string().nullable(),
  fecha_pedido:   z.string().min(1, "Requerido"),
  fecha_entrega:  z.string().nullable(),
  productos:      z.array(productoSchema).min(1),
})

type EditFormValues = z.infer<typeof editSchema>

/* ── Mock ── */
const MOCK_DETALLE: PedidoDetalle = {
  id: 184,
  referencia: "PED-2026-00184",
  estado: "procesado",
  ia_confianza: "alta",
  ia_confianza_pct: 92,
  nombre_cliente: "Juan García",
  email_cliente: "j.garcia@construcciones-martinez.es",
  nombre_empresa: "Construcciones Martínez S.L.",
  cif_empresa: "B-87650921",
  fecha_pedido: "2026-05-10",
  fecha_entrega: "2026-05-22",
  num_productos: 6,
  subtotal: 277.00,
  iva_pct: 21,
  total: 335.17,
  productos: [
    { referencia: "TM8-100", nombre: "Tornillo cabeza hexagonal M8 × 100 mm DIN 933",      cantidad: 100, precio_unitario: 0.15,  importe: 15.00  },
    { referencia: "TM8-NUT", nombre: "Tuerca hexagonal M8 zincada DIN 934",                 cantidad: 100, precio_unitario: 0.08,  importe: 8.00   },
    { referencia: "AR-7N",   nombre: "Anclaje químico resina + barra rosca 12 mm × 160",    cantidad: 24,  precio_unitario: 3.20,  importe: 76.80  },
    { referencia: "VLG-A4",  nombre: "Varilla roscada inoxidable A4 M12 × 1 m",             cantidad: 12,  precio_unitario: 9.50,  importe: 114.00 },
    { referencia: "TPL-50",  nombre: "Taco plástico expansión Ø10 × 50 (caja 100 ud.)",     cantidad: 4,   precio_unitario: 12.40, importe: 49.60  },
    { referencia: "ARN-58",  nombre: "Arandela plana M8 zincada DIN 125 (bolsa 200)",       cantidad: 2,   precio_unitario: 6.80,  importe: 13.60  },
  ],
  pdf_nombre: "pedido-construcciones-m.pdf",
  pdf_size_kb: 184,
  pdf_paginas: 1,
  procesado_por: "diego.ruiz@acme.es",
  erp_json: JSON.stringify({
    pedido_id: "PED-2026-00184",
    cliente: "Juan García",
    empresa: "Construcciones Martínez S.L.",
    cif: "B-87650921",
    fecha: "2026-05-10",
    lineas: [
      { ref: "TM8-100", desc: "Tornillo M8 × 100 DIN 933", qty: 100, price: 0.15 },
      { ref: "TM8-NUT", desc: "Tuerca M8 DIN 934",          qty: 100, price: 0.08 },
    ],
    total: 335.17,
  }, null, 2),
  timeline: [
    { label: "PDF subido por Diego Ruiz",                fecha: "2026-05-10T14:23:08Z" },
    { label: "Extracción IA completada",                  fecha: "2026-05-10T14:23:10Z" },
    { label: 'Cantidad corregida en línea "Arandela M8"', fecha: "2026-05-10T14:24:55Z" },
    { label: "Pedido confirmado",                         fecha: "2026-05-10T14:25:12Z" },
    { label: "Enviado al ERP (webhook)",                  fecha: "2026-05-10T14:25:14Z" },
  ],
  created_at: "2026-05-10T14:23:08Z",
}

/* ── Helpers ── */
function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
}
function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" })
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}
function formatPrice(n: number) {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" })
}

const estadoCfg = {
  procesado: { label: "Procesado y enviado al ERP", bg: "#e7f5ee", color: "#2a8a5d", dot: "#2a8a5d" },
  pendiente:  { label: "Pendiente de revisión",      bg: "#fbf1d9", color: "#b07a12", dot: "#b07a12" },
  error:      { label: "Error en el proceso",        bg: "#fbe9e6", color: "#c0382a", dot: "#c0382a" },
}

const inputSt: React.CSSProperties = {
  width: "100%", padding: "5px 8px", fontSize: 13,
  border: "1px solid #ebe4d8", borderRadius: 8,
  background: "#faf7f2", color: "#1a1410", outline: "none",
}

/* ── Page ── */
export default function DetallePedidoPage() {
  const router   = useRouter()
  const params   = useParams()
  const id       = params.id as string

  const [pedido,     setPedido]     = useState<PedidoDetalle | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [jsonOpen,   setJsonOpen]   = useState(false)
  const [duplicando, setDuplicando] = useState(false)
  const [editMode,    setEditMode]    = useState(false)
  const [guardando,   setGuardando]   = useState(false)
  const [jsonVisible, setJsonVisible] = useState(false)

  const { register, control, handleSubmit, reset, watch, formState: { errors } } =
    useForm<EditFormValues>({
      resolver: zodResolver(editSchema),
      defaultValues: { nombre_cliente: "", email_cliente: null, nombre_empresa: "", cif_empresa: null, fecha_pedido: "", fecha_entrega: null, productos: [] },
    })

  const { fields, append, remove } = useFieldArray({ control, name: "productos" })
  const watchProductos = watch("productos")
  const totalCalc = watchProductos.reduce((s, p) => s + (p.cantidad ?? 0) * (p.precio_unitario ?? 0), 0)
  const ivaCalc   = totalCalc * ((pedido?.iva_pct ?? 21) / 100)

  useEffect(() => {
    async function cargar() {
      setLoading(true)
      if (process.env.NODE_ENV === "development") {
        await new Promise(r => setTimeout(r, 400))
        setPedido(MOCK_DETALLE)
        setLoading(false)
        return
      }
      try {
        const token = getToken()
        const res = await fetch(`/api/pedidos/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const json = await res.json()
          setPedido(json.data)
        } else {
          toast.error("No se pudo cargar el pedido")
        }
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [id])

  function abrirEdicion() {
    if (!pedido) return
    reset({
      nombre_cliente: pedido.nombre_cliente ?? "",
      email_cliente:  pedido.email_cliente  ?? null,
      nombre_empresa: pedido.nombre_empresa ?? "",
      cif_empresa:    pedido.cif_empresa    ?? null,
      fecha_pedido:   pedido.fecha_pedido   ?? "",
      fecha_entrega:  pedido.fecha_entrega  ?? null,
      productos: pedido.productos.map(p => ({
        referencia:      p.referencia,
        nombre:          p.nombre,
        cantidad:        p.cantidad,
        precio_unitario: p.precio_unitario,
      })),
    })
    setEditMode(true)
  }

  function cancelarEdicion() {
    setEditMode(false)
  }

  async function onGuardar(values: EditFormValues) {
    if (!pedido) return
    setGuardando(true)

    if (process.env.NODE_ENV === "development") {
      await new Promise(r => setTimeout(r, 700))
      // Actualizar estado local con los valores guardados
      const nuevosProductos = values.productos.map(p => ({
        ...p,
        importe: (p.cantidad ?? 0) * (p.precio_unitario ?? 0),
      }))
      const nuevoSubtotal = nuevosProductos.reduce((s, p) => s + (p.importe ?? 0), 0)
      const nuevoTotal    = nuevoSubtotal * (1 + pedido.iva_pct / 100)
      setPedido(prev => prev ? {
        ...prev,
        nombre_cliente: values.nombre_cliente,
        email_cliente:  values.email_cliente,
        nombre_empresa: values.nombre_empresa,
        cif_empresa:    values.cif_empresa,
        fecha_pedido:   values.fecha_pedido,
        fecha_entrega:  values.fecha_entrega ?? null,
        num_productos:  nuevosProductos.length,
        productos:      nuevosProductos,
        subtotal:       nuevoSubtotal,
        total:          Math.round(nuevoTotal * 100) / 100,
      } : prev)
      toast.success("Cambios guardados correctamente")
      setEditMode(false)
      setGuardando(false)
      return
    }

    try {
      const token = getToken()
      const res = await fetch(`/api/pedidos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(values),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Error al guardar los cambios")
        return
      }
      setPedido(json.data)
      toast.success("Cambios guardados correctamente")
      setEditMode(false)
    } catch {
      toast.error("Error de conexión al guardar")
    } finally {
      setGuardando(false)
    }
  }

  // Animación modal JSON: montar → visible, cerrar → invisible → desmontar
  useEffect(() => {
    if (jsonOpen) {
      const t = requestAnimationFrame(() => setJsonVisible(true))
      return () => cancelAnimationFrame(t)
    } else {
      setJsonVisible(false)
    }
  }, [jsonOpen])

  function closeJson() {
    setJsonVisible(false)
    setTimeout(() => setJsonOpen(false), 220)
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && jsonOpen) closeJson()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [jsonOpen])

  async function handleDuplicar() {
    if (!pedido || duplicando) return
    setDuplicando(true)
    if (process.env.NODE_ENV === "development") {
      await new Promise(r => setTimeout(r, 900))
      toast.success("Pedido duplicado como PED-2026-00185")
      setDuplicando(false)
      return
    }
    try {
      const token = getToken()
      const res = await fetch(`/api/pedidos/${id}/duplicar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Error al duplicar el pedido")
        return
      }
      toast.success("Pedido duplicado correctamente")
      router.push(`/empleado/pedidos/${json.data.id}`)
    } catch {
      toast.error("Error de conexión al duplicar")
    } finally {
      setDuplicando(false)
    }
  }

  function handleExportarJson() {
    setJsonOpen(true)
  }

  function handleDescargarJson() {
    if (!pedido?.erp_json) return
    const blob = new Blob([pedido.erp_json], { type: "application/json" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href = url; a.download = `${pedido.referencia}.json`; a.click()
    URL.revokeObjectURL(url)
    toast.success(`${pedido.referencia}.json descargado`)
  }

  /* ── Loading ── */
  if (loading || !pedido) {
    return (
      <div className="flex flex-col h-full -m-6">
        <div className="flex items-center px-6 shrink-0" style={{ height: 48, borderBottom: "1px solid #ebe4d8", background: "#fff" }}>
          <div className="h-3 w-48 rounded-full animate-pulse" style={{ background: "#f3eee6" }} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm" style={{ color: "#b8aea1" }}>Cargando pedido…</p>
        </div>
      </div>
    )
  }

  const cfg        = estadoCfg[pedido.estado]
  const ivaImporte = pedido.subtotal != null ? pedido.subtotal * (pedido.iva_pct / 100) : null

  return (
    <div className="flex flex-col h-full -m-6">

      {/* ── JSON modal ── */}
      {jsonOpen && pedido.erp_json && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(26,20,16,0.55)",
            opacity: jsonVisible ? 1 : 0,
            transition: "opacity 200ms ease",
          }}
          onClick={closeJson}
        >
          <div
            className="flex flex-col rounded-[18px] overflow-hidden shadow-2xl"
            style={{
              width: 680, maxWidth: "90vw", maxHeight: "75vh",
              background: "#161210", border: "1px solid #2e2620",
              opacity: jsonVisible ? 1 : 0,
              transform: jsonVisible ? "scale(1) translateY(0)" : "scale(0.96) translateY(8px)",
              transition: "opacity 220ms ease, transform 220ms ease",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3.5 shrink-0" style={{ borderBottom: "1px solid #2e2620" }}>
              <div className="flex items-center gap-2">
                <FileJson className="size-4" style={{ color: "#f57a26" }} />
                <span className="text-sm font-semibold" style={{ color: "#f3eee6" }}>Salida ERP</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#2e2620", color: "#847a6f" }}>JSON</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDescargarJson}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-[8px] transition-colors"
                  style={{ border: "1px solid #3a302a", background: "transparent", color: "#b8aea1" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#2e2620")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <Download className="size-3" /> Descargar
                </button>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(pedido.erp_json!); toast.success("Copiado al portapapeles") }}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-[8px] transition-colors"
                  style={{ border: "1px solid #3a302a", background: "transparent", color: "#b8aea1" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#2e2620")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <Copy className="size-3" /> Copiar
                </button>
                <button
                  type="button"
                  onClick={closeJson}
                  className="size-7 flex items-center justify-center rounded-[7px] transition-colors ml-1"
                  style={{ color: "#847a6f", background: "transparent" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#2e2620")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>
            {/* JSON content */}
            <div className="overflow-auto p-5">
              <pre
                className="text-xs leading-relaxed"
                style={{ color: "#d4c9bb", fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace" }}
              >
                {pedido.erp_json}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ── Topbar ── */}
      <div
        className="flex items-center justify-between px-4 md:px-6 shrink-0 gap-2 md:gap-4"
        style={{ height: 48, borderBottom: "1px solid #ebe4d8", background: "#ffffff" }}
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm min-w-0">
          <button
            type="button"
            onClick={() => router.push("/empleado/pedidos")}
            className="transition-colors"
            style={{ color: "#b8aea1" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#f57a26")}
            onMouseLeave={e => (e.currentTarget.style.color = "#b8aea1")}
          >
            Pedidos
          </button>
          <ChevronRight className="size-3.5 shrink-0" style={{ color: "#ddd4c4" }} />
          <span className="font-medium truncate" style={{ color: "#1a1410" }}>{pedido.referencia}</span>
          <span
            className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ml-2 shrink-0"
            style={{ background: editMode ? "#fbf1d9" : cfg.bg, color: editMode ? "#b07a12" : cfg.color }}
          >
            <span className="size-1.5 rounded-full shrink-0" style={{ background: editMode ? "#b07a12" : cfg.dot }} />
            {editMode ? "Editando" : cfg.label}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {editMode ? (
            <>
              <button
                type="button"
                onClick={cancelarEdicion}
                disabled={guardando}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[10px] transition-colors"
                style={{ border: "1px solid #ebe4d8", background: "#ffffff", color: "#4a423b" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f3eee6")}
                onMouseLeave={e => (e.currentTarget.style.background = "#ffffff")}
              >
                <X className="size-3.5" /> Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit(onGuardar)}
                disabled={guardando}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[10px] transition-colors"
                style={{
                  background: guardando ? "#ddd4c4" : "#f57a26",
                  color: "#ffffff",
                  cursor: guardando ? "not-allowed" : "pointer",
                }}
                onMouseEnter={e => { if (!guardando) (e.currentTarget as HTMLElement).style.background = "#d96017" }}
                onMouseLeave={e => { if (!guardando) (e.currentTarget as HTMLElement).style.background = "#f57a26" }}
              >
                <Check className="size-3.5" />
                {guardando ? "Guardando…" : "Guardar cambios"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleDuplicar}
                disabled={duplicando}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[10px] transition-colors"
                style={{ border: "1px solid #ebe4d8", background: "#ffffff", color: duplicando ? "#b8aea1" : "#4a423b", cursor: duplicando ? "not-allowed" : "pointer" }}
                onMouseEnter={e => { if (!duplicando) (e.currentTarget as HTMLElement).style.background = "#f3eee6" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#ffffff" }}
              >
                <Copy className="size-3.5" />
                <span className="hidden sm:inline">{duplicando ? "Duplicando…" : "Duplicar"}</span>
              </button>

              <button
                type="button"
                onClick={handleExportarJson}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[10px] transition-colors"
                style={{ border: `1px solid ${jsonOpen ? "#f57a26" : "#ebe4d8"}`, background: jsonOpen ? "#fff5ec" : "#ffffff", color: jsonOpen ? "#f57a26" : "#4a423b" }}
                onMouseEnter={e => { if (!jsonOpen) (e.currentTarget as HTMLElement).style.background = "#f3eee6" }}
                onMouseLeave={e => { if (!jsonOpen) (e.currentTarget as HTMLElement).style.background = "#ffffff" }}
              >
                <FileJson className="size-3.5" /><span className="hidden sm:inline"> Exportar JSON</span>
              </button>

              <button
                type="button"
                onClick={abrirEdicion}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[10px] transition-colors"
                style={{ border: "1px solid #ebe4d8", background: "#ffffff", color: "#4a423b" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f3eee6")}
                onMouseLeave={e => (e.currentTarget.style.background = "#ffffff")}
              >
                <Pencil className="size-3.5" /><span className="hidden sm:inline"> Editar</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-auto lg:overflow-hidden">

        {/* ── Left: main content ── */}
        <div
          className="flex-1 overflow-y-auto p-4 md:p-6 border-b lg:border-b-0 lg:border-r"
          style={{ borderColor: "#ebe4d8" }}
        >

          {/* Hero card */}
          <div className="rounded-[16px] p-5 mb-5" style={{ background: "#ffffff", border: "1px solid #ebe4d8" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold mb-1" style={{ color: "#1a1410" }}>
                  Pedido de {editMode ? (watch("nombre_cliente") || pedido.nombre_cliente) : (pedido.nombre_cliente ?? "—")}
                </p>
                <p className="text-sm" style={{ color: "#847a6f" }}>
                  {[
                    editMode ? watch("nombre_empresa") : pedido.nombre_empresa,
                    editMode
                      ? (watch("fecha_pedido") ? formatDateLong(watch("fecha_pedido")!) : null)
                      : (pedido.fecha_pedido ? formatDateLong(pedido.fecha_pedido) : null),
                    `${editMode ? fields.length : pedido.num_productos} productos`,
                    editMode ? formatPrice(totalCalc + ivaCalc) : (pedido.total != null ? formatPrice(pedido.total) : null),
                  ].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {pedido.ia_confianza && <IaConfianzaBadge nivel={pedido.ia_confianza} />}
                {pedido.ia_confianza_pct != null && (
                  <span className="text-xs" style={{ color: "#b8aea1" }}>
                    Extraído con IA · Confianza {pedido.ia_confianza_pct}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Datos del pedido */}
          <div className="rounded-[16px] p-5 mb-5" style={{ background: "#ffffff", border: "1px solid #ebe4d8" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#b8aea1" }}>Datos del pedido</p>
            {editMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                {/* Nombre cliente */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#b8aea1" }}>Nombre cliente</label>
                  <input {...register("nombre_cliente")} style={inputSt}
                    onFocus={e => e.currentTarget.style.borderColor = "#f57a26"}
                    onBlur={e => e.currentTarget.style.borderColor = "#ebe4d8"} />
                  {errors.nombre_cliente && <p className="text-[10px]" style={{ color: "#c0382a" }}>{errors.nombre_cliente.message}</p>}
                </div>
                {/* Email cliente */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#b8aea1" }}>Email cliente</label>
                  <input {...register("email_cliente")} style={inputSt} placeholder="opcional"
                    onFocus={e => e.currentTarget.style.borderColor = "#f57a26"}
                    onBlur={e => e.currentTarget.style.borderColor = "#ebe4d8"} />
                </div>
                {/* Empresa */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#b8aea1" }}>Razón social</label>
                  <input {...register("nombre_empresa")} style={inputSt}
                    onFocus={e => e.currentTarget.style.borderColor = "#f57a26"}
                    onBlur={e => e.currentTarget.style.borderColor = "#ebe4d8"} />
                  {errors.nombre_empresa && <p className="text-[10px]" style={{ color: "#c0382a" }}>{errors.nombre_empresa.message}</p>}
                </div>
                {/* CIF */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#b8aea1" }}>CIF</label>
                  <input {...register("cif_empresa")} style={inputSt} placeholder="opcional"
                    onFocus={e => e.currentTarget.style.borderColor = "#f57a26"}
                    onBlur={e => e.currentTarget.style.borderColor = "#ebe4d8"} />
                </div>
                {/* Fecha pedido */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#b8aea1" }}>Fecha del pedido</label>
                  <input type="date" {...register("fecha_pedido")} style={inputSt}
                    onFocus={e => e.currentTarget.style.borderColor = "#f57a26"}
                    onBlur={e => e.currentTarget.style.borderColor = "#ebe4d8"} />
                  {errors.fecha_pedido && <p className="text-[10px]" style={{ color: "#c0382a" }}>{errors.fecha_pedido.message}</p>}
                </div>
                {/* Fecha entrega */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#b8aea1" }}>Entrega prevista</label>
                  <input type="date" {...register("fecha_entrega")} style={inputSt} placeholder="opcional"
                    onFocus={e => e.currentTarget.style.borderColor = "#f57a26"}
                    onBlur={e => e.currentTarget.style.borderColor = "#ebe4d8"} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: "#b8aea1" }}>Cliente</p>
                  <p className="text-sm font-medium mb-0.5" style={{ color: "#1a1410" }}>{pedido.nombre_cliente ?? "—"}</p>
                  {pedido.email_cliente && <p className="text-xs" style={{ color: "#847a6f" }}>{pedido.email_cliente}</p>}
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: "#b8aea1" }}>Empresa</p>
                  <p className="text-sm font-medium mb-0.5" style={{ color: "#1a1410" }}>{pedido.nombre_empresa ?? "—"}</p>
                  {pedido.cif_empresa && <p className="text-xs" style={{ color: "#847a6f" }}>CIF {pedido.cif_empresa}</p>}
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: "#b8aea1" }}>Fecha del pedido</p>
                  <p className="text-sm font-medium mb-0.5" style={{ color: "#1a1410" }}>
                    {pedido.fecha_pedido ? formatDateLong(pedido.fecha_pedido) : "—"}
                  </p>
                  {pedido.fecha_entrega && (
                    <p className="text-xs" style={{ color: "#847a6f" }}>Entrega prevista: {formatDateShort(pedido.fecha_entrega)}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Líneas de producto */}
          <div className="rounded-[16px] overflow-hidden" style={{ background: "#ffffff", border: "1px solid #ebe4d8" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #f3eee6" }}>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#b8aea1" }}>Líneas de producto</p>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "#f3eee6", color: "#847a6f" }}>
                  {editMode ? fields.length : pedido.num_productos} referencias
                </span>
              </div>
              {editMode ? (
                <button
                  type="button"
                  onClick={() => append({ referencia: null, nombre: "", cantidad: 1, precio_unitario: null })}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-[8px] transition-colors"
                  style={{ border: "1px solid #ebe4d8", background: "#faf7f2", color: "#4a423b" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f3eee6")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#faf7f2")}
                >
                  <Plus className="size-3" /> Añadir línea
                </button>
              ) : (
                pedido.total != null && (
                  <span className="text-sm font-semibold" style={{ color: "#1a1410" }}>
                    Total: {formatPrice(pedido.total)}
                  </span>
                )
              )}
            </div>

            <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr style={{ background: "#ffffff", borderBottom: "1px solid #f3eee6" }}>
                  {["Ref.", "Producto", "Cant.", "P. unit.", "Importe", ...(editMode ? [""] : [])].map((h, i) => (
                    <th
                      key={h + i}
                      className={`px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider ${i > 1 && h !== "" ? "text-right" : "text-left"}`}
                      style={{ color: "#b8aea1", width: h === "" ? 32 : undefined }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {editMode ? (
                  fields.map((field, i) => {
                    const imp = (watchProductos[i]?.cantidad ?? 0) * (watchProductos[i]?.precio_unitario ?? 0)
                    return (
                      <tr key={field.id} style={{ borderBottom: i < fields.length - 1 ? "1px solid #f3eee6" : "none" }}>
                        <td className="px-3 py-2" style={{ width: 90 }}>
                          <input {...register(`productos.${i}.referencia`)} placeholder="REF" style={{ ...inputSt, fontSize: 12, fontFamily: "monospace" }}
                            onFocus={e => e.currentTarget.style.borderColor = "#f57a26"}
                            onBlur={e => e.currentTarget.style.borderColor = "#ebe4d8"} />
                        </td>
                        <td className="px-3 py-2">
                          <input {...register(`productos.${i}.nombre`)} placeholder="Nombre del producto" style={{ ...inputSt, fontSize: 12 }}
                            onFocus={e => e.currentTarget.style.borderColor = "#f57a26"}
                            onBlur={e => e.currentTarget.style.borderColor = "#ebe4d8"} />
                          {errors.productos?.[i]?.nombre && (
                            <p className="text-[10px] mt-0.5" style={{ color: "#c0382a" }}>{errors.productos[i]?.nombre?.message}</p>
                          )}
                        </td>
                        <td className="px-3 py-2" style={{ width: 72 }}>
                          <input {...register(`productos.${i}.cantidad`, { valueAsNumber: true })} type="number" min={0} style={{ ...inputSt, fontSize: 12, textAlign: "center" }}
                            onFocus={e => e.currentTarget.style.borderColor = "#f57a26"}
                            onBlur={e => e.currentTarget.style.borderColor = "#ebe4d8"} />
                        </td>
                        <td className="px-3 py-2" style={{ width: 90 }}>
                          <input {...register(`productos.${i}.precio_unitario`, { valueAsNumber: true })} type="number" min={0} step={0.01} placeholder="0,00" style={{ ...inputSt, fontSize: 12, textAlign: "right" }}
                            onFocus={e => e.currentTarget.style.borderColor = "#f57a26"}
                            onBlur={e => e.currentTarget.style.borderColor = "#ebe4d8"} />
                        </td>
                        <td className="px-4 py-2 text-sm text-right tabular-nums" style={{ color: "#1a1410", width: 90 }}>
                          {imp > 0 ? formatPrice(imp) : <span style={{ color: "#ddd4c4" }}>—</span>}
                        </td>
                        <td className="px-2 py-2 text-center" style={{ width: 32 }}>
                          <button
                            type="button"
                            onClick={() => remove(i)}
                            className="flex items-center justify-center rounded-[6px] transition-colors"
                            style={{ width: 24, height: 24, color: "#b8aea1", background: "transparent" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#c0382a" }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#b8aea1" }}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  pedido.productos.map((p, i) => (
                    <tr key={i} style={{ borderBottom: i < pedido.productos.length - 1 ? "1px solid #f3eee6" : "none" }}>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: "#847a6f", whiteSpace: "nowrap" }}>
                        {p.referencia ?? <span style={{ color: "#ddd4c4" }}>—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#1a1410" }}>{p.nombre}</td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums" style={{ color: "#4a423b" }}>{p.cantidad}</td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums" style={{ color: "#4a423b" }}>
                        {p.precio_unitario != null ? formatPrice(p.precio_unitario) : <span style={{ color: "#ddd4c4" }}>—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-right tabular-nums font-medium" style={{ color: "#1a1410" }}>
                        {p.importe != null ? formatPrice(p.importe) : <span style={{ color: "#ddd4c4" }}>—</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>

            {/* Totals */}
            <div className="px-5 py-4" style={{ borderTop: "1px solid #f3eee6", background: "#ffffff" }}>
              <div className="flex flex-col gap-1.5 items-end">
                <div className="flex items-center gap-8">
                  <span className="text-xs" style={{ color: "#847a6f" }}>Subtotal</span>
                  <span className="text-sm tabular-nums" style={{ color: "#1a1410" }}>
                    {editMode ? formatPrice(totalCalc) : (pedido.subtotal != null ? formatPrice(pedido.subtotal) : "—")}
                  </span>
                </div>
                <div className="flex items-center gap-8">
                  <span className="text-xs" style={{ color: "#847a6f" }}>IVA ({pedido.iva_pct}%)</span>
                  <span className="text-sm tabular-nums" style={{ color: "#1a1410" }}>
                    {editMode ? formatPrice(ivaCalc) : (ivaImporte != null ? formatPrice(ivaImporte) : "—")}
                  </span>
                </div>
                <div className="flex items-center gap-8 pt-1.5" style={{ borderTop: "1px solid #ebe4d8" }}>
                  <span className="text-xs font-semibold" style={{ color: "#1a1410" }}>Total</span>
                  <span className="text-base font-semibold tabular-nums" style={{ color: "#1a1410" }}>
                    {editMode ? formatPrice(totalCalc + ivaCalc) : (pedido.total != null ? formatPrice(pedido.total) : "—")}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── Right: sidebar ── */}
        <div className="lg:w-72 shrink-0 overflow-y-auto flex flex-col gap-4 p-4 md:p-5">

          {/* Salida ERP — preview card */}
          {pedido.erp_json && (
            <button
              type="button"
              onClick={() => setJsonOpen(true)}
              className="w-full text-left rounded-[14px] overflow-hidden transition-opacity"
              style={{ border: "1px solid #2e2620", background: "#161210", opacity: 1 }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              {/* Mini header */}
              <div className="flex items-center justify-between px-3.5 py-2.5" style={{ borderBottom: "1px solid #2e2620" }}>
                <div className="flex items-center gap-1.5">
                  <FileJson className="size-3.5" style={{ color: "#f57a26" }} />
                  <span className="text-xs font-medium" style={{ color: "#d4c9bb" }}>Salida ERP</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "#2e2620", color: "#847a6f" }}>JSON · ver</span>
              </div>
              {/* Preview of first lines */}
              <pre
                className="text-[10px] px-3.5 py-2.5 leading-relaxed overflow-hidden"
                style={{
                  color: "#6b5e54",
                  fontFamily: "ui-monospace, monospace",
                  maxHeight: 64,
                  maskImage: "linear-gradient(to bottom, #161210 40%, transparent 100%)",
                  WebkitMaskImage: "linear-gradient(to bottom, #161210 40%, transparent 100%)",
                }}
              >
                {pedido.erp_json}
              </pre>
            </button>
          )}

          {/* Timeline */}
          <div className="rounded-[14px] p-4" style={{ background: "#ffffff", border: "1px solid #ebe4d8" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#b8aea1" }}>Línea temporal</p>
            <ol className="flex flex-col gap-0">
              {pedido.timeline.map((ev, i) => (
                <li key={i} className="flex gap-3">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="size-2 rounded-full shrink-0 mt-1"
                      style={{ background: i === pedido.timeline.length - 1 ? "#f57a26" : "#ddd4c4" }} />
                    {i < pedido.timeline.length - 1 && (
                      <div className="w-px flex-1 my-1" style={{ background: "#f3eee6", minHeight: 20 }} />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="text-xs font-medium leading-snug" style={{ color: "#1a1410" }}>{ev.label}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#b8aea1" }}>
                      {formatDateShort(ev.fecha)}, {formatTime(ev.fecha)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* PDF original */}
          <div className="rounded-[14px] p-4" style={{ background: "#ffffff", border: "1px solid #ebe4d8" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#b8aea1" }}>PDF original</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="size-9 rounded-[8px] flex items-center justify-center text-[9px] font-bold tracking-wide shrink-0"
                style={{ background: "#ffd0a8", color: "#5a2706" }}>PDF</div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: "#1a1410" }}>{pedido.pdf_nombre ?? "documento.pdf"}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "#b8aea1" }}>
                  {[pedido.pdf_size_kb != null ? `${pedido.pdf_size_kb} KB` : null, pedido.pdf_paginas != null ? `${pedido.pdf_paginas} pág.` : null].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toast.info("Descarga (próximamente)")}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs rounded-[10px] transition-colors"
              style={{ border: "1px solid #ebe4d8", background: "#faf7f2", color: "#4a423b" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f3eee6")}
              onMouseLeave={e => (e.currentTarget.style.background = "#faf7f2")}
            >
              <Download className="size-3.5" /> Descargar
            </button>
          </div>

          {/* Procesado por */}
          <div className="rounded-[14px] p-4" style={{ background: "#ffffff", border: "1px solid #ebe4d8" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#b8aea1" }}>Procesado por</p>
            <p className="text-xs" style={{ color: "#4a423b" }}>{pedido.procesado_por ?? "—"}</p>
          </div>

        </div>{/* end right sidebar */}
      </div>
    </div>
  )
}
