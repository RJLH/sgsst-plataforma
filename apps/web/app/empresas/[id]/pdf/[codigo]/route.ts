import { repositorio } from "@/lib/datos";
import { pdfAutoevaluacion, pdfDocumento } from "@/lib/pdf/generar";
import { adjunto, anioActual, logoDe, resultadoDe } from "@/lib/servidor";

export async function GET(req: Request, ctx: { params: Promise<{ id: string; codigo: string }> }) {
  const { id, codigo } = await ctx.params;
  const repo = repositorio();
  const empresa = await repo.obtenerEmpresa(id);
  const doc = empresa ? await repo.obtenerDocumento(id, decodeURIComponent(codigo)) : null;
  if (!empresa || !doc) return new Response("Documento no encontrado", { status: 404 });

  const logo = await logoDe(empresa);
  const recursos = logo ? { logo } : {};
  let bytes: Uint8Array;

  if (doc.codigo === "FT-SST-001") {
    const anioParam = Number(new URL(req.url).searchParams.get("anio"));
    const anio = Number.isInteger(anioParam) && anioParam > 2000 ? anioParam : anioActual();
    const ev = (await repo.obtenerAutoevaluacion(id, anio)) ?? {
      id: "", empresaId: id, anio, grupo: "60" as const, respuestas: {}, actualizadoEn: "",
    };
    bytes = await pdfAutoevaluacion(empresa, doc, ev, resultadoDe(empresa, ev), recursos);
  } else {
    const archivo = doc.archivo ? await repo.leerArchivo(id, doc.archivo).catch(() => undefined) : undefined;
    bytes = await pdfDocumento(empresa, doc, archivo ? { ...recursos, archivo } : recursos);
  }

  const inline = new URL(req.url).searchParams.has("ver");
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": adjunto(`${doc.codigo} ${doc.nombre}.pdf`, inline),
      "Cache-Control": "no-store",
    },
  });
}
