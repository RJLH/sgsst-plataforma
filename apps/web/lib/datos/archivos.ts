/**
 * Validación de archivos cargados. El tipo se determina por el contenido
 * (firma de bytes), no por la extensión ni por el tipo que declara el navegador.
 */

export const TAMANO_MAXIMO_BYTES = 20 * 1024 * 1024;

export type TipoPermitido = "pdf" | "png" | "jpg" | "docx" | "xlsx" | "pptx";

const MIME: Record<TipoPermitido, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export const ACEPTA_DOCUMENTOS = ".pdf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg";
export const ACEPTA_IMAGENES = ".png,.jpg,.jpeg";

export class ArchivoInvalido extends Error {}

const empiezaCon = (b: Uint8Array, firma: number[]) => firma.every((v, i) => b[i] === v);

export function detectarTipo(bytes: Uint8Array, nombre: string): TipoPermitido | null {
  if (empiezaCon(bytes, [0x25, 0x50, 0x44, 0x46])) return "pdf"; // %PDF
  if (empiezaCon(bytes, [0x89, 0x50, 0x4e, 0x47])) return "png";
  if (empiezaCon(bytes, [0xff, 0xd8, 0xff])) return "jpg";
  // Office moderno es un ZIP: se distingue por la extensión, ya verificado que es ZIP.
  if (empiezaCon(bytes, [0x50, 0x4b, 0x03, 0x04])) {
    const ext = nombre.toLowerCase().split(".").pop();
    if (ext === "docx" || ext === "xlsx" || ext === "pptx") return ext;
  }
  return null;
}

export interface ArchivoValidado {
  bytes: Uint8Array;
  tipo: TipoPermitido;
  tipoMime: string;
  nombre: string;
}

/** Deja solo caracteres seguros en el nombre, conservando tildes y eñes. */
export function limpiarNombre(nombre: string): string {
  const base = nombre.split(/[\\/]/).pop() ?? "archivo";
  const limpio = base.normalize("NFC").replace(/[^\p{L}\p{N}._ -]/gu, "_").replace(/\s+/g, " ").trim();
  return (limpio || "archivo").slice(0, 120);
}

export async function validarArchivo(archivo: File, permitidos: readonly TipoPermitido[]): Promise<ArchivoValidado> {
  if (archivo.size === 0) throw new ArchivoInvalido("El archivo está vacío.");
  if (archivo.size > TAMANO_MAXIMO_BYTES) {
    throw new ArchivoInvalido("El archivo supera el límite de 20 MB. Comprímalo o divídalo e intente de nuevo.");
  }
  const bytes = new Uint8Array(await archivo.arrayBuffer());
  const tipo = detectarTipo(bytes, archivo.name);
  if (!tipo || !permitidos.includes(tipo)) {
    throw new ArchivoInvalido(`Tipo de archivo no permitido. Use: ${permitidos.join(", ").toUpperCase()}.`);
  }
  return { bytes, tipo, tipoMime: MIME[tipo], nombre: limpiarNombre(archivo.name) };
}
