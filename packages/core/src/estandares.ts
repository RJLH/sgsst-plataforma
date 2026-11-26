/**
 * Catálogo de estándares mínimos del SG-SST.
 *
 * Fuente: Resolución 0312 de 2019 (Ministerio del Trabajo), artículo 27,
 * "Tabla de valores y calificación". Códigos, nombres y pesos verificados
 * contra el formato FT-SST-001 (Evaluación inicial del SG-SST) usado en
 * la autoevaluación 2022 de Hotel y E.D.S. La Troncal.
 */

export type CicloPHVA = "PLANEAR" | "HACER" | "VERIFICAR" | "ACTUAR";

export interface Estandar {
  /** Número del estándar (1 a 7). */
  numero: number;
  nombre: string;
  ciclo: CicloPHVA;
  /** Peso del estándar en porcentaje. */
  peso: number;
}

export interface Subestandar {
  /** Código, p. ej. "1.1" o "2.4". */
  codigo: string;
  estandar: number;
  nombre: string;
  peso: number;
}

export interface ItemEstandar {
  /** Código del ítem, p. ej. "1.1.1". */
  codigo: string;
  /** Código del subestándar al que pertenece, p. ej. "1.1". */
  subestandar: string;
  nombre: string;
  /** Valor del ítem en la tabla de valores (suma total = 100). */
  peso: number;
}

export const ESTANDARES: readonly Estandar[] = [
  { numero: 1, nombre: "Recursos", ciclo: "PLANEAR", peso: 10 },
  { numero: 2, nombre: "Gestión integral del SG-SST", ciclo: "PLANEAR", peso: 15 },
  { numero: 3, nombre: "Gestión de la salud", ciclo: "HACER", peso: 20 },
  { numero: 4, nombre: "Gestión de peligros y riesgos", ciclo: "HACER", peso: 30 },
  { numero: 5, nombre: "Gestión de amenazas", ciclo: "HACER", peso: 10 },
  { numero: 6, nombre: "Verificación del SG-SST", ciclo: "VERIFICAR", peso: 5 },
  { numero: 7, nombre: "Mejoramiento", ciclo: "ACTUAR", peso: 10 },
];

export const SUBESTANDARES: readonly Subestandar[] = [
  { codigo: "1.1", estandar: 1, nombre: "Recursos financieros, técnicos, humanos y de otra índole", peso: 4 },
  { codigo: "1.2", estandar: 1, nombre: "Capacitación en el SG-SST", peso: 6 },
  { codigo: "2.1", estandar: 2, nombre: "Política de seguridad y salud en el trabajo", peso: 1 },
  { codigo: "2.2", estandar: 2, nombre: "Objetivos del SG-SST", peso: 1 },
  { codigo: "2.3", estandar: 2, nombre: "Evaluación inicial del SG-SST", peso: 1 },
  { codigo: "2.4", estandar: 2, nombre: "Plan anual de trabajo", peso: 2 },
  { codigo: "2.5", estandar: 2, nombre: "Conservación de la documentación", peso: 2 },
  { codigo: "2.6", estandar: 2, nombre: "Rendición de cuentas", peso: 1 },
  { codigo: "2.7", estandar: 2, nombre: "Normatividad nacional vigente y aplicable en SST", peso: 2 },
  { codigo: "2.8", estandar: 2, nombre: "Comunicación", peso: 1 },
  { codigo: "2.9", estandar: 2, nombre: "Adquisiciones", peso: 1 },
  { codigo: "2.10", estandar: 2, nombre: "Contratación", peso: 2 },
  { codigo: "2.11", estandar: 2, nombre: "Gestión del cambio", peso: 1 },
  { codigo: "3.1", estandar: 3, nombre: "Condiciones de salud en el trabajo", peso: 9 },
  { codigo: "3.2", estandar: 3, nombre: "Registro, reporte e investigación de enfermedades laborales, incidentes y accidentes", peso: 5 },
  { codigo: "3.3", estandar: 3, nombre: "Mecanismos de vigilancia de las condiciones de salud de los trabajadores", peso: 6 },
  { codigo: "4.1", estandar: 4, nombre: "Identificación de peligros, evaluación y valoración de riesgos", peso: 15 },
  { codigo: "4.2", estandar: 4, nombre: "Medidas de prevención y control para intervenir los peligros/riesgos", peso: 15 },
  { codigo: "5.1", estandar: 5, nombre: "Plan de prevención, preparación y respuesta ante emergencias", peso: 10 },
  { codigo: "6.1", estandar: 6, nombre: "Gestión y resultados del SG-SST", peso: 5 },
  { codigo: "7.1", estandar: 7, nombre: "Acciones preventivas y correctivas con base en los resultados del SG-SST", peso: 10 },
];

export const ITEMS: readonly ItemEstandar[] = [
  // 1.1 Recursos (4%)
  { codigo: "1.1.1", subestandar: "1.1", nombre: "Responsable del SG-SST", peso: 0.5 },
  { codigo: "1.1.2", subestandar: "1.1", nombre: "Responsabilidades en el SG-SST", peso: 0.5 },
  { codigo: "1.1.3", subestandar: "1.1", nombre: "Asignación de recursos para el SG-SST", peso: 0.5 },
  { codigo: "1.1.4", subestandar: "1.1", nombre: "Afiliación al Sistema General de Riesgos Laborales", peso: 0.5 },
  { codigo: "1.1.5", subestandar: "1.1", nombre: "Pago de pensión trabajadores alto riesgo", peso: 0.5 },
  { codigo: "1.1.6", subestandar: "1.1", nombre: "Conformación COPASST / Vigía", peso: 0.5 },
  { codigo: "1.1.7", subestandar: "1.1", nombre: "Capacitación COPASST / Vigía", peso: 0.5 },
  { codigo: "1.1.8", subestandar: "1.1", nombre: "Conformación Comité de Convivencia", peso: 0.5 },
  // 1.2 Capacitación (6%)
  { codigo: "1.2.1", subestandar: "1.2", nombre: "Programa de capacitación en promoción y prevención (PyP)", peso: 2 },
  { codigo: "1.2.2", subestandar: "1.2", nombre: "Capacitación, inducción y reinducción en SG-SST y actividades de PyP", peso: 2 },
  { codigo: "1.2.3", subestandar: "1.2", nombre: "Responsables del SG-SST con curso virtual de 50 horas", peso: 2 },
  // 2. Gestión integral (15%)
  { codigo: "2.1.1", subestandar: "2.1", nombre: "Política del SG-SST firmada, fechada y comunicada al COPASST/Vigía", peso: 1 },
  { codigo: "2.2.1", subestandar: "2.2", nombre: "Objetivos definidos, claros, medibles, cuantificables, con metas, documentados y revisados", peso: 1 },
  { codigo: "2.3.1", subestandar: "2.3", nombre: "Evaluación e identificación de prioridades", peso: 1 },
  { codigo: "2.4.1", subestandar: "2.4", nombre: "Plan que identifica objetivos, metas, responsabilidad, recursos, con cronograma y firmado", peso: 2 },
  { codigo: "2.5.1", subestandar: "2.5", nombre: "Archivo o retención documental del SG-SST", peso: 2 },
  { codigo: "2.6.1", subestandar: "2.6", nombre: "Rendición sobre el desempeño", peso: 1 },
  { codigo: "2.7.1", subestandar: "2.7", nombre: "Matriz legal", peso: 2 },
  { codigo: "2.8.1", subestandar: "2.8", nombre: "Mecanismos de comunicación, autorreporte en SG-SST", peso: 1 },
  { codigo: "2.9.1", subestandar: "2.9", nombre: "Identificación y evaluación para adquisición de productos y servicios en SG-SST", peso: 1 },
  { codigo: "2.10.1", subestandar: "2.10", nombre: "Evaluación y selección de proveedores y contratistas", peso: 2 },
  { codigo: "2.11.1", subestandar: "2.11", nombre: "Evaluación del impacto de cambios internos y externos en el SG-SST", peso: 1 },
  // 3.1 Condiciones de salud (9%)
  { codigo: "3.1.1", subestandar: "3.1", nombre: "Evaluación médica ocupacional", peso: 1 },
  { codigo: "3.1.2", subestandar: "3.1", nombre: "Actividades de promoción y prevención en salud", peso: 1 },
  { codigo: "3.1.3", subestandar: "3.1", nombre: "Información al médico de los perfiles de cargo", peso: 1 },
  { codigo: "3.1.4", subestandar: "3.1", nombre: "Realización de los exámenes médicos ocupacionales: preingreso, periódicos", peso: 1 },
  { codigo: "3.1.5", subestandar: "3.1", nombre: "Custodia de historias clínicas", peso: 1 },
  { codigo: "3.1.6", subestandar: "3.1", nombre: "Restricciones y recomendaciones médico laborales", peso: 1 },
  { codigo: "3.1.7", subestandar: "3.1", nombre: "Estilos de vida y entornos saludables (tabaquismo, alcoholismo, farmacodependencia y otros)", peso: 1 },
  { codigo: "3.1.8", subestandar: "3.1", nombre: "Agua potable, servicios sanitarios y disposición de basuras", peso: 1 },
  { codigo: "3.1.9", subestandar: "3.1", nombre: "Eliminación adecuada de residuos sólidos, líquidos o gaseosos", peso: 1 },
  // 3.2 Registro, reporte e investigación (5%)
  { codigo: "3.2.1", subestandar: "3.2", nombre: "Reporte de accidentes de trabajo y enfermedad laboral a la ARL, EPS y Dirección Territorial del Ministerio del Trabajo", peso: 2 },
  { codigo: "3.2.2", subestandar: "3.2", nombre: "Investigación de accidentes, incidentes y enfermedad laboral", peso: 2 },
  { codigo: "3.2.3", subestandar: "3.2", nombre: "Registro y análisis estadístico de incidentes, accidentes de trabajo y enfermedad laboral", peso: 1 },
  // 3.3 Vigilancia (6%)
  { codigo: "3.3.1", subestandar: "3.3", nombre: "Medición de la severidad de los accidentes de trabajo y enfermedad laboral", peso: 1 },
  { codigo: "3.3.2", subestandar: "3.3", nombre: "Medición de la frecuencia de los incidentes, accidentes de trabajo y enfermedad laboral", peso: 1 },
  { codigo: "3.3.3", subestandar: "3.3", nombre: "Medición de la mortalidad de accidentes de trabajo y enfermedad laboral", peso: 1 },
  { codigo: "3.3.4", subestandar: "3.3", nombre: "Medición de la prevalencia de incidentes, accidentes de trabajo y enfermedad laboral", peso: 1 },
  { codigo: "3.3.5", subestandar: "3.3", nombre: "Medición de la incidencia de incidentes, accidentes de trabajo y enfermedad laboral", peso: 1 },
  { codigo: "3.3.6", subestandar: "3.3", nombre: "Medición del ausentismo por incidentes, accidentes de trabajo y enfermedad laboral", peso: 1 },
  // 4.1 IPEVR (15%)
  { codigo: "4.1.1", subestandar: "4.1", nombre: "Metodología para la identificación, evaluación y valoración de peligros", peso: 4 },
  { codigo: "4.1.2", subestandar: "4.1", nombre: "Identificación de peligros con participación de todos los niveles de la empresa", peso: 4 },
  { codigo: "4.1.3", subestandar: "4.1", nombre: "Identificación y priorización de la naturaleza de los peligros (metodología adicional, cancerígenos y otros)", peso: 3 },
  { codigo: "4.1.4", subestandar: "4.1", nombre: "Realización de mediciones ambientales, químicos, físicos y biológicos", peso: 4 },
  // 4.2 Medidas de prevención y control (15%)
  { codigo: "4.2.1", subestandar: "4.2", nombre: "Se implementan las medidas de prevención y control de peligros", peso: 2.5 },
  { codigo: "4.2.2", subestandar: "4.2", nombre: "Se verifica aplicación de las medidas de prevención y control", peso: 2.5 },
  { codigo: "4.2.3", subestandar: "4.2", nombre: "Hay procedimientos, instructivos, fichas, protocolos", peso: 2.5 },
  { codigo: "4.2.4", subestandar: "4.2", nombre: "Inspección con el COPASST o Vigía", peso: 2.5 },
  { codigo: "4.2.5", subestandar: "4.2", nombre: "Mantenimiento periódico de instalaciones, equipos, máquinas, herramientas", peso: 2.5 },
  { codigo: "4.2.6", subestandar: "4.2", nombre: "Entrega de elementos de protección personal (EPP), se verifica con contratistas y subcontratistas", peso: 2.5 },
  // 5.1 Emergencias (10%)
  { codigo: "5.1.1", subestandar: "5.1", nombre: "Se cuenta con el plan de prevención y preparación ante emergencias", peso: 5 },
  { codigo: "5.1.2", subestandar: "5.1", nombre: "Brigada de prevención conformada, capacitada y dotada", peso: 5 },
  // 6.1 Verificación (5%)
  { codigo: "6.1.1", subestandar: "6.1", nombre: "Indicadores de estructura, proceso y resultado", peso: 1.25 },
  { codigo: "6.1.2", subestandar: "6.1", nombre: "La empresa adelanta auditoría por lo menos una vez al año", peso: 1.25 },
  { codigo: "6.1.3", subestandar: "6.1", nombre: "Revisión anual por la alta dirección, resultados y alcance de la auditoría", peso: 1.25 },
  { codigo: "6.1.4", subestandar: "6.1", nombre: "Planificar auditoría con el COPASST", peso: 1.25 },
  // 7.1 Mejoramiento (10%)
  { codigo: "7.1.1", subestandar: "7.1", nombre: "Definir acciones de promoción y prevención con base en resultados del SG-SST", peso: 2.5 },
  { codigo: "7.1.2", subestandar: "7.1", nombre: "Toma de medidas correctivas, preventivas y de mejora", peso: 2.5 },
  { codigo: "7.1.3", subestandar: "7.1", nombre: "Ejecución de acciones preventivas, correctivas y de mejora de la investigación de incidentes, accidentes y enfermedad laboral", peso: 2.5 },
  { codigo: "7.1.4", subestandar: "7.1", nombre: "Implementar medidas y acciones correctivas de autoridades y de ARL", peso: 2.5 },
];

export function itemPorCodigo(codigo: string): ItemEstandar | undefined {
  return ITEMS.find((i) => i.codigo === codigo);
}

export function subestandarDeItem(item: ItemEstandar): Subestandar {
  const sub = SUBESTANDARES.find((s) => s.codigo === item.subestandar);
  if (!sub) throw new Error(`Subestándar desconocido: ${item.subestandar}`);
  return sub;
}

export function estandarDeItem(item: ItemEstandar): Estandar {
  const sub = subestandarDeItem(item);
  const est = ESTANDARES.find((e) => e.numero === sub.estandar);
  if (!est) throw new Error(`Estándar desconocido: ${sub.estandar}`);
  return est;
}
