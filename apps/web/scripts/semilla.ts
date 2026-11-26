/**
 * Carga la empresa de ejemplo (Hotel y E.D.S. La Troncal) en el modo local,
 * con la autoevaluación del año en curso igual a la de 2022 (88,25 %).
 * Uso: pnpm --filter web semilla
 */
import path from "node:path";
import { ITEMS } from "@sgsst/core";
import { RepositorioLocal } from "../lib/datos/local";
import type { RespuestaGuardada } from "../lib/datos/tipos";

const repo = new RepositorioLocal(process.env.SGSST_DATOS_DIR ?? path.join(process.cwd(), ".datos"));
const NIT = "901569104-9";

const existente = (await repo.listarEmpresas()).find((e) => e.nit === NIT);
const empresa = existente ?? (await repo.crearEmpresa({
  nit: NIT,
  razonSocial: "Hotel y Estación de Servicio La Troncal S.A.S.",
  actividadesCiiu: ["4731", "5511"],
  claseRiesgo: 3,
  numeroTrabajadores: 10,
  usarTablaCompleta: true,
  arl: "AXA Colpatria",
  representanteLegal: "Ahide Pallares Ascanio",
  responsableSst: "Ronny López Hernández",
  direccion: "Carretera principal vía al mar, Loma Colorada",
  municipio: "Bosconia",
  departamento: "Cesar",
}));

// Ítems que no se cumplieron en el FT-SST-001 de 2022.
const NO_CUMPLIDOS = new Set(["2.3.1", "2.6.1", "2.9.1", "3.1.5", "4.1.4", "6.1.1", "6.1.3", "6.1.4"]);
const respuestas: Record<string, RespuestaGuardada> = Object.fromEntries(
  ITEMS.map((i) => [i.codigo, { estado: NO_CUMPLIDOS.has(i.codigo) ? "NO_CUMPLE" : "CUMPLE" }]),
);
const anio = Number(new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", year: "numeric" }).format(new Date()));
await repo.guardarAutoevaluacion(empresa.id, anio, "60", respuestas);

console.log(`${existente ? "Actualizada" : "Creada"}: ${empresa.razonSocial} (${empresa.id}), autoevaluación ${anio}.`);
