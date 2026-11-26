import type { ClaseRiesgo, EstadoItem, GrupoEstandares, TipoDocumento } from "@sgsst/core";

export interface Empresa {
  id: string;
  nit: string;
  razonSocial: string;
  actividadesCiiu: string[];
  claseRiesgo: ClaseRiesgo;
  numeroTrabajadores: number;
  usarTablaCompleta: boolean;
  arl: string;
  representanteLegal: string;
  responsableSst: string;
  direccion: string;
  municipio: string;
  departamento: string;
  /** Archivo del logo, si la empresa lo cargó. */
  logo?: ArchivoGuardado;
  creadoEn: string;
}

export type NuevaEmpresa = Omit<Empresa, "id" | "creadoEn" | "logo">;

export type EstadoDocumento = "BORRADOR" | "EN_REVISION" | "VIGENTE" | "OBSOLETO";

export interface ArchivoGuardado {
  /** Ruta interna, relativa al almacenamiento de la empresa. */
  ruta: string;
  nombre: string;
  tipoMime: string;
  tamanoBytes: number;
  sha256: string;
  subidoEn: string;
}

export interface DocumentoEmpresa {
  id: string;
  empresaId: string;
  codigo: string;
  nombre: string;
  tipo: TipoDocumento;
  items: string[];
  version: string;
  fechaVersion: string;
  estado: EstadoDocumento;
  elaboro: string;
  reviso: string;
  aprobo: string;
  formularioDigital: boolean;
  mejoraSugerida?: string;
  nuevo?: boolean;
  activo: boolean;
  archivo?: ArchivoGuardado;
  /** Versiones anteriores del archivo; nunca se borran. */
  historial: { version: string; fecha: string; archivo: ArchivoGuardado; cambio: string }[];
}

export interface RespuestaGuardada {
  estado: EstadoItem;
  justificacion?: string;
}

export interface Autoevaluacion {
  id: string;
  empresaId: string;
  anio: number;
  grupo: GrupoEstandares;
  respuestas: Record<string, RespuestaGuardada>;
  actualizadoEn: string;
}

export interface Repositorio {
  listarEmpresas(): Promise<Empresa[]>;
  obtenerEmpresa(id: string): Promise<Empresa | null>;
  crearEmpresa(datos: NuevaEmpresa): Promise<Empresa>;
  actualizarEmpresa(id: string, datos: Partial<NuevaEmpresa>): Promise<Empresa>;
  guardarLogo(empresaId: string, archivo: File): Promise<void>;

  listarDocumentos(empresaId: string): Promise<DocumentoEmpresa[]>;
  obtenerDocumento(empresaId: string, codigo: string): Promise<DocumentoEmpresa | null>;
  actualizarDocumento(
    empresaId: string,
    codigo: string,
    cambios: Partial<Pick<DocumentoEmpresa, "nombre" | "version" | "fechaVersion" | "estado" | "elaboro" | "reviso" | "aprobo" | "activo">>,
  ): Promise<DocumentoEmpresa>;
  cargarArchivoDocumento(empresaId: string, codigo: string, archivo: File, cambio: string): Promise<DocumentoEmpresa>;

  obtenerAutoevaluacion(empresaId: string, anio: number): Promise<Autoevaluacion | null>;
  guardarAutoevaluacion(empresaId: string, anio: number, grupo: GrupoEstandares, respuestas: Record<string, RespuestaGuardada>): Promise<Autoevaluacion>;

  leerArchivo(empresaId: string, archivo: ArchivoGuardado): Promise<Uint8Array>;
}
