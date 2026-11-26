/**
 * Documentos PDF de la plataforma.
 */
import {
  ACCIONES_VALORACION,
  ESTANDARES,
  ITEMS,
  SUBESTANDARES,
  TEXTO_VALORACION,
  requisitosDelGrupo,
  type ResultadoAutoevaluacion,
} from "@sgsst/core";
import type { Autoevaluacion, DocumentoEmpresa, Empresa } from "../datos/tipos";
import { COLOR, Lienzo, fechaLegible, type DatosEncabezado } from "./lienzo";

export interface Recursos {
  logo?: { bytes: Uint8Array; tipoMime: string };
  archivo?: Uint8Array;
}

function encabezado(empresa: Empresa, doc: DocumentoEmpresa, recursos: Recursos): DatosEncabezado {
  return {
    razonSocial: empresa.razonSocial,
    nit: empresa.nit,
    titulo: doc.nombre,
    codigo: doc.codigo,
    version: doc.version,
    fechaVersion: doc.fechaVersion,
    ...(recursos.logo ? { logo: recursos.logo } : {}),
  };
}

const firmasDocumento = (empresa: Empresa, doc: DocumentoEmpresa) => [
  { rol: "Elaboró", nombre: doc.elaboro },
  { rol: "Revisó", nombre: doc.reviso || empresa.responsableSst },
  { rol: "Aprobó", nombre: doc.aprobo || empresa.representanteLegal },
];

const TEXTO_ESTADO = { CUMPLE: "Cumple", NO_CUMPLE: "No cumple", NO_APLICA: "No aplica" } as const;

/** FT-SST-001: evaluación de estándares mínimos con la tabla de valores. */
export async function pdfAutoevaluacion(
  empresa: Empresa,
  doc: DocumentoEmpresa,
  ev: Autoevaluacion,
  resultado: ResultadoAutoevaluacion,
  recursos: Recursos,
): Promise<Uint8Array> {
  const l = await Lienzo.crear(encabezado(empresa, doc, recursos));
  const color = resultado.valoracion === "ACEPTABLE" ? COLOR.verde : resultado.valoracion === "CRITICO" ? COLOR.rojo : COLOR.ambar;

  l.texto(`Año evaluado: ${ev.anio}.  Trabajadores: ${empresa.numeroTrabajadores}.  Clase de riesgo: ${empresa.claseRiesgo}.  ARL: ${empresa.arl || "sin registrar"}.`, { tam: 9 });
  l.texto(
    resultado.grupo === "60"
      ? "Se evalúa con la tabla de valores de 60 ítems (Resolución 0312 de 2019, art. 27)."
      : `Se evalúa con los ${resultado.grupo} estándares mínimos que aplican a la empresa (Resolución 0312 de 2019, ${resultado.grupo === "7" ? "art. 3" : "art. 9"}).`,
    { tam: 9, color: COLOR.gris, espacio: 10 },
  );
  l.texto(`Resultado: ${resultado.porcentaje.toFixed(2).replace(".", ",")}%  -  ${TEXTO_VALORACION[resultado.valoracion]}`, { tam: 14, negrita: true, color, espacio: 10 });

  if (resultado.grupo === "60") {
    const filas: string[][] = [];
    const subtotales = new Set<number>();
    for (const est of ESTANDARES) {
      for (const sub of SUBESTANDARES.filter((s) => s.estandar === est.numero)) {
        for (const item of ITEMS.filter((i) => i.subestandar === sub.codigo)) {
          const r = ev.respuestas[item.codigo];
          const vale = r && (r.estado === "CUMPLE" || (r.estado === "NO_APLICA" && r.justificacion?.trim())) ? item.peso : 0;
          filas.push([
            item.codigo,
            item.nombre + (r?.estado === "NO_APLICA" ? `\nJustificación: ${r.justificacion?.trim() || "sin justificar (vale 0)"}` : ""),
            item.peso.toString().replace(".", ","),
            r ? TEXTO_ESTADO[r.estado] : "Sin evaluar",
            vale.toString().replace(".", ","),
          ]);
        }
      }
      const parcial = resultado.porEstandar.find((p) => p.codigo === String(est.numero));
      subtotales.add(filas.length);
      filas.push([
        "", `${est.ciclo.charAt(0)}${est.ciclo.slice(1).toLowerCase()}: ${est.numero}. ${est.nombre}`,
        `${est.peso}`, "Subtotal", (parcial?.obtenido ?? 0).toString().replace(".", ","),
      ]);
    }
    l.tabla(["Ítem", "Estándar", "Valor", "Calificación", "Puntaje"], [7, 55, 8, 13, 9], filas, (i) =>
      subtotales.has(i) ? { negrita: true, fondo: COLOR.fondo } : {},
    );
  } else {
    const reqs = requisitosDelGrupo(resultado.grupo);
    l.tabla(
      ["N.º", "Estándar mínimo", "Calificación", "Observación"],
      [6, 52, 14, 28],
      reqs.map((req) => {
        const r = ev.respuestas[String(req.numero)];
        return [String(req.numero), req.nombre, r ? TEXTO_ESTADO[r.estado] : "Sin evaluar", r?.justificacion ?? ""];
      }),
    );
  }

  l.texto(
    "Cuando se cumple con el ítem del estándar la calificación será la máxima del respectivo ítem, de lo contrario será igual a cero (0). " +
      "Si el estándar no aplica, se deberá justificar la situación y se calificará con el porcentaje máximo del ítem; en caso de no justificarse, la calificación será igual a cero (0).",
    { tam: 8, color: COLOR.gris, espacio: 10 },
  );
  l.titulo(`Acciones requeridas: ${TEXTO_VALORACION[resultado.valoracion]}`);
  for (const a of ACCIONES_VALORACION[resultado.valoracion]) l.texto(`- ${a}`, { tam: 9, sangria: 8 });

  l.firmas([
    { rol: "Empleador o contratante", nombre: empresa.representanteLegal },
    { rol: "Responsable del SG-SST", nombre: empresa.responsableSst },
  ]);
  return l.terminar();
}

/** Plantilla del registro de asistencia (FT-SST-015) para imprimir y diligenciar. */
function plantillaAsistencia(l: Lienzo) {
  l.tabla(["Tema", "Fecha", "Hora"], [60, 20, 20], [["", "", ""]]);
  l.tabla(["Responsable / capacitador", "Duración", "Lugar"], [50, 20, 30], [["", "", ""]]);
  l.tabla(
    ["N.º", "Nombres y apellidos", "Documento", "Cargo", "Firma"],
    [6, 34, 18, 20, 22],
    Array.from({ length: 12 }, (_, i) => [String(i + 1), "\n", "", "", ""]),
  );
}

function plantillaGenerica(l: Lienzo, doc: DocumentoEmpresa) {
  l.tabla(["Fecha", "Área / proceso", "Responsable"], [25, 40, 35], [["\n", "", ""]]);
  l.titulo("Descripción");
  l.tabla([""], [1], Array.from({ length: 6 }, () => ["\n"]));
  l.titulo("Observaciones y compromisos");
  l.tabla(["Actividad", "Responsable", "Fecha límite"], [55, 25, 20], Array.from({ length: 5 }, () => ["\n", "", ""]));
  l.texto(`Ítems de la Resolución 0312 que evidencia este formato: ${doc.items.join(", ")}.`, { tam: 8, color: COLOR.gris });
}

/**
 * Cualquier documento del listado maestro:
 * - con archivo PDF o imagen cargado: hoja de control + el archivo, con encabezado y pie de control;
 * - con archivo de Office: hoja de control que indica el archivo original para descargar aparte;
 * - sin archivo: plantilla en blanco lista para diligenciar.
 */
export async function pdfDocumento(empresa: Empresa, doc: DocumentoEmpresa, recursos: Recursos): Promise<Uint8Array> {
  const l = await Lienzo.crear(encabezado(empresa, doc, recursos));
  const archivo = doc.archivo;

  if (!archivo || !recursos.archivo) {
    if (doc.codigo === "FT-SST-015") {
      plantillaAsistencia(l);
      l.firmas([{ rol: "Firma del responsable o capacitador", nombre: "" }]);
    } else {
      plantillaGenerica(l, doc);
      l.firmas(firmasDocumento(empresa, doc));
    }
    return l.terminar();
  }

  l.titulo("Hoja de control del documento");
  l.tabla(
    ["Dato", "Valor"],
    [30, 70],
    [
      ["Código", doc.codigo],
      ["Nombre", doc.nombre],
      ["Versión vigente", `${doc.version} del ${fechaLegible(doc.fechaVersion)}`],
      ["Estado", doc.estado.replace("_", " ").toLowerCase()],
      ["Archivo", `${archivo.nombre} (${(archivo.tamanoBytes / 1024).toFixed(0)} KB)`],
      ["Huella SHA-256", archivo.sha256],
      ["Ítems que evidencia", doc.items.join(", ")],
    ],
  );
  if (doc.historial.length) {
    l.titulo("Control de cambios");
    l.tabla(
      ["Versión", "Fecha", "Descripción del cambio"],
      [12, 18, 70],
      [...doc.historial.map((h) => [h.version, fechaLegible(h.fecha), h.cambio]), [doc.version, fechaLegible(doc.fechaVersion), "Versión vigente"]],
    );
  }
  l.firmas(firmasDocumento(empresa, doc));

  if (archivo.tipoMime === "application/pdf") {
    const ok = await l.anexarPdf(recursos.archivo);
    if (!ok) {
      l.texto("El PDF cargado está protegido con contraseña o dañado, y no se pudo incluir. Descargue el archivo original desde la plataforma.", { tam: 9, color: COLOR.rojo });
    }
  } else if (archivo.tipoMime.startsWith("image/")) {
    await l.anexarImagen(recursos.archivo, archivo.tipoMime);
  } else {
    l.texto(
      `El contenido está en el archivo original "${archivo.nombre}". Descárguelo desde la plataforma para consultarlo o editarlo. ` +
        "Para incluirlo dentro de este PDF, cárguelo convertido a PDF.",
      { tam: 9, color: COLOR.gris },
    );
  }
  return l.terminar();
}
