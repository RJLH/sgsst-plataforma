import { notFound } from "next/navigation";
import type { TipoDocumento } from "@sgsst/core";
import { actualizarDocumento, cargarArchivo } from "@/app/acciones";
import { FilaDocumento } from "@/componentes/FilaDocumento";
import { repositorio } from "@/lib/datos";

export const metadata = { title: "Documentos" };

const ORDEN: TipoDocumento[] = ["MANUAL", "REGLAMENTO", "POLITICA", "PROCEDIMIENTO", "PROGRAMA", "PLAN", "FORMATO"];
const PLURAL: Record<TipoDocumento, string> = {
  MANUAL: "manuales", REGLAMENTO: "reglamentos", POLITICA: "políticas", PROCEDIMIENTO: "procedimientos",
  PROGRAMA: "programas", PLAN: "planes", FORMATO: "formatos",
};

export default async function Documentos({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = repositorio();
  const empresa = await repo.obtenerEmpresa(id);
  if (!empresa) notFound();
  const docs = (await repo.listarDocumentos(id)).sort(
    (a, b) => ORDEN.indexOf(a.tipo) - ORDEN.indexOf(b.tipo) || a.codigo.localeCompare(b.codigo, "es", { numeric: true }),
  );
  const activos = docs.filter((d) => d.activo);
  const inactivos = docs.filter((d) => !d.activo);

  const tabla = (lista: typeof docs, titulo: string, idCaption: string) => (
    <div className="tabla-contenedor" tabIndex={0} role="region" aria-labelledby={idCaption}>
      <table>
        <caption id={idCaption}>{titulo}</caption>
        <thead>
          <tr>
            <th scope="col">Código</th>
            <th scope="col">Documento</th>
            <th scope="col">Estado</th>
            <th scope="col">Archivo</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((d) => (
            <FilaDocumento
              key={d.codigo}
              doc={d}
              empresaId={id}
              cargar={cargarArchivo.bind(null, id, d.codigo)}
              actualizar={actualizarDocumento.bind(null, id, d.codigo)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <div className="encabezado-pagina">
        <h1>Listado maestro de documentos</h1>
        <p>
          Cargue cada documento y descárguelo en PDF con el logo, código, versión y fecha de la empresa.
          Los formatos sin archivo se descargan como plantilla en blanco para diligenciar.
          Las versiones anteriores se conservan.
        </p>
      </div>
      <p className="ayuda">
        {ORDEN.map((t) => `${activos.filter((d) => d.tipo === t).length} ${PLURAL[t]}`).join(", ")}.
      </p>
      {tabla(activos, `${activos.length} documentos en uso`, "docs-activos")}
      {inactivos.length > 0 && (
        <details className="seccion">
          <summary>{inactivos.length} documentos que la empresa no usa</summary>
          {tabla(inactivos, "Documentos desactivados", "docs-inactivos")}
        </details>
      )}
    </>
  );
}
