import { describe, expect, it } from "vitest";
import {
  DOCUMENTOS_BASE,
  ESTANDARES,
  ITEMS,
  REQUISITOS_21,
  REQUISITOS_7,
  SUBESTANDARES,
  ausentismoCausaMedica,
  calificar,
  evaluarKPI,
  frecuenciaAccidentalidad,
  grupoAplicable,
  grupoObligatorio,
  incidenciaEnfermedadLaboral,
  indicadoresMinimosAnio,
  itemPorCodigo,
  KPI_BASE,
  prevalenciaEnfermedadLaboral,
  proporcionAccidentesMortales,
  severidadAccidentalidad,
  valorar,
  type Respuestas,
} from "../src";

const suma = (xs: readonly number[]) => Math.round(xs.reduce((a, b) => a + b, 0) * 100) / 100;

describe("catálogo de estándares (Resolución 0312, art. 27)", () => {
  it("tiene 60 ítems únicos que suman 100", () => {
    expect(ITEMS).toHaveLength(60);
    expect(new Set(ITEMS.map((i) => i.codigo)).size).toBe(60);
    expect(suma(ITEMS.map((i) => i.peso))).toBe(100);
  });

  it("los pesos de estándares y subestándares cuadran con sus ítems", () => {
    expect(suma(ESTANDARES.map((e) => e.peso))).toBe(100);
    for (const sub of SUBESTANDARES) {
      const items = ITEMS.filter((i) => i.subestandar === sub.codigo);
      expect(suma(items.map((i) => i.peso)), sub.codigo).toBe(sub.peso);
    }
    for (const est of ESTANDARES) {
      const subs = SUBESTANDARES.filter((s) => s.estandar === est.numero);
      expect(suma(subs.map((s) => s.peso)), String(est.numero)).toBe(est.peso);
    }
  });

  it("las listas reducidas tienen 7 y 21 requisitos con ítems existentes", () => {
    expect(REQUISITOS_7).toHaveLength(7);
    expect(REQUISITOS_21).toHaveLength(21);
    for (const r of [...REQUISITOS_7, ...REQUISITOS_21]) {
      for (const c of r.itemsRelacionados) expect(itemPorCodigo(c), c).toBeDefined();
    }
  });
});

describe("aplicabilidad", () => {
  it("asigna el grupo según trabajadores y riesgo", () => {
    expect(grupoObligatorio({ numeroTrabajadores: 10, claseRiesgo: 3 })).toBe("7");
    expect(grupoObligatorio({ numeroTrabajadores: 11, claseRiesgo: 1 })).toBe("21");
    expect(grupoObligatorio({ numeroTrabajadores: 50, claseRiesgo: 3 })).toBe("21");
    expect(grupoObligatorio({ numeroTrabajadores: 51, claseRiesgo: 1 })).toBe("60");
    expect(grupoObligatorio({ numeroTrabajadores: 3, claseRiesgo: 4 })).toBe("60");
    expect(grupoObligatorio({ numeroTrabajadores: 3, claseRiesgo: 5 })).toBe("60");
  });

  it("permite adoptar la tabla completa voluntariamente (caso La Troncal)", () => {
    expect(grupoAplicable({ numeroTrabajadores: 10, claseRiesgo: 3, usarTablaCompleta: true })).toBe("60");
  });

  it("rechaza números de trabajadores inválidos", () => {
    expect(() => grupoObligatorio({ numeroTrabajadores: 0, claseRiesgo: 1 })).toThrow(RangeError);
  });
});

describe("calificación", () => {
  const todo = (estado: "CUMPLE" | "NO_CUMPLE"): Respuestas =>
    Object.fromEntries(ITEMS.map((i) => [i.codigo, { estado }]));

  it("100% cuando cumple todo y 0% cuando no cumple nada", () => {
    expect(calificar("60", todo("CUMPLE")).porcentaje).toBe(100);
    expect(calificar("60", todo("NO_CUMPLE")).porcentaje).toBe(0);
  });

  it("reproduce la autoevaluación 2022 de La Troncal: 88,25% aceptable", () => {
    // En el FT-SST-001 de 2022 no se cumplieron: 2.3.1, 2.6.1, 2.9.1, 3.1.5, 4.1.4, 6.1.1, 6.1.3 y 6.1.4
    // (subtotales del formato: estándar 2 = 12 de 15, subestándar 3.1 = 8 de 9).
    const respuestas: Record<string, { estado: "CUMPLE" | "NO_CUMPLE" }> = { ...todo("CUMPLE") } as never;
    for (const c of ["2.3.1", "2.6.1", "2.9.1", "3.1.5", "4.1.4", "6.1.1", "6.1.3", "6.1.4"]) respuestas[c] = { estado: "NO_CUMPLE" };
    const r = calificar("60", respuestas);
    expect(r.porcentaje).toBe(88.25);
    expect(r.valoracion).toBe("ACEPTABLE");
    expect(r.porEstandar.find((e) => e.codigo === "6")?.obtenido).toBe(1.25);
    expect(r.porEstandar.find((e) => e.codigo === "2")?.obtenido).toBe(12);
    expect(r.porSubestandar.find((s) => s.codigo === "3.1")?.obtenido).toBe(8);
  });

  it("'no aplica' vale el máximo solo si está justificado", () => {
    const base = todo("CUMPLE");
    const sinJust = calificar("60", { ...base, "1.1.5": { estado: "NO_APLICA" } });
    expect(sinJust.porcentaje).toBe(99.5);
    expect(sinJust.noAplicaSinJustificar).toEqual(["1.1.5"]);
    const conJust = calificar("60", {
      ...base,
      "1.1.5": { estado: "NO_APLICA", justificacion: "No hay trabajadores en actividades de alto riesgo" },
    });
    expect(conJust.porcentaje).toBe(100);
  });

  it("los ítems sin responder cuentan como cero y se listan", () => {
    const r = calificar("7", { "1": { estado: "CUMPLE" } });
    expect(r.pendientes).toHaveLength(6);
    expect(r.porcentaje).toBe(14.29);
  });

  it("aplica los límites de valoración del art. 28", () => {
    expect(valorar(59.99)).toBe("CRITICO");
    expect(valorar(60)).toBe("MODERADAMENTE_ACEPTABLE");
    expect(valorar(85)).toBe("MODERADAMENTE_ACEPTABLE");
    expect(valorar(85.01)).toBe("ACEPTABLE");
  });
});

describe("indicadores mínimos (Resolución 0312, art. 30)", () => {
  it("calcula las seis fórmulas", () => {
    expect(frecuenciaAccidentalidad(1, 10)).toBe(10);
    expect(severidadAccidentalidad(5, 0, 10)).toBe(50);
    expect(proporcionAccidentesMortales(0, 3)).toBe(0);
    expect(prevalenciaEnfermedadLaboral(1, 10)).toBe(10000);
    expect(incidenciaEnfermedadLaboral(1, 10)).toBe(10000);
    expect(ausentismoCausaMedica(6, 260)).toBe(2.31);
  });

  it("devuelve 0 si el denominador es 0 y rechaza negativos", () => {
    expect(proporcionAccidentesMortales(0, 0)).toBe(0);
    expect(() => frecuenciaAccidentalidad(-1, 10)).toThrow(RangeError);
  });

  it("acumula el año sin duplicar casos antiguos de enfermedad laboral", () => {
    const mes = {
      trabajadores: 10, accidentes: 1, accidentesMortales: 0, diasIncapacidadAT: 2, diasCargados: 0,
      diasAusenciaCausaMedica: 3, diasProgramados: 260, casosNuevosEL: 0, casosTotalesEL: 1,
    };
    const anio = indicadoresMinimosAnio(Array.from({ length: 12 }, () => mes));
    expect(anio.frecuencia).toBe(120);
    expect(anio.prevalencia).toBe(10000);
    expect(anio.incidencia).toBe(0);
  });
});

describe("KPI configurables", () => {
  it("evalúa la meta en ambos sentidos", () => {
    const plan = KPI_BASE.find((k) => k.codigo === "P-01")!;
    expect(evaluarKPI(plan, 18, 20)).toEqual({ valor: 90, cumpleMeta: true });
    expect(evaluarKPI({ ...plan, sentido: "MENOR_O_IGUAL", meta: 5 }, 1, 10).cumpleMeta).toBe(false);
  });

  it("todos los KPI apuntan a ítems existentes", () => {
    for (const k of KPI_BASE) if (k.itemEstandar) expect(itemPorCodigo(k.itemEstandar), k.codigo).toBeDefined();
  });
});

describe("listado maestro de documentos", () => {
  it("tiene códigos únicos y cada documento evidencia ítems existentes", () => {
    expect(new Set(DOCUMENTOS_BASE.map((d) => d.codigo)).size).toBe(DOCUMENTOS_BASE.length);
    for (const d of DOCUMENTOS_BASE) {
      expect(d.items.length, d.codigo).toBeGreaterThan(0);
      for (const c of d.items) expect(itemPorCodigo(c), `${d.codigo} → ${c}`).toBeDefined();
    }
  });
});
