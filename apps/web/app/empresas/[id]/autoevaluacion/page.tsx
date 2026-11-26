import { notFound } from "next/navigation";
import { guardarAutoevaluacion } from "@/app/acciones";
import { FormAutoevaluacion } from "@/componentes/FormAutoevaluacion";
import { repositorio } from "@/lib/datos";
import { anioActual, grupoDeEmpresa } from "@/lib/servidor";

export const metadata = { title: "Autoevaluación" };

export default async function Autoevaluacion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = repositorio();
  const empresa = await repo.obtenerEmpresa(id);
  if (!empresa) notFound();
  const anio = anioActual();
  const ev = await repo.obtenerAutoevaluacion(id, anio);
  const grupo = grupoDeEmpresa(empresa);

  return (
    <>
      <div className="encabezado-pagina">
        <h1>Autoevaluación {anio}</h1>
        <p>
          Marque cada ítem. &ldquo;No aplica&rdquo; vale el máximo solo si escribe la justificación (Resolución 0312, art. 27).
          El puntaje se recalcula mientras responde; guarde para conservarlo.
        </p>
      </div>
      <FormAutoevaluacion
        accion={guardarAutoevaluacion.bind(null, id, anio)}
        grupo={grupo}
        iniciales={ev?.respuestas ?? {}}
        anio={anio}
        empresaId={id}
      />
    </>
  );
}
