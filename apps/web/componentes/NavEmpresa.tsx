"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavEmpresa({ id, nombre }: { id: string; nombre: string }) {
  const ruta = usePathname();
  const enlaces = [
    { href: `/empresas/${id}`, texto: "Resumen" },
    { href: `/empresas/${id}/autoevaluacion`, texto: "Autoevaluación" },
    { href: `/empresas/${id}/documentos`, texto: "Documentos" },
    { href: `/empresas/${id}/datos`, texto: "Datos de la empresa" },
  ];
  return (
    <div className="barra barra--secundaria">
      <div className="barra__contenido">
        <span className="barra__empresa">{nombre}</span>
        <nav aria-label="Secciones de la empresa">
          <ul>
            {enlaces.map((e) => (
              <li key={e.href}>
                <Link href={e.href} aria-current={ruta === e.href ? "page" : undefined}>{e.texto}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
