import { cn } from "@/lib/utils"

export type Confianza = "alta" | "media" | "baja"

const config: Record<Confianza, { label: string; bars: number; classes: string }> = {
  alta:  { label: "Alta",  bars: 3, classes: "text-ia-alta  bg-ia-alta-bg" },
  media: { label: "Media", bars: 2, classes: "text-ia-media bg-ia-media-bg" },
  baja:  { label: "Baja",  bars: 1, classes: "text-ia-baja  bg-ia-baja-bg" },
}

export function IaConfianzaBadge({ nivel }: { nivel: Confianza }) {
  const { label, bars, classes } = config[nivel]
  return (
    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium", classes)}>
      <span className="flex gap-0.5 items-end">
        {[1, 2, 3].map((b) => (
          <span
            key={b}
            className={cn(
              "w-[3px] rounded-sm",
              b === 1 ? "h-[6px]" : b === 2 ? "h-[9px]" : "h-[12px]",
              b <= bars ? "bg-current opacity-100" : "bg-current opacity-20"
            )}
          />
        ))}
      </span>
      {label}
    </span>
  )
}
