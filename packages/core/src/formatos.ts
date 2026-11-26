/**
 * Listado maestro de documentos del SG-SST.
 *
 * Plantilla base tomada del SG-SST-001 de Hotel y E.D.S. La Troncal
 * (versión 1.2, noviembre de 2026). Cada empresa recibe una copia y la
 * adapta: puede renombrar, desactivar, agregar documentos propios o
 * cambiar la codificación.
 *
 * `mejora` marca lo que hay que ajustar para cumplir la norma vigente.
 * `nuevo: true` indica documentos que la plantilla del hotel no tenía.
 */

export type TipoDocumento =
  | "MANUAL"
  | "POLITICA"
  | "REGLAMENTO"
  | "PROCEDIMIENTO"
  | "PROGRAMA"
  | "PLAN"
  | "FORMATO";

export interface DocumentoMaestro {
  codigo: string;
  nombre: string;
  tipo: TipoDocumento;
  /** Ítems de la tabla de 60 que este documento evidencia. */
  items: readonly string[];
  /** true si la app lo diligencia como formulario (con firma, fotos, etc.). */
  formularioDigital?: boolean;
  mejora?: string;
  nuevo?: boolean;
}

export const TIPOS_DOCUMENTO: Record<TipoDocumento, { prefijo: string; nombre: string }> = {
  MANUAL: { prefijo: "MAN", nombre: "Manual" },
  POLITICA: { prefijo: "PLT", nombre: "Política" },
  REGLAMENTO: { prefijo: "R", nombre: "Reglamento" },
  PROCEDIMIENTO: { prefijo: "PRC", nombre: "Procedimiento" },
  PROGRAMA: { prefijo: "PRG", nombre: "Programa" },
  PLAN: { prefijo: "PLA", nombre: "Plan" },
  FORMATO: { prefijo: "FT", nombre: "Formato" },
};

export const DOCUMENTOS_BASE: readonly DocumentoMaestro[] = [
  // Manual y reglamentos
  { codigo: "SG-SST-001", nombre: "Documento del Sistema de Gestión de la Seguridad y Salud en el Trabajo", tipo: "MANUAL", items: ["2.5.1"],
    mejora: "Actualizar el control de cambios: el encabezado conserva 'Versión 001 – Mayo 2022' aunque la última modificación es de noviembre de 2026." },
  { codigo: "MAN-SST-001", nombre: "Manual de funciones y responsabilidades en SST", tipo: "MANUAL", items: ["1.1.2"] },
  { codigo: "R-SST-001", nombre: "Reglamento interno de trabajo", tipo: "REGLAMENTO", items: ["2.7.1"] },
  { codigo: "R-SST-002", nombre: "Reglamento de higiene y seguridad industrial", tipo: "REGLAMENTO", items: ["2.7.1"] },

  // Políticas
  { codigo: "PLT-SST-001", nombre: "Política de seguridad y salud en el trabajo", tipo: "POLITICA", items: ["2.1.1"] },
  { codigo: "PLT-SST-002", nombre: "Política de prevención del consumo de alcohol, tabaco y otras sustancias psicoactivas", tipo: "POLITICA", items: ["3.1.7"] },
  { codigo: "PLT-SST-003", nombre: "Política de preparación, prevención y respuesta ante emergencias", tipo: "POLITICA", items: ["5.1.1"] },
  { codigo: "PLT-SST-004", nombre: "Política de prevención de acoso laboral", tipo: "POLITICA", items: ["1.1.8"] },
  { codigo: "PLT-SST-005", nombre: "Política de elementos de protección personal", tipo: "POLITICA", items: ["4.2.6"] },
  { codigo: "PLT-SST-006", nombre: "Política interna de uso de teléfonos celulares, redes sociales y dispositivos personales en horario laboral", tipo: "POLITICA", items: ["4.2.1"] },
  { codigo: "PLT-SST-007", nombre: "Política interna de selección, contratación y prevención de conflictos de interés por vínculos familiares", tipo: "POLITICA", items: ["2.10.1"] },

  // Procedimientos
  { codigo: "PRC-SST-001", nombre: "Procedimiento para la elección y conformación del COPASST", tipo: "PROCEDIMIENTO", items: ["1.1.6"] },
  { codigo: "PRC-SST-002", nombre: "Procedimiento para la elección y conformación del Comité de Convivencia", tipo: "PROCEDIMIENTO", items: ["1.1.8"] },
  { codigo: "PRC-SST-003", nombre: "Procedimiento de control de documentos y registros", tipo: "PROCEDIMIENTO", items: ["2.5.1"],
    mejora: "Indicar que los registros se conservan por un mínimo de 20 años desde el retiro del trabajador (Decreto 1072 de 2015, art. 2.2.4.6.13)." },
  { codigo: "PRC-SST-005", nombre: "Procedimiento de identificación de requisitos legales", tipo: "PROCEDIMIENTO", items: ["2.7.1"] },
  { codigo: "PRC-SST-006", nombre: "Procedimiento de comunicación, participación y consulta", tipo: "PROCEDIMIENTO", items: ["2.8.1"] },
  { codigo: "PRC-SST-009", nombre: "Procedimiento para la selección, inspección, reposición, uso y cuidado de los EPP", tipo: "PROCEDIMIENTO", items: ["4.2.6"] },
  { codigo: "PRC-SST-012", nombre: "Procedimiento para la realización de exámenes médicos ocupacionales", tipo: "PROCEDIMIENTO", items: ["3.1.4"] },
  { codigo: "PRC-SST-013", nombre: "Procedimiento para investigación de incidentes, accidentes de trabajo y enfermedades laborales", tipo: "PROCEDIMIENTO", items: ["3.2.2"] },
  { codigo: "PRC-SST-014", nombre: "Procedimiento de identificación de peligros, valoración de riesgos y determinación de controles", tipo: "PROCEDIMIENTO", items: ["4.1.1"] },
  { codigo: "PRC-SST-016", nombre: "Procedimiento de auditorías internas", tipo: "PROCEDIMIENTO", items: ["6.1.2"] },
  { codigo: "PRC-SST-017", nombre: "Procedimiento de revisión por la alta dirección", tipo: "PROCEDIMIENTO", items: ["6.1.3"] },
  { codigo: "PRC-SST-018", nombre: "Procedimiento de no conformidades, acciones correctivas y preventivas", tipo: "PROCEDIMIENTO", items: ["7.1.2"] },
  { codigo: "PRC-SST-019", nombre: "Procedimiento seguro de trabajo en alturas", tipo: "PROCEDIMIENTO", items: ["4.2.3"],
    mejora: "Actualizar la referencia normativa: la Resolución 1409 de 2012 fue reemplazada por la Resolución 4272 de 2021." },
  { codigo: "PRC-SST-024", nombre: "Procedimiento seguro de trabajo para uso de herramientas manuales", tipo: "PROCEDIMIENTO", items: ["4.2.3"] },
  { codigo: "PRC-SST-025", nombre: "Procedimiento de gestión del cambio", tipo: "PROCEDIMIENTO", items: ["2.11.1"], nuevo: true,
    mejora: "El SG-SST-001 describe la gestión del cambio (numeral 4.1) pero no tiene procedimiento ni formato codificado." },

  // Programas
  { codigo: "PRG-SST-001", nombre: "Programa de capacitación", tipo: "PROGRAMA", items: ["1.2.1"] },
  { codigo: "PRG-SST-003", nombre: "Programa de medicina preventiva y del trabajo", tipo: "PROGRAMA", items: ["3.1.2"] },
  { codigo: "PRG-SST-009", nombre: "Programa de inspecciones", tipo: "PROGRAMA", items: ["4.2.4"] },
  { codigo: "PRG-SST-010", nombre: "Programa de higiene industrial", tipo: "PROGRAMA", items: ["4.1.4"] },
  { codigo: "PRG-SST-011", nombre: "Programa de seguridad industrial", tipo: "PROGRAMA", items: ["4.2.1"] },
  { codigo: "PRG-SST-012", nombre: "Programa de vigilancia epidemiológica de riesgo psicosocial", tipo: "PROGRAMA", items: ["3.1.2", "4.1.3"], nuevo: true,
    mejora: "La carpeta tiene análisis psicosocial, pero falta el programa que lo formalice con la batería de instrumentos (Resolución 2764 de 2022)." },

  // Planes
  { codigo: "PLA-SST-001", nombre: "Plan de prevención, preparación y respuesta ante emergencias", tipo: "PLAN", items: ["5.1.1"] },

  // Formatos
  { codigo: "FT-SST-001", nombre: "Evaluación inicial del SG-SST (tabla de valores)", tipo: "FORMATO", items: ["2.3.1"], formularioDigital: true },
  { codigo: "FT-SST-008", nombre: "Inscripción de candidatos al COPASST", tipo: "FORMATO", items: ["1.1.6"], formularioDigital: true },
  { codigo: "FT-SST-009", nombre: "Votos de elección del COPASST", tipo: "FORMATO", items: ["1.1.6"] },
  { codigo: "FT-SST-010", nombre: "Apertura de elección del COPASST", tipo: "FORMATO", items: ["1.1.6"] },
  { codigo: "FT-SST-011", nombre: "Registro de votantes para el COPASST", tipo: "FORMATO", items: ["1.1.6"], formularioDigital: true },
  { codigo: "FT-SST-012", nombre: "Acta de cierre de las votaciones para el COPASST", tipo: "FORMATO", items: ["1.1.6"] },
  { codigo: "FT-SST-013", nombre: "Acta de conformación del COPASST", tipo: "FORMATO", items: ["1.1.6"] },
  { codigo: "FT-SST-014", nombre: "Acta de reunión del COPASST", tipo: "FORMATO", items: ["1.1.6", "6.1.4"], formularioDigital: true },
  { codigo: "FT-SST-015", nombre: "Registro de asistencia", tipo: "FORMATO", items: ["1.2.1", "1.2.2"], formularioDigital: true },
  { codigo: "FT-SST-016", nombre: "Convocatoria a la elección del Comité de Convivencia", tipo: "FORMATO", items: ["1.1.8"] },
  { codigo: "FT-SST-017", nombre: "Participantes a la elección del Comité de Convivencia", tipo: "FORMATO", items: ["1.1.8"] },
  { codigo: "FT-SST-018", nombre: "Votación para la elección del Comité de Convivencia", tipo: "FORMATO", items: ["1.1.8"] },
  { codigo: "FT-SST-019", nombre: "Acta de escrutinio y votación del Comité de Convivencia", tipo: "FORMATO", items: ["1.1.8"] },
  { codigo: "FT-SST-020", nombre: "Constitución del Comité de Convivencia", tipo: "FORMATO", items: ["1.1.8"] },
  { codigo: "FT-SST-021", nombre: "Presentación de quejas relacionadas con situaciones de conflicto", tipo: "FORMATO", items: ["1.1.8"], formularioDigital: true },
  { codigo: "FT-SST-022", nombre: "Seguimiento de quejas relacionadas con situaciones de conflicto", tipo: "FORMATO", items: ["1.1.8"] },
  { codigo: "FT-SST-023", nombre: "Acta de compromisos", tipo: "FORMATO", items: ["1.1.8"] },
  { codigo: "FT-SST-024", nombre: "Cronograma de capacitación y entrenamiento en SST", tipo: "FORMATO", items: ["1.2.1"], formularioDigital: true },
  { codigo: "FT-SST-025", nombre: "Matriz de identificación de peligros, valoración de riesgos y determinación de controles", tipo: "FORMATO", items: ["4.1.1", "4.1.2"], formularioDigital: true },
  { codigo: "FT-SST-026", nombre: "Inducción al SG-SST", tipo: "FORMATO", items: ["1.2.2"], formularioDigital: true },
  { codigo: "FT-SST-030", nombre: "Plan de trabajo anual del SG-SST", tipo: "FORMATO", items: ["2.4.1"], formularioDigital: true,
    mejora: "En el SG-SST-001 aparece como 'FT-SST-30'; se normaliza a tres dígitos." },
  { codigo: "FT-SST-031", nombre: "Matriz de objetivos, metas e indicadores del SG-SST", tipo: "FORMATO", items: ["2.2.1", "6.1.1"], formularioDigital: true, nuevo: true,
    mejora: "La tabla 14 del SG-SST-001 tiene las directrices de la política, pero la columna de indicadores está vacía." },
  { codigo: "FT-SST-034", nombre: "Matriz de requisitos legales en SST", tipo: "FORMATO", items: ["2.7.1"], formularioDigital: true },
  { codigo: "FT-SST-036", nombre: "Matriz de elementos de protección personal", tipo: "FORMATO", items: ["4.2.6"], formularioDigital: true },
  { codigo: "FT-SST-043", nombre: "Diagnóstico de condiciones de salud (entregado por el médico ocupacional)", tipo: "FORMATO", items: ["3.1.1"] },
  { codigo: "FT-SST-046", nombre: "Profesiograma", tipo: "FORMATO", items: ["3.1.3"] },
  { codigo: "FT-SST-048", nombre: "Reporte de incidentes y accidentes", tipo: "FORMATO", items: ["3.2.1"], formularioDigital: true },
  { codigo: "FT-SST-049", nombre: "Investigación de accidentes", tipo: "FORMATO", items: ["3.2.2"], formularioDigital: true },
  { codigo: "FT-SST-050", nombre: "Análisis de accidentes", tipo: "FORMATO", items: ["3.2.2", "3.2.3"], formularioDigital: true },
  { codigo: "FT-SST-051", nombre: "Registro de testigos de accidentes", tipo: "FORMATO", items: ["3.2.2"], formularioDigital: true },
  { codigo: "FT-SST-061", nombre: "Inspección de elementos de protección personal", tipo: "FORMATO", items: ["4.2.6", "4.2.4"], formularioDigital: true },
  { codigo: "FT-SST-062", nombre: "Reporte de actos y condiciones subestándar", tipo: "FORMATO", items: ["2.8.1"], formularioDigital: true },
  { codigo: "FT-SST-072", nombre: "Inventario de equipos contra incendios y primeros auxilios", tipo: "FORMATO", items: ["5.1.2", "4.2.5"], formularioDigital: true },
  { codigo: "FT-SST-073", nombre: "Análisis de amenazas y vulnerabilidad", tipo: "FORMATO", items: ["5.1.1"] },
  { codigo: "FT-SST-079", nombre: "Conformación de brigada de primeros auxilios", tipo: "FORMATO", items: ["5.1.2"] },
  { codigo: "FT-SST-080", nombre: "Conformación de brigada contra incendios", tipo: "FORMATO", items: ["5.1.2"] },
  { codigo: "FT-SST-081", nombre: "Conformación de brigada de aviso y control", tipo: "FORMATO", items: ["5.1.2"] },
  { codigo: "FT-SST-084", nombre: "Auditoría interna", tipo: "FORMATO", items: ["6.1.2"], formularioDigital: true },
  { codigo: "FT-SST-085", nombre: "Plan de auditorías", tipo: "FORMATO", items: ["6.1.2", "6.1.4"] },
  { codigo: "FT-SST-086", nombre: "Informe de auditorías", tipo: "FORMATO", items: ["6.1.2"] },
  { codigo: "FT-SST-087", nombre: "Informe de revisión anual por la alta dirección", tipo: "FORMATO", items: ["6.1.3"], formularioDigital: true },
  { codigo: "FT-SST-089", nombre: "Reporte y seguimiento de acciones correctivas, preventivas y de mejora", tipo: "FORMATO", items: ["7.1.2", "7.1.3"], formularioDigital: true },
  { codigo: "FT-SST-090", nombre: "Reporte de restricciones médicas laborales", tipo: "FORMATO", items: ["3.1.6"], formularioDigital: true },
  { codigo: "FT-SST-091", nombre: "Gestión del cambio", tipo: "FORMATO", items: ["2.11.1"], formularioDigital: true, nuevo: true },
  { codigo: "FT-SST-137", nombre: "Cuadrante de trabajo rotativo por turnos", tipo: "FORMATO", items: ["4.2.1"] },
];

export function documentosPorItem(codigoItem: string): DocumentoMaestro[] {
  return DOCUMENTOS_BASE.filter((d) => d.items.includes(codigoItem));
}
