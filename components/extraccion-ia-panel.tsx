"use client"

import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Trash2, AlertTriangle } from "lucide-react"
import { useEffect } from "react"
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
  onDescartar: () => void
  confirming?: boolean
}

/* ── Inline input styled to match mockup ── */
function Field({
  label, error, confianza, children,
}: { label: string; error?: string; confianza?: Confianza; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "#847a6f" }}>{label}</label>
        {confianza && <IaConfianzaBadge nivel={confianza} />}
      </div>
      {children}
      {error && <p className="text-xs" style={{ color: "#c0382a" }}>{error}</p>}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "6px 10px", fontSize: 13,
  border: "1px solid #ebe4d8", borderRadius: 10,
  background: "#ffffff", color: "#1a1410", outline: "none",
  boxShadow: "0 1px 0 0 rgba(26,20,16,0.04)",
}

/* ── Component ── */
export function ExtraccionIaPanel({ loading, datos, onConfirmar, onDescartar, confirming }: Props) {
  const { register, control, handleSubmit, reset, watch, formState: { errors } } =
    useForm<PedidoFormValues>({
      resolver: zodResolver(pedidoSchema),
      defaultValues: { nombre_cliente: "", nombre_empresa: "", fecha_pedido: "", productos: [] },
    })

  const { fields, append, remove } = useFieldArray({ control, name: "productos" })

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

  const productos      = watch("productos")
  const total          = productos.reduce((acc, p) => acc + (p.cantidad ?? 0) * (p.precio_unitario ?? 0), 0)
  const bajasConfianza = datos?.productos.filter(p => p.confianza === "baja").length ?? 0
  const conf           = datos?.ia_confianza

  /* Loading skeleton */
  if (loading) return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-36" style={{ background: "#f3eee6" }} />
        <Skeleton className="h-5 w-24 rounded-full" style={{ background: "#f3eee6" }} />
      </div>
      {[1,2,3].map(i => (
        <div key={i} className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-20" style={{ background: "#f3eee6" }} />
          <Skeleton className="h-8 w-full rounded-[10px]" style={{ background: "#f3eee6" }} />
        </div>
      ))}
      <Skeleton className="h-3 w-16" style={{ background: "#f3eee6" }} />
      {[1,2,3].map(i => <Skeleton key={i} className="h-8 w-full rounded-[10px]" style={{ background: "#f3eee6" }} />)}
      <p className="text-xs text-center animate-pulse mt-auto" style={{ color: "#b8aea1" }}>Procesando con IA…</p>
    </div>
  )

  if (!datos) return null

  return (
    <form onSubmit={handleSubmit(onConfirmar)} className="flex flex-col h-full gap-0">

      {/* Header */}
      <div className="flex items-center gap-2 pb-4" style={{ borderBottom: "1px solid #ebe4d8" }}>
        <span className="text-sm font-medium" style={{ color: "#1a1410" }}>Datos extraídos por IA</span>
        <span
          className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{ background: "#e7f5ee", color: "#2a8a5d" }}
        >
          ✓ Listo para revisar
        </span>
        {conf && (
          <span className="text-xs ml-auto" style={{ color: "#b8aea1" }}>
            Revisa campos en naranja o rojo
          </span>
        )}
      </div>

      {/* Scrollable fields */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-5">

        {/* Cliente */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#b8aea1" }}>Cliente</p>
          <Field label="Nombre del cliente" confianza={conf?.nombre_cliente} error={errors.nombre_cliente?.message}>
            <input {...register("nombre_cliente")} style={{ ...inputStyle, borderColor: errors.nombre_cliente ? "#c0382a" : "#ebe4d8" }} />
          </Field>
        </div>

        {/* Empresa */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#b8aea1" }}>Empresa</p>
          <Field label="Razón social" confianza={conf?.nombre_empresa} error={errors.nombre_empresa?.message}>
            <input {...register("nombre_empresa")} style={{ ...inputStyle, borderColor: errors.nombre_empresa ? "#c0382a" : "#ebe4d8" }} />
          </Field>
          <Field label="Fecha del pedido" confianza={conf?.fecha_pedido} error={errors.fecha_pedido?.message}>
            <input type="date" {...register("fecha_pedido")} style={{ ...inputStyle, borderColor: errors.fecha_pedido ? "#c0382a" : "#ebe4d8" }} />
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
              {conf?.productos && <IaConfianzaBadge nivel={conf.productos} />}
            </div>
            <button
              type="button"
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-[8px] transition-colors"
              style={{ color: "#4a423b", background: "transparent" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f3eee6")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              onClick={() => append({ nombre: "", cantidad: 1, precio_unitario: null, referencia: null })}
            >
              <Plus className="size-3" /> Añadir línea
            </button>
          </div>

          {/* Table head */}
          <div className="grid grid-cols-[1fr_56px_76px_24px] gap-2 px-1">
            {["Producto", "Cant.", "P. unit.", ""].map(h => (
              <span key={h} className="text-[10px]" style={{ color: "#b8aea1" }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          {fields.map((field, i) => {
            const c = datos.productos[i]?.confianza
            const rowBg = c === "baja" ? "#fbe9e6" : c === "media" ? "rgba(251,241,217,0.5)" : "transparent"
            return (
              <div
                key={field.id}
                className="grid grid-cols-[1fr_56px_76px_24px] gap-2 items-center px-1 py-1 rounded-[8px]"
                style={{ background: rowBg }}
              >
                <input {...register(`productos.${i}.nombre`)} placeholder="Nombre" style={{ ...inputStyle, fontSize: 12 }} />
                <input {...register(`productos.${i}.cantidad`)} type="number" min={0} style={{ ...inputStyle, fontSize: 12, textAlign: "center" }} />
                <input {...register(`productos.${i}.precio_unitario`)} type="number" min={0} step={0.01} placeholder="0,00" style={{ ...inputStyle, fontSize: 12, textAlign: "right" }} />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="flex items-center justify-center rounded-[6px] transition-colors"
                  style={{ color: "#b8aea1", background: "transparent", width: 24, height: 24 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#c0382a" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#b8aea1" }}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            )
          })}

          {/* Total */}
          {fields.length > 0 && (
            <div className="flex justify-end pt-2" style={{ borderTop: "1px solid #ebe4d8" }}>
              <div className="text-right">
                <p className="text-xs" style={{ color: "#b8aea1" }}>Total calculado</p>
                <p className="text-base font-semibold" style={{ color: "#1a1410" }}>{formatPrice(total)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Warning */}
        {bajasConfianza > 0 && (
          <div className="flex gap-2 p-3 rounded-[10px]" style={{ background: "#fbe9e6", border: "1px solid rgba(192,56,42,0.15)" }}>
            <AlertTriangle className="size-4 shrink-0 mt-0.5" style={{ color: "#c0382a" }} />
            <p className="text-xs leading-relaxed" style={{ color: "#c0382a" }}>
              {bajasConfianza} {bajasConfianza === 1 ? "campo con baja confianza" : "campos con baja confianza"}.
              Revisa las líneas resaltadas antes de confirmar.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4" style={{ borderTop: "1px solid #ebe4d8" }}>
        <button
          type="button"
          onClick={onDescartar}
          disabled={confirming}
          className="flex-1 py-2 text-sm font-medium rounded-[10px] transition-colors"
          style={{ border: "1px solid #ebe4d8", background: "#ffffff", color: "#4a423b" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#f3eee6")}
          onMouseLeave={e => (e.currentTarget.style.background = "#ffffff")}
        >
          Descartar
        </button>
        <button
          type="submit"
          disabled={confirming}
          className="flex-1 py-2 text-sm font-medium rounded-[10px] transition-colors"
          style={{ background: confirming ? "#ddd4c4" : "#f57a26", color: "#ffffff", cursor: confirming ? "not-allowed" : "pointer" }}
          onMouseEnter={e => { if (!confirming) (e.currentTarget as HTMLElement).style.background = "#d96017" }}
          onMouseLeave={e => { if (!confirming) (e.currentTarget as HTMLElement).style.background = "#f57a26" }}
        >
          {confirming ? "Guardando…" : "✓ Confirmar pedido"}
        </button>
      </div>
    </form>
  )
}
