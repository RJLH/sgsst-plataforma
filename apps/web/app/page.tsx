import Link from "next/link";
import { TEXTO_VALORACION } from "@sgsst/core";
import { repositorio } from "@/lib/datos";
import { anioActual, grupoDeEmpresa, resultadoDe } from "@/lib/servidor";

export const dynamic = "force-dynamic";

export default async function Inicio() {
  const repo = repositorio();
  const anio = anioActual();
  const empresas = await repo.listarEmpresas();
  const filas = await Promise.all(
    empresas.map(async (e) => {
      const ev = await repo.obtenerAutoevaluacion(e.id, anio);
      return { e, ev, r: resultadoDe(e, ev), grupo: grupoDeEmpresa(e) };
    }),
  );

  return (
    <main>
      <div className="encabezado-pagina">
        <h1>Empresas</h1>
        <p>Estado de los estándares mínimos de cada empresa en {anio}.</p>
      </div>

      {filas.length === 0 ? (
        <div className="panel">
          <h2>Registre la primera empresa</h2>
          <p>
            Con el número de trabajadores y la clase de riesgo, la plataforma determina qué estándares mínimos le aplican
            y le prepara el listado de documentos del SG-SST para que lo adapte.
          </p>
          <Link className="boton" href="/empresas/nueva">Registrar empresa</Link>
        </div>
      ) : (
        <>
          <ul className="empresas">
            {filas.map(({ e, ev, r, grupo }) => (
              <li key={e.id} className="empresa" data-valoracion={ev ? r.valoracion : undefined}>
                <Link href={`/empresas/${e.id}`}>{e.razonSocial}</Link>
                <span className="empresa__dato">
                  NIT {e.nit}. {e.numeroTrabajadores} trabajadores, riesgo {e.claseRiesgo}, {grupo} estándares.{" "}
                  {ev ? TEXTO_VALORACION[r.valoracion] : `Sin autoevaluación ${anio}`}
                </span>
                <span className="empresa__cifra">{ev ? `${Math.round(r.porcentaje)}%` : "—"}</span>
              </li>
            ))}
          </ul>
          <p className="seccion">
            <Link className="boton boton--secundario" href="/empresas/nueva">Registrar otra empresa</Link>
          </p>
        </>
      )}
    </main>
  );
}
