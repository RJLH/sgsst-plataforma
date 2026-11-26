import Link from "next/link";
import { notFound } from "next/navigation";
import { ACCIONES_VALORACION, ESTANDARES, LISTAS_REDUCIDAS_VERIFICADAS, TEXTO_VALORACION } from "@sgsst/core";
import { repositorio } from "@/lib/datos";
import { anioActual, grupoDeEmpresa, resultadoDe } from "@/lib/servidor";

export const metadata = { title: "Resumen" };

const nivel = (pct: number) => (pct > 85 ? "alto" : pct >= 60 ? "medio" : "bajo");
const coma = (n: number) => n.toLocaleString("es-CO", { maximumFractionDigits: 2 });

export default async function Resumen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = repositorio();
  const empresa = await repo.obtenerEmpresa(id);
  if (!empresa) notFound();
  const anio = anioActual();
  const ev = await repo.obtenerAutoevaluacion(id, anio);
  const r = resultadoDe(empresa, ev);
  const grupo = grupoDeEmpresa(empresa);
  const documentos = await repo.listarDocumentos(id);
  const activos = documentos.filter((d) => d.activo);
  const vigentes = activos.filter((d) => d.estado === "VIGENTE").length;
  const conMejora = activos.filter((d) => d.mejoraSugerida && d.estado !== "VIGENTE");

  return (
    <>
      <div className="encabezado-pagina">
        <h1>Estándares mínimos {anio}</h1>
        <p>
          {empresa.numeroTrabajadores} trabajadores, riesgo {empresa.claseRiesgo}.{" "}
          {grupo === "60"
            ? empresa.usarTablaCompleta ? "Se evalúa con la tabla completa de 60 ítems por decisión de la empresa." : "Se evalúa con la tabla completa de 60 ítems."
            : `Se evalúa con ${grupo} estándares mínimos.`}
        </p>
      </div>

      {grupo !== "60" && !LISTAS_REDUCIDAS_VERIFICADAS && (
        <div className="aviso">
          <p>La lista de {grupo} estándares está pendiente de cotejar con el texto oficial de la Resolución 0312. Revísela antes de reportar.</p>
        </div>
      )}

      <section className="resumen" aria-label="Resultado de la autoevaluación">
        <div className="placa" data-valoracion={ev ? r.valoracion : undefined}>
          <span className="placa__cifra">{ev ? coma(r.porcentaje) : "—"}<small>{ev ? "%" : ""}</small></span>
          <span className="placa__valoracion">{ev ? TEXTO_VALORACION[r.valoracion] : "Sin evaluar"}</span>
          <p className="placa__detalle">
            {ev ? `${r.pendientes.length} ítems sin responder${r.noAplicaSinJustificar.length ? `, ${r.noAplicaSinJustificar.length} "no aplica" sin justificar` : ""}.` : `Aún no hay autoevaluación de ${anio}.`}
          </p>
          <div className="acciones">
            <Link className="boton" href={`/empresas/${id}/autoevaluacion`}>{ev ? "Continuar autoevaluación" : "Empezar autoevaluación"}</Link>
            {ev && <a className="boton boton--secundario" href={`/empresas/${id}/pdf/FT-SST-001?anio=${anio}`}>Descargar PDF</a>}
          </div>
        </div>

        <div className="panel">
          {grupo === "60" ? (
            <>
              <h2>Por estándar</h2>
              <ul className="estandares">
                {r.porEstandar.map((p) => {
                  const est = ESTANDARES.find((e) => String(e.numero) === p.codigo);
                  const pct = (p.obtenido / p.posible) * 100;
                  return (
                    <li key={p.codigo} className="estandar">
                      <span className="estandar__nombre">
                        {p.codigo}. {p.nombre} <span className="estandar__ciclo">({est?.ciclo.toLowerCase()})</span>
                      </span>
                      <span className="estandar__valor">{coma(p.obtenido)} de {p.posible}</span>
                      <progress max={p.posible} value={p.obtenido} data-nivel={nivel(pct)} aria-label={`${p.nombre}: ${coma(p.obtenido)} de ${p.posible}`} />
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <>
              <h2>Qué exige la norma</h2>
              <ul>
                {ACCIONES_VALORACION[ev ? r.valoracion : "CRITICO"].map((a) => <li key={a}>{a}</li>)}
              </ul>
            </>
          )}
        </div>
      </section>

      <section className="panel seccion">
        <h2>Documentos</h2>
        <p>
          {vigentes} de {activos.length} documentos están vigentes.{" "}
          {conMejora.length > 0 && `${conMejora.length} tienen ajustes pendientes para cumplir la norma.`}
        </p>
        <Link href={`/empresas/${id}/documentos`}>Ir al listado de documentos</Link>
      </section>
    </>
  );
}
