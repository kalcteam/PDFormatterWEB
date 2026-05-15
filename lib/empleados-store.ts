/**
 * Empleados store — persists state overrides in localStorage.
 * When the backend is ready, replace localStorage calls with API fetch calls.
 *
 * API endpoints to implement:
 *   PUT  /api/empleados/:id/estado   { estado: "activo" | "inactivo" }
 *   PUT  /api/empleados/:id/rol      { rol: "empleado" | "admin" }
 *   DELETE /api/empleados/:id
 */

export type EstadoEmpleado = "activo" | "inactivo" | "pendiente"
export type RolEmpleado    = "empleado" | "admin"

interface EmpleadoOverride {
  estado?: EstadoEmpleado
  rol?:    RolEmpleado
  deleted?: boolean
}

const KEY = "empleados:overrides"

function getAll(): Record<number, EmpleadoOverride> {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<number, EmpleadoOverride>
  } catch {
    return {}
  }
}

function setAll(data: Record<number, EmpleadoOverride>) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function getOverride(id: number): EmpleadoOverride {
  return getAll()[id] ?? {}
}

export async function setEstado(id: number, estado: EstadoEmpleado): Promise<void> {
  // TODO: await fetch(`/api/empleados/${id}/estado`, { method: "PUT", ... })
  await new Promise(r => setTimeout(r, 800))
  const all = getAll()
  all[id] = { ...all[id], estado }
  setAll(all)
}

export async function setRol(id: number, rol: RolEmpleado): Promise<void> {
  // TODO: await fetch(`/api/empleados/${id}/rol`, { method: "PUT", ... })
  await new Promise(r => setTimeout(r, 600))
  const all = getAll()
  all[id] = { ...all[id], rol }
  setAll(all)
}

export async function deleteEmpleado(id: number): Promise<void> {
  // TODO: await fetch(`/api/empleados/${id}`, { method: "DELETE", ... })
  await new Promise(r => setTimeout(r, 800))
  const all = getAll()
  all[id] = { ...all[id], deleted: true }
  setAll(all)
}

export function isDeleted(id: number): boolean {
  return getAll()[id]?.deleted === true
}
