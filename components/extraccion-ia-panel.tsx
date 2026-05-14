"use client"

import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Trash2, MoreHorizontal, Sparkles, Pencil, Check, X } from "lucide-react"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { IaConfianzaBadge, type Confianza } from "@/components/ia-confidence-badge"
import { formatPrice } from "@/lib/utils"

/* ── Schemas ── */
const productoSchema = z.object({
  nombre:          z.string().min(1, "Requerido"),
  cantidad:        z.coerce.number().min(0),
  precio_unitario: z.coerce.number().nullable(),
  referencia:      z.string().nullable(),
})
const pedidoSchema = z.object({
  nombre_cliente: z.string().min(1, "Requerido"),
  nombre_empresa: z.string().min(1, "Requerido"),
  fecha_pedido:   z.string().min(1, "Requerido"),
  productos:      z.array(productoSchema).min(1),
})
export type PedidoFormValues = z.infer<typeof pedidoSchema>

/* ── Types ── */
export interface DatosExtraidos {
  nombre_cliente: string | null
  nombre_empresa: string | null
  fecha_pedido:   string | null
  ia_confianza?: {
    nombre_cliente?: Confianza
    nombre_empresa?: Confianza
    fecha_pedido?:   Confianza
    productos?:      Confianza
  }
  productos: Array<{
    nombre: string; cantidad: number
    precio_unitario: number | null; referencia: string | null
    confianza?: Confianza
  }>
}

interface Props {
  loading?:    boolean
  datos?:      DatosExtraidos
  onConfirmar: (values: PedidoFormValues) => void
}

/* ── Helpers ── */
function borderByConf(c?: Confianza, hasError?: boolean): string {
  if (hasError)      return "#a83828"
  if (c === "baja")  return "#a83828"
  if (c === "media") return "#c8a040"
  return "#ebe4d8"
}

function mkInput(conf?: Confianza, hasError?: boolean, extra?: React.CSSProperties): React.CSSProperties {
  return {
    width: "100%", padding: "7px 10px", fontSize: 13,
    border: `1px solid ${borderByConf(conf, hasError)}`,
    borderRadius: 10,
    background: "#ffffff", color: "#1a1410", outline: "none",
    boxShadow: "0 1px 0 0 rgba(26,20,16,0.04)",
    ...extra,
  }
}

function globalScore(datos: DatosExtraidos): number {
  const confs = [
    datos.ia_confianza?.nombre_cliente,
    datos.ia_confianza?.nombre_empresa,
    datos.ia_confianza?.fecha_pedido,
    ...datos.productos.map(p => p.confianza),
  ].filter(Boolean) as Confianza[]
  if (!confs.length) return 100
  const sum = confs.reduce((a, c) => a + (c === "alta" ? 3 : c === "media" ? 2 : 1), 0)
  return Math.round((sum / (confs.length * 3)) * 100)
}

/* ── Field wrapper ── */
function Field({ label, error, confianza, children }: {
  label: string; error?: string; confianza?: Confianza; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium" style={{ color: "#847a6f" }}>{label}</label>
        {confianza && <IaConfianzaBadge nivel={confianza} />}
      </div>
      {children}
      {error && <p className="text-xs mt-0.5" style={{ color: "#a83828" }}>{error}</p>}
    </div>
  )
}

/* ── Component ── */
export function ExtraccionIaPanel({ loading, datos, onConfirmar }: Props) {
  const { register, control, handleSubmit, reset, watch, getValues, formState: { errors } } =
    useForm<PedidoFormValues>({
      resolver: zodResolver(pedidoSchema),
      defaultValues: { nombre_cliente: "", nombre_empresa: "", fecha_pedido: "", productos: [] },
    })

  const { fields, append, remove } = useFieldArray({ control, name: "productos" })

  const [openMenu, setOpenMenu]     = useState<number | null>(null)
  const [menuPos,  setMenuPos]      = useState<{ top: number; right: number } | null>(null)
  const [editRows, setEditRows]     = useState<Set<number>>(new Set())
  const [snapshots, setSnapshots]   = useState<Record<number, PedidoFormValues["productos"][number]>>({})

  // Close menu on scroll or resize so it doesn't go stale
  useEffect(() => {
    if (openMenu === null) return
    const close = () => { setOpenMenu(null); setMenuPos(null) }
    window.addEventListener("scroll", close, true)
    window.addEventListener("resize", close)
    return () => { window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close) }
  }, [openMenu])

  function startEdit(i: number) {
    const current = productos[i]
    if (current) setSnapshots(prev => ({ ...prev, [i]: { ...current } }))
    setEditRows(prev => new Set(prev).add(i))
    setOpenMenu(null)
  }

  function confirmEdit(i: number) {
    setEditRows(prev => { const n = new Set(prev); n.delete(i); return n })
    setSnapshots(prev => { const n = { ...prev }; delete n[i]; return n })
  }

  function cancelEdit(i: number) {
    const snap = snapshots[i]
    if (snap) {
      // restore original values
      reset({ ...getValues(), productos: productos.map((p, idx) => idx === i ? snap : p) })
    } else {
      // was a new row — remove it
      handleRemoveRow(i)
      return
    }
    setEditRows(prev => { const n = new Set(prev); n.delete(i); return n })
    setSnapshots(prev => { const n = { ...prev }; delete n[i]; return n })
  }

  function handleRemoveRow(i: number) {
    remove(i)
    setOpenMenu(null)
    setEditRows(prev => {
      const next = new Set<number>()
      prev.forEach(idx => { if (idx < i) next.add(idx); else if (idx > i) next.add(idx - 1) })
      return next
    })
    setSnapshots(prev => {
      const next: typeof prev = {}
      Object.entries(prev).forEach(([k, v]) => {
        const idx = Number(k)
        if (idx < i) next[idx] = v
        else if (idx > i) next[idx - 1] = v
      })
      return next
    })
  }

  useEffect(() => {
    if (datos) reset({
      nombre_cliente: datos.nombre_cliente ?? "",
      nombre_empresa: datos.nombre_empresa ?? "",
      fecha_pedido:   datos.fecha_pedido   ?? "",
      productos: datos.productos.map(p => ({
        nombre: p.nombre, cantidad: p.cantidad,
        precio_unitario: p.precio_unitario, referencia: p.referencia,
      })),
    })
  }, [datos, reset])

  const productos = watch("productos")
  const total     = productos.reduce((acc, p) => acc + (p.cantidad ?? 0) * (p.precio_unitario ?? 0), 0)
  const conf      = datos?.ia_confianza

  const allConfs: Confianza[] = [
    conf?.nombre_cliente, conf?.nombre_empresa, conf?.fecha_pedido,
    ...(datos?.productos.map(p => p.confianza) ?? []),
  ].filter(Boolean) as Confianza[]
  const hasBaja  = allConfs.includes("baja")
  const hasMedia = !hasBaja && allConfs.includes("media")
  const score    = datos ? globalScore(datos) : null

  const bannerBg     = hasBaja ? "rgba(168,56,40,0.06)"  : hasMedia ? "rgba(160,120,40,0.06)"  : "#f3eee6"
  const bannerBorder = hasBaja ? "rgba(168,56,40,0.15)"  : hasMedia ? "rgba(160,120,40,0.2)"   : "#ebe4d8"
  const bannerIcon   = hasBaja ? "#a83828"                : hasMedia ? "#a07828"                 : "#f57a26"
  const bannerIconBg = hasBaja ? "rgba(168,56,40,0.1)"   : hasMedia ? "rgba(160,120,40,0.1)"   : "rgba(245,122,38,0.12)"
  const bannerText   = hasBaja ? "#a83828"                : hasMedia ? "#7a5c10"                 : "#4a423b"

  /* Loading skeleton */
  if (loading) return (
    <div className="flex flex-col h-full gap-4 py-2">
      <Skeleton className="h-12 w-full rounded-[12px]" style={{ background: "#f3eee6" }} />
      {[1, 2, 3].map(i => (
        <div key={i} className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-20" style={{ background: "#f3eee6" }} />
          <Skeleton className="h-9 w-full rounded-[10px]" style={{ background: "#f3eee6" }} />
        </div>
      ))}
      <div className="flex flex-col gap-2 mt-2">
        <Skeleton className="h-3 w-16" style={{ background: "#f3eee6" }} />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full rounded-[10px]" style={{ background: "#f3eee6" }} />)}
      </div>
      <p className="text-xs text-center animate-pulse mt-auto" style={{ color: "#b8aea1" }}>Procesando con IA…</p>
    </div>
  )

  if (!datos) return null

  return (
    <form id="pedido-form" onSubmit={handleSubmit(onConfirmar)} className="flex flex-col h-full">
      <div
        className="flex-1 overflow-y-auto flex flex-col gap-5"
        onClick={() => { if (openMenu !== null) setOpenMenu(null) }}
      >

        {/* Global confidence banner */}
        {score !== null && (
          <div
            className="flex items-start gap-2.5 px-3.5 py-3 rounded-[12px]"
            style={{ background: bannerBg, border: `1px solid ${bannerBorder}` }}
          >
            <div
              className="size-6 rounded-[7px] flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: bannerIconBg }}
            >
              <Sparkles className="size-3.5" style={{ color: bannerIcon }} />
            </div>
            <p className="text-xs leading-relaxed" style={{ color: bannerText }}>
              <span className="font-semibold">Confianza global: {score}%.</span>{" "}
              {hasBaja || hasMedia
                ? "Revisa los campos marcados con confianza media o baja antes de confirmar."
                : "Todos los campos se extrajeron con alta confianza."}
            </p>
          </div>
        )}

        {/* Cliente */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#b8aea1" }}>Cliente</p>
          <Field label="Nombre del cliente" confianza={conf?.nombre_cliente} error={errors.nombre_cliente?.message}>
            <input {...register("nombre_cliente")} style={mkInput(conf?.nombre_cliente, !!errors.nombre_cliente)} />
          </Field>
        </div>

        {/* Empresa */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#b8aea1" }}>Empresa</p>
          <Field label="Razón social" confianza={conf?.nombre_empresa} error={errors.nombre_empresa?.message}>
            <input {...register("nombre_empresa")} style={mkInput(conf?.nombre_empresa, !!errors.nombre_empresa)} />
          </Field>
          <Field label="Fecha del pedido" confianza={conf?.fecha_pedido} error={errors.fecha_pedido?.message}>
            <input type="date" {...register("fecha_pedido")} style={mkInput(conf?.fecha_pedido, !!errors.fecha_pedido)} />
          </Field>
        </div>

        {/* Productos */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#b8aea1" }}>Productos</p>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "#f3eee6", color: "#847a6f" }}>
                {fields.length} líneas
              </span>
            </div>
            <button
              type="button"
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-[8px] transition-colors font-medium"
              style={{ color: "#4a423b", border: "1px solid #ebe4d8", background: "#ffffff" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f3eee6")}
              onMouseLeave={e => (e.currentTarget.style.background = "#ffffff")}
              onClick={() => {
                const newIndex = fields.length
                append({ nombre: "", cantidad: 1, precio_unitario: null, referencia: null })
                setEditRows(prev => new Set(prev).add(newIndex))
                // no snapshot → cancelEdit will remove the row
              }}
            >
              <Plus className="size-3" /> Añadir línea
            </button>
          </div>

          {/* Table */}
          <div className="rounded-[12px] overflow-x-auto" style={{ border: "1px solid #ebe4d8", background: "#ffffff" }}>
          <div style={{ minWidth: 400 }}>

            {/* Head */}
            <div
              className="grid px-3 py-2 rounded-t-[12px]"
              style={{ gridTemplateColumns: "1fr 52px 72px 76px 60px", gap: 8, borderBottom: "1px solid #ebe4d8" }}
            >
              {["PRODUCTO", "CANT.", "P. UNIT.", "CONFIANZA", ""].map(h => (
                <span key={h} className="text-[10px] font-semibold tracking-wider" style={{ color: "#b8aea1" }}>{h}</span>
              ))}
            </div>

            {/* Rows */}
            {fields.map((field, i) => {
              const c      = datos.productos[i]?.confianza
              const ref    = datos.productos[i]?.referencia
              const isEdit = editRows.has(i)
              const p      = productos[i]

              return (
                <div
                  key={field.id}
                  className="grid items-center px-3"
                  style={{
                    gridTemplateColumns: "1fr 52px 72px 76px 60px",
                    gap: 8,
                    borderBottom: i < fields.length - 1 ? "1px solid #f3eee6" : "none",
                    paddingTop: isEdit ? 10 : 10,
                    paddingBottom: isEdit ? 10 : 10,
                  }}
                >
                  {/* Product */}
                  <div className="min-w-0 flex flex-col gap-0.5">
                    {isEdit ? (
                      <input
                        {...register(`productos.${i}.nombre`)}
                        placeholder="Nombre del producto"
                        style={mkInput(c, false, { fontSize: 12, padding: "5px 8px" })}
                      />
                    ) : (
                      <p className="text-sm font-medium truncate" style={{ color: "#1a1410" }}>
                        {p?.nombre || <span style={{ color: "#b8aea1" }}>—</span>}
                      </p>
                    )}
                    {ref && (
                      <span className="text-[10px] font-mono" style={{ color: "#b8aea1" }}>{ref}</span>
                    )}
                  </div>

                  {/* Cantidad */}
                  {isEdit ? (
                    <input
                      {...register(`productos.${i}.cantidad`)}
                      type="number" min={0}
                      style={mkInput(undefined, false, { fontSize: 12, padding: "5px 6px", textAlign: "center" })}
                    />
                  ) : (
                    <p className="text-sm text-center" style={{ color: "#1a1410" }}>{p?.cantidad ?? "—"}</p>
                  )}

                  {/* Precio */}
                  {isEdit ? (
                    <input
                      {...register(`productos.${i}.precio_unitario`)}
                      type="number" min={0} step={0.01} placeholder="0,00"
                      style={mkInput(undefined, false, { fontSize: 12, padding: "5px 6px", textAlign: "center" })}
                    />
                  ) : (
                    <p className="text-sm text-center" style={{ color: "#1a1410" }}>
                      {p?.precio_unitario != null ? `${Number(p.precio_unitario).toFixed(2)} €` : "—"}
                    </p>
                  )}

                  {/* Confianza badge */}
                  <div className="flex items-center">
                    {c ? <IaConfianzaBadge nivel={c} /> : <span />}
                  </div>

                  {/* Row menu */}
                  <div className="relative flex items-center justify-center" onClick={e => e.stopPropagation()}>
                    {isEdit ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => confirmEdit(i)}
                          className="flex items-center justify-center size-6 rounded-[6px] transition-colors"
                          style={{ background: "#e7f5ee", color: "#2a8a5d" }}
                          title="Confirmar"
                        >
                          <Check className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelEdit(i)}
                          className="flex items-center justify-center size-6 rounded-[6px] transition-colors"
                          style={{ background: "#f3eee6", color: "#847a6f" }}
                          title="Cancelar"
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fdf0ee"; (e.currentTarget as HTMLElement).style.color = "#a83828" }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#f3eee6"; (e.currentTarget as HTMLElement).style.color = "#847a6f" }}
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation()
                          if (openMenu === i) { setOpenMenu(null); setMenuPos(null); return }
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          const right = Math.max(8, window.innerWidth - rect.right)
                          const top   = rect.bottom + 4
                          setMenuPos({ top, right })
                          setOpenMenu(i)
                        }}
                        className="flex items-center justify-center size-6 rounded-[6px] transition-colors"
                        style={{ color: "#b8aea1" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#f3eee6"; (e.currentTarget as HTMLElement).style.color = "#4a423b" }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#b8aea1" }}
                      >
                        <MoreHorizontal className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Total */}
            {fields.length > 0 && (
              <div
                className="flex items-center justify-between px-3 py-2.5 rounded-b-[12px]"
                style={{ borderTop: "1px solid #ebe4d8" }}
              >
                <span className="text-xs" style={{ color: "#b8aea1" }}>Total calculado</span>
                <span className="text-sm font-semibold" style={{ color: "#1a1410" }}>{formatPrice(total)}</span>
              </div>
            )}
          </div>{/* end minWidth wrapper */}
          </div>{/* end table outer */}
        </div>

      </div>

      {/* Row dropdown — rendered outside overflow containers, position: fixed */}
      {openMenu !== null && menuPos && (
        <div
          className="rounded-[10px] py-1 min-w-[130px]"
          style={{
            position: "fixed",
            top: menuPos.top,
            right: menuPos.right,
            zIndex: 200,
            background: "#ffffff",
            border: "1px solid #ebe4d8",
            boxShadow: "0 4px 14px rgba(26,20,16,0.08)",
          }}
          onClick={e => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => { startEdit(openMenu); setMenuPos(null) }}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs transition-colors"
            style={{ color: "#1a1410" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f3eee6")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <Pencil className="size-3" /> Editar línea
          </button>
          <button
            type="button"
            onClick={() => { handleRemoveRow(openMenu); setMenuPos(null) }}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs transition-colors"
            style={{ color: "#a83828" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#fdf0ee")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <Trash2 className="size-3" /> Eliminar línea
          </button>
        </div>
      )}
    </form>
  )
}
