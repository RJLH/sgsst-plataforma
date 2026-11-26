/**
 * Calificación de la autoevaluación de estándares mínimos.
 *
 * Reglas (Resolución 0312 de 2019, art. 27 y 28; texto del formato FT-SST-001):
 * - "Cuando se cumple con el ítem del estándar la calificación será la máxima
 *   del respectivo ítem, de lo contrario su calificación será igual a cero (0)."
 * - "Si el estándar No Aplica, se deberá justificar la situación y se calificará
 *   con el porcentaje máximo del ítem indicado para cada estándar. En caso de no
 *   justificarse, la calificación del estándar será igual a cero (0)."
 * - Valoración: menor a 60% crítico; de 60% a 85% moderadamente aceptable;
 *   mayor a 85% aceptable.
 */

import { ESTANDARES, ITEMS, SUBESTANDARES, estandarDeItem, subestandarDeItem } from "./estandares";
import { requisitosDelGrupo, type GrupoEstandares } from "./aplicabilidad";

export type EstadoItem = "CUMPLE" | "NO_CUMPLE" | "NO_APLICA";

export interface RespuestaItem {
  estado: EstadoItem;
  /** Obligatoria cuando el estado es NO_APLICA; si falta, el ítem vale 0. */
  justificacion?: string;
}

/** Respuestas por código: "1.1.1" en la tabla de 60, o "1".."21" en las listas reducidas. */
export type Respuestas = Readonly<Record<string, RespuestaItem | undefined>>;

export type Valoracion = "CRITICO" | "MODERADAMENTE_ACEPTABLE" | "ACEPTABLE";

export interface ResultadoParcial {
  codigo: string;
  nombre: string;
  posible: number;
  obtenido: number;
}

export interface ResultadoAutoevaluacion {
  grupo: GrupoEstandares;
  /** Porcentaje de cumplimiento de 0 a 100, redondeado a 2 decimales. */
  porcentaje: number;
  valoracion: Valoracion;
  /** Ítems sin responder (cuentan como 0). */
  pendientes: string[];
  /** Ítems marcados "no aplica" sin justificación (cuentan como 0). */
  noAplicaSinJustificar: string[];
  /** Solo en la tabla de 60: detalle por estándar. */
  porEstandar: ResultadoParcial[];
  /** Solo en la tabla de 60: detalle por subestándar. */
  porSubestandar: ResultadoParcial[];
}

const redondear = (n: number) => Math.round(n * 100) / 100;

export function valorar(porcentaje: number): Valoracion {
  if (porcentaje < 60) return "CRITICO";
  if (porcentaje <= 85) return "MODERADAMENTE_ACEPTABLE";
  return "ACEPTABLE";
}

export const TEXTO_VALORACION: Record<Valoracion, string> = {
  CRITICO: "Crítico",
  MODERADAMENTE_ACEPTABLE: "Moderadamente aceptable",
  ACEPTABLE: "Aceptable",
};

/** Acciones que la Resolución 0312 (art. 28) exige según la valoración. */
export const ACCIONES_VALORACION: Record<Valoracion, string[]> = {
  CRITICO: [
    "Realizar y tener a disposición del Ministerio del Trabajo un plan de mejoramiento de inmediato.",
    "Enviar a la ARL un reporte de avances en el término máximo de tres (3) meses.",
    "Seguimiento anual y plan de visita a la empresa por parte del Ministerio del Trabajo.",
  ],
  MODERADAMENTE_ACEPTABLE: [
    "Realizar y tener a disposición del Ministerio del Trabajo un plan de mejoramiento.",
    "Enviar a la ARL un reporte de avances en el término máximo de seis (6) meses.",
    "Plan de visita por parte del Ministerio del Trabajo.",
  ],
  ACEPTABLE: [
    "Mantener la calificación y evidencias a disposición del Ministerio del Trabajo.",
    "Incluir en el plan anual de trabajo las mejoras detectadas.",
  ],
};

function puntajeItem(r: RespuestaItem | undefined, peso: number): number {
  if (!r) return 0;
  if (r.estado === "CUMPLE") return peso;
  if (r.estado === "NO_APLICA") return r.justificacion?.trim() ? peso : 0;
  return 0;
}

export function calificar(grupo: GrupoEstandares, respuestas: Respuestas): ResultadoAutoevaluacion {
  const pendientes: string[] = [];
  const noAplicaSinJustificar: string[] = [];

  const revisar = (codigo: string) => {
    const r = respuestas[codigo];
    if (!r) pendientes.push(codigo);
    else if (r.estado === "NO_APLICA" && !r.justificacion?.trim()) noAplicaSinJustificar.push(codigo);
    return r;
  };

  if (grupo === "60") {
    const porSub = new Map<string, number>();
    const porEst = new Map<number, number>();
    let total = 0;
    for (const item of ITEMS) {
      const p = puntajeItem(revisar(item.codigo), item.peso);
      total += p;
      const sub = subestandarDeItem(item);
      porSub.set(sub.codigo, (porSub.get(sub.codigo) ?? 0) + p);
      const est = estandarDeItem(item);
      porEst.set(est.numero, (porEst.get(est.numero) ?? 0) + p);
    }
    const porcentaje = redondear(total);
    return {
      grupo,
      porcentaje,
      valoracion: valorar(porcentaje),
      pendientes,
      noAplicaSinJustificar,
      porEstandar: ESTANDARES.map((e) => ({
        codigo: String(e.numero),
        nombre: e.nombre,
        posible: e.peso,
        obtenido: redondear(porEst.get(e.numero) ?? 0),
      })),
      porSubestandar: SUBESTANDARES.map((s) => ({
        codigo: s.codigo,
        nombre: s.nombre,
        posible: s.peso,
        obtenido: redondear(porSub.get(s.codigo) ?? 0),
      })),
    };
  }

  // Listas reducidas (7 o 21): cada requisito pesa lo mismo.
  const requisitos = requisitosDelGrupo(grupo);
  const peso = 100 / requisitos.length;
  let total = 0;
  for (const req of requisitos) {
    total += puntajeItem(revisar(String(req.numero)), peso);
  }
  const porcentaje = redondear(total);
  return {
    grupo,
    porcentaje,
    valoracion: valorar(porcentaje),
    pendientes,
    noAplicaSinJustificar,
    porEstandar: [],
    porSubestandar: [],
  };
}
