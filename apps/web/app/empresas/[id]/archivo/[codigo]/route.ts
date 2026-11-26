import { repositorio } from "@/lib/datos";
import { adjunto } from "@/lib/servidor";

/** Descarga el archivo original cargado (Word, Excel, PDF o imagen) sin modificar. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string; codigo: string }> }) {
  const { id, codigo } = await ctx.params;
  const repo = repositorio();
  const doc = await repo.obtenerDocumento(id, decodeURIComponent(codigo));
  if (!doc?.archivo) return new Response("Archivo no encontrado", { status: 404 });
  const bytes = await repo.leerArchivo(id, doc.archivo);
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": doc.archivo.tipoMime,
      "Content-Disposition": adjunto(doc.archivo.nombre),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
}
