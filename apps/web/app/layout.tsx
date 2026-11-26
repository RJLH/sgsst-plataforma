import "@fontsource/barlow/400.css";
import "@fontsource/barlow/600.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "./estilos.css";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { default: "SG-SST", template: "%s | SG-SST" },
  description: "Gestión del Sistema de Seguridad y Salud en el Trabajo: estándares mínimos, documentos, evidencias e indicadores.",
};

export default function Raiz({ children }: { children: ReactNode }) {
  return (
    <html lang="es-CO">
      <body>
        <header className="barra">
          <div className="barra__contenido">
            <Link href="/" className="marca">SG-SST</Link>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
