"use client";

import { TIPOS_DOCUMENTO } from "@sgsst/core";
import { useActionState } from "react";
import type { EstadoFormulario } from "@/app/acciones";
import { ACEPTA_DOCUMENTOS } from "@/lib/datos/archivos";
import type { DocumentoEmpresa } from "@/lib/datos/tipos";

type Accion = (prev: EstadoFormulario, fd: FormData) => Promise<EstadoFormulario>;

const TEXTO_ESTADO = { BORRADOR: "Borrador", EN_REVISION: "En revisión", VIGENTE: "Vigente", OBSOLETO: "Obsoleto" } as const;

function Mensaje({ estado }: { estado: EstadoFormulario }) {
  return <p role="status" className={estado.error ? "estado-error" : "estado-ok"}>{estado.error ?? estado.ok}</p>;
}

export function FilaDocumento({ doc, empresaId, cargar, actualizar }: {
  doc: DocumentoEmpresa; empresaId: string; cargar: Accion; actualizar: Accion;
}) {
  const [estadoCarga, enviarCarga, cargando] = useActionState(cargar, {});
  const [estadoDatos, enviarDatos, guardando] = useActionState(actualizar, {});
  const base = `/empresas/${empresaId}`;
  const codigoUrl = encodeURIComponent(doc.codigo);
  const id = doc.codigo.replace(/[^a-zA-Z0-9]/g, "");

  return (
    <tr>
      <th scope="row">{doc.codigo}</th>
      <td>
        {doc.nombre}
        <div className="ayuda">{TIPOS_DOCUMENTO[doc.tipo].nombre}. Evidencia los ítems {doc.items.join(", ")}.</div>
        {doc.mejoraSugerida && <p className="mejora">{doc.nuevo ? "Documento nuevo. " : "Ajuste normativo: "}{doc.mejoraSugerida}</p>}
      </td>
      <td>
        <span className={`etiqueta etiqueta--${doc.estado}`}>{TEXTO_ESTADO[doc.estado]}</span>
        <div className="ayuda">Versión {doc.version}</div>
      </td>
      <td>
        {doc.archivo ? (
          <a href={`${base}/archivo/${codigoUrl}`}>{doc.archivo.nombre}</a>
        ) : (
          <span className="ayuda">Sin archivo</span>
        )}
      </td>
      <td>
        <div className="acciones">
          <a href={`${base}/pdf/${codigoUrl}`} download>Descargar PDF</a>
        </div>
        <details>
          <summary>Cargar archivo</summary>
          <form action={enviarCarga} className="formulario">
            <div className="campo">
              <label htmlFor={`archivo-${id}`}>Archivo</label>
              <span className="ayuda" id={`archivo-ayuda-${id}`}>PDF, Word, Excel, PowerPoint o imagen, hasta 20 MB.</span>
              <input id={`archivo-${id}`} name="archivo" type="file" required accept={ACEPTA_DOCUMENTOS} aria-describedby={`archivo-ayuda-${id}`} />
            </div>
            {doc.archivo && (
              <div className="campo">
                <label htmlFor={`cambio-${id}`}>Qué cambió en esta versión</label>
                <input id={`cambio-${id}`} name="cambio" type="text" required maxLength={300} />
                <span className="error-campo">Describa el cambio para el control de versiones.</span>
              </div>
            )}
            <button className="boton" type="submit" disabled={cargando}>{cargando ? "Cargando…" : "Cargar archivo"}</button>
            <Mensaje estado={estadoCarga} />
          </form>
        </details>
        <details>
          <summary>Estado y firmas</summary>
          <form action={enviarDatos} className="formulario">
            <div className="campo">
              <label htmlFor={`estado-${id}`}>Estado</label>
              <select id={`estado-${id}`} name="estado" defaultValue={doc.estado}>
                {Object.entries(TEXTO_ESTADO).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </select>
            </div>
            {(["elaboro", "reviso", "aprobo"] as const).map((campo) => (
              <div className="campo" key={campo}>
                <label htmlFor={`${campo}-${id}`}>{{ elaboro: "Elaboró", reviso: "Revisó", aprobo: "Aprobó" }[campo]}</label>
                <input id={`${campo}-${id}`} name={campo} type="text" defaultValue={doc[campo]} />
              </div>
            ))}
            <label className="casilla">
              <input type="checkbox" name="activo" defaultChecked={doc.activo} />
              <span>La empresa usa este documento</span>
            </label>
            <button className="boton" type="submit" disabled={guardando}>{guardando ? "Guardando…" : "Guardar cambios"}</button>
            <Mensaje estado={estadoDatos} />
          </form>
        </details>
      </td>
    </tr>
  );
}
