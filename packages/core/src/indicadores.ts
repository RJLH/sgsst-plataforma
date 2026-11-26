/**
 * Indicadores y KPI del SG-SST.
 *
 * 1. Indicadores mínimos obligatorios (Resolución 0312 de 2019, art. 30).
 * 2. Indicadores de estructura, proceso y resultado (Decreto 1072 de 2015,
 *    arts. 2.2.4.6.19 a 2.2.4.6.22), configurables por empresa.
 *
 * Todas las fórmulas son funciones puras: la plataforma les pasa los
 * conteos del periodo y guarda el resultado con su fecha de cálculo.
 */

export type TipoIndicador = "ESTRUCTURA" | "PROCESO" | "RESULTADO";
export type Periodicidad = "MENSUAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL";
export type SentidoMeta = "MAYOR_O_IGUAL" | "MENOR_O_IGUAL";

const dividir = (numerador: number, denominador: number, factor: number): number => {
  if (!Number.isFinite(numerador) || !Number.isFinite(denominador) || numerador < 0 || denominador < 0) {
    throw new RangeError("Los valores del indicador deben ser números no negativos");
  }
  if (denominador === 0) return 0;
  return Math.round((numerador / denominador) * factor * 100) / 100;
};

// ---------------------------------------------------------------------------
// 1. Indicadores mínimos de la Resolución 0312 (art. 30)
// ---------------------------------------------------------------------------

/** (N.º de AT que se presentaron en el mes / N.º de trabajadores en el mes) × 100 */
export const frecuenciaAccidentalidad = (accidentesMes: number, trabajadoresMes: number) =>
  dividir(accidentesMes, trabajadoresMes, 100);

/** ((Días de incapacidad por AT en el mes + días cargados en el mes) / N.º de trabajadores en el mes) × 100 */
export const severidadAccidentalidad = (diasIncapacidadMes: number, diasCargadosMes: number, trabajadoresMes: number) =>
  dividir(diasIncapacidadMes + diasCargadosMes, trabajadoresMes, 100);

/** (N.º de AT mortales en el año / Total de AT en el año) × 100 */
export const proporcionAccidentesMortales = (mortalesAnio: number, accidentesAnio: number) =>
  dividir(mortalesAnio, accidentesAnio, 100);

/** (N.º de casos nuevos y antiguos de EL en el periodo / Promedio de trabajadores en el periodo) × 100.000 */
export const prevalenciaEnfermedadLaboral = (casosNuevosYAntiguos: number, promedioTrabajadores: number) =>
  dividir(casosNuevosYAntiguos, promedioTrabajadores, 100_000);

/** (N.º de casos nuevos de EL en el periodo / Promedio de trabajadores en el periodo) × 100.000 */
export const incidenciaEnfermedadLaboral = (casosNuevos: number, promedioTrabajadores: number) =>
  dividir(casosNuevos, promedioTrabajadores, 100_000);

/** (Días de ausencia por incapacidad laboral o común en el mes / Días de trabajo programados en el mes) × 100 */
export const ausentismoCausaMedica = (diasAusenciaMes: number, diasProgramadosMes: number) =>
  dividir(diasAusenciaMes, diasProgramadosMes, 100);

/** Datos que la plataforma reúne de los registros de un mes. */
export interface DatosMes {
  trabajadores: number;
  accidentes: number;
  accidentesMortales: number;
  diasIncapacidadAT: number;
  diasCargados: number;
  diasAusenciaCausaMedica: number;
  diasProgramados: number;
  casosNuevosEL: number;
  casosTotalesEL: number;
}

export interface ResultadoIndicadoresMes {
  frecuencia: number;
  severidad: number;
  mortalidad: number;
  prevalencia: number;
  incidencia: number;
  ausentismo: number;
}

/** Calcula los seis indicadores mínimos para un mes. */
export function indicadoresMinimosMes(d: DatosMes): ResultadoIndicadoresMes {
  return {
    frecuencia: frecuenciaAccidentalidad(d.accidentes, d.trabajadores),
    severidad: severidadAccidentalidad(d.diasIncapacidadAT, d.diasCargados, d.trabajadores),
    mortalidad: proporcionAccidentesMortales(d.accidentesMortales, d.accidentes),
    prevalencia: prevalenciaEnfermedadLaboral(d.casosTotalesEL, d.trabajadores),
    incidencia: incidenciaEnfermedadLaboral(d.casosNuevosEL, d.trabajadores),
    ausentismo: ausentismoCausaMedica(d.diasAusenciaCausaMedica, d.diasProgramados),
  };
}

/** Acumulado anual a partir de los datos mensuales (prevalencia e incidencia sobre el promedio de trabajadores). */
export function indicadoresMinimosAnio(meses: readonly DatosMes[]): ResultadoIndicadoresMes {
  if (meses.length === 0) throw new RangeError("Se necesita al menos un mes de datos");
  const suma = (f: (d: DatosMes) => number) => meses.reduce((acc, d) => acc + f(d), 0);
  const promedioTrab = suma((d) => d.trabajadores) / meses.length;
  const accidentes = suma((d) => d.accidentes);
  return {
    frecuencia: frecuenciaAccidentalidad(accidentes, promedioTrab),
    severidad: severidadAccidentalidad(suma((d) => d.diasIncapacidadAT), suma((d) => d.diasCargados), promedioTrab),
    mortalidad: proporcionAccidentesMortales(suma((d) => d.accidentesMortales), accidentes),
    // Casos totales: el máximo registrado en el año, porque los casos antiguos se repiten cada mes.
    prevalencia: prevalenciaEnfermedadLaboral(Math.max(...meses.map((d) => d.casosTotalesEL)), promedioTrab),
    incidencia: incidenciaEnfermedadLaboral(suma((d) => d.casosNuevosEL), promedioTrab),
    ausentismo: ausentismoCausaMedica(suma((d) => d.diasAusenciaCausaMedica), suma((d) => d.diasProgramados)),
  };
}

// ---------------------------------------------------------------------------
// 2. KPI configurables (estructura, proceso, resultado)
// ---------------------------------------------------------------------------

export interface DefinicionKPI {
  codigo: string;
  nombre: string;
  tipo: TipoIndicador;
  /** Directriz de la política u objetivo al que responde. */
  objetivo: string;
  numerador: string;
  denominador: string;
  factor: number;
  unidad: string;
  meta: number;
  sentido: SentidoMeta;
  periodicidad: Periodicidad;
  /** Ítem de los estándares mínimos que evidencia. */
  itemEstandar?: string;
  fuente: string;
}

export interface EvaluacionKPI {
  valor: number;
  cumpleMeta: boolean;
}

export function evaluarKPI(def: DefinicionKPI, numerador: number, denominador: number): EvaluacionKPI {
  const valor = dividir(numerador, denominador, def.factor);
  const cumpleMeta = def.sentido === "MAYOR_O_IGUAL" ? valor >= def.meta : valor <= def.meta;
  return { valor, cumpleMeta };
}

/**
 * KPI base. Parten de las tres directrices de la política del hotel
 * (prevención de ATEL, disminución del ausentismo, ambientes de trabajo
 * seguros) y completan la tabla 14 del SG-SST-001, que estaba vacía.
 * Cada empresa puede ajustar metas, agregar o desactivar indicadores.
 */
export const KPI_BASE: readonly DefinicionKPI[] = [
  // Estructura
  {
    codigo: "E-01", nombre: "Recursos asignados al SG-SST", tipo: "ESTRUCTURA",
    objetivo: "Cumplimiento normativo", numerador: "Recursos ejecutados en el periodo",
    denominador: "Recursos asignados en el presupuesto", factor: 100, unidad: "%",
    meta: 90, sentido: "MAYOR_O_IGUAL", periodicidad: "ANUAL", itemEstandar: "1.1.3",
    fuente: "Decreto 1072 de 2015, art. 2.2.4.6.20",
  },
  {
    codigo: "E-02", nombre: "Documentos del SG-SST vigentes y aprobados", tipo: "ESTRUCTURA",
    objetivo: "Cumplimiento normativo", numerador: "Documentos vigentes y aprobados",
    denominador: "Documentos requeridos en el listado maestro", factor: 100, unidad: "%",
    meta: 100, sentido: "MAYOR_O_IGUAL", periodicidad: "SEMESTRAL", itemEstandar: "2.5.1",
    fuente: "Decreto 1072 de 2015, art. 2.2.4.6.20",
  },
  {
    codigo: "E-03", nombre: "Requisitos legales con cumplimiento", tipo: "ESTRUCTURA",
    objetivo: "Cumplimiento normativo", numerador: "Requisitos de la matriz legal cumplidos",
    denominador: "Requisitos aplicables en la matriz legal", factor: 100, unidad: "%",
    meta: 95, sentido: "MAYOR_O_IGUAL", periodicidad: "SEMESTRAL", itemEstandar: "2.7.1",
    fuente: "Decreto 1072 de 2015, art. 2.2.4.6.20",
  },
  // Proceso
  {
    codigo: "P-01", nombre: "Cumplimiento del plan anual de trabajo", tipo: "PROCESO",
    objetivo: "Prevención de ATEL", numerador: "Actividades ejecutadas",
    denominador: "Actividades programadas a la fecha", factor: 100, unidad: "%",
    meta: 90, sentido: "MAYOR_O_IGUAL", periodicidad: "TRIMESTRAL", itemEstandar: "2.4.1",
    fuente: "Decreto 1072 de 2015, art. 2.2.4.6.21",
  },
  {
    codigo: "P-02", nombre: "Cumplimiento del cronograma de capacitación", tipo: "PROCESO",
    objetivo: "Prevención de ATEL", numerador: "Capacitaciones ejecutadas",
    denominador: "Capacitaciones programadas", factor: 100, unidad: "%",
    meta: 90, sentido: "MAYOR_O_IGUAL", periodicidad: "TRIMESTRAL", itemEstandar: "1.2.1",
    fuente: "Decreto 1072 de 2015, art. 2.2.4.6.21",
  },
  {
    codigo: "P-03", nombre: "Cobertura de capacitación", tipo: "PROCESO",
    objetivo: "Prevención de ATEL", numerador: "Trabajadores capacitados",
    denominador: "Trabajadores convocados", factor: 100, unidad: "%",
    meta: 90, sentido: "MAYOR_O_IGUAL", periodicidad: "TRIMESTRAL", itemEstandar: "1.2.2",
    fuente: "Decreto 1072 de 2015, art. 2.2.4.6.21",
  },
  {
    codigo: "P-04", nombre: "Cumplimiento de inspecciones", tipo: "PROCESO",
    objetivo: "Ambientes laborales seguros", numerador: "Inspecciones realizadas",
    denominador: "Inspecciones programadas", factor: 100, unidad: "%",
    meta: 95, sentido: "MAYOR_O_IGUAL", periodicidad: "MENSUAL", itemEstandar: "4.2.4",
    fuente: "Decreto 1072 de 2015, art. 2.2.4.6.21",
  },
  {
    codigo: "P-05", nombre: "Evaluaciones médicas ocupacionales al día", tipo: "PROCESO",
    objetivo: "Disminución del ausentismo", numerador: "Trabajadores con evaluación médica vigente",
    denominador: "Total de trabajadores", factor: 100, unidad: "%",
    meta: 100, sentido: "MAYOR_O_IGUAL", periodicidad: "SEMESTRAL", itemEstandar: "3.1.4",
    fuente: "Decreto 1072 de 2015, art. 2.2.4.6.21",
  },
  {
    codigo: "P-06", nombre: "Intervención de peligros prioritarios", tipo: "PROCESO",
    objetivo: "Ambientes laborales seguros", numerador: "Controles implementados de la matriz IPEVR",
    denominador: "Controles propuestos para riesgos no aceptables", factor: 100, unidad: "%",
    meta: 80, sentido: "MAYOR_O_IGUAL", periodicidad: "TRIMESTRAL", itemEstandar: "4.2.1",
    fuente: "Decreto 1072 de 2015, art. 2.2.4.6.21",
  },
  {
    codigo: "P-07", nombre: "Investigación oportuna de accidentes", tipo: "PROCESO",
    objetivo: "Prevención de ATEL", numerador: "Accidentes investigados dentro de los 15 días",
    denominador: "Accidentes ocurridos", factor: 100, unidad: "%",
    meta: 100, sentido: "MAYOR_O_IGUAL", periodicidad: "MENSUAL", itemEstandar: "3.2.2",
    fuente: "Resolución 1401 de 2007, art. 4",
  },
  // Resultado
  {
    codigo: "R-01", nombre: "Eficacia de acciones correctivas y preventivas", tipo: "RESULTADO",
    objetivo: "Mejora continua", numerador: "Acciones cerradas y verificadas como eficaces",
    denominador: "Acciones con fecha de cierre vencida", factor: 100, unidad: "%",
    meta: 90, sentido: "MAYOR_O_IGUAL", periodicidad: "TRIMESTRAL", itemEstandar: "7.1.2",
    fuente: "Decreto 1072 de 2015, art. 2.2.4.6.22",
  },
  {
    codigo: "R-02", nombre: "Cumplimiento de objetivos del SG-SST", tipo: "RESULTADO",
    objetivo: "Mejora continua", numerador: "Objetivos con meta cumplida",
    denominador: "Objetivos definidos", factor: 100, unidad: "%",
    meta: 90, sentido: "MAYOR_O_IGUAL", periodicidad: "ANUAL", itemEstandar: "2.2.1",
    fuente: "Decreto 1072 de 2015, art. 2.2.4.6.22",
  },
];
