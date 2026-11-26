import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { calificar, DOCUMENTOS_BASE, ITEMS, type Respuestas } from "@sgsst/core";
import { ArchivoInvalido, detectarTipo, limpiarNombre, validarArchivo } from "../lib/datos/archivos";
import { Conflicto, RepositorioLocal } from "../lib/datos/local";
import type { NuevaEmpresa } from "../lib/datos/tipos";
import { pdfAutoevaluacion, pdfDocumento } from "../lib/pdf/generar";
import { marcaDeTiempo } from "../lib/pdf/lienzo";

const PNG_1x1 = Uint8Array.from(
  Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==", "base64"),
);

const troncal: NuevaEmpresa = {
  nit: "901569104-9",
  razonSocial: "Hotel y Estación de Servicio La Troncal S.A.S.",
  actividadesCiiu: ["4731", "5511"],
  claseRiesgo: 3,
  numeroTrabajadores: 10,
  usarTablaCompleta: true,
  arl: "AXA Colpatria",
  representanteLegal: "Representante Legal",
  responsableSst: "Responsable SST",
  direccion: "Vía al mar, Loma Colorada",
  municipio: "Bosconia",
  departamento: "Cesar",
};

async function pdfMinimo(texto: string) {
  const d = await PDFDocument.create();
  d.addPage().drawText(texto);
  return new Uint8Array(await d.save());
}

describe("validación de archivos", () => {
  it("detecta el tipo por el contenido y no por la extensión", () => {
    expect(detectarTipo(PNG_1x1, "logo.jpg")).toBe("png");
    expect(detectarTipo(new TextEncoder().encode("%PDF-1.7"), "x.docx")).toBe("pdf");
    expect(detectarTipo(new TextEncoder().encode("<script>"), "x.pdf")).toBeNull();
    expect(detectarTipo(Uint8Array.from([0x50, 0x4b, 0x03, 0x04]), "matriz.xlsx")).toBe("xlsx");
    expect(detectarTipo(Uint8Array.from([0x50, 0x4b, 0x03, 0x04]), "virus.zip")).toBeNull();
  });

  it("rechaza archivos vacíos, disfrazados o de tipo no permitido", async () => {
    await expect(validarArchivo(new File([], "a.pdf"), ["pdf"])).rejects.toThrow(ArchivoInvalido);
    await expect(validarArchivo(new File(["hola"], "a.pdf"), ["pdf"])).rejects.toThrow(/no permitido/);
    await expect(validarArchivo(new File([PNG_1x1], "a.png"), ["pdf"])).rejects.toThrow(/no permitido/);
  });

  it("limpia nombres peligrosos conservando tildes", () => {
    expect(limpiarNombre("../../etc/passwd")).toBe("passwd");
    expect(limpiarNombre("Política <SST> año 2026.pdf")).toBe("Política _SST_ año 2026.pdf");
  });
});

describe("repositorio local", () => {
  let dir: string;
  let repo: RepositorioLocal;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "sgsst-"));
    repo = new RepositorioLocal(dir);
  });
  afterEach(() => rm(dir, { recursive: true, force: true }));

  it("al crear una empresa le copia el listado maestro completo", async () => {
    const e = await repo.crearEmpresa(troncal);
    const docs = await repo.listarDocumentos(e.id);
    expect(docs).toHaveLength(DOCUMENTOS_BASE.length);
    expect(docs.find((d) => d.codigo === "PRC-SST-019")?.mejoraSugerida).toMatch(/4272/);
    await expect(repo.crearEmpresa(troncal)).rejects.toThrow(Conflicto);
  });

  it("los documentos de una empresa no se mezclan con los de otra", async () => {
    const a = await repo.crearEmpresa(troncal);
    const b = await repo.crearEmpresa({ ...troncal, nit: "900000000-1", razonSocial: "Otra" });
    const pdf = await pdfMinimo("politica");
    await repo.cargarArchivoDocumento(a.id, "PLT-SST-001", new File([pdf], "politica.pdf"), "inicial");
    expect((await repo.obtenerDocumento(b.id, "PLT-SST-001"))?.archivo).toBeUndefined();
  });

  it("cargar una nueva versión conserva la anterior y sube el número", async () => {
    const e = await repo.crearEmpresa(troncal);
    await repo.cargarArchivoDocumento(e.id, "PLT-SST-001", new File([await pdfMinimo("v1")], "v1.pdf"), "Versión inicial");
    const d = await repo.cargarArchivoDocumento(e.id, "PLT-SST-001", new File([await pdfMinimo("v2")], "v2.pdf"), "Se actualiza la firma");
    expect(d.version).toBe("2");
    expect(d.historial).toHaveLength(1);
    expect(d.historial[0]?.archivo.nombre).toBe("v1.pdf");
    expect(d.estado).toBe("EN_REVISION");
    const bytes = await repo.leerArchivo(e.id, d.historial[0]!.archivo);
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe("%PDF");
  });

  it("no permite leer archivos fuera de la carpeta de la empresa", async () => {
    const e = await repo.crearEmpresa(troncal);
    await expect(
      repo.leerArchivo(e.id, { ruta: "../base.json", nombre: "x", tipoMime: "x", tamanoBytes: 1, sha256: "", subidoEn: "" }),
    ).rejects.toThrow(/no encontrado/i);
  });

  it("escrituras simultáneas no se pisan", async () => {
    const e = await repo.crearEmpresa(troncal);
    await Promise.all(
      ["elaboro", "reviso", "aprobo"].map((campo) => repo.actualizarDocumento(e.id, "PLT-SST-001", { [campo]: campo.toUpperCase() })),
    );
    const d = await repo.obtenerDocumento(e.id, "PLT-SST-001");
    expect([d?.elaboro, d?.reviso, d?.aprobo]).toEqual(["ELABORO", "REVISO", "APROBO"]);
  });
});

describe("PDF", () => {
  let dir: string;
  let repo: RepositorioLocal;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "sgsst-pdf-"));
    repo = new RepositorioLocal(dir);
  });
  afterEach(() => rm(dir, { recursive: true, force: true }));

  it("la autoevaluación de 60 ítems genera un PDF válido de varias páginas", async () => {
    const e = await repo.crearEmpresa(troncal);
    const doc = (await repo.obtenerDocumento(e.id, "FT-SST-001"))!;
    const respuestas = Object.fromEntries(ITEMS.map((i) => [i.codigo, { estado: "CUMPLE" as const }]));
    respuestas["1.1.5"] = { estado: "NO_APLICA", justificacion: "Ningún cargo es de alto riesgo para pensión especial." } as never;
    const ev = await repo.guardarAutoevaluacion(e.id, 2026, "60", respuestas);
    const bytes = await pdfAutoevaluacion(e, doc, ev, calificar("60", respuestas as Respuestas), { logo: { bytes: PNG_1x1, tipoMime: "image/png" } });
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThan(1);
    expect(pdf.getTitle()).toBe("FT-SST-001 Evaluación inicial del SG-SST (tabla de valores)");
  });

  it("un documento con PDF cargado incluye hoja de control más las páginas del archivo", async () => {
    const e = await repo.crearEmpresa(troncal);
    const fuente = await PDFDocument.create();
    fuente.addPage(); fuente.addPage();
    const d = await repo.cargarArchivoDocumento(e.id, "PLT-SST-001", new File([new Uint8Array(await fuente.save())], "politica.pdf"), "inicial");
    const bytes = await pdfDocumento(e, d, { archivo: await repo.leerArchivo(e.id, d.archivo!) });
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(3);
  });

  it("sin archivo genera la plantilla en blanco, y un PDF dañado no rompe la descarga", async () => {
    const e = await repo.crearEmpresa(troncal);
    const asistencia = (await repo.obtenerDocumento(e.id, "FT-SST-015"))!;
    expect((await PDFDocument.load(await pdfDocumento(e, asistencia, {}))).getPageCount()).toBe(1);

    const roto = { ...asistencia, archivo: { ruta: "x.pdf", nombre: "x.pdf", tipoMime: "application/pdf", tamanoBytes: 9, sha256: "0", subidoEn: "" } };
    const bytes = await pdfDocumento(e, roto, { archivo: new TextEncoder().encode("%PDF-roto") });
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
  });

  it("la marca de tiempo usa la hora de Colombia", () => {
    const { fecha, hora } = marcaDeTiempo(new Date("2026-11-27T03:30:00Z"));
    expect(fecha).toBe("26/11/2026");
    expect(hora).toBe("22:30");
  });
});
