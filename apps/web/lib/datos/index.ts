import "server-only";
import path from "node:path";
import { RepositorioLocal } from "./local";
import type { Repositorio } from "./tipos";

let instancia: Repositorio | undefined;

/**
 * Devuelve el repositorio configurado.
 * - Modo local (por defecto en desarrollo): datos en SGSST_DATOS_DIR o apps/web/.datos.
 * - Producción: se exige Supabase. El modo local no tiene usuarios ni permisos,
 *   así que solo se permite en producción si se activa a propósito con SGSST_MODO_LOCAL=1.
 */
export function repositorio(): Repositorio {
  if (instancia) return instancia;
  const haySupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (haySupabase) {
    throw new Error("El repositorio de Supabase aún no está implementado; quite las variables de Supabase para usar el modo local.");
  }
  if (process.env.NODE_ENV === "production" && process.env.SGSST_MODO_LOCAL !== "1") {
    throw new Error("En producción configure Supabase. El modo local no protege los datos con usuarios ni permisos.");
  }
  instancia = new RepositorioLocal(process.env.SGSST_DATOS_DIR ?? path.join(/*turbopackIgnore: true*/ process.cwd(), ".datos"));
  return instancia;
}

export * from "./tipos";
