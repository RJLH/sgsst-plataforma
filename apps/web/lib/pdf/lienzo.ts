/**
 * Utilidades para componer PDF con pdf-lib: páginas tamaño carta, encabezado
 * de control documental en todas las páginas, texto con ajuste de línea y tablas.
 */
import { PDFDocument, PDFFont, PDFImage, PDFPage, StandardFonts, rgb, type RGB } from "pdf-lib";

export const CARTA = { ancho: 612, alto: 792 } as const;
const MARGEN = 40;
const ALTO_ENCABEZADO = 74;
const ALTO_PIE = 30;

export const COLOR = {
  tinta: rgb(0.13, 0.15, 0.17),
  gris: rgb(0.42, 0.45, 0.47),
  linea: rgb(0.72, 0.75, 0.74),
  fondo: rgb(0.94, 0.95, 0.95),
  verde: rgb(0.04, 0.48, 0.29),
  ambar: rgb(0.7, 0.42, 0),
  rojo: rgb(0.7, 0.15, 0.12),
} as const;

export interface DatosEncabezado {
  razonSocial: string;
  nit: string;
  titulo: string;
  codigo: string;
  version: string;
  fechaVersion: string;
  logo?: { bytes: Uint8Array; tipoMime: string };
}

/** Fecha y hora de generación en la zona horaria de Colombia. */
export function marcaDeTiempo(fecha = new Date()) {
  const f = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota", day: "2-digit", month: "2-digit", year: "numeric",
  }).format(fecha);
  const h = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(fecha);
  return { fecha: f, hora: h };
}

export function fechaLegible(iso: string) {
  const [a, m, d] = iso.slice(0, 10).split("-");
  return a && m && d ? `${d}/${m}/${a}` : iso;
}

export class Lienzo {
  readonly doc: PDFDocument;
  readonly normal: PDFFont;
  readonly negrita: PDFFont;
  private logo?: PDFImage;
  /** Páginas que componemos nosotros (llevan encabezado completo). */
  private propias = new Set<PDFPage>();
  private pagina!: PDFPage;
  y = 0;
  private codificable = new Map<string, boolean>();

  private constructor(doc: PDFDocument, normal: PDFFont, negrita: PDFFont, private readonly enc: DatosEncabezado) {
    this.doc = doc;
    this.normal = normal;
    this.negrita = negrita;
  }

  static async crear(enc: DatosEncabezado): Promise<Lienzo> {
    const doc = await PDFDocument.create();
    doc.setTitle(`${enc.codigo} ${enc.titulo}`);
    doc.setAuthor(enc.razonSocial);
    doc.setProducer("Plataforma SG-SST");
    doc.setLanguage("es-CO");
    const l = new Lienzo(doc, await doc.embedFont(StandardFonts.Helvetica), await doc.embedFont(StandardFonts.HelveticaBold), enc);
    if (enc.logo) {
      try {
        l.logo = enc.logo.tipoMime === "image/png" ? await doc.embedPng(enc.logo.bytes) : await doc.embedJpg(enc.logo.bytes);
      } catch {
        // Un logo dañado no debe impedir generar el documento.
      }
    }
    l.nuevaPagina();
    return l;
  }

  get anchoUtil() {
    return CARTA.ancho - MARGEN * 2;
  }

  get izquierda() {
    return MARGEN;
  }

  nuevaPagina() {
    this.pagina = this.doc.addPage([CARTA.ancho, CARTA.alto]);
    this.propias.add(this.pagina);
    this.y = CARTA.alto - MARGEN - ALTO_ENCABEZADO - 18;
  }

  /** Salta de página si no caben `alto` puntos. */
  asegurar(alto: number) {
    if (this.y - alto < MARGEN + ALTO_PIE) this.nuevaPagina();
  }

  /** Reemplaza los caracteres que la fuente estándar no puede codificar. */
  seguro(texto: string, fuente: PDFFont = this.normal): string {
    let out = "";
    for (const ch of texto.replace(/\r/g, "")) {
      if (ch === "\n") { out += ch; continue; }
      let ok = this.codificable.get(ch);
      if (ok === undefined) {
        try { fuente.encodeText(ch); ok = true; } catch { ok = false; }
        this.codificable.set(ch, ok);
      }
      out += ok ? ch : ch === "≥" ? ">=" : ch === "≤" ? "<=" : "?";
    }
    return out;
  }

  partir(texto: string, ancho: number, tam: number, fuente: PDFFont = this.normal): string[] {
    const lineas: string[] = [];
    for (const parrafo of this.seguro(texto, fuente).split("\n")) {
      let actual = "";
      for (const palabra of parrafo.split(/\s+/).filter(Boolean)) {
        const prueba = actual ? `${actual} ${palabra}` : palabra;
        if (fuente.widthOfTextAtSize(prueba, tam) <= ancho) actual = prueba;
        else {
          if (actual) lineas.push(actual);
          actual = palabra;
        }
      }
      lineas.push(actual);
    }
    return lineas;
  }

  texto(contenido: string, opts: { tam?: number; negrita?: boolean; color?: RGB; sangria?: number; espacio?: number } = {}) {
    const tam = opts.tam ?? 10;
    const fuente = opts.negrita ? this.negrita : this.normal;
    const x = MARGEN + (opts.sangria ?? 0);
    const interlinea = tam * 1.35;
    for (const linea of this.partir(contenido, this.anchoUtil - (opts.sangria ?? 0), tam, fuente)) {
      this.asegurar(interlinea);
      this.pagina.drawText(linea, { x, y: this.y - tam, size: tam, font: fuente, color: opts.color ?? COLOR.tinta });
      this.y -= interlinea;
    }
    this.y -= opts.espacio ?? 4;
  }

  titulo(contenido: string) {
    this.asegurar(30);
    this.y -= 6;
    this.texto(contenido, { tam: 12, negrita: true, espacio: 6 });
  }

  /**
   * Tabla con encabezado repetido en cada página. `anchos` en proporciones.
   * `estilo` permite resaltar filas (subtotales).
   */
  tabla(columnas: string[], anchos: number[], filas: string[][], estilo?: (i: number) => { negrita?: boolean; fondo?: RGB }) {
    const total = anchos.reduce((a, b) => a + b, 0);
    const ancho = anchos.map((a) => (a / total) * this.anchoUtil);
    const tam = 8.5;
    const pad = 4;

    const dibujarFila = (celdas: string[], opts: { negrita?: boolean; fondo?: RGB }) => {
      const fuente = opts.negrita ? this.negrita : this.normal;
      const lineas = celdas.map((c, i) => this.partir(c, (ancho[i] ?? 0) - pad * 2, tam, fuente));
      const alto = Math.max(...lineas.map((l) => l.length)) * tam * 1.3 + pad * 2;
      return { alto, dibujar: () => {
        let x = MARGEN;
        celdas.forEach((_, i) => {
          const w = ancho[i] ?? 0;
          this.pagina.drawRectangle({
            x, y: this.y - alto, width: w, height: alto,
            borderColor: COLOR.linea, borderWidth: 0.6, ...(opts.fondo ? { color: opts.fondo } : {}),
          });
          (lineas[i] ?? []).forEach((linea, j) => {
            this.pagina.drawText(linea, { x: x + pad, y: this.y - pad - tam - j * tam * 1.3, size: tam, font: fuente, color: COLOR.tinta });
          });
          x += w;
        });
        this.y -= alto;
      } };
    };

    const cabecera = () => {
      const f = dibujarFila(columnas, { negrita: true, fondo: COLOR.fondo });
      this.asegurar(f.alto);
      f.dibujar();
    };

    cabecera();
    filas.forEach((fila, i) => {
      const f = dibujarFila(fila, estilo?.(i) ?? {});
      if (this.y - f.alto < MARGEN + ALTO_PIE) {
        this.nuevaPagina();
        cabecera();
      }
      f.dibujar();
    });
    this.y -= 10;
  }

  /** Líneas de firma al final del documento. */
  firmas(roles: { rol: string; nombre: string }[]) {
    this.asegurar(70);
    this.y -= 34;
    const ancho = this.anchoUtil / roles.length;
    roles.forEach((r, i) => {
      const x = MARGEN + i * ancho + 8;
      this.pagina.drawLine({ start: { x, y: this.y }, end: { x: x + ancho - 16, y: this.y }, thickness: 0.6, color: COLOR.tinta });
      this.pagina.drawText(this.seguro(r.nombre || " "), { x, y: this.y - 11, size: 8.5, font: this.negrita, color: COLOR.tinta });
      this.pagina.drawText(this.seguro(r.rol), { x, y: this.y - 22, size: 8, font: this.normal, color: COLOR.gris });
    });
    this.y -= 30;
  }

  /** Copia páginas de un PDF cargado. Devuelve false si no se pudo leer. */
  async anexarPdf(bytes: Uint8Array): Promise<boolean> {
    try {
      const origen = await PDFDocument.load(bytes);
      const paginas = await this.doc.copyPages(origen, origen.getPageIndices());
      paginas.forEach((p) => this.doc.addPage(p));
      return true;
    } catch {
      return false;
    }
  }

  async anexarImagen(bytes: Uint8Array, tipoMime: string) {
    const img = tipoMime === "image/png" ? await this.doc.embedPng(bytes) : await this.doc.embedJpg(bytes);
    this.nuevaPagina();
    const maxW = this.anchoUtil;
    const maxH = this.y - MARGEN - ALTO_PIE;
    const escala = Math.min(maxW / img.width, maxH / img.height, 1);
    const w = img.width * escala;
    const h = img.height * escala;
    this.pagina.drawImage(img, { x: MARGEN + (maxW - w) / 2, y: this.y - h, width: w, height: h });
    this.y -= h + 10;
  }

  /** Dibuja encabezados y pies con la numeración final y devuelve los bytes. */
  async terminar(generado = new Date()): Promise<Uint8Array> {
    const { fecha, hora } = marcaDeTiempo(generado);
    const paginas = this.doc.getPages();
    const total = paginas.length;
    paginas.forEach((p, i) => {
      if (this.propias.has(p)) this.encabezado(p, i + 1, total);
      this.pie(p, i + 1, total, fecha, hora);
    });
    return this.doc.save();
  }

  private encabezado(p: PDFPage, numero: number, total: number) {
    const e = this.enc;
    const top = CARTA.alto - MARGEN;
    const wLogo = 120;
    const wDer = 150;
    const wCentro = this.anchoUtil - wLogo - wDer;
    const caja = (x: number, y: number, w: number, h: number) =>
      p.drawRectangle({ x, y, width: w, height: h, borderColor: COLOR.tinta, borderWidth: 0.8 });

    // Logo o, si no hay, el nombre de la empresa.
    caja(MARGEN, top - ALTO_ENCABEZADO, wLogo, ALTO_ENCABEZADO);
    if (this.logo) {
      const esc = Math.min((wLogo - 12) / this.logo.width, (ALTO_ENCABEZADO - 12) / this.logo.height);
      const w = this.logo.width * esc;
      const h = this.logo.height * esc;
      p.drawImage(this.logo, { x: MARGEN + (wLogo - w) / 2, y: top - ALTO_ENCABEZADO + (ALTO_ENCABEZADO - h) / 2, width: w, height: h });
    } else {
      const lineas = this.partir(e.razonSocial, wLogo - 12, 8, this.negrita).slice(0, 5);
      lineas.forEach((l, i) => p.drawText(l, { x: MARGEN + 6, y: top - 16 - i * 10, size: 8, font: this.negrita, color: COLOR.tinta }));
    }

    // Centro: empresa, sistema y título del documento.
    const xc = MARGEN + wLogo;
    caja(xc, top - ALTO_ENCABEZADO, wCentro, ALTO_ENCABEZADO);
    const centrar = (t: string, y: number, tam: number, fuente: PDFFont) => {
      const s = this.seguro(t, fuente);
      p.drawText(s, { x: xc + (wCentro - fuente.widthOfTextAtSize(s, tam)) / 2, y, size: tam, font: fuente, color: COLOR.tinta });
    };
    // Sin logo, la razón social ya ocupa la celda izquierda: no se repite en el centro.
    let y = top - 15;
    if (this.logo) {
      centrar(this.partir(e.razonSocial, wCentro - 12, 8.5, this.negrita)[0] ?? "", y, 8.5, this.negrita);
      y -= 11;
    }
    centrar(`NIT ${e.nit}`, y, 7.5, this.normal);
    centrar("Sistema de Gestión de la Seguridad y Salud en el Trabajo", y - 11, 7.5, this.normal);
    this.partir(e.titulo, wCentro - 12, 9, this.negrita).slice(0, 3).forEach((l, i) => centrar(l, y - 25 - i * 10.5, 9, this.negrita));

    // Derecha: datos de control.
    const xd = MARGEN + wLogo + wCentro;
    const filas: [string, string][] = [
      ["Código", e.codigo],
      ["Versión", e.version],
      ["Fecha", fechaLegible(e.fechaVersion)],
      ["Página", `${numero} de ${total}`],
    ];
    const hFila = ALTO_ENCABEZADO / filas.length;
    filas.forEach(([k, v], i) => {
      const y = top - (i + 1) * hFila;
      caja(xd, y, wDer, hFila);
      p.drawText(k, { x: xd + 6, y: y + hFila / 2 - 3, size: 7.5, font: this.normal, color: COLOR.gris });
      p.drawText(this.seguro(v, this.negrita), { x: xd + 52, y: y + hFila / 2 - 3, size: 8.5, font: this.negrita, color: COLOR.tinta });
    });
  }

  private pie(p: PDFPage, numero: number, total: number, fecha: string, hora: string) {
    const { width } = p.getSize();
    const texto = this.seguro(
      `${this.enc.codigo} v${this.enc.version}  |  Copia controlada generada por la plataforma SG-SST el ${fecha} a las ${hora} (hora de Colombia). Verifique que sea la versión vigente.  |  ${numero}/${total}`,
    );
    const tam = 6.5;
    const w = this.normal.widthOfTextAtSize(texto, tam);
    p.drawText(texto, { x: Math.max(12, (width - w) / 2), y: 16, size: tam, font: this.normal, color: COLOR.gris });
  }
}
