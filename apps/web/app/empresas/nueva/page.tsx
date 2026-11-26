import { crearEmpresa } from "@/app/acciones";
import { FormEmpresa } from "@/componentes/FormEmpresa";

export const metadata = { title: "Registrar empresa" };

export default function NuevaEmpresa() {
  return (
    <main>
      <div className="encabezado-pagina">
        <h1>Registrar empresa</h1>
        <p>La empresa recibe una copia del listado maestro de documentos que podrá adaptar.</p>
      </div>
      <FormEmpresa accion={crearEmpresa} textoBoton="Registrar empresa" />
    </main>
  );
}
