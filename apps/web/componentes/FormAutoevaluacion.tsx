"use client";

import {
  ESTANDARES,
  ITEMS,
  SUBESTANDARES,
  TEXTO_VALORACION,
  calificar,
  requisitosDelGrupo,
  type EstadoItem,
  type GrupoEstandares,
  type Respuestas,
} from "@sgsst/core";
import { useActionState, useMemo, useState } from "react";
import type { EstadoFormulario } from "@/app/acciones";
import type { RespuestaGuardada } from "@/lib/datos/tipos";

type Accion = (prev: EstadoFormulario, fd: FormData) => Promise<EstadoFormulario>;

const OPCIONES: { valor: EstadoItem; texto: string }[] = [
  { valor: "CUMPLE", texto: "Cumple" },
  { valor: "NO_CUMPLE", texto: "No cumple" },
  { valor: "NO_APLICA", texto: "No aplica" },
];

const coma = (n: number) => n.toLocaleString("es-CO", { maximumFractionDigits: 2 });

function Item({ codigo, nombre, peso, respuesta, onCambio }: {
  codigo: string; nombre: string; peso?: number;
  respuesta: RespuestaGuardada | undefined;
  onCambio: (r: RespuestaGuardada) => void;
}) {
  const idJust = `justificacion-${codigo}`;
  return (
    <div className="item">
      <div className="item__titulo">
        <span className="item__codigo">{codigo}</span>
        <span id={`nombre-${codigo}`}>{nombre}</span>
        {peso !== undefined && <span className="item__peso">{coma(peso)} %</span>}
      </div>
      <fieldset className="opciones" aria-labelledby={`nombre-${codigo}`}>
        {OPCIONES.map((o) => (
          <label key={o.valor}>
            <input
              type="radio"
              name={`estado:${codigo}`}
              value={o.valor}
              checked={respuesta?.estado === o.valor}
              onChange={() => onCambio({ estado: o.valor, ...(respuesta?.justificacion ? { justificacion: respuesta.justificacion } : {}) })}
            />
            {o.texto}
          </label>
        ))}
      </fieldset>
      <div className="campo justificacion">
        <label htmlFor={idJust}>Justificación de por qué no aplica</label>
        <textarea
          id={idJust}
          name={`justificacion:${codigo}`}
          required={respuesta?.estado === "NO_APLICA"}
          maxLength={1000}
          value={respuesta?.justificacion ?? ""}
          onChange={(e) => onCambio({ estado: respuesta?.estado ?? "NO_APLICA", justificacion: e.target.value })}
        />
        <span className="error-campo">Escriba por qué no aplica. Sin justificación el ítem vale 0.</span>
      </div>
    </div>
  );
}

export function FormAutoevaluacion({ accion, grupo, iniciales, anio, empresaId }: {
  accion: Accion;
  grupo: GrupoEstandares;
  iniciales: Record<string, RespuestaGuardada>;
  anio: number;
  empresaId: string;
}) {
  const [estado, enviar, enviando] = useActionState(accion, {});
  const [resp, setResp] = useState<Record<string, RespuestaGuardada>>(iniciales);
  const resultado = useMemo(() => calificar(grupo, resp as Respuestas), [grupo, resp]);
  const cambiar = (codigo: string) => (r: RespuestaGuardada) => setResp((prev) => ({ ...prev, [codigo]: r }));
  const nivel = resultado.porcentaje > 85 ? "alto" : resultado.porcentaje >= 60 ? "medio" : "bajo";

  return (
    <form action={enviar}>
      <div className="marcador">
        <span className="marcador__cifra">{coma(resultado.porcentaje)} %</span>
        <span>{TEXTO_VALORACION[resultado.valoracion]}. {resultado.pendientes.length} sin responder.</span>
        <progress max={100} value={resultado.porcentaje} data-nivel={nivel} aria-label="Puntaje actual" />
        <div className="acciones">
          <button className="boton" type="submit" disabled={enviando}>{enviando ? "Guardando…" : "Guardar autoevaluación"}</button>
          <a className="boton boton--secundario" href={`/empresas/${empresaId}/pdf/FT-SST-001?anio=${anio}`}>Descargar PDF</a>
        </div>
        <p role="status" className={estado.error ? "estado-error" : "estado-ok"}>{estado.error ?? estado.ok}</p>
      </div>

      {grupo === "60" ? (
        ESTANDARES.map((est) => (
          <section key={est.numero} className="ciclo" aria-labelledby={`est-${est.numero}`}>
            <h2 id={`est-${est.numero}`}>{est.numero}. {est.nombre} <span className="estandar__ciclo">({est.peso} %)</span></h2>
            {SUBESTANDARES.filter((s) => s.estandar === est.numero).map((sub) => {
              const items = ITEMS.filter((i) => i.subestandar === sub.codigo);
              const parcial = resultado.porSubestandar.find((p) => p.codigo === sub.codigo);
              const completo = items.every((i) => resp[i.codigo]);
              return (
                <details key={sub.codigo} className="grupo-items" open={!completo}>
                  <summary>
                    {sub.codigo} {sub.nombre}
                    <span>{coma(parcial?.obtenido ?? 0)} de {sub.peso}</span>
                  </summary>
                  {items.map((i) => (
                    <Item key={i.codigo} codigo={i.codigo} nombre={i.nombre} peso={i.peso} respuesta={resp[i.codigo]} onCambio={cambiar(i.codigo)} />
                  ))}
                </details>
              );
            })}
          </section>
        ))
      ) : (
        <div className="grupo-items">
          {requisitosDelGrupo(grupo).map((req) => (
            <Item key={req.numero} codigo={String(req.numero)} nombre={req.nombre} respuesta={resp[String(req.numero)]} onCambio={cambiar(String(req.numero))} />
          ))}
        </div>
      )}
    </form>
  );
}
