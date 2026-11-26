/**
 * Qué grupo de estándares mínimos aplica a cada empresa, según el número
 * de trabajadores y la clase de riesgo (Resolución 0312 de 2019,
 * capítulos I, II y III).
 *
 * - Hasta 10 trabajadores, riesgo I, II o III: 7 estándares (art. 3).
 * - De 11 a 50 trabajadores, riesgo I, II o III: 21 estándares (art. 9).
 * - Más de 50 trabajadores, o riesgo IV o V sin importar el tamaño:
 *   tabla completa de 60 ítems (art. 16).
 *
 * Cualquier empresa puede adoptar voluntariamente la tabla completa.
 */

export type ClaseRiesgo = 1 | 2 | 3 | 4 | 5;
export type GrupoEstandares = "7" | "21" | "60";

export interface PerfilEmpresa {
  numeroTrabajadores: number;
  claseRiesgo: ClaseRiesgo;
  /** La empresa decide evaluarse con los 60 ítems aunque no le sea obligatorio. */
  usarTablaCompleta?: boolean;
}

export interface Requisito {
  /** Número del requisito dentro de su grupo (1..7 o 1..21). */
  numero: number;
  nombre: string;
  /** Ítems de la tabla de 60 relacionados, para reutilizar evidencias. */
  itemsRelacionados: readonly string[];
}

/**
 * Las listas de 7 y 21 estándares se transcribieron de memoria del texto
 * de la Resolución 0312 y aún no se han cotejado con el texto oficial.
 * Mientras esta marca sea false, la interfaz muestra un aviso.
 */
export const LISTAS_REDUCIDAS_VERIFICADAS = false;

export const REQUISITOS_7: readonly Requisito[] = [
  { numero: 1, nombre: "Asignación de persona que diseña el SG-SST", itemsRelacionados: ["1.1.1"] },
  { numero: 2, nombre: "Afiliación al Sistema de Seguridad Social Integral", itemsRelacionados: ["1.1.4"] },
  { numero: 3, nombre: "Capacitación en SST", itemsRelacionados: ["1.2.1", "1.2.2"] },
  { numero: 4, nombre: "Plan anual de trabajo", itemsRelacionados: ["2.4.1"] },
  { numero: 5, nombre: "Evaluaciones médicas ocupacionales", itemsRelacionados: ["3.1.1", "3.1.4"] },
  { numero: 6, nombre: "Identificación de peligros, evaluación y valoración de riesgos", itemsRelacionados: ["4.1.1", "4.1.2"] },
  { numero: 7, nombre: "Medidas de prevención y control frente a peligros/riesgos identificados", itemsRelacionados: ["4.2.1"] },
];

export const REQUISITOS_21: readonly Requisito[] = [
  { numero: 1, nombre: "Asignación de persona que diseña el SG-SST", itemsRelacionados: ["1.1.1"] },
  { numero: 2, nombre: "Asignación de recursos para el SG-SST", itemsRelacionados: ["1.1.3"] },
  { numero: 3, nombre: "Afiliación al Sistema de Seguridad Social Integral", itemsRelacionados: ["1.1.4"] },
  { numero: 4, nombre: "Conformación y funcionamiento del COPASST", itemsRelacionados: ["1.1.6", "1.1.7"] },
  { numero: 5, nombre: "Conformación y funcionamiento del Comité de Convivencia Laboral", itemsRelacionados: ["1.1.8"] },
  { numero: 6, nombre: "Programa de capacitación anual", itemsRelacionados: ["1.2.1"] },
  { numero: 7, nombre: "Política de SST", itemsRelacionados: ["2.1.1"] },
  { numero: 8, nombre: "Plan anual de trabajo", itemsRelacionados: ["2.4.1"] },
  { numero: 9, nombre: "Archivo o retención documental del SG-SST", itemsRelacionados: ["2.5.1"] },
  { numero: 10, nombre: "Descripción sociodemográfica y diagnóstico de condiciones de salud", itemsRelacionados: ["3.1.1"] },
  { numero: 11, nombre: "Actividades de medicina del trabajo y de prevención y promoción de la salud", itemsRelacionados: ["3.1.2"] },
  { numero: 12, nombre: "Evaluaciones médicas ocupacionales", itemsRelacionados: ["3.1.4"] },
  { numero: 13, nombre: "Restricciones y recomendaciones médico laborales", itemsRelacionados: ["3.1.6"] },
  { numero: 14, nombre: "Reporte de los accidentes de trabajo y enfermedad laboral", itemsRelacionados: ["3.2.1"] },
  { numero: 15, nombre: "Investigación de incidentes, accidentes y enfermedades laborales", itemsRelacionados: ["3.2.2"] },
  { numero: 16, nombre: "Identificación de peligros, evaluación y valoración de riesgos", itemsRelacionados: ["4.1.1", "4.1.2"] },
  { numero: 17, nombre: "Medidas de prevención y control frente a peligros/riesgos identificados", itemsRelacionados: ["4.2.1"] },
  { numero: 18, nombre: "Mantenimiento periódico de instalaciones, equipos, máquinas y herramientas", itemsRelacionados: ["4.2.5"] },
  { numero: 19, nombre: "Entrega de elementos de protección personal (EPP) y capacitación en su uso adecuado", itemsRelacionados: ["4.2.6"] },
  { numero: 20, nombre: "Plan de prevención, preparación y respuesta ante emergencias", itemsRelacionados: ["5.1.1"] },
  { numero: 21, nombre: "Brigada de prevención, preparación y respuesta ante emergencias", itemsRelacionados: ["5.1.2"] },
];

/** Grupo que la norma exige, sin tener en cuenta la elección voluntaria. */
export function grupoObligatorio(perfil: Pick<PerfilEmpresa, "numeroTrabajadores" | "claseRiesgo">): GrupoEstandares {
  const { numeroTrabajadores, claseRiesgo } = perfil;
  if (!Number.isInteger(numeroTrabajadores) || numeroTrabajadores < 1) {
    throw new RangeError("El número de trabajadores debe ser un entero mayor o igual a 1");
  }
  if (claseRiesgo >= 4 || numeroTrabajadores > 50) return "60";
  if (numeroTrabajadores <= 10) return "7";
  return "21";
}

/** Grupo con el que se evaluará la empresa. */
export function grupoAplicable(perfil: PerfilEmpresa): GrupoEstandares {
  return perfil.usarTablaCompleta ? "60" : grupoObligatorio(perfil);
}

export function requisitosDelGrupo(grupo: Exclude<GrupoEstandares, "60">): readonly Requisito[] {
  return grupo === "7" ? REQUISITOS_7 : REQUISITOS_21;
}
