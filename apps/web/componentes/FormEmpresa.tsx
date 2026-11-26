"use client";

import { grupoObligatorio, type ClaseRiesgo } from "@sgsst/core";
import { useActionState, useState } from "react";
import type { EstadoFormulario } from "@/app/acciones";
import type { Empresa } from "@/lib/datos/tipos";
import { ACEPTA_IMAGENES } from "@/lib/datos/archivos";

type Accion = (prev: EstadoFormulario, fd: FormData) => Promise<EstadoFormulario>;

const TEXTO_GRUPO = {
  "7": "7 estándares mínimos (hasta 10 trabajadores, riesgo I, II o III)",
  "21": "21 estándares mínimos (11 a 50 trabajadores, riesgo I, II o III)",
  "60": "tabla completa de 60 ítems (más de 50 trabajadores o riesgo IV o V)",
} as const;

export function FormEmpresa({ accion, empresa, textoBoton }: { accion: Accion; empresa?: Empresa; textoBoton: string }) {
  const [estado, enviar, enviando] = useActionState(accion, {});
  const [trabajadores, setTrabajadores] = useState(empresa?.numeroTrabajadores ?? 1);
  const [riesgo, setRiesgo] = useState<ClaseRiesgo>(empresa?.claseRiesgo ?? 1);
  const grupo = trabajadores >= 1 ? grupoObligatorio({ numeroTrabajadores: trabajadores, claseRiesgo: riesgo }) : null;

  return (
    <form action={enviar} className="formulario">
      <div className="fila">
        <div className="campo">
          <label htmlFor="razonSocial">Razón social</label>
          <input id="razonSocial" name="razonSocial" type="text" required minLength={3} defaultValue={empresa?.razonSocial} autoComplete="organization" />
          <span className="error-campo">Escriba la razón social.</span>
        </div>
        <div className="campo">
          <label htmlFor="nit">NIT</label>
          <span className="ayuda" id="nit-ayuda">Con dígito de verificación, por ejemplo 901569104-9</span>
          <input id="nit" name="nit" type="text" inputMode="numeric" required pattern="\d{6,10}(-\d)?" aria-describedby="nit-ayuda" defaultValue={empresa?.nit} />
          <span className="error-campo">Escriba el NIT con números, como 901569104-9.</span>
        </div>
      </div>

      <div className="fila">
        <div className="campo">
          <label htmlFor="numeroTrabajadores">Número de trabajadores</label>
          <input id="numeroTrabajadores" name="numeroTrabajadores" type="number" min={1} required value={trabajadores}
            onChange={(e) => setTrabajadores(Number(e.target.value))} />
          <span className="error-campo">Debe ser 1 o más.</span>
        </div>
        <div className="campo">
          <label htmlFor="claseRiesgo">Clase de riesgo (la más alta de la empresa)</label>
          <select id="claseRiesgo" name="claseRiesgo" value={riesgo} onChange={(e) => setRiesgo(Number(e.target.value) as ClaseRiesgo)}>
            {[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>Riesgo {["I", "II", "III", "IV", "V"][r - 1]}</option>)}
          </select>
        </div>
      </div>

      {grupo && (
        <p className="aviso aviso--info" aria-live="polite">
          Por norma a esta empresa le aplican los <strong>{TEXTO_GRUPO[grupo]}</strong>.
        </p>
      )}

      <label className="casilla">
        <input type="checkbox" name="usarTablaCompleta" defaultChecked={empresa?.usarTablaCompleta} />
        <span>Evaluar con la tabla completa de 60 ítems aunque no sea obligatoria. Es más exigente y deja la empresa preparada para crecer.</span>
      </label>

      <div className="fila">
        <div className="campo">
          <label htmlFor="actividadesCiiu">Actividades económicas (CIIU)</label>
          <span className="ayuda" id="ciiu-ayuda">Separadas por coma, por ejemplo 4731, 5511</span>
          <input id="actividadesCiiu" name="actividadesCiiu" type="text" aria-describedby="ciiu-ayuda" defaultValue={empresa?.actividadesCiiu.join(", ")} />
        </div>
        <div className="campo">
          <label htmlFor="arl">ARL</label>
          <input id="arl" name="arl" type="text" defaultValue={empresa?.arl} />
        </div>
      </div>

      <div className="fila">
        <div className="campo">
          <label htmlFor="representanteLegal">Representante legal</label>
          <input id="representanteLegal" name="representanteLegal" type="text" autoComplete="off" defaultValue={empresa?.representanteLegal} />
        </div>
        <div className="campo">
          <label htmlFor="responsableSst">Responsable del SG-SST</label>
          <input id="responsableSst" name="responsableSst" type="text" autoComplete="off" defaultValue={empresa?.responsableSst} />
        </div>
      </div>

      <div className="fila">
        <div className="campo">
          <label htmlFor="direccion">Dirección</label>
          <input id="direccion" name="direccion" type="text" autoComplete="street-address" defaultValue={empresa?.direccion} />
        </div>
        <div className="campo">
          <label htmlFor="municipio">Municipio</label>
          <input id="municipio" name="municipio" type="text" autoComplete="address-level2" defaultValue={empresa?.municipio} />
        </div>
        <div className="campo">
          <label htmlFor="departamento">Departamento</label>
          <input id="departamento" name="departamento" type="text" autoComplete="address-level1" defaultValue={empresa?.departamento} />
        </div>
      </div>

      <div className="campo">
        <label htmlFor="logo">Logo {empresa?.logo ? "(cargue otro para reemplazarlo)" : ""}</label>
        <span className="ayuda" id="logo-ayuda">PNG o JPG. Aparece en el encabezado de todos los PDF.</span>
        <input id="logo" name="logo" type="file" accept={ACEPTA_IMAGENES} aria-describedby="logo-ayuda" />
      </div>

      <div className="acciones">
        <button className="boton" type="submit" disabled={enviando}>{enviando ? "Guardando…" : textoBoton}</button>
        <p role="status" className={estado.error ? "estado-error" : "estado-ok"}>
          {estado.error ?? estado.ok}
        </p>
      </div>
    </form>
  );
}
