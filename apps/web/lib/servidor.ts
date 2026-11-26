import "server-only";
import { calificar, grupoAplicable, type Respuestas } from "@sgsst/core";
import { repositorio, type Autoevaluacion, type Empresa } from "./datos";

/** Año en curso en Colombia. */
export function anioActual() {
  return Number(new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", year: "numeric" }).format(new Date()));
}

export function grupoDeEmpresa(e: Empresa) {
  return grupoAplicable({
    numeroTrabajadores: e.numeroTrabajadores,
    claseRiesgo: e.claseRiesgo,
    usarTablaCompleta: e.usarTablaCompleta,
  });
}

/**
 * Califica una autoevaluación con el grupo que aplica hoy a la empresa.
 * Si el grupo cambió (por ejemplo, la empresa creció), se califica con el nuevo
 * y las respuestas del grupo anterior simplemente no cuentan.
 */
export function resultadoDe(e: Empresa, ev: Autoevaluacion | null) {
  const grupo = grupoDeEmpresa(e);
  return calificar(grupo, (ev?.respuestas ?? {}) as Respuestas);
}

export async function logoDe(e: Empresa) {
  if (!e.logo) return undefined;
  try {
    return { bytes: await repositorio().leerArchivo(e.id, e.logo), tipoMime: e.logo.tipoMime };
  } catch {
    return undefined;
  }
}

/** Content-Disposition seguro para nombres con tildes. */
export function adjunto(nombre: string, inline = false) {
  const ascii = nombre.normalize("NFD").replace(/[^\x20-\x7e]/g, "").replace(/["\\]/g, "");
  return `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(nombre)}`;
}
