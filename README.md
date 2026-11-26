# Plataforma SG-SST

Plataforma multiempresa para gestionar el Sistema de Gestión de Seguridad y Salud en el Trabajo (Colombia):
estándares mínimos, documentos y formatos, evidencias, indicadores y KPI, plan anual y acciones de mejora.

La plantilla base es el SG-SST de Hotel y E.D.S. La Troncal (estructura PHVA, listado de documentos e indicadores),
ajustada a la norma vigente. Cada empresa recibe una copia y la adapta a su tamaño, riesgo y actividad.

## Normas que implementa

- Decreto 1072 de 2015, libro 2, parte 2, título 4, capítulo 6 (SG-SST).
- Resolución 0312 de 2019: grupos de 7, 21 o 60 estándares, tabla de valores, valoración e indicadores mínimos.

## Estructura

| Carpeta | Contenido |
|---|---|
| `packages/core` | Reglas de negocio sin dependencias: catálogo de 60 ítems, aplicabilidad, calificación, indicadores, KPI y listado maestro de documentos. |
| `supabase/migrations` | Base de datos PostgreSQL con seguridad por empresa (RLS), almacenamiento de archivos y conservación de registros por 20 años. |
| `apps/web` | Plataforma web (Next.js): empresas, autoevaluación con puntaje en vivo, listado maestro de documentos con carga de archivos y descarga en PDF con logo, código, versión y fecha. |
| `apps/movil` | App de campo (pendiente). |
| `.claude/skills` | Skills para Claude Code usadas en el proyecto (diseño, buenas prácticas web, ECC, docling, graphify). |

## Comandos

```bash
pnpm install
pnpm test                      # pruebas del núcleo y de la web
pnpm typecheck
pnpm --filter web semilla      # carga la empresa de ejemplo (La Troncal)
pnpm dev                       # http://localhost:3000
```

### Modo local y producción

Sin variables de Supabase, la web guarda los datos en `apps/web/.datos` (o en `SGSST_DATOS_DIR`).
Ese modo **no tiene usuarios ni permisos** y sirve solo para desarrollo y demostraciones en un equipo.
En producción la app se niega a arrancar en modo local, salvo que se active a propósito con `SGSST_MODO_LOCAL=1`.

### PDF

Todos los documentos se descargan con encabezado de control (logo, razón social, NIT, título, código,
versión, fecha y página X de Y) y un pie con la fecha y hora de generación en hora de Colombia.

- **FT-SST-001**: la autoevaluación con la tabla de valores, subtotales, valoración y acciones del art. 28.
- **Con archivo PDF o imagen cargado**: hoja de control y control de cambios, seguidas del archivo.
- **Con archivo de Office**: hoja de control; el original se descarga aparte.
- **Sin archivo**: plantilla en blanco para diligenciar (la asistencia, FT-SST-015, con su tabla de firmas).

## Pendiente de verificar

- Las listas de 7 y 21 estándares (`packages/core/src/aplicabilidad.ts`) se deben cotejar con el texto oficial
  de la Resolución 0312. La constante `LISTAS_REDUCIDAS_VERIFICADAS` lo indica.
