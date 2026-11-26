/**
 * Repositorio local: guarda los datos en un archivo JSON y los archivos en
 * disco. Sirve para desarrollo y demostraciones en un solo equipo.
 * No tiene usuarios ni permisos: en producción se usa Supabase.
 */
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { DOCUMENTOS_BASE, type GrupoEstandares } from "@sgsst/core";
import { validarArchivo } from "./archivos";
import type {
  ArchivoGuardado,
  Autoevaluacion,
  DocumentoEmpresa,
  Empresa,
  NuevaEmpresa,
  Repositorio,
  RespuestaGuardada,
} from "./tipos";

interface BaseLocal {
  empresas: Empresa[];
  documentos: DocumentoEmpresa[];
  autoevaluaciones: Autoevaluacion[];
}

const vacia = (): BaseLocal => ({ empresas: [], documentos: [], autoevaluaciones: [] });
const ahora = () => new Date().toISOString();
const hoy = () => ahora().slice(0, 10);

export class NoEncontrado extends Error {}
export class Conflicto extends Error {}

export class RepositorioLocal implements Repositorio {
  private readonly archivoBase: string;
  private readonly carpetaArchivos: string;
  private cola: Promise<unknown> = Promise.resolve();

  constructor(private readonly directorio: string) {
    this.archivoBase = path.join(/*turbopackIgnore: true*/ directorio, "base.json");
    this.carpetaArchivos = path.join(/*turbopackIgnore: true*/ directorio, "archivos");
  }

  private async leer(): Promise<BaseLocal> {
    try {
      return JSON.parse(await readFile(this.archivoBase, "utf8")) as BaseLocal;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return vacia();
      throw e;
    }
  }

  /** Serializa las escrituras y reemplaza el archivo de forma atómica. */
  private modificar<T>(fn: (base: BaseLocal) => T | Promise<T>): Promise<T> {
    const tarea = this.cola.then(async () => {
      const base = await this.leer();
      const resultado = await fn(base);
      await mkdir(this.directorio, { recursive: true });
      const tmp = `${this.archivoBase}.${randomUUID()}.tmp`;
      await writeFile(tmp, JSON.stringify(base, null, 2));
      await rename(tmp, this.archivoBase);
      return resultado;
    });
    this.cola = tarea.catch(() => undefined);
    return tarea;
  }

  private async guardarBytes(empresaId: string, bytes: Uint8Array, nombre: string, tipoMime: string, extension: string): Promise<ArchivoGuardado> {
    const carpeta = path.join(/*turbopackIgnore: true*/ this.carpetaArchivos, empresaId);
    await mkdir(carpeta, { recursive: true });
    const ruta = `${randomUUID()}.${extension}`;
    await writeFile(path.join(/*turbopackIgnore: true*/ carpeta, ruta), bytes, { flag: "wx" });
    return {
      ruta,
      nombre,
      tipoMime,
      tamanoBytes: bytes.byteLength,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      subidoEn: ahora(),
    };
  }

  async listarEmpresas() {
    const base = await this.leer();
    return [...base.empresas].sort((a, b) => a.razonSocial.localeCompare(b.razonSocial, "es"));
  }

  async obtenerEmpresa(id: string) {
    return (await this.leer()).empresas.find((e) => e.id === id) ?? null;
  }

  crearEmpresa(datos: NuevaEmpresa) {
    return this.modificar((base) => {
      if (base.empresas.some((e) => e.nit === datos.nit)) {
        throw new Conflicto(`Ya existe una empresa con el NIT ${datos.nit}.`);
      }
      const empresa: Empresa = { ...datos, id: randomUUID(), creadoEn: ahora() };
      base.empresas.push(empresa);
      // Cada empresa recibe su propia copia del listado maestro para adaptarlo.
      for (const d of DOCUMENTOS_BASE) {
        base.documentos.push({
          id: randomUUID(),
          empresaId: empresa.id,
          codigo: d.codigo,
          nombre: d.nombre,
          tipo: d.tipo,
          items: [...d.items],
          version: "1",
          fechaVersion: hoy(),
          estado: "BORRADOR",
          elaboro: "",
          reviso: datos.responsableSst,
          aprobo: datos.representanteLegal,
          formularioDigital: Boolean(d.formularioDigital),
          ...(d.mejora ? { mejoraSugerida: d.mejora } : {}),
          ...(d.nuevo ? { nuevo: true } : {}),
          activo: true,
          historial: [],
        });
      }
      return empresa;
    });
  }

  actualizarEmpresa(id: string, datos: Partial<NuevaEmpresa>) {
    return this.modificar((base) => {
      const empresa = base.empresas.find((e) => e.id === id);
      if (!empresa) throw new NoEncontrado("La empresa no existe.");
      if (datos.nit && base.empresas.some((e) => e.nit === datos.nit && e.id !== id)) {
        throw new Conflicto(`Ya existe una empresa con el NIT ${datos.nit}.`);
      }
      Object.assign(empresa, datos);
      return empresa;
    });
  }

  async guardarLogo(empresaId: string, archivo: File) {
    const v = await validarArchivo(archivo, ["png", "jpg"]);
    const guardado = await this.guardarBytes(empresaId, v.bytes, v.nombre, v.tipoMime, v.tipo);
    await this.modificar((base) => {
      const empresa = base.empresas.find((e) => e.id === empresaId);
      if (!empresa) throw new NoEncontrado("La empresa no existe.");
      empresa.logo = guardado;
    });
  }

  async listarDocumentos(empresaId: string) {
    return (await this.leer()).documentos.filter((d) => d.empresaId === empresaId);
  }

  async obtenerDocumento(empresaId: string, codigo: string) {
    return (await this.leer()).documentos.find((d) => d.empresaId === empresaId && d.codigo === codigo) ?? null;
  }

  actualizarDocumento(empresaId: string, codigo: string, cambios: Parameters<Repositorio["actualizarDocumento"]>[2]) {
    return this.modificar((base) => {
      const doc = base.documentos.find((d) => d.empresaId === empresaId && d.codigo === codigo);
      if (!doc) throw new NoEncontrado(`El documento ${codigo} no existe.`);
      Object.assign(doc, cambios);
      return doc;
    });
  }

  async cargarArchivoDocumento(empresaId: string, codigo: string, archivo: File, cambio: string) {
    const v = await validarArchivo(archivo, ["pdf", "docx", "xlsx", "pptx", "png", "jpg"]);
    const guardado = await this.guardarBytes(empresaId, v.bytes, v.nombre, v.tipoMime, v.tipo);
    return this.modificar((base) => {
      const doc = base.documentos.find((d) => d.empresaId === empresaId && d.codigo === codigo);
      if (!doc) throw new NoEncontrado(`El documento ${codigo} no existe.`);
      if (doc.archivo) {
        // La versión anterior se conserva en el historial y la nueva sube de número.
        doc.historial.push({ version: doc.version, fecha: doc.fechaVersion, archivo: doc.archivo, cambio });
        const n = Number.parseInt(doc.version, 10);
        doc.version = Number.isFinite(n) ? String(n + 1) : `${doc.version}.1`;
        doc.fechaVersion = hoy();
      }
      doc.archivo = guardado;
      if (doc.estado === "BORRADOR") doc.estado = "EN_REVISION";
      return doc;
    });
  }

  async obtenerAutoevaluacion(empresaId: string, anio: number) {
    return (await this.leer()).autoevaluaciones.find((a) => a.empresaId === empresaId && a.anio === anio) ?? null;
  }

  guardarAutoevaluacion(empresaId: string, anio: number, grupo: GrupoEstandares, respuestas: Record<string, RespuestaGuardada>) {
    return this.modificar((base) => {
      let ev = base.autoevaluaciones.find((a) => a.empresaId === empresaId && a.anio === anio);
      if (!ev) {
        ev = { id: randomUUID(), empresaId, anio, grupo, respuestas: {}, actualizadoEn: ahora() };
        base.autoevaluaciones.push(ev);
      }
      ev.grupo = grupo;
      ev.respuestas = respuestas;
      ev.actualizadoEn = ahora();
      return ev;
    });
  }

  async leerArchivo(empresaId: string, archivo: ArchivoGuardado) {
    const carpeta = path.resolve(/*turbopackIgnore: true*/ this.carpetaArchivos, empresaId);
    const ruta = path.resolve(/*turbopackIgnore: true*/ carpeta, archivo.ruta);
    // Impide salir de la carpeta de la empresa con rutas como "../".
    if (!ruta.startsWith(carpeta + path.sep)) throw new NoEncontrado("Archivo no encontrado.");
    return new Uint8Array(await readFile(ruta));
  }
}
