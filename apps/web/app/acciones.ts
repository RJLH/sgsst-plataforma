"use server";

import { ITEMS, grupoAplicable, requisitosDelGrupo, type EstadoItem } from "@sgsst/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { repositorio, type RespuestaGuardada } from "@/lib/datos";
import { ArchivoInvalido } from "@/lib/datos/archivos";
import { Conflicto, NoEncontrado } from "@/lib/datos/local";

export interface EstadoFormulario {
  error?: string;
  ok?: string;
}

const texto = (max = 200) => z.string().trim().max(max);

const esquemaEmpresa = z.object({
  nit: z.string().trim().regex(/^\d{6,10}(-\d)?$/, "Escriba el NIT con números y, si quiere, el dígito de verificación: 901569104-9."),
  razonSocial: texto().min(3, "Escriba la razón social."),
  actividadesCiiu: texto(),
  claseRiesgo: z.coerce.number().int().min(1).max(5),
  numeroTrabajadores: z.coerce.number().int().min(1, "La empresa debe tener al menos 1 trabajador.").max(100000),
  usarTablaCompleta: z.preprocess((v) => v === "on", z.boolean()),
  arl: texto(80),
  representanteLegal: texto(120),
  responsableSst: texto(120),
  direccion: texto(),
  municipio: texto(80),
  departamento: texto(80),
});

function datosEmpresa(fd: FormData) {
  const r = esquemaEmpresa.safeParse(Object.fromEntries(fd));
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Revise los datos del formulario." } as const;
  const { actividadesCiiu, claseRiesgo, ...resto } = r.data;
  return {
    datos: {
      ...resto,
      claseRiesgo: claseRiesgo as 1 | 2 | 3 | 4 | 5,
      actividadesCiiu: actividadesCiiu.split(/[,;]/).map((s) => s.trim()).filter(Boolean),
    },
  } as const;
}

function mensaje(e: unknown): string {
  if (e instanceof ArchivoInvalido || e instanceof Conflicto || e instanceof NoEncontrado) return e.message;
  console.error(e);
  return "No se pudo guardar. Intente de nuevo; si el problema sigue, revise el registro del servidor.";
}

const archivoDe = (fd: FormData, campo: string) => {
  const f = fd.get(campo);
  return f instanceof File && f.size > 0 ? f : null;
};

export async function crearEmpresa(_prev: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  const r = datosEmpresa(fd);
  if ("error" in r) return { error: r.error };
  let id: string;
  try {
    const empresa = await repositorio().crearEmpresa(r.datos);
    id = empresa.id;
    const logo = archivoDe(fd, "logo");
    if (logo) await repositorio().guardarLogo(id, logo);
  } catch (e) {
    return { error: mensaje(e) };
  }
  revalidatePath("/");
  redirect(`/empresas/${id}`);
}

export async function actualizarEmpresa(id: string, _prev: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  const r = datosEmpresa(fd);
  if ("error" in r) return { error: r.error };
  try {
    await repositorio().actualizarEmpresa(id, r.datos);
    const logo = archivoDe(fd, "logo");
    if (logo) await repositorio().guardarLogo(id, logo);
  } catch (e) {
    return { error: mensaje(e) };
  }
  revalidatePath(`/empresas/${id}`, "layout");
  return { ok: "Datos de la empresa guardados." };
}

const ESTADOS: readonly EstadoItem[] = ["CUMPLE", "NO_CUMPLE", "NO_APLICA"];

export async function guardarAutoevaluacion(empresaId: string, anio: number, _prev: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  const repo = repositorio();
  const empresa = await repo.obtenerEmpresa(empresaId);
  if (!empresa) return { error: "La empresa no existe." };
  const grupo = grupoAplicable(empresa);
  const codigos = grupo === "60" ? ITEMS.map((i) => i.codigo) : requisitosDelGrupo(grupo).map((r) => String(r.numero));

  const respuestas: Record<string, RespuestaGuardada> = {};
  for (const c of codigos) {
    const estado = fd.get(`estado:${c}`);
    if (typeof estado !== "string" || !ESTADOS.includes(estado as EstadoItem)) continue;
    const justificacion = String(fd.get(`justificacion:${c}`) ?? "").trim().slice(0, 1000);
    respuestas[c] = estado === "NO_APLICA" ? { estado, justificacion } : { estado: estado as EstadoItem };
  }
  try {
    await repo.guardarAutoevaluacion(empresaId, anio, grupo, respuestas);
  } catch (e) {
    return { error: mensaje(e) };
  }
  revalidatePath(`/empresas/${empresaId}`, "layout");
  return { ok: `Autoevaluación ${anio} guardada.` };
}

export async function cargarArchivo(empresaId: string, codigo: string, _prev: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  const archivo = archivoDe(fd, "archivo");
  if (!archivo) return { error: "Seleccione un archivo para cargar." };
  const cambio = String(fd.get("cambio") ?? "").trim().slice(0, 300) || "Actualización del documento";
  try {
    const doc = await repositorio().cargarArchivoDocumento(empresaId, codigo, archivo, cambio);
    revalidatePath(`/empresas/${empresaId}/documentos`);
    return { ok: `Archivo cargado. ${doc.codigo} queda en versión ${doc.version}.` };
  } catch (e) {
    return { error: mensaje(e) };
  }
}

const esquemaDocumento = z.object({
  estado: z.enum(["BORRADOR", "EN_REVISION", "VIGENTE", "OBSOLETO"]),
  elaboro: texto(120),
  reviso: texto(120),
  aprobo: texto(120),
  activo: z.preprocess((v) => v === "on", z.boolean()),
});

export async function actualizarDocumento(empresaId: string, codigo: string, _prev: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  const r = esquemaDocumento.safeParse(Object.fromEntries(fd));
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Revise los datos." };
  try {
    await repositorio().actualizarDocumento(empresaId, codigo, r.data);
  } catch (e) {
    return { error: mensaje(e) };
  }
  revalidatePath(`/empresas/${empresaId}/documentos`);
  return { ok: "Cambios guardados." };
}
