import { notFound } from "next/navigation";
import { actualizarEmpresa } from "@/app/acciones";
import { FormEmpresa } from "@/componentes/FormEmpresa";
import { repositorio } from "@/lib/datos";

export const metadata = { title: "Datos de la empresa" };

export default async function DatosEmpresa({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const empresa = await repositorio().obtenerEmpresa(id);
  if (!empresa) notFound();
  return (
    <>
      <div className="encabezado-pagina">
        <h1>Datos de la empresa</h1>
        <p>Si cambia el número de trabajadores o la clase de riesgo, se recalcula el grupo de estándares que aplica.</p>
      </div>
      <FormEmpresa accion={actualizarEmpresa.bind(null, id)} empresa={empresa} textoBoton="Guardar cambios" />
    </>
  );
}
