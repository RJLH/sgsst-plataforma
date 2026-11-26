import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { NavEmpresa } from "@/componentes/NavEmpresa";
import { repositorio } from "@/lib/datos";

export default async function LayoutEmpresa({ children, params }: { children: ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const empresa = await repositorio().obtenerEmpresa(id);
  if (!empresa) notFound();
  return (
    <>
      <NavEmpresa id={id} nombre={empresa.razonSocial} />
      <main>{children}</main>
    </>
  );
}
